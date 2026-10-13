"""Rutas principales del backend."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Panel de administración de Django (entran las mismas dos abogadas)
    path("admin/", admin.site.urls),
    # Inicio de sesión
    path("api/cuentas/", include("cuentas.urls")),
    # Clientes, casos, actuaciones, citas y resumen
    path("api/", include("despacho.urls")),
]
