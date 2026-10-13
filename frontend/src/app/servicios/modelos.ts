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
  telefono: string;
  correo: string;
  mensaje: string;
  abogada: number | null;
  abogada_nombre?: string;
  rama: string;
  atendida?: boolean;
  creado?: string;
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
  actuaciones: { id: number; fecha: string; descripcion: string }[];
  proximas_citas: { id: number; titulo: string; tipo_texto: string; fecha_hora: string; lugar: string }[];
}

/** Opciones de las listas desplegables (iguales a las del backend) */
export const TIPOS_DOCUMENTO = [
  { valor: 'CC', texto: 'Cédula de ciudadanía' },
  { valor: 'CE', texto: 'Cédula de extranjería' },
  { valor: 'NIT', texto: 'NIT' },
  { valor: 'PAS', texto: 'Pasaporte' },
  { valor: 'TI', texto: 'Tarjeta de identidad' },
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
