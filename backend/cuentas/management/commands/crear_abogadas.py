"""
Comando: python manage.py crear_abogadas

Crea (o actualiza) las DOS únicas usuarias administradoras del sistema,
usando los datos ABOGADA1_* y ABOGADA2_* del archivo .env.
Se puede ejecutar varias veces sin problema: si ya existen, actualiza su contraseña.
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from despacho.models import PerfilAbogada


class Command(BaseCommand):
    help = "Crea las dos usuarias administradoras (abogadas) definidas en el .env"

    def handle(self, *args, **opciones):
        Usuario = get_user_model()

        for numero in (1, 2):
            usuario = os.environ.get(f"ABOGADA{numero}_USUARIO")
            nombre = os.environ.get(f"ABOGADA{numero}_NOMBRE", usuario)
            password = os.environ.get(f"ABOGADA{numero}_PASSWORD")
            if not usuario or not password:
                raise CommandError(f"Faltan ABOGADA{numero}_USUARIO o ABOGADA{numero}_PASSWORD en el .env")

            cuenta, creada = Usuario.objects.get_or_create(username=usuario)
            cuenta.first_name = nombre
            cuenta.is_staff = True  # Puede usar la API y el panel /admin/
            cuenta.is_superuser = True  # Administradora con todos los permisos
            cuenta.is_active = True
            cuenta.set_password(password)
            cuenta.save()
            # Perfil público (descripción y ramas se llenan desde "Mi perfil")
            PerfilAbogada.objects.get_or_create(usuario=cuenta)

            accion = "creada" if creada else "actualizada"
            self.stdout.write(self.style.SUCCESS(f"Usuaria '{usuario}' {accion}."))
