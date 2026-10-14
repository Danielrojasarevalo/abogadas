"""
API pública: lo que se ve ANTES de iniciar sesión.
- Presentación del despacho y de las abogadas (con sus ramas, si las tienen).
- Envío de solicitudes de consulta eligiendo abogada.
"""

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .datos import registrar_autorizacion
from .identificacion import limpiar_documento
from .models import InfoDespacho, PerfilAbogada, Solicitud
from .serializers import InfoDespachoSerializer, PerfilAbogadaSerializer, RamaSerializer


def abogadas_publicas():
    """Las abogadas (usuarias administradoras activas) con su perfil y ramas."""
    usuarias = get_user_model().objects.filter(is_staff=True, is_active=True).order_by("id")
    resultado = []
    for usuaria in usuarias:
        perfil, _ = PerfilAbogada.objects.get_or_create(usuario=usuaria)
        resultado.append(
            {
                # Todo lo que la abogada llenó en "Mi perfil"
                **PerfilAbogadaSerializer(perfil).data,
                "id": usuaria.id,
                "nombre": usuaria.first_name or usuaria.username,
                # Lista vacía si la abogada no ha agregado ramas
                "ramas": RamaSerializer(usuaria.ramas.all(), many=True).data,
            }
        )
    return resultado


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([])
def presentacion(request):
    """Datos para la página pública de inicio."""
    return Response(
        {
            "despacho": InfoDespachoSerializer(InfoDespacho.obtener()).data,
            "abogadas": abogadas_publicas(),
        }
    )


class NuevaSolicitudSerializer(serializers.ModelSerializer):
    # Autorización expresa para datos sensibles (opcional)
    datos_sensibles = serializers.BooleanField(default=False, write_only=True)

    class Meta:
        model = Solicitud
        fields = [
            "nombre", "tipo_documento", "numero_documento", "ciudad", "telefono", "correo", "mensaje",
            "abogada", "rama", "acepta_datos", "datos_sensibles", "latitud", "longitud", "precision_m",
        ]
        extra_kwargs = {
            "abogada": {"required": True, "allow_null": False},
            "acepta_datos": {"required": True},
            "tipo_documento": {"required": True},
            "numero_documento": {"required": True, "allow_blank": False},
            "ciudad": {"required": True, "allow_blank": False},
        }

    def validate(self, datos):
        # Documento según su tipo (cédula solo números, NIT con dígito de verificación, etc.)
        numero, error = limpiar_documento(datos.get("tipo_documento"), datos.get("numero_documento"))
        if error:
            raise serializers.ValidationError({"numero_documento": error})
        datos["numero_documento"] = numero
        # La ubicación es opcional, pero si llega debe venir completa y con valores posibles
        lat, lon = datos.get("latitud"), datos.get("longitud")
        if (lat is None) != (lon is None):
            raise serializers.ValidationError("La ubicación está incompleta.")
        if lat is not None and not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise serializers.ValidationError("La ubicación no es válida.")
        return datos

    def validate_acepta_datos(self, acepta):
        # Ley 1581 de 2012: sin autorización previa no se pueden guardar los datos
        if not acepta:
            raise serializers.ValidationError("Debes autorizar el tratamiento de tus datos para enviar la consulta.")
        return acepta

    def validate_abogada(self, abogada):
        # Solo se puede elegir a una de las abogadas del despacho
        if not abogada.is_staff or not abogada.is_active:
            raise serializers.ValidationError("Abogada no válida.")
        return abogada


class LimiteSolicitudes(AnonRateThrottle):
    """Máximo 10 solicitudes por hora desde la misma conexión (evita spam)."""

    rate = "10/hour"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LimiteSolicitudes])
def enviar_solicitud(request):
    serializer = NuevaSolicitudSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    sensibles = serializer.validated_data.pop("datos_sensibles")
    with transaction.atomic():
        solicitud = serializer.save()
        # Prueba de la autorización: solo la ve la abogada elegida
        registrar_autorizacion(
            request, abogada=solicitud.abogada, nombre=solicitud.nombre, origen="solicitud",
            datos_sensibles=sensibles, solicitud=solicitud,
        )
    return Response({"detail": "Solicitud enviada."}, status=status.HTTP_201_CREATED)
