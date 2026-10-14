"""Registro de las tablas en el panel de administración de Django (/admin/)."""

from django.contrib import admin

from .models import (
    Actuacion,
    AutorizacionDatos,
    Caso,
    Cita,
    Cliente,
    Documento,
    InfoDespacho,
    PerfilAbogada,
    PeticionDatos,
    Rama,
    Solicitud,
)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nombre", "numero_documento", "telefono", "correo")
    search_fields = ("nombre", "numero_documento")


class ActuacionEnLinea(admin.TabularInline):
    """Permite ver y agregar actuaciones dentro de la ficha del caso."""

    model = Actuacion
    extra = 0


class DocumentoEnLinea(admin.TabularInline):
    """Documentos (PDF y Word) dentro de la ficha del caso."""

    model = Documento
    extra = 0
    fields = ("nombre", "archivo", "visible_cliente", "subido_por_cliente", "creado")
    readonly_fields = ("subido_por_cliente", "creado")


@admin.register(Caso)
class CasoAdmin(admin.ModelAdmin):
    list_display = ("titulo", "cliente", "area", "estado", "abogada", "fecha_inicio")
    list_filter = ("estado", "area", "abogada")
    search_fields = ("titulo", "radicado", "cliente__nombre")
    inlines = [ActuacionEnLinea, DocumentoEnLinea]


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "tipo", "fecha_hora", "cliente", "completada")
    list_filter = ("tipo", "completada")


@admin.register(PerfilAbogada)
class PerfilAbogadaAdmin(admin.ModelAdmin):
    list_display = ("usuario", "titulo", "telefono", "whatsapp", "correo")


@admin.register(Rama)
class RamaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "abogada")
    list_filter = ("abogada",)


@admin.register(InfoDespacho)
class InfoDespachoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "telefono", "correo")


@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ("nombre", "telefono", "abogada", "rama", "atendida", "creado")
    list_filter = ("atendida", "abogada")


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "caso", "subido_por", "subido_por_cliente", "visible_cliente", "creado")
    list_filter = ("subido_por_cliente", "visible_cliente")
    search_fields = ("nombre", "caso__titulo", "caso__cliente__nombre")


@admin.register(AutorizacionDatos)
class AutorizacionDatosAdmin(admin.ModelAdmin):
    """Prueba de las autorizaciones: no se editan, solo se consultan."""

    list_display = ("nombre", "abogada", "origen", "datos_sensibles", "fecha", "revocada")
    list_filter = ("origen", "abogada")
    readonly_fields = [f.name for f in AutorizacionDatos._meta.fields]


@admin.register(PeticionDatos)
class PeticionDatosAdmin(admin.ModelAdmin):
    list_display = ("cliente", "tipo", "estado", "abogada", "creado")
    list_filter = ("tipo", "estado", "abogada")
