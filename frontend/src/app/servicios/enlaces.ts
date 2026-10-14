/**
 * Enlaces a WhatsApp y a Google Maps (no necesitan llaves ni cuentas).
 */

/** Enlace para abrir un chat de WhatsApp con un mensaje ya escrito */
export function enlaceWhatsapp(numero: string | undefined, mensaje = ''): string {
  // wa.me solo acepta dígitos con el indicativo del país (ej: 573133957573)
  let digitos = (numero ?? '').replace(/\D/g, '');
  if (digitos.length === 10) digitos = '57' + digitos; // Número colombiano sin el +57
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${digitos}${texto}`;
}

/** Enlace para abrir una dirección en Google Maps (en el celular abre la app) */
export function enlaceMapa(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

/** Dirección del mapa incrustado (vista previa dentro de la página) */
export function mapaIncrustado(direccion: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(direccion)}&z=16&output=embed`;
}

/** Tamaño de un archivo en texto: 1,2 MB, 340 KB... */
export function tamanoLegible(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
