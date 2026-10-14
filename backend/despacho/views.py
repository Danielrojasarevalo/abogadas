"""
Vistas de la API del despacho.
Todas exigen haber iniciado sesión como administradora (ver settings.py).
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import ProtectedError, Q
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Actuacion, Caso, Cita, Cliente, Documento, InfoDespacho, PerfilAbogada, Rama, Solicitud
from .serializers import (
    ActuacionSerializer,
    CasoSerializer,
    CitaSerializer,
    ClienteSerializer,
    DocumentoSerializer,
    InfoDespachoSerializer,
    PerfilAbogadaSerializer,
    RamaSerializer,
    SolicitudSerializer,
)


class ClienteViewSet(viewsets.ModelViewSet):
    """Listar, crear, editar y borrar clientes. Se puede buscar con ?buscar=texto"""

    serializer_class = ClienteSerializer

    def get_queryset(self):
        consulta = Cliente.objects.all()
        buscar = self.request.query_params.get("buscar")
        if buscar:
            consulta = consulta.filter(
                Q(nombre__icontains=buscar) | Q(numero_documento__icontains=buscar)
            )
        return consulta

    def perform_update(self, serializer):
        cliente = serializer.save()
        # El correo del cliente es al que llega el código para recuperar su contraseña
        if cliente.usuario and cliente.usuario.email != cliente.correo:
            cliente.usuario.email = cliente.correo
            cliente.usuario.save(update_fields=["email"])

    def destroy(self, request, *args, **kwargs):
        # No dejamos borrar un cliente que todavía tiene casos
        cliente = self.get_object()
        usuario = cliente.usuario
        try:
            with transaction.atomic():
                cliente.delete()
                # Si tenía acceso al portal, también se borra su cuenta
                if usuario:
                    usuario.delete()
        except ProtectedError:
            return Response(
                {"detail": "No se puede borrar: el cliente tiene casos registrados."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post", "delete"])
    def acceso(self, request, pk=None):
        """
        Acceso del cliente al portal.
        POST {"password": "..."} -> crea la cuenta o cambia la contraseña.
            El usuario para entrar es el número de documento del cliente.
        DELETE -> le quita el acceso (borra su cuenta).
        """
        cliente = self.get_object()

        if request.method == "DELETE":
            if cliente.usuario:
                cliente.usuario.delete()
            return Response(ClienteSerializer(Cliente.objects.get(pk=cliente.pk)).data)

        password = request.data.get("password", "")
        Usuario = get_user_model()
        usuario = cliente.usuario
        if usuario is None:
            nombre_usuario = cliente.numero_documento.strip().lower()
            if Usuario.objects.filter(username=nombre_usuario).exists():
                return Response(
                    {"detail": "Ya existe un usuario con ese documento."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Cuenta normal: NO es administradora (is_staff=False)
            usuario = Usuario(username=nombre_usuario, first_name=cliente.nombre[:150])

        try:
            validate_password(password, usuario)
        except ValidationError as error:
            return Response({"detail": " ".join(error.messages)}, status=status.HTTP_400_BAD_REQUEST)

        usuario.set_password(password)
        usuario.email = cliente.correo  # Para poder recuperar la contraseña
        usuario.save()
        cliente.usuario = usuario
        cliente.save(update_fields=["usuario"])
        return Response(ClienteSerializer(cliente).data)


class CasoViewSet(viewsets.ModelViewSet):
    """Casos del despacho. Filtros: ?estado=abierto  ?cliente=3  ?buscar=texto"""

    serializer_class = CasoSerializer

    def get_queryset(self):
        consulta = Caso.objects.select_related("cliente", "abogada")
        estado = self.request.query_params.get("estado")
        cliente = self.request.query_params.get("cliente")
        buscar = self.request.query_params.get("buscar")
        if estado:
            consulta = consulta.filter(estado=estado)
        if cliente:
            consulta = consulta.filter(cliente_id=cliente)
        if buscar:
            consulta = consulta.filter(
                Q(titulo__icontains=buscar)
                | Q(radicado__icontains=buscar)
                | Q(cliente__nombre__icontains=buscar)
            )
        return consulta


class ActuacionViewSet(viewsets.ModelViewSet):
    """Historial de un caso. Filtro: ?caso=5"""

    serializer_class = ActuacionSerializer

    def get_queryset(self):
        consulta = Actuacion.objects.all()
        caso = self.request.query_params.get("caso")
        if caso:
            consulta = consulta.filter(caso_id=caso)
        return consulta


class CitaViewSet(viewsets.ModelViewSet):
    """Agenda. Filtros: ?pendientes=1 (solo no completadas)  ?caso=5 (citas de un caso)"""

    serializer_class = CitaSerializer

    def get_queryset(self):
        consulta = Cita.objects.select_related("cliente", "caso")
        if self.request.query_params.get("pendientes"):
            consulta = consulta.filter(completada=False)
        caso = self.request.query_params.get("caso")
        if caso:
            consulta = consulta.filter(caso_id=caso)
        return consulta


def descargar_archivo(documento):
    """Entrega el archivo de un documento para descargarlo o verlo en el navegador."""
    try:
        archivo = documento.archivo.open("rb")
    except FileNotFoundError:
        raise Http404("El archivo ya no existe en el servidor.")
    # El nombre con el que se descarga siempre lleva su extensión (.pdf, .docx...)
    nombre = documento.nombre
    if not nombre.lower().endswith(f".{documento.extension}"):
        nombre = f"{nombre}.{documento.extension}"
    return FileResponse(archivo, as_attachment=True, filename=nombre)


class DocumentoViewSet(viewsets.ModelViewSet):
    """
    Documentos PDF y Word de los casos. Filtro: ?caso=5
    Para subir uno se envía un formulario (multipart) con caso, nombre y archivo.
    """

    serializer_class = DocumentoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        consulta = Documento.objects.select_related("subido_por")
        caso = self.request.query_params.get("caso")
        if caso:
            consulta = consulta.filter(caso_id=caso)
        return consulta

    def perform_create(self, serializer):
        serializer.save(subido_por=self.request.user, subido_por_cliente=False)

    @action(detail=True, methods=["get"])
    def descargar(self, request, pk=None):
        return descargar_archivo(self.get_object())


@api_view(["GET"])
def resumen(request):
    """Números y próximas citas para la pantalla de inicio."""
    ahora = timezone.now()
    proximas = Cita.objects.select_related("cliente", "caso").filter(
        completada=False, fecha_hora__gte=ahora
    )[:5]
    return Response(
        {
            "clientes": Cliente.objects.count(),
            "casos_activos": Caso.objects.exclude(estado="cerrado").count(),
            "casos_cerrados": Caso.objects.filter(estado="cerrado").count(),
            "citas_pendientes": Cita.objects.filter(
                completada=False, fecha_hora__gte=ahora
            ).count(),
            "proximas_citas": CitaSerializer(proximas, many=True).data,
            "solicitudes_nuevas": Solicitud.objects.filter(atendida=False).count(),
            # Documentos que subieron los clientes en la última semana
            "documentos_clientes": Documento.objects.filter(
                subido_por_cliente=True, creado__gte=ahora - timedelta(days=7)
            ).count(),
        }
    )


@api_view(["GET", "PATCH"])
def mi_perfil(request):
    """Perfil público de la abogada que tiene la sesión abierta (ver y editar)."""
    perfil, _ = PerfilAbogada.objects.get_or_create(usuario=request.user)
    if request.method == "PATCH":
        serializer = PerfilAbogadaSerializer(perfil, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Ese correo también sirve para que la abogada recupere su contraseña
        if perfil.correo and request.user.email != perfil.correo:
            request.user.email = perfil.correo
            request.user.save(update_fields=["email"])
    return Response(PerfilAbogadaSerializer(perfil).data)


class RamaViewSet(viewsets.ModelViewSet):
    """Ramas del derecho de la abogada conectada. Cada una solo ve y edita las suyas."""

    serializer_class = RamaSerializer

    def get_queryset(self):
        return Rama.objects.filter(abogada=self.request.user)

    def perform_create(self, serializer):
        serializer.save(abogada=self.request.user)


@api_view(["GET", "PATCH"])
def info_despacho(request):
    """Presentación general del despacho (la editan las abogadas)."""
    info = InfoDespacho.obtener()
    if request.method == "PATCH":
        serializer = InfoDespachoSerializer(info, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        cambio_politica = any(
            campo in serializer.validated_data and serializer.validated_data[campo] != getattr(info, campo)
            for campo in InfoDespacho.CAMPOS_POLITICA
        )
        # Si cambia la política, queda como una versión nueva (las autorizaciones guardan cuál aceptaron)
        serializer.save(**({"politica_actualizada": timezone.now()} if cambio_politica else {}))
    return Response(InfoDespachoSerializer(info).data)


class SolicitudViewSet(viewsets.ModelViewSet):
    """Solicitudes de consulta recibidas. Filtro: ?mias=1 (solo las de la abogada conectada)"""

    serializer_class = SolicitudSerializer
    http_method_names = ["get", "patch", "delete"]  # Se crean solo desde la página pública

    def get_queryset(self):
        consulta = Solicitud.objects.select_related("abogada")
        if self.request.query_params.get("mias"):
            consulta = consulta.filter(abogada=self.request.user)
        return consulta
