"""Rutas de la API del despacho (todas empiezan por /api/)."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import portal, publico, views

# El router crea solo las rutas de listar, crear, ver, editar y borrar
router = DefaultRouter()
router.register("clientes", views.ClienteViewSet, basename="cliente")
router.register("casos", views.CasoViewSet, basename="caso")
router.register("actuaciones", views.ActuacionViewSet, basename="actuacion")
router.register("citas", views.CitaViewSet, basename="cita")
router.register("ramas", views.RamaViewSet, basename="rama")
router.register("solicitudes", views.SolicitudViewSet, basename="solicitud")

urlpatterns = [
    # Panel de las abogadas
    path("resumen/", views.resumen, name="resumen"),
    path("perfil/", views.mi_perfil, name="mi-perfil"),
    path("despacho/", views.info_despacho, name="info-despacho"),
    # Página pública (sin iniciar sesión)
    path("publico/", publico.presentacion, name="publico"),
    path("publico/solicitud/", publico.enviar_solicitud, name="publico-solicitud"),
    # Portal de clientes
    path("portal/casos/", portal.mis_casos, name="portal-casos"),
    path("portal/password/", portal.cambiar_password, name="portal-password"),
] + router.urls
