"""
Protección de datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013).

- Autorizaciones: la prueba de que el titular aceptó la política (fecha, versión, IP).
- Peticiones: el cliente ejerce sus derechos (conocer, actualizar, suprimir, revocar).

Privacidad entre abogadas: cada autorización y cada petición van dirigidas a UNA abogada.
Solo esa abogada y el propio cliente las pueden ver; la otra abogada no.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import AutorizacionDatos, Caso, Cita, InfoDespacho, PeticionDatos, Solicitud
from .portal import EsCliente
from .serializers import CasoPortalSerializer, CitaClienteSerializer


def ip_de(request):
    """IP desde la que se dio la autorización (queda como prueba)."""
    reenviada = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return (reenviada.split(",")[0].strip() or request.META.get("REMOTE_ADDR")) or None


def abogada_valida(abogada_id):
    """Devuelve la abogada (usuaria administradora activa) o None."""
    return get_user_model().objects.filter(pk=abogada_id, is_staff=True, is_active=True).first()


def registrar_autorizacion(request, *, abogada, nombre, origen, datos_sensibles=False, cliente=None, solicitud=None):
    return AutorizacionDatos.objects.create(
        abogada=abogada,
        nombre=nombre[:150],
        origen=origen,
        datos_sensibles=bool(datos_sensibles),
        cliente=cliente,
        solicitud=solicitud,
        version_politica=InfoDespacho.obtener().version_politica(),
        ip=ip_de(request),
    )


def autorizacion_vigente(cliente):
    """La última autorización no revocada del cliente (o None)."""
    return cliente.autorizaciones.filter(revocada__isnull=True).select_related("abogada").first()


def nombre_de(usuario):
    return (usuario.first_name or usuario.username) if usuario else ""


# ---------- Serializadores ----------


class AutorizacionSerializer(serializers.ModelSerializer):
    abogada_nombre = serializers.SerializerMethodField()
    origen_texto = serializers.CharField(source="get_origen_display", read_only=True)

    class Meta:
        model = AutorizacionDatos
        fields = [
            "id", "abogada", "abogada_nombre", "cliente", "nombre", "origen", "origen_texto",
            "datos_sensibles", "version_politica", "fecha", "revocada",
        ]

    def get_abogada_nombre(self, autorizacion):
        return nombre_de(autorizacion.abogada)


class PeticionSerializer(serializers.ModelSerializer):
    tipo_texto = serializers.CharField(source="get_tipo_display", read_only=True)
    estado_texto = serializers.CharField(source="get_estado_display", read_only=True)
    cliente_nombre = serializers.CharField(source="cliente.nombre", read_only=True)
    abogada_nombre = serializers.SerializerMethodField()
    fecha_limite = serializers.DateField(read_only=True)
    dias_habiles = serializers.IntegerField(read_only=True)

    class Meta:
        model = PeticionDatos
        fields = [
            "id", "cliente", "cliente_nombre", "abogada", "abogada_nombre", "tipo", "tipo_texto",
            "detalle", "estado", "estado_texto", "respuesta", "creado", "respondida_en",
            "fecha_limite", "dias_habiles",
        ]
        read_only_fields = ["cliente", "abogada", "creado", "respondida_en"]

    def get_abogada_nombre(self, peticion):
        return nombre_de(peticion.abogada)


# ---------- Portal del cliente ----------


def abogadas_para_autorizar(cliente):
    """Las abogadas de sus casos; si no tiene casos, cualquiera de las dos."""
    Usuario = get_user_model()
    ids = Caso.objects.filter(cliente=cliente, abogada__isnull=False).values_list("abogada", flat=True)
    abogadas = Usuario.objects.filter(pk__in=ids, is_staff=True, is_active=True)
    if not abogadas.exists():
        abogadas = Usuario.objects.filter(is_staff=True, is_active=True)
    return [{"id": a.id, "nombre": nombre_de(a)} for a in abogadas.order_by("id")]


def estado_datos(cliente):
    vigente = autorizacion_vigente(cliente)
    peticiones = cliente.peticiones_datos.select_related("abogada", "cliente")
    return {
        "autorizacion": AutorizacionSerializer(vigente).data if vigente else None,
        "version_actual": InfoDespacho.obtener().version_politica(),
        "abogadas": abogadas_para_autorizar(cliente),
        "peticiones": PeticionSerializer(peticiones, many=True).data,
        "tipos": [{"valor": v, "texto": t} for v, t in PeticionDatos.TIPOS],
    }


@api_view(["GET"])
@permission_classes([EsCliente])
def mis_datos(request):
    """Estado de la autorización y las peticiones del cliente conectado."""
    return Response(estado_datos(request.user.cliente))


@api_view(["POST"])
@permission_classes([EsCliente])
def autorizar(request):
    """El cliente acepta la política: {"abogada": id, "datos_sensibles": bool}"""
    cliente = request.user.cliente
    permitidas = {a["id"] for a in abogadas_para_autorizar(cliente)}
    abogada = abogada_valida(request.data.get("abogada"))
    if abogada is None or abogada.id not in permitidas:
        return Response({"detail": "Elige a tu abogada."}, status=status.HTTP_400_BAD_REQUEST)
    if request.data.get("acepta_datos") is not True:
        return Response({"detail": "Debes aceptar la política de tratamiento de datos."}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        # Una sola autorización vigente: la anterior queda reemplazada
        cliente.autorizaciones.filter(revocada__isnull=True).update(revocada=timezone.now())
        registrar_autorizacion(
            request, abogada=abogada, nombre=cliente.nombre, origen="portal",
            datos_sensibles=request.data.get("datos_sensibles"), cliente=cliente,
        )
    return Response(estado_datos(cliente), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([EsCliente])
def nueva_peticion(request):
    """El cliente ejerce un derecho. Llega solo a la abogada que autorizó: {"tipo", "detalle"}"""
    cliente = request.user.cliente
    vigente = autorizacion_vigente(cliente)
    if vigente is None:
        return Response(
            {"detail": "Primero acepta la política y elige a tu abogada."}, status=status.HTTP_400_BAD_REQUEST
        )
    serializer = PeticionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(cliente=cliente, abogada=vigente.abogada, estado="recibida", respuesta="")
    return Response(estado_datos(cliente), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([EsCliente])
def descargar_mis_datos(request):
    """Copia de todos los datos que el despacho tiene del cliente (derecho a conocer)."""
    cliente = request.user.cliente
    casos = Caso.objects.filter(cliente=cliente).prefetch_related("actuaciones", "citas", "documentos")
    citas = Cita.objects.filter(cliente=cliente) | Cita.objects.filter(caso__cliente=cliente)
    datos = {
        "generado": timezone.now().isoformat(),
        "titular": {
            "nombre": cliente.nombre,
            "tipo_documento": cliente.get_tipo_documento_display(),
            "numero_documento": cliente.numero_documento,
            "telefono": cliente.telefono,
            "correo": cliente.correo,
            "direccion": cliente.direccion,
            "registrado": cliente.creado.isoformat(),
            "usuario_portal": request.user.username,
        },
        "casos": CasoPortalSerializer(casos, many=True).data,
        "citas": CitaClienteSerializer(citas.distinct(), many=True).data,
        "autorizaciones": AutorizacionSerializer(cliente.autorizaciones.all(), many=True).data,
        "peticiones": PeticionSerializer(cliente.peticiones_datos.all(), many=True).data,
    }
    respuesta = Response(datos)
    respuesta["Content-Disposition"] = 'attachment; filename="mis-datos.json"'
    return respuesta


# ---------- Panel de la abogada (solo lo dirigido a ella) ----------


class PeticionDatosViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """
    Peticiones de datos que recibió la abogada conectada (las de la otra abogada no aparecen).
    PATCH {"estado", "respuesta", "aplicar_revocacion": true} para responder.
    """

    serializer_class = PeticionSerializer
    http_method_names = ["get", "patch"]

    def get_queryset(self):
        return PeticionDatos.objects.filter(abogada=self.request.user).select_related("cliente", "abogada")

    def perform_update(self, serializer):
        peticion = serializer.instance
        cambios = {}
        if serializer.validated_data.get("estado") == "respondida" and not peticion.respondida_en:
            cambios["respondida_en"] = timezone.now()
        peticion = serializer.save(**cambios)
        # Si la abogada acepta la revocación, la autorización deja de estar vigente
        if peticion.tipo == "revocar" and self.request.data.get("aplicar_revocacion") is True:
            peticion.cliente.autorizaciones.filter(
                abogada=self.request.user, revocada__isnull=True
            ).update(revocada=timezone.now())


class AutorizacionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Autorizaciones que los titulares le dieron a la abogada conectada (solo lectura)."""

    serializer_class = AutorizacionSerializer

    def get_queryset(self):
        return AutorizacionDatos.objects.filter(abogada=self.request.user).select_related("abogada")


def depurar_solicitudes(abogada=None):
    """
    Borra las solicitudes más viejas que el plazo de conservación de la política.
    Con abogada, solo las dirigidas a ella. Devuelve cuántas se borraron.
    """
    meses = InfoDespacho.obtener().meses_conservacion_solicitudes
    limite = timezone.now() - timedelta(days=30 * meses)
    viejas = Solicitud.objects.filter(creado__lt=limite)
    if abogada is not None:
        viejas = viejas.filter(abogada=abogada)
    cantidad = viejas.count()
    viejas.delete()
    return cantidad


@api_view(["GET", "POST"])
def depurar(request):
    """GET: cuántas solicitudes propias ya vencieron. POST: las borra."""
    if request.method == "POST":
        return Response({"borradas": depurar_solicitudes(request.user)})
    meses = InfoDespacho.obtener().meses_conservacion_solicitudes
    limite = timezone.now() - timedelta(days=30 * meses)
    vencidas = Solicitud.objects.filter(abogada=request.user, creado__lt=limite).count()
    return Response({"vencidas": vencidas, "meses": meses})
