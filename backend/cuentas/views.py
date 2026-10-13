"""
Inicio y cierre de sesión de las abogadas.

Pueden entrar:
- Las dos abogadas (administradoras, is_staff). Se crean con `python manage.py crear_abogadas`.
- Los clientes a los que una abogada les dio acceso al portal (ver /api/clientes/<id>/acceso/).
No existe registro público.
"""

from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


def rol_de(usuario):
    """'abogada', 'cliente' o None si el usuario no puede entrar."""
    if usuario.is_staff:
        return "abogada"
    if hasattr(usuario, "cliente"):
        return "cliente"
    return None


def datos_usuaria(usuario):
    """Información básica de quien inició sesión, para el frontend."""
    return {
        "id": usuario.id,
        "usuario": usuario.username,
        "nombre": usuario.first_name or usuario.username,
        "rol": rol_de(usuario),
    }


@api_view(["POST"])
@permission_classes([AllowAny])  # Cualquiera puede intentar entrar; se valida abajo
def iniciar_sesion(request):
    usuario = authenticate(
        username=request.data.get("usuario", ""),
        password=request.data.get("password", ""),
    )
    # Mismo mensaje en todos los casos para no dar pistas de qué falló
    if usuario is None or rol_de(usuario) is None:
        return Response(
            {"detail": "Usuario o contraseña incorrectos."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    token, _ = Token.objects.get_or_create(user=usuario)
    return Response({"token": token.key, "usuaria": datos_usuaria(usuario)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])  # Abogadas y clientes
def cerrar_sesion(request):
    # Borramos el token: el navegador ya no podrá usarlo
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yo(request):
    """Devuelve quién tiene la sesión abierta (sirve para validar el token)."""
    return Response(datos_usuaria(request.user))


@api_view(["GET"])
def abogadas(request):
    """Lista de las abogadas, para elegir la responsable de un caso."""
    usuarias = get_user_model().objects.filter(is_staff=True, is_active=True)
    return Response([datos_usuaria(u) for u in usuarias])
