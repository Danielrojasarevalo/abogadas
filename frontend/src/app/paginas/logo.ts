import { Component, input } from '@angular/core';

/**
 * Logo del despacho: una balanza de la justicia dibujada en SVG.
 * Uso: <app-logo [tamano]="48" />
 */
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="tamano()" [attr.height]="tamano()" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="currentColor" opacity="0.12" />
      <g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <!-- Columna central y base -->
        <path d="M32 14v34M24 48h16" />
        <!-- Brazo de la balanza -->
        <path d="M17 20h30" />
        <circle cx="32" cy="14" r="2" fill="currentColor" />
        <!-- Platillo izquierdo -->
        <path d="M17 20l-6 13h12z" />
        <path d="M11 33a6 3 0 0 0 12 0" />
        <!-- Platillo derecho -->
        <path d="M47 20l-6 13h12z" />
        <path d="M41 33a6 3 0 0 0 12 0" />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      color: var(--ion-color-secondary);
    }
  `,
})
export class Logo {
  /** Tamaño en píxeles */
  tamano = input(40);
}
