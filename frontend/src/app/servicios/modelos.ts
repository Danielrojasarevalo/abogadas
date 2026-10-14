/**
 * Tipos de datos que devuelve la API de Django.
 * Deben coincidir con los modelos de backend/despacho/models.py
 */

/** Quién inició sesión: una de las abogadas o un cliente del portal */
export interface Usuaria {
  id: number;
  usuario: string;
  nombre: string;
  rol: 'abogada' | 'cliente';
}

export interface Cliente {
  id?: number;
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  correo: string;
  direccion: string;
  notas: string;
  total_casos?: number;
  /** Usuario para entrar al portal ("" = no tiene acceso) */
  usuario_portal?: string;
}

export interface Caso {
  id?: number;
  cliente: number | null;
  cliente_nombre?: string;
  abogada: number | null;
  abogada_nombre?: string;
  titulo: string;
  radicado: string;
  juzgado: string;
  area: string;
  area_texto?: string;
  estado: string;
  estado_texto?: string;
  descripcion: string;
  honorarios: string | number;
  fecha_inicio: string; // formato AAAA-MM-DD
}

export interface Actuacion {
  id?: number;
  caso: number;
  fecha: string;
  descripcion: string;
  /** false = nota interna que el cliente no ve */
  visible_cliente?: boolean;
}

export interface Cita {
  id?: number;
  titulo: string;
  tipo: string;
  tipo_texto?: string;
  fecha_hora: string; // fecha y hora en formato ISO
  lugar: string;
  cliente: number | null;
  cliente_nombre?: string;
  caso: number | null;
  caso_titulo?: string;
  /** Dirección del cliente (se usa como ubicación si la cita no tiene lugar) */
  cliente_direccion?: string;
  notas: string;
  completada: boolean;
}

export interface Resumen {
  clientes: number;
  casos_activos: number;
  casos_cerrados: number;
  citas_pendientes: number;
  proximas_citas: Cita[];
  solicitudes_nuevas: number;
  /** Documentos subidos por clientes en los últimos 7 días */
  documentos_clientes: number;
}

/** Rama del derecho de una abogada (opcional) */
export interface Rama {
  id?: number;
  nombre: string;
  descripcion: string;
}

/** Perfil público de la abogada conectada */
export interface PerfilAbogada {
  nombre?: string;
  titulo: string;
  descripcion: string;
  telefono: string;
  /** Número al que los visitantes envían la consulta por WhatsApp */
  whatsapp?: string;
  correo: string;
  // Trayectoria (opcional)
  frase?: string;
  anios_experiencia?: number | null;
  tarjeta_profesional?: string;
  formacion?: string; // una por línea
  experiencia?: string; // una por línea
  logros?: string; // uno por línea
  idiomas?: string;
  atencion?: string;
  /** Ciudad donde atiende (ej: Neiva, Huila) */
  ciudad?: string;
}

/** Presentación general del despacho */
export interface InfoDespacho {
  nombre: string;
  lema: string;
  descripcion: string;
  telefono: string;
  correo: string;
  direccion: string;
  horario: string;
  // Protección de datos y aviso legal (los llenan las abogadas en "Mi perfil")
  responsable_nombre?: string;
  responsable_identificacion?: string;
  ciudad?: string;
  correo_datos?: string;
  area_peticiones?: string;
  finalidades_adicionales?: string; // una por línea
  vigencia_base_datos?: string;
  vigencia_politica?: string | null; // AAAA-MM-DD
  meses_conservacion_solicitudes?: number;
  costo_consulta?: string;
  tiempo_respuesta?: string;
  politica_actualizada?: string | null;
  /** Campos obligatorios de la política que faltan por llenar */
  faltantes?: string[];
}

/** Abogada tal como se ve en la página pública */
export interface AbogadaPublica extends PerfilAbogada {
  id: number;
  nombre: string;
  ramas: Rama[];
}

export interface Presentacion {
  despacho: InfoDespacho;
  abogadas: AbogadaPublica[];
}

