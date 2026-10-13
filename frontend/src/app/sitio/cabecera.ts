import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Logo } from '../paginas/logo';

/**
 * Header (barra superior) de la página pública y del portal de clientes.
 * - Muestra el logo y los nombres de las abogadas.
 * - Si `enlaces` es true, muestra el menú (Nosotras, Cómo funciona, Contacto).
 * - A la derecha va lo que se ponga dentro de la etiqueta (botones).
 *
 * Uso: <app-cabecera [enlaces]="true" (ir)="irA($event)"> ...botones... </app-cabecera>
 */
@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, Logo],
  template: `
    <header class="cabecera">
      <a class="marca" routerLink="/" aria-label="Ir a la página principal">
        <app-logo [tamano]="40" />
        <span class="nombres">
          <strong>Elizabeth Imbachi <em>&amp;</em> Katherine Rojas</strong>
          <small>Abogadas</small>
        </span>
      </a>

      @if (enlaces()) {
        <nav class="menu" aria-label="Secciones">
          <button type="button" (click)="ir.emit('nosotras')">Nosotras</button>
          <button type="button" (click)="ir.emit('como-funciona')">Cómo funciona</button>
          <button type="button" (click)="ir.emit('contacto')">Contacto</button>
        </nav>
      }

      <div class="acciones">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .cabecera {
      display: flex;
      align-items: center;
      gap: 24px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 14px 20px;
    }

    .marca {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      min-width: 0;
    }

    .nombres {
      display: flex;
      flex-direction: column;
      min-width: 0;

      strong {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 17px;
        color: var(--ion-color-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      em {
        font-style: normal;
        color: var(--ion-color-secondary);
      }

      small {
        font-size: 10px;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: var(--ion-color-secondary-shade);
      }
    }

    .menu {
      display: flex;
      gap: 4px;
      margin-left: auto;

      button {
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        background: none;
        font: inherit;
        font-size: 14px;
        font-weight: 500;
        color: #3d4352;
        cursor: pointer;

        &:hover {
          background: rgba(var(--ion-color-primary-rgb), 0.06);
          color: var(--ion-color-primary);
        }
      }
    }

    .acciones {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      flex-shrink: 0;
    }

    .menu + .acciones {
      margin-left: 0;
    }

    /* Celular: se oculta el menú y se achican los nombres */
    @media (max-width: 860px) {
      .menu {
        display: none;
      }

      .menu + .acciones {
        margin-left: auto;
      }
    }

    @media (max-width: 560px) {
      .cabecera {
        gap: 10px;
        padding: 12px 16px;
      }

      .nombres strong {
        font-size: 14px;
        white-space: normal;
        line-height: 1.2;
      }
    }
  `,
})
export class Cabecera {
  /** Mostrar el menú de secciones de la página pública */
  enlaces = input(false);
  /** Avisa a qué sección se quiere ir (el padre hace el desplazamiento) */
  ir = output<string>();
}
