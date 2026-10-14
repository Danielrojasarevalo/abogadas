"""
Crear cuenta (clientes) y recuperar contraseña (clientes y abogadas).

- Crear cuenta: un cliente se registra con sus datos. Si el despacho ya lo tenía
  registrado (mismo documento), se le vincula la cuenta SOLO si el correo coincide
  con el que tiene el despacho; así nadie puede apropiarse de la cuenta de otro.
- Recuperar contraseña: se envía un código de 6 dígitos al correo de la cuenta.
"""

import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from despacho.datos import abogada_valida, registrar_autorizacion
from despacho.identificacion import limpiar_documento
from despacho.models import Cliente

from .models import CodigoRecuperacion
from .views import datos_usuaria


class LimiteCuentas(AnonRateThrottle):
    """Máximo 10 intentos por hora desde la misma conexión (evita abusos)."""

    rate = "10/hour"


def error(mensaje):
    return Response({"detail": mensaje}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LimiteCuentas])
def crear_cuenta(request):
    datos = request.data
    nombre = str(datos.get("nombre", "")).strip()
    tipo = str(datos.get("tipo_documento", "CC")).strip()
    documento = str(datos.get("numero_documento", "")).strip()
    correo = str(datos.get("correo", "")).strip().lower()
    telefono = str(datos.get("telefono", "")).strip()
    password = str(datos.get("password", ""))

    if not nombre or not documento or not correo:
        return error("Nombre, número de documento y correo son obligatorios.")
    # Documento según su tipo (ej: 1.075.123.456 -> 1075123456)
    documento, error_documento = limpiar_documento(tipo, documento)
    if error_documento:
        return error(error_documento)

    # Ley 1581 de 2012: autorización previa, expresa e informada, dirigida a una abogada
    if datos.get("acepta_datos") is not True:
        return error("Debes aceptar la política de tratamiento de datos para crear tu cuenta.")
    abogada = abogada_valida(datos.get("abogada"))
    if abogada is None:
        return error("Elige la abogada a la que autorizas el tratamiento de tus datos.")

    Usuario = get_user_model()
    nombre_usuario = documento.lower()
    if Usuario.objects.filter(username=nombre_usuario).exists():
        return error("Ya existe una cuenta con ese documento. Si olvidaste tu contraseña, usa “Recuperar contraseña”.")

    cliente = Cliente.objects.filter(numero_documento__iexact=documento).first()
    if cliente and (not cliente.correo or cliente.correo.lower() != correo):
        # El despacho ya tiene a este cliente pero el correo no coincide
        return error("Ese documento ya está registrado en el despacho. Comunícate con tu abogada para activar tu acceso.")

    usuario = Usuario(username=nombre_usuario, first_name=nombre[:150], email=correo)
    try:
        validate_password(password, usuario)
    except ValidationError as e:
        return error(" ".join(e.messages))

    with transaction.atomic():
        usuario.set_password(password)
        usuario.save()
        if cliente is None:
            cliente = Cliente.objects.create(
                nombre=nombre, tipo_documento=tipo, numero_documento=documento,
                correo=correo, telefono=telefono,
            )
        cliente.usuario = usuario
        cliente.save(update_fields=["usuario"])
        registrar_autorizacion(
            request, abogada=abogada, nombre=cliente.nombre, origen="registro",
            datos_sensibles=datos.get("datos_sensibles") is True, cliente=cliente,
        )

    # Entra directamente después de crear la cuenta
    token, _ = Token.objects.get_or_create(user=usuario)
    return Response({"token": token.key, "usuaria": datos_usuaria(usuario)}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LimiteCuentas])
def pedir_codigo(request):
    """Envía un código al correo de la cuenta. {"usuario": "documento o usuario"}"""
    nombre_usuario = str(request.data.get("usuario", "")).strip().lower()
    usuario = get_user_model().objects.filter(username=nombre_usuario, is_active=True).first()

    # Respondemos siempre lo mismo para no revelar qué cuentas existen
    respuesta = Response({"detail": "Si la cuenta existe y tiene correo, te enviamos un código."})
    if not usuario or not usuario.email:
        return respuesta

    codigo = f"{secrets.randbelow(1_000_000):06d}"
    # Invalidamos códigos anteriores y guardamos el nuevo cifrado
    usuario.codigos.filter(usado=False).update(usado=True)
    CodigoRecuperacion.objects.create(usuario=usuario, codigo_cifrado=make_password(codigo))

    send_mail(
        subject="Código para recuperar tu contraseña",
        message=(
            f"Hola {usuario.first_name or usuario.username},\n\n"
            f"Tu código para cambiar la contraseña es: {codigo}\n\n"
            "Vence en 15 minutos. Si no lo pediste, ignora este mensaje.\n\n"
            "Elizabeth Imbachi & Katherine Rojas · Abogadas"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
        fail_silently=False,
    )
    return respuesta


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LimiteCuentas])
def cambiar_con_codigo(request):
    """Cambia la contraseña con el código. {"usuario", "codigo", "password"}"""
    nombre_usuario = str(request.data.get("usuario", "")).strip().lower()
    codigo = str(request.data.get("codigo", "")).strip()
    password = str(request.data.get("password", ""))

    usuario = get_user_model().objects.filter(username=nombre_usuario, is_active=True).first()
    registro = usuario.codigos.filter(usado=False).first() if usuario else None
    if not registro or not registro.vigente():
        return error("El código no es válido o ya venció. Pide uno nuevo.")

    if not check_password(codigo, registro.codigo_cifrado):
        registro.intentos += 1
        registro.save(update_fields=["intentos"])
        return error("El código no es correcto.")

    try:
        validate_password(password, usuario)
    except ValidationError as e:
        return error(" ".join(e.messages))

    usuario.set_password(password)
    usuario.save()
    registro.usado = True
    registro.save(update_fields=["usado"])
    # Cerramos las sesiones abiertas con la contraseña anterior
    Token.objects.filter(user=usuario).delete()
    return Response({"detail": "Contraseña actualizada. Ya puedes iniciar sesión."})
