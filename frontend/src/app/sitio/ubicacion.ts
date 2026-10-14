import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

import { enlaceMapa, mapaIncrustado } from '../servicios/enlaces';

/**
 * Ventana con el mapa del lugar de una cita (reunión, audiencia...).
 * La ve la abogada desde la agenda y el cliente desde su portal.
 * También muestra desde dónde se envió una solicitud de consulta (coordenadas).
 */
@Component({
  selector: 'app-ubicacion',
  imports: [DatePipe, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ubicación</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()" aria-label="Cerrar">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="datos">
        <strong>{{ titulo }}</strong>
        @if (fechaHora) {
          <span><ion-icon name="calendar-outline" /> {{ fechaHora | date: "EEEE d 'de' MMMM, h:mm a" }}</span>
        }
        @if (persona) {
          <span><ion-icon name="person-outline" /> {{ persona }}</span>
        }
        <span class="lugar"><ion-icon name="location-outline" /> {{ lugar }}</span>
        @if (esDireccionCliente) {
          <small>La cita no tiene lugar escrito: se muestra la dirección registrada del cliente.</small>
        }
        @if (nota) {
          <small>{{ nota }}</small>
        }
      </div>
      <iframe class="mapa" [src]="mapa" title="Mapa de la ubicación" loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"></iframe>
    </ion-content>

    <ion-footer class="ion-padding acciones">
      <span class="espacio"></span>
      <ion-button fill="outline" (click)="cerrar()">Cerrar</ion-button>
      <ion-button [href]="enlace" target="_blank" rel="noopener">
        <ion-icon slot="start" name="navigate-outline" /> Cómo llegar
      </ion-button>
    </ion-footer>
  `,
  styleUrl: '../formularios/formularios.scss',
  styles: `
    .datos {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
      font-size: 14px;
      color: var(--despacho-suave);

      strong {
        font-size: 17px;
        color: var(--ion-color-primary);
      }

      span {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .lugar {
        font-weight: 600;
        color: var(--ion-color-primary);

        ion-icon {
          color: var(--ion-color-secondary);
        }
      }
    }

    .mapa {
      width: 100%;
      height: min(60vh, 420px);
      border: 1px solid var(--despacho-borde);
      border-radius: 14px;
      background: #eceae6;
    }
  `,
})
export class Ubicacion implements OnInit {
  private modal = inject(ModalController);
  private sanitizador = inject(DomSanitizer);

  @Input() titulo = '';
  @Input() lugar = '';
  @Input() fechaHora = '';
  /** Cliente (vista de la abogada) o abogada (vista del cliente) */
  @Input() persona = '';
  /** true si el lugar es la dirección del cliente y no el de la cita */
  @Input() esDireccionCliente = false;
  /** Texto adicional debajo de los datos (ej: precisión de la ubicación) */
  @Input() nota = '';

  mapa!: SafeResourceUrl;
  enlace = '';

  ngOnInit(): void {
    // El mapa viene siempre de Google Maps; solo cambia la dirección buscada
    this.mapa = this.sanitizador.bypassSecurityTrustResourceUrl(mapaIncrustado(this.lugar));
    this.enlace = enlaceMapa(this.lugar);
  }

  cerrar(): void {
    this.modal.dismiss();
  }
}
