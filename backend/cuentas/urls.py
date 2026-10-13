"""Rutas de sesión y cuentas: /api/cuentas/..."""

from django.urls import path

from . import registro, views

urlpatterns = [
    path("login/", views.iniciar_sesion, name="login"),
    path("logout/", views.cerrar_sesion, name="logout"),
    path("yo/", views.yo, name="yo"),
    path("abogadas/", views.abogadas, name="abogadas"),
    # Crear cuenta (clientes) y recuperar contraseña
    path("registro/", registro.crear_cuenta, name="registro"),
    path("recuperar/", registro.pedir_codigo, name="recuperar"),
    path("recuperar/confirmar/", registro.cambiar_con_codigo, name="recuperar-confirmar"),
]
