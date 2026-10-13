"""
API del portal de clientes.
Un cliente con sesión abierta solo puede ver SUS casos (nunca los de otros).
"""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .models import Caso, Cita
from .serializers import CasoPortalSerializer, CitaClienteSerializer


class EsCliente(BasePermission):
    """Permite el paso solo a usuarios que tienen un cliente asociado."""

    message = "Esta sección es solo para clientes."

    def has_permission(self, request, view):
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and hasattr(usuario, "cliente"))


@api_view(["GET"])
@permission_classes([EsCliente])
def mis_casos(request):
    """
    Todo lo que necesita ver el cliente al entrar:
    sus datos, sus próximas citas (fecha, hora, lugar) y sus casos con el historial.
    """
    cliente = request.user.cliente
    casos = (
        Caso.objects.filter(cliente=cliente)
        .select_related("abogada__perfil")
        .prefetch_related("actuaciones", "citas")
    )
    # Citas pendientes del cliente: las suyas directamente o las de alguno de sus casos
    citas = (
        Cita.objects.filter(Q(cliente=cliente) | Q(caso__cliente=cliente))
        .filter(completada=False, fecha_hora__gte=timezone.now())
        .select_related("caso")
        .distinct()
    )
    return Response(
        {
            "cliente": {
                "nombre": cliente.nombre,
                "documento": f"{cliente.tipo_documento} {cliente.numero_documento}",
                "correo": cliente.correo,
                "telefono": cliente.telefono,
            },
            "citas": CitaClienteSerializer(citas, many=True).data,
            "casos": CasoPortalSerializer(casos, many=True).data,
        }
    )


@api_view(["POST"])
@permission_classes([EsCliente])
def cambiar_password(request):
    """El cliente cambia su propia contraseña: {"actual": "...", "nueva": "..."}"""
    usuario = request.user
    if not usuario.check_password(request.data.get("actual", "")):
        return Response({"detail": "La contraseña actual no es correcta."}, status=status.HTTP_400_BAD_REQUEST)

    nueva = request.data.get("nueva", "")
    try:
        validate_password(nueva, usuario)
    except ValidationError as error:
        return Response({"detail": " ".join(error.messages)}, status=status.HTTP_400_BAD_REQUEST)

    usuario.set_password(nueva)
    usuario.save()
    return Response({"detail": "Contraseña actualizada."})
