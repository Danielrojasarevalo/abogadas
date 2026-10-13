/**
 * Ayudas para convertir fechas entre el formato de la API y el de los formularios.
 */

/** Fecha de hoy en formato AAAA-MM-DD (hora local) */
export function hoy(): string {
  return aFechaLocal(new Date());
}

/** Date -> "AAAA-MM-DD" usando la hora local del computador */
export function aFechaLocal(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** Fecha ISO de la API -> "AAAA-MM-DDTHH:MM" para un campo datetime-local */
export function aCampoFechaHora(iso: string | null | undefined): string {
  const fecha = iso ? new Date(iso) : new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${aFechaLocal(fecha)}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

/** "AAAA-MM-DDTHH:MM" (hora local) -> ISO con zona horaria para enviar a la API */
export function deCampoFechaHora(valor: string): string {
  return new Date(valor).toISOString();
}
