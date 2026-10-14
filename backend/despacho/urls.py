"""Rutas de la API del despacho (todas empiezan por /api/)."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import datos, portal, publico, views

# El router crea solo las rutas de listar, crear, ver, editar y borrar
router = DefaultRouter()
router.register("clientes", views.ClienteViewSet, basename="cliente")
router.register("casos", views.CasoViewSet, basename="caso")
router.register("actuaciones", views.ActuacionViewSet, basename="actuacion")
router.register("citas", views.CitaViewSet, basename="cita")
router.register("ramas", views.RamaViewSet, basename="rama")
router.register("solicitudes", views.SolicitudViewSet, basename="solicitud")
router.register("documentos", views.DocumentoViewSet, basename="documento")
# Protección de datos: cada abogada solo ve lo dirigido a ella
router.register("peticiones-datos", datos.PeticionDatosViewSet, basename="peticion-datos")
router.register("autorizaciones", datos.AutorizacionViewSet, basename="autorizacion")

urlpatterns = [
    # Panel de las abogadas
    path("resumen/", views.resumen, name="resumen"),
    path("perfil/", views.mi_perfil, name="mi-perfil"),
    path("despacho/", views.info_despacho, name="info-despacho"),
    path("datos/depurar/", datos.depurar, name="depurar-solicitudes"),
    # Página pública (sin iniciar sesión)
    path("publico/", publico.presentacion, name="publico"),
    path("publico/solicitud/", publico.enviar_solicitud, name="publico-solicitud"),
    # Portal de clientes
    path("portal/casos/", portal.mis_casos, name="portal-casos"),
    path("portal/password/", portal.cambiar_password, name="portal-password"),
    path("portal/documentos/", portal.subir_documento, name="portal-documentos"),
    path("portal/documentos/<int:pk>/", portal.borrar_documento, name="portal-documento"),
    path("portal/documentos/<int:pk>/descargar/", portal.descargar_documento, name="portal-descargar"),
    # Protección de datos del cliente (solo él y la abogada que autorizó)
    path("portal/datos/", datos.mis_datos, name="portal-datos"),
    path("portal/datos/autorizar/", datos.autorizar, name="portal-autorizar"),
    path("portal/datos/peticiones/", datos.nueva_peticion, name="portal-peticiones"),
    path("portal/datos/descargar/", datos.descargar_mis_datos, name="portal-descargar-datos"),
] + router.urls
