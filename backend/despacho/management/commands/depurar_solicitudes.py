"""
Borra las solicitudes de consulta más viejas que el plazo de conservación de la
política de datos ("Mi perfil" > Protección de datos). Se puede programar con cron:

    ./venv/bin/python manage.py depurar_solicitudes
"""

from django.core.management.base import BaseCommand

from despacho.datos import depurar_solicitudes


class Command(BaseCommand):
    help = "Borra las solicitudes que superaron el plazo de conservación de datos."

    def handle(self, *args, **opciones):
        cantidad = depurar_solicitudes()
        self.stdout.write(self.style.SUCCESS(f"Solicitudes borradas: {cantidad}"))
