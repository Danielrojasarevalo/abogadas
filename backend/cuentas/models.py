"""
Tablas de la app de cuentas.
Los usuarios son los de Django (auth_user); aquí solo guardamos los códigos
para recuperar la contraseña.
"""

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class CodigoRecuperacion(models.Model):
    """Código de 6 dígitos que se envía al correo para cambiar la contraseña."""

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="codigos")
    # Guardamos el código cifrado (nunca en texto plano)
    codigo_cifrado = models.CharField(max_length=128)
    creado = models.DateTimeField(auto_now_add=True)
    intentos = models.PositiveSmallIntegerField(default=0)
    usado = models.BooleanField(default=False)

    # El código vence a los 15 minutos y se bloquea tras 5 intentos fallidos
    VIGENCIA = timedelta(minutes=15)
    MAX_INTENTOS = 5

    class Meta:
        ordering = ["-creado"]

    def vigente(self):
        return (
            not self.usado
            and self.intentos < self.MAX_INTENTOS
            and timezone.now() - self.creado < self.VIGENCIA
        )
