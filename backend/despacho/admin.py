"""Registro de las tablas en el panel de administración de Django (/admin/)."""

from django.contrib import admin

from .models import Actuacion, Caso, Cita, Cliente, InfoDespacho, PerfilAbogada, Rama, Solicitud


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nombre", "numero_documento", "telefono", "correo")
    search_fields = ("nombre", "numero_documento")


class ActuacionEnLinea(admin.TabularInline):
    """Permite ver y agregar actuaciones dentro de la ficha del caso."""

    model = Actuacion
    extra = 0


@admin.register(Caso)
class CasoAdmin(admin.ModelAdmin):
    list_display = ("titulo", "cliente", "area", "estado", "abogada", "fecha_inicio")
    list_filter = ("estado", "area", "abogada")
    search_fields = ("titulo", "radicado", "cliente__nombre")
    inlines = [ActuacionEnLinea]


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "tipo", "fecha_hora", "cliente", "completada")
    list_filter = ("tipo", "completada")


@admin.register(PerfilAbogada)
class PerfilAbogadaAdmin(admin.ModelAdmin):
    list_display = ("usuario", "titulo", "telefono", "correo")


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
