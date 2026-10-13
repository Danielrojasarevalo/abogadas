"""
Tablas principales del despacho de abogadas.

- Cliente: las personas o empresas que contratan al despacho.
- Caso: cada proceso o asunto legal de un cliente.
- Actuacion: el seguimiento de un caso (audiencias, memoriales, notas...).
- Cita: la agenda de reuniones y audiencias.
- PerfilAbogada / Rama: lo que ve el público de cada abogada (descripción y ramas).
- InfoDespacho: la presentación general del despacho en la página pública.
- Solicitud: las consultas que envían los visitantes eligiendo una abogada.
"""

from django.conf import settings
from django.db import models


class Cliente(models.Model):
    """Persona natural o empresa que es atendida por el despacho."""

    TIPOS_DOCUMENTO = [
        ("CC", "Cédula de ciudadanía"),
        ("CE", "Cédula de extranjería"),
        ("NIT", "NIT"),
        ("PAS", "Pasaporte"),
        ("TI", "Tarjeta de identidad"),
    ]

    nombre = models.CharField("Nombre completo o razón social", max_length=150)
    tipo_documento = models.CharField(max_length=3, choices=TIPOS_DOCUMENTO, default="CC")
    numero_documento = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    direccion = models.CharField(max_length=200, blank=True)
    notas = models.TextField(blank=True)
    # Cuenta para entrar al portal de clientes (vacío = el cliente no tiene acceso)
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cliente",
    )
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name = "cliente"
        verbose_name_plural = "clientes"

    def __str__(self):
        return f"{self.nombre} ({self.numero_documento})"


class Caso(models.Model):
    """Proceso o asunto legal que el despacho lleva para un cliente."""

    AREAS = [
        ("civil", "Civil"),
        ("familia", "Familia"),
        ("laboral", "Laboral"),
        ("penal", "Penal"),
        ("administrativo", "Administrativo"),
        ("comercial", "Comercial"),
        ("otro", "Otro"),
    ]

    ESTADOS = [
        ("abierto", "Abierto"),
        ("en_tramite", "En trámite"),
        ("suspendido", "Suspendido"),
        ("cerrado", "Cerrado"),
    ]

    # Si se borra el cliente no se pierden sus casos por accidente (PROTECT)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="casos")
    # Abogada responsable del caso (una de las dos usuarias)
    abogada = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="casos",
    )
    titulo = models.CharField(max_length=150)
    radicado = models.CharField("Número de radicado", max_length=40, blank=True)
    juzgado = models.CharField("Juzgado o entidad", max_length=150, blank=True)
    area = models.CharField(max_length=20, choices=AREAS, default="civil")
    estado = models.CharField(max_length=20, choices=ESTADOS, default="abierto")
    descripcion = models.TextField(blank=True)
    honorarios = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    fecha_inicio = models.DateField()
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_inicio"]
        verbose_name = "caso"
        verbose_name_plural = "casos"

    def __str__(self):
        return self.titulo


class Actuacion(models.Model):
    """Cada paso o novedad dentro de un caso (bitácora del proceso)."""

    # Si se borra el caso, se borra también su historial
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE, related_name="actuaciones")
    fecha = models.DateField()
    descripcion = models.TextField()
    # Si es False, es una nota interna que el cliente NO ve en su portal
    visible_cliente = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha", "-creado"]
        verbose_name = "actuación"
        verbose_name_plural = "actuaciones"

    def __str__(self):
        return f"{self.fecha} - {self.caso}"


class Cita(models.Model):
    """Reunión, audiencia o recordatorio en la agenda del despacho."""

    TIPOS = [
        ("reunion", "Reunión con cliente"),
        ("audiencia", "Audiencia"),
        ("vencimiento", "Vencimiento de término"),
        ("otro", "Otro"),
    ]

    titulo = models.CharField(max_length=150)
    tipo = models.CharField(max_length=20, choices=TIPOS, default="reunion")
    fecha_hora = models.DateTimeField()
    lugar = models.CharField(max_length=150, blank=True)
    # La cita puede estar ligada a un cliente y/o a un caso, pero no es obligatorio
    cliente = models.ForeignKey(
        Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name="citas"
    )
    caso = models.ForeignKey(
        Caso, on_delete=models.SET_NULL, null=True, blank=True, related_name="citas"
    )
    notas = models.TextField(blank=True)
    completada = models.BooleanField(default=False)

    class Meta:
        ordering = ["fecha_hora"]
        verbose_name = "cita"
        verbose_name_plural = "citas"

    def __str__(self):
        return f"{self.titulo} - {self.fecha_hora:%Y-%m-%d %H:%M}"


class PerfilAbogada(models.Model):
    """Información pública de cada abogada (se muestra en la página de inicio)."""

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="perfil"
    )
    titulo = models.CharField("Título profesional", max_length=120, default="Abogada")
    descripcion = models.TextField("Presentación", blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)

    class Meta:
        verbose_name = "perfil de abogada"
        verbose_name_plural = "perfiles de abogadas"

    def __str__(self):
        return self.usuario.first_name or self.usuario.username


class Rama(models.Model):
    """
    Rama del derecho en la que trabaja una abogada (ej: Familia, Laboral).
    Es opcional: si una abogada no agrega ramas, en la página pública no aparece esa sección.
    """

    abogada = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ramas"
    )
    nombre = models.CharField(max_length=80)
    descripcion = models.CharField(max_length=250, blank=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name = "rama del derecho"
        verbose_name_plural = "ramas del derecho"

    def __str__(self):
        return f"{self.nombre} ({self.abogada})"


class InfoDespacho(models.Model):
    """Presentación general del despacho. Solo existe un registro (id=1)."""

    nombre = models.CharField(max_length=120, default="Elizabeth Imbachi & Katherine Rojas Abogadas")
    lema = models.CharField(max_length=200, blank=True, default="Asesoría legal cercana, clara y comprometida.")
    descripcion = models.TextField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    direccion = models.CharField(max_length=200, blank=True)
    horario = models.CharField(max_length=120, blank=True)

    class Meta:
        verbose_name = "información del despacho"
        verbose_name_plural = "información del despacho"

    def __str__(self):
        return self.nombre

    @classmethod
    def obtener(cls):
        """Devuelve el único registro, creándolo si todavía no existe."""
        info, _ = cls.objects.get_or_create(pk=1)
        return info


class Solicitud(models.Model):
    """Consulta que envía un visitante desde la página pública, eligiendo abogada."""

    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    correo = models.EmailField(blank=True)
    mensaje = models.TextField()
    # Abogada que eligió el visitante
    abogada = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="solicitudes",
    )
    rama = models.CharField("Rama de interés", max_length=80, blank=True)
    atendida = models.BooleanField(default=False)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["atendida", "-creado"]
        verbose_name = "solicitud de consulta"
        verbose_name_plural = "solicitudes de consulta"

    def __str__(self):
        return f"{self.nombre} -> {self.abogada}"
