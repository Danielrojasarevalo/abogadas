import { Component, Input } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { inject } from '@angular/core';

import { AbogadaPublica } from '../servicios/modelos';

/**
 * Ventana pública "Ver perfil completo" de una abogada.
 * Muestra todo lo que ella llenó en "Mi perfil"; las secciones vacías no aparecen.
 * Si el visitante pulsa "Consultar", se cierra con role = 'consultar'.
 */
@Component({
  selector: 'app-perfil-completo',
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonContent, IonFooter],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()" aria-label="Cerrar">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Encabezado con nombre y frase -->
      <header class="portada">
        <span class="monograma">{{ iniciales() }}</span>
        <h1>{{ abogada.nombre }}</h1>
        <span class="titulo">{{ abogada.titulo }}</span>
        @if (abogada.frase) {
          <p class="frase">“{{ abogada.frase }}”</p>
        }
      </header>

      <!-- Datos rápidos -->
      @if (abogada.anios_experiencia || abogada.tarjeta_profesional || abogada.atencion || abogada.idiomas) {
        <div class="datos">
          @if (abogada.anios_experiencia) {
            <div><strong>{{ abogada.anios_experiencia }}+</strong><span>años de experiencia</span></div>
          }
          @if (abogada.tarjeta_profesional) {
            <div><strong>T.P. {{ abogada.tarjeta_profesional }}</strong><span>tarjeta profesional</span></div>
          }
          @if (abogada.atencion) {
            <div><strong>{{ abogada.atencion }}</strong><span>atención</span></div>
          }
          @if (abogada.idiomas) {
            <div><strong>{{ abogada.idiomas }}</strong><span>idiomas</span></div>
          }
        </div>
      }

      <div class="cuerpo">
        @if (abogada.descripcion) {
          <section>
            <h2>Sobre mí</h2>
            <p class="texto">{{ abogada.descripcion }}</p>
          </section>
        }

        @if (abogada.ramas.length) {
          <section>
            <h2>Ramas en las que trabajo</h2>
            <ul class="ramas">
              @for (r of abogada.ramas; track r.id) {
                <li>
                  <strong>{{ r.nombre }}</strong>
                  @if (r.descripcion) {
                    <span>{{ r.descripcion }}</span>
                  }
                </li>
              }
            </ul>
          </section>
        }

        @if (lineas(abogada.formacion).length) {
          <section>
            <h2>Formación académica</h2>
            <ul class="lista">
              @for (l of lineas(abogada.formacion); track $index) {
                <li><ion-icon name="document-text-outline" /> {{ l }}</li>
              }
            </ul>
          </section>
        }

        @if (lineas(abogada.experiencia).length) {
          <section>
            <h2>Experiencia</h2>
            <ul class="lista">
              @for (l of lineas(abogada.experiencia); track $index) {
                <li><ion-icon name="briefcase-outline" /> {{ l }}</li>
              }
            </ul>
          </section>
        }

        @if (lineas(abogada.logros).length) {
          <section>
            <h2>Logros y reconocimientos</h2>
            <ul class="lista">
              @for (l of lineas(abogada.logros); track $index) {
                <li><ion-icon name="checkmark-circle" /> {{ l }}</li>
              }
            </ul>
          </section>
        }

        @if (abogada.telefono || abogada.correo) {
          <section>
            <h2>Contacto</h2>
            <div class="contacto">
              @if (abogada.telefono) {
                <a [href]="'tel:' + abogada.telefono"><ion-icon name="call-outline" /> {{ abogada.telefono }}</a>
              }
              @if (abogada.correo) {
                <a [href]="'mailto:' + abogada.correo"><ion-icon name="mail-outline" /> {{ abogada.correo }}</a>
              }
            </div>
          </section>
        }
      </div>
    </ion-content>

    <ion-footer class="ion-padding pie">
      <ion-button expand="block" (click)="consultar()">Consultar con {{ abogada.nombre.split(' ')[0] }}</ion-button>
    </ion-footer>
  `,
  styles: `
    ion-toolbar { --background: #1f2a44; --color: #fff; }
    ion-content { --background: #fbfaf7; }

    .portada {
      padding: 0 24px 32px;
      text-align: center;
      color: #fff;
      background: linear-gradient(180deg, #1f2a44 0%, #26324f 100%);

      h1 { margin: 14px 0 4px; font-size: 30px; color: #fff; }
    }

    .monograma {
      display: inline-grid;
      place-items: center;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: linear-gradient(140deg, #2c3a5c, #3a4766);
      color: var(--ion-color-secondary-tint);
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 32px;
      box-shadow: 0 0 0 4px rgba(201, 164, 108, 0.5);
    }

    .titulo { font-weight: 600; color: var(--ion-color-secondary-tint); }

    .frase {
      max-width: 460px;
      margin: 14px auto 0;
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 17px;
      color: rgba(255, 255, 255, 0.82);
    }

    .datos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
      margin: -18px 20px 0;

      div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 14px;
        border-radius: 14px;
        text-align: center;
        background: #fff;
        box-shadow: var(--despacho-sombra);
      }

      strong { color: var(--ion-color-primary); font-size: 16px; }
      span { font-size: 12px; color: var(--despacho-suave); }
    }

    .cuerpo { padding: 8px 24px 24px; }

    section { margin-top: 22px; }

    h2 {
      margin: 0 0 10px;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ion-color-secondary-shade);
    }

    .texto { margin: 0; line-height: 1.7; white-space: pre-line; color: #3d4352; }

    .ramas {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid var(--despacho-borde);
        background: #fff;
      }

      strong { display: block; color: var(--ion-color-primary); }
      span { font-size: 13px; color: var(--despacho-suave); }
    }

    .lista {
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        display: flex;
        gap: 10px;
        padding: 8px 0;
        line-height: 1.5;
        border-bottom: 1px solid var(--despacho-borde);
      }

      li:last-child { border-bottom: none; }

      ion-icon { flex-shrink: 0; margin-top: 3px; color: var(--ion-color-secondary); }
    }

    .contacto {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 999px;
        font-weight: 600;
        text-decoration: none;
        background: rgba(var(--ion-color-secondary-rgb), 0.14);
        color: var(--ion-color-secondary-shade);
      }
    }

    .pie {
      background: #fff;
      border-top: 1px solid var(--despacho-borde);
      box-shadow: none;

      ion-button { --border-radius: 12px; height: 48px; font-weight: 600; text-transform: none; letter-spacing: 0; }
    }
  `,
})
export class PerfilCompleto {
  private modal = inject(ModalController);

  /** Abogada a mostrar (viene de la página pública) */
  @Input({ required: true }) abogada!: AbogadaPublica;

  iniciales(): string {
    return this.abogada.nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  /** Convierte un texto con varias líneas en una lista (ignora líneas vacías) */
  lineas(texto?: string): string[] {
    return (texto ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  }

  cerrar(): void {
    this.modal.dismiss(null, 'cerrar');
  }

  consultar(): void {
    this.modal.dismiss(this.abogada.id, 'consultar');
  }
}
