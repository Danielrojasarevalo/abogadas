"""
Serializadores: convierten las tablas a JSON (y al revés) para la API.
Además de los ids, devolvemos nombres legibles para mostrarlos en pantalla.
"""

from django.utils import timezone
from rest_framework import serializers

from .models import Actuacion, Caso, Cita, Cliente, InfoDespacho, PerfilAbogada, Rama, Solicitud


class ClienteSerializer(serializers.ModelSerializer):
    # Cantidad de casos del cliente (solo lectura)
    total_casos = serializers.IntegerField(source="casos.count", read_only=True)
    # Usuario con el que el cliente entra al portal ("" si no tiene acceso)
    usuario_portal = serializers.CharField(source="usuario.username", read_only=True, default="")

    class Meta:
        model = Cliente
        fields = "__all__"
        # El acceso al portal se maneja con su propia ruta (/clientes/<id>/acceso/)
        read_only_fields = ["usuario"]


class ActuacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actuacion
        fields = "__all__"


class CasoSerializer(serializers.ModelSerializer):
    # Textos de ayuda para la pantalla (solo lectura)
    cliente_nombre = serializers.CharField(source="cliente.nombre", read_only=True)
    abogada_nombre = serializers.CharField(source="abogada.first_name", read_only=True, default="")
    area_texto = serializers.CharField(source="get_area_display", read_only=True)
    estado_texto = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = Caso
        fields = "__all__"


class CitaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source="cliente.nombre", read_only=True, default="")
    caso_titulo = serializers.CharField(source="caso.titulo", read_only=True, default="")
    tipo_texto = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = Cita
        fields = "__all__"


# ---------- Perfil, ramas e información del despacho ----------


class RamaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rama
        fields = ["id", "nombre", "descripcion"]


class PerfilAbogadaSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source="usuario.first_name", read_only=True)

    class Meta:
        model = PerfilAbogada
        fields = ["nombre", "titulo", "descripcion", "telefono", "correo"]


class InfoDespachoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfoDespacho
        exclude = ["id"]


class SolicitudSerializer(serializers.ModelSerializer):
    abogada_nombre = serializers.CharField(source="abogada.first_name", read_only=True, default="")

    class Meta:
        model = Solicitud
        fields = "__all__"


# ---------- Lo que ve el cliente en su portal (solo lectura) ----------


class ActuacionPortalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actuacion
        fields = ["id", "fecha", "descripcion"]


class CitaPortalSerializer(serializers.ModelSerializer):
    tipo_texto = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = Cita
        fields = ["id", "titulo", "tipo_texto", "fecha_hora", "lugar"]


class CitaClienteSerializer(serializers.ModelSerializer):
    """Cita vista por el cliente (sin las notas internas de las abogadas)."""

    tipo_texto = serializers.CharField(source="get_tipo_display", read_only=True)
    caso_titulo = serializers.CharField(source="caso.titulo", read_only=True, default="")

    class Meta:
        model = Cita
        fields = ["id", "titulo", "tipo", "tipo_texto", "fecha_hora", "lugar", "caso_titulo"]


class CasoPortalSerializer(serializers.ModelSerializer):
    """Caso visto por el cliente: sin notas internas ni datos de otros clientes."""

    abogada_nombre = serializers.CharField(source="abogada.first_name", read_only=True, default="")
    abogada_telefono = serializers.CharField(source="abogada.perfil.telefono", read_only=True, default="")
    abogada_correo = serializers.CharField(source="abogada.perfil.correo", read_only=True, default="")
    area_texto = serializers.CharField(source="get_area_display", read_only=True)
    estado_texto = serializers.CharField(source="get_estado_display", read_only=True)
    actuaciones = serializers.SerializerMethodField()
    proximas_citas = serializers.SerializerMethodField()

    class Meta:
        model = Caso
        fields = [
            "id", "titulo", "radicado", "juzgado", "area", "area_texto", "estado",
            "estado_texto", "descripcion", "fecha_inicio", "abogada_nombre",
            "abogada_telefono", "abogada_correo",
            "actuaciones", "proximas_citas",
        ]

    def get_actuaciones(self, caso):
        # Solo las actuaciones marcadas como visibles para el cliente
        visibles = caso.actuaciones.filter(visible_cliente=True)
        return ActuacionPortalSerializer(visibles, many=True).data

    def get_proximas_citas(self, caso):
        citas = caso.citas.filter(completada=False, fecha_hora__gte=timezone.now())
        return CitaPortalSerializer(citas, many=True).data