/** Solicitud de consulta enviada desde la página pública */
export interface Solicitud {
  id?: number;
  nombre: string;
  /** CC, CE, TI, PAS, NIT, PPT o PEP */
  tipo_documento: string;
  numero_documento: string;
  /** Ciudad o municipio donde vive */
  ciudad: string;
  telefono: string;
  correo: string;
  mensaje: string;
  abogada: number | null;
  abogada_nombre?: string;
  rama: string;
  atendida?: boolean;
  creado?: string;
  /** Autorizó el tratamiento de datos (obligatorio para enviar) */
  acepta_datos?: boolean;
  /** Autorizó expresamente el tratamiento de datos sensibles */
  datos_sensibles?: boolean;
  /** Ubicación desde donde envió la consulta (si dio permiso) */
  latitud?: number | string | null;
  longitud?: number | string | null;
  precision_m?: number | null;
}

/** Caso tal como lo ve el cliente en su portal */
export interface CasoPortal {
  id: number;
  titulo: string;
  radicado: string;
  juzgado: string;
  area: string;
  area_texto: string;
  estado: string;
  estado_texto: string;
  descripcion: string;
  fecha_inicio: string;
  abogada_nombre: string;
  abogada_telefono: string;
  abogada_correo: string;
  abogada_whatsapp: string;
  actuaciones: { id: number; fecha: string; descripcion: string }[];
  proximas_citas: { id: number; titulo: string; tipo_texto: string; fecha_hora: string; lugar: string }[];
  documentos: Documento[];
}

/** Documento PDF o Word de un caso */
export interface Documento {
  id: number;
  caso: number;
  nombre: string;
  descripcion: string;
  /** false = documento interno que el cliente no ve (solo para las abogadas) */
  visible_cliente?: boolean;
  /** true = lo subió el cliente desde su portal */
  subido_por_cliente: boolean;
  subido_por_nombre: string;
  extension: string; // pdf, doc o docx
  tamano: number; // en bytes
  creado: string;
}

/** Prueba de que un titular autorizó el tratamiento de sus datos a una abogada */
export interface AutorizacionDatos {
  id: number;
  abogada: number;
  abogada_nombre: string;
  cliente: number | null;
  nombre: string;
  origen: string;
  origen_texto: string;
  datos_sensibles: boolean;
  version_politica: string;
  fecha: string;
  revocada: string | null;
}

/** Consulta o reclamo del titular sobre sus datos (Ley 1581 de 2012) */
export interface PeticionDatos {
  id: number;
  cliente: number;
  cliente_nombre: string;
  abogada: number;
  abogada_nombre: string;
  tipo: string;
  tipo_texto: string;
  detalle: string;
  estado: 'recibida' | 'en_tramite' | 'respondida';
  estado_texto: string;
  respuesta: string;
  creado: string;
  respondida_en: string | null;
  fecha_limite: string;
  dias_habiles: number;
}

/** Respuesta de /api/portal/datos/ */
export interface EstadoDatos {
  autorizacion: AutorizacionDatos | null;
  version_actual: string;
  abogadas: { id: number; nombre: string }[];
  peticiones: PeticionDatos[];
  tipos: { valor: string; texto: string }[];
}

/** Opciones de las listas desplegables (iguales a las del backend) */
export const TIPOS_DOCUMENTO = [
  { valor: 'CC', texto: 'Cédula de ciudadanía' },
  { valor: 'CE', texto: 'Cédula de extranjería' },
  { valor: 'NIT', texto: 'NIT' },
  { valor: 'PAS', texto: 'Pasaporte' },
  { valor: 'TI', texto: 'Tarjeta de identidad' },
  { valor: 'PPT', texto: 'Permiso por Protección Temporal' },
  { valor: 'PEP', texto: 'Permiso Especial de Permanencia' },
];

export const AREAS = [
  { valor: 'civil', texto: 'Civil' },
  { valor: 'familia', texto: 'Familia' },
  { valor: 'laboral', texto: 'Laboral' },
  { valor: 'penal', texto: 'Penal' },
  { valor: 'administrativo', texto: 'Administrativo' },
  { valor: 'comercial', texto: 'Comercial' },
  { valor: 'otro', texto: 'Otro' },
];

export const ESTADOS = [
  { valor: 'abierto', texto: 'Abierto' },
  { valor: 'en_tramite', texto: 'En trámite' },
  { valor: 'suspendido', texto: 'Suspendido' },
  { valor: 'cerrado', texto: 'Cerrado' },
];

export const TIPOS_CITA = [
  { valor: 'reunion', texto: 'Reunión con cliente' },
  { valor: 'audiencia', texto: 'Audiencia' },
  { valor: 'vencimiento', texto: 'Vencimiento de término' },
  { valor: 'otro', texto: 'Otro' },
];
