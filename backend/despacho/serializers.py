"""
Serializadores: convierten las tablas a JSON (y al revés) para la API.
Además de los ids, devolvemos nombres legibles para mostrarlos en pantalla.
"""

from django.utils import timezone
from rest_framework import serializers

from .models import Actuacion, Caso, Cita, Cliente, Documento, InfoDespacho, PerfilAbogada, Rama, Solicitud


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
    # Dirección del cliente: sirve de ubicación si la reunión no tiene lugar escrito
    cliente_direccion = serializers.CharField(source="cliente.direccion", read_only=True, default="")

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
        fields = [
            "nombre", "titulo", "descripcion", "telefono", "whatsapp", "correo",
            "frase", "anios_experiencia", "tarjeta_profesional",
            "formacion", "experiencia", "logros", "idiomas", "atencion", "ciudad",
        ]


class InfoDespachoSerializer(serializers.ModelSerializer):
    # Campos obligatorios de la política que faltan por llenar
    faltantes = serializers.ListField(read_only=True)

    class Meta:
        model = InfoDespacho
        exclude = ["id"]
        read_only_fields = ["politica_actualizada"]


class SolicitudSerializer(serializers.ModelSerializer):
    abogada_nombre = serializers.CharField(source="abogada.first_name", read_only=True, default="")

    class Meta:
        model = Solicitud
        fields = "__all__"


# ---------- Documentos (PDF y Word) ----------


class DocumentoSerializer(serializers.ModelSerializer):
    """Documento visto por las abogadas. El archivo se descarga por /documentos/<id>/descargar/."""

    subido_por_nombre = serializers.SerializerMethodField()
    extension = serializers.CharField(read_only=True)
    tamano = serializers.SerializerMethodField()
    # Al subir se envía el archivo; al leer no se devuelve la ruta interna
    archivo = serializers.FileField(write_only=True)
    # En un formulario con archivo, si no se envía la casilla quedaría en False
    visible_cliente = serializers.BooleanField(default=True)

    class Meta:
        model = Documento
        fields = [
            "id", "caso", "nombre", "descripcion", "archivo", "visible_cliente",
            "subido_por_cliente", "subido_por_nombre", "extension", "tamano", "creado",
        ]
        read_only_fields = ["subido_por_cliente"]
        # Si no escriben un nombre se usa el del archivo (ver validate)
        extra_kwargs = {"nombre": {"required": False, "allow_blank": True}}

    def get_subido_por_nombre(self, documento):
        usuario = documento.subido_por
        return (usuario.first_name or usuario.username) if usuario else ""

    def get_tamano(self, documento):
        try:
            return documento.archivo.size
        except (FileNotFoundError, ValueError):
            return 0

    def validate_archivo(self, archivo):
        extension = archivo.name.rsplit(".", 1)[-1].lower() if "." in archivo.name else ""
        if extension not in Documento.EXTENSIONES:
            raise serializers.ValidationError("Solo se permiten archivos PDF o Word (.pdf, .doc, .docx).")
        if archivo.size > Documento.TAMANO_MAXIMO:
            raise serializers.ValidationError("El archivo pesa más de 10 MB.")
        return archivo

    def validate(self, datos):
        # Si no escriben un nombre, usamos el del archivo
        if not datos.get("nombre") and datos.get("archivo"):
            datos["nombre"] = datos["archivo"].name[:150]
        return datos


class DocumentoPortalSerializer(DocumentoSerializer):
    """Documento visto (o subido) por el cliente: no puede ocultarlo ni elegir otro caso que no sea suyo."""

    class Meta(DocumentoSerializer.Meta):
        fields = [
            "id", "caso", "nombre", "descripcion", "archivo", "subido_por_cliente",
            "subido_por_nombre", "extension", "tamano", "creado",
        ]


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
    abogada_whatsapp = serializers.CharField(source="abogada.perfil.whatsapp", read_only=True, default="")
    area_texto = serializers.CharField(source="get_area_display", read_only=True)
    estado_texto = serializers.CharField(source="get_estado_display", read_only=True)
    actuaciones = serializers.SerializerMethodField()
    proximas_citas = serializers.SerializerMethodField()
    documentos = serializers.SerializerMethodField()

    class Meta:
        model = Caso
        fields = [
            "id", "titulo", "radicado", "juzgado", "area", "area_texto", "estado",
            "estado_texto", "descripcion", "fecha_inicio", "abogada_nombre",
            "abogada_telefono", "abogada_correo", "abogada_whatsapp",
            "actuaciones", "proximas_citas", "documentos",
        ]

    def get_actuaciones(self, caso):
        # Solo las actuaciones marcadas como visibles para el cliente
        visibles = caso.actuaciones.filter(visible_cliente=True)
        return ActuacionPortalSerializer(visibles, many=True).data

    def get_proximas_citas(self, caso):
        citas = caso.citas.filter(completada=False, fecha_hora__gte=timezone.now())
        return CitaPortalSerializer(citas, many=True).data

    def get_documentos(self, caso):
        visibles = caso.documentos.filter(visible_cliente=True).select_related("subido_por")
        return DocumentoPortalSerializer(visibles, many=True).data
