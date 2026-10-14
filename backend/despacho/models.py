"""
Tablas principales del despacho de abogadas.

- Cliente: las personas o empresas que contratan al despacho.
- Caso: cada proceso o asunto legal de un cliente.
- Actuacion: el seguimiento de un caso (audiencias, memoriales, notas...).
- Cita: la agenda de reuniones y audiencias.
- PerfilAbogada / Rama: lo que ve el público de cada abogada (descripción y ramas).
- InfoDespacho: la presentación general del despacho en la página pública.
- Solicitud: las consultas que envían los visitantes eligiendo una abogada.
- Documento: archivos PDF o Word de un caso que suben las abogadas o el cliente.
- AutorizacionDatos / PeticionDatos: protección de datos personales (Ley 1581 de 2012).
"""

import os
from datetime import timedelta

from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


class Cliente(models.Model):
    """Persona natural o empresa que es atendida por el despacho."""

    TIPOS_DOCUMENTO = [
        ("CC", "Cédula de ciudadanía"),
        ("CE", "Cédula de extranjería"),
        ("NIT", "NIT"),
        ("PAS", "Pasaporte"),
        ("TI", "Tarjeta de identidad"),
        ("PPT", "Permiso por Protección Temporal"),
        ("PEP", "Permiso Especial de Permanencia"),
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
    # Número al que los visitantes envían su consulta por WhatsApp (con indicativo, ej: +57 313 3957573)
    whatsapp = models.CharField("WhatsApp", max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    # Trayectoria (todo opcional: en la página pública solo se muestra lo que esté lleno)
    frase = models.CharField("Frase o lema personal", max_length=200, blank=True)
    anios_experiencia = models.PositiveSmallIntegerField("Años de experiencia", null=True, blank=True)
    tarjeta_profesional = models.CharField("Tarjeta profesional", max_length=40, blank=True)
    # Una línea por cada estudio / experiencia / logro
    formacion = models.TextField("Formación académica (una por línea)", blank=True)
    experiencia = models.TextField("Experiencia profesional (una por línea)", blank=True)
    logros = models.TextField("Logros o reconocimientos (uno por línea)", blank=True)
    idiomas = models.CharField(max_length=120, blank=True)
    atencion = models.CharField("Modalidad de atención", max_length=120, blank=True)
    # Ciudad donde atiende (se muestra en su tarjeta y en el pie de página)
    ciudad = models.CharField("Ciudad donde atiende", max_length=80, blank=True)

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

    # ---- Protección de datos y aviso legal (los llenan las abogadas en "Mi perfil") ----
    # Con estos datos se arma la Política de Tratamiento que ve el público
    # (Ley 1581 de 2012 y Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015).
    responsable_nombre = models.CharField("Responsable(s) del tratamiento", max_length=200, blank=True)
    responsable_identificacion = models.CharField("Identificación (C.C. / NIT)", max_length=120, blank=True)
    ciudad = models.CharField("Ciudad (domicilio)", max_length=80, blank=True)
    correo_datos = models.EmailField("Correo para peticiones de datos", blank=True)
    area_peticiones = models.CharField(
        "Persona o área que atiende las peticiones", max_length=200, blank=True
    )
    finalidades_adicionales = models.TextField("Otras finalidades (una por línea)", blank=True)
    vigencia_base_datos = models.CharField(
        "Vigencia de la base de datos",
        max_length=250,
        blank=True,
        default="Mientras exista la relación con el titular y durante los términos legales de conservación.",
    )
    vigencia_politica = models.DateField("Fecha de entrada en vigencia de la política", null=True, blank=True)
    meses_conservacion_solicitudes = models.PositiveSmallIntegerField(
        "Meses que se guardan las solicitudes que no se volvieron clientes", default=12
    )
    # Condiciones de la consulta (Estatuto del Consumidor: información clara)
    costo_consulta = models.CharField("Costo de la primera consulta", max_length=150, blank=True)
    tiempo_respuesta = models.CharField("Tiempo de respuesta a las solicitudes", max_length=150, blank=True)
    # Cambia cada vez que se modifica la política: las autorizaciones guardan esta versión
    politica_actualizada = models.DateTimeField(null=True, blank=True)

    # Campos que la ley exige que aparezcan en la política
    CAMPOS_OBLIGATORIOS = [
        "responsable_nombre", "responsable_identificacion", "ciudad", "direccion",
        "telefono", "area_peticiones", "vigencia_politica",
    ]
    # Si alguno de estos cambia, la política es una versión nueva
    CAMPOS_POLITICA = CAMPOS_OBLIGATORIOS + [
        "correo", "correo_datos", "finalidades_adicionales", "vigencia_base_datos",
        "meses_conservacion_solicitudes",
    ]

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

    def faltantes(self):
        """Campos obligatorios de la política que todavía están vacíos."""
        faltan = [c for c in self.CAMPOS_OBLIGATORIOS if not getattr(self, c)]
        if not (self.correo_datos or self.correo):
            faltan.append("correo_datos")
        return faltan

    def version_politica(self):
        """Texto que identifica la versión vigente de la política."""
        fecha = self.politica_actualizada or self.vigencia_politica
        return fecha.isoformat() if fecha else "sin-fecha"


class Solicitud(models.Model):
    """Consulta que envía un visitante desde la página pública, eligiendo abogada."""

    nombre = models.CharField(max_length=150)
    # Identificación de quien pide la consulta (obligatoria desde el formulario público)
    tipo_documento = models.CharField(max_length=3, choices=Cliente.TIPOS_DOCUMENTO, default="CC")
    numero_documento = models.CharField(max_length=20, blank=True)
    ciudad = models.CharField("Ciudad o municipio", max_length=80, blank=True)
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
    # Prueba de la autorización de datos (ver AutorizacionDatos)
    acepta_datos = models.BooleanField("Autorizó el tratamiento de datos", default=False)
    # Ubicación desde donde se envió la consulta (solo si el visitante dio permiso en el navegador)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    precision_m = models.PositiveIntegerField("Precisión de la ubicación (metros)", null=True, blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["atendida", "-creado"]
        verbose_name = "solicitud de consulta"
        verbose_name_plural = "solicitudes de consulta"

    def __str__(self):
        return f"{self.nombre} -> {self.abogada}"


def ruta_documento(documento, nombre_archivo):
    """Los archivos se guardan separados por caso: documentos/caso_5/demanda.pdf"""
    return f"documentos/caso_{documento.caso_id}/{nombre_archivo}"


class Documento(models.Model):
    """Archivo PDF o Word de un caso. Lo pueden subir las abogadas o el cliente desde su portal."""

    EXTENSIONES = ["pdf", "doc", "docx"]
    TAMANO_MAXIMO = 10 * 1024 * 1024  # 10 MB

    # Si se borra el caso, se borran también sus documentos
    caso = models.ForeignKey(Caso, on_delete=models.CASCADE, related_name="documentos")
    nombre = models.CharField(max_length=150)
    descripcion = models.CharField(max_length=250, blank=True)
    archivo = models.FileField(
        upload_to=ruta_documento, validators=[FileExtensionValidator(EXTENSIONES)]
    )
    # Quién lo subió (una abogada o el usuario del cliente)
    subido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documentos_subidos",
    )
    subido_por_cliente = models.BooleanField(default=False)
    # Si es False, es un documento interno que el cliente NO ve en su portal
    visible_cliente = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado"]
        verbose_name = "documento"
        verbose_name_plural = "documentos"

    def __str__(self):
        return f"{self.nombre} ({self.caso})"

    @property
    def extension(self):
        return os.path.splitext(self.archivo.name)[1].lstrip(".").lower()

    def delete(self, *args, **kwargs):
        # Al borrar el registro también se borra el archivo del disco
        self.archivo.delete(save=False)
        super().delete(*args, **kwargs)


# ---------- Protección de datos personales (Ley 1581 de 2012) ----------


class AutorizacionDatos(models.Model):
    """
    Prueba de que el titular autorizó el tratamiento de sus datos (la ley exige poder demostrarlo).
    Cada autorización queda dirigida a UNA abogada: solo ella y el titular la pueden ver.
    """

    ORIGENES = [
        ("solicitud", "Formulario de consulta"),
        ("registro", "Creación de cuenta"),
        ("portal", "Portal de clientes"),
    ]

    abogada = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="autorizaciones_recibidas"
    )
    # Quién autorizó: un cliente con cuenta o un visitante que envió una solicitud
    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, null=True, blank=True, related_name="autorizaciones"
    )
    solicitud = models.OneToOneField(
        Solicitud, on_delete=models.CASCADE, null=True, blank=True, related_name="autorizacion"
    )
    nombre = models.CharField("Nombre del titular", max_length=150)
    origen = models.CharField(max_length=20, choices=ORIGENES)
    # Autorización expresa para datos sensibles (salud, violencia, menores, etc.)
    datos_sensibles = models.BooleanField(default=False)
    version_politica = models.CharField(max_length=40)
    ip = models.GenericIPAddressField(null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    revocada = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "autorización de datos"
        verbose_name_plural = "autorizaciones de datos"

    def __str__(self):
        return f"{self.nombre} -> {self.abogada} ({self.fecha:%Y-%m-%d})"


class PeticionDatos(models.Model):
    """
    Consulta o reclamo del titular sobre sus datos (derechos de la Ley 1581, art. 8).
    La recibe solo la abogada a la que el cliente autorizó.
    Plazos: consultas 10 días hábiles (art. 14); reclamos 15 días hábiles (art. 15).
    """

    TIPOS = [
        ("conocer", "Conocer qué datos míos tienen"),
        ("actualizar", "Actualizar o corregir mis datos"),
        ("suprimir", "Borrar mis datos / mi cuenta"),
        ("revocar", "Revocar la autorización"),
        ("otro", "Otra consulta o reclamo"),
    ]
    # Solo "conocer" es consulta; los demás son reclamos
    CONSULTAS = ["conocer"]

    ESTADOS = [
        ("recibida", "Recibida"),
        ("en_tramite", "En trámite"),
        ("respondida", "Respondida"),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="peticiones_datos")
    abogada = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="peticiones_datos"
    )
    tipo = models.CharField(max_length=20, choices=TIPOS)
    detalle = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="recibida")
    respuesta = models.TextField(blank=True)
    creado = models.DateTimeField(auto_now_add=True)
    respondida_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-creado"]
        verbose_name = "petición de datos"
        verbose_name_plural = "peticiones de datos"

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.cliente}"

    @property
    def dias_habiles(self):
        return 10 if self.tipo in self.CONSULTAS else 15

    @property
    def fecha_limite(self):
        """Fecha máxima para responder (cuenta solo días hábiles; no descuenta festivos)."""
        fecha = self.creado.date()
        faltan = self.dias_habiles
        while faltan:
            fecha += timedelta(days=1)
            if fecha.weekday() < 5:
                faltan -= 1
        return fecha
