"""
API pública: lo que se ve ANTES de iniciar sesión.
- Presentación del despacho y de las abogadas (con sus ramas, si las tienen).
- Envío de solicitudes de consulta eligiendo abogada.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import InfoDespacho, PerfilAbogada, Solicitud
from .serializers import InfoDespachoSerializer, RamaSerializer


def abogadas_publicas():
    """Las abogadas (usuarias administradoras activas) con su perfil y ramas."""
    usuarias = get_user_model().objects.filter(is_staff=True, is_active=True).order_by("id")
    resultado = []
    for usuaria in usuarias:
        perfil, _ = PerfilAbogada.objects.get_or_create(usuario=usuaria)
        resultado.append(
            {
                "id": usuaria.id,
                "nombre": usuaria.first_name or usuaria.username,
                "titulo": perfil.titulo,
                "descripcion": perfil.descripcion,
                "telefono": perfil.telefono,
                "correo": perfil.correo,
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
    class Meta:
        model = Solicitud
        fields = ["nombre", "telefono", "correo", "mensaje", "abogada", "rama"]
        extra_kwargs = {"abogada": {"required": True, "allow_null": False}}

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
    serializer.save()
    return Response({"detail": "Solicitud enviada."}, status=status.HTTP_201_CREATED)
