import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

import { ApiService } from '../servicios/api.service';
import { AvisosService } from '../servicios/avisos.service';
import { AbogadaPublica, Solicitud } from '../servicios/modelos';

/**
 * Ventana pública "Agenda tu consulta": el visitante elige a una de las dos
 * abogadas, opcionalmente la rama, y deja sus datos para que lo contacten.
 */
@Component({
  selector: 'app-solicitud-form',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonFooter,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Agenda tu consulta</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()" aria-label="Cerrar">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (enviada()) {
        <div class="enviada">
          <ion-icon name="checkmark-circle" />
          <h2>¡Solicitud enviada!</h2>
          <p>{{ elegida()?.nombre }} se pondrá en contacto contigo muy pronto.</p>
          <ion-button (click)="cerrar()">Listo</ion-button>
        </div>
      } @else {
        <form class="formulario" (ngSubmit)="enviar()">
          <p class="paso">1. Elige con quién quieres hablar</p>
          <div class="abogadas">
            @for (a of abogadas; track a.id) {
              <button type="button" class="opcion" [class.activa]="datos.abogada === a.id" (click)="elegir(a.id)">
                <span class="iniciales">{{ iniciales(a.nombre) }}</span>
                <span>
                  <strong>{{ a.nombre }}</strong>
                  <small>{{ a.titulo }}</small>
                </span>
              </button>
            }
          </div>

          <!-- Las ramas solo aparecen si la abogada elegida las tiene -->
          @if (elegida()?.ramas?.length) {
            <ion-select label="Tema de tu consulta (opcional)" labelPlacement="floating" fill="outline"
              interface="popover" name="rama" [(ngModel)]="datos.rama">
              <ion-select-option value="">Otro / no estoy seguro</ion-select-option>
              @for (r of elegida()!.ramas; track r.id) {
                <ion-select-option [value]="r.nombre">{{ r.nombre }}</ion-select-option>
              }
            </ion-select>
          }

          <p class="paso">2. Tus datos</p>
          <ion-input label="Nombre completo *" labelPlacement="floating" fill="outline"
            name="nombre" autocomplete="name" [(ngModel)]="datos.nombre" />
          <div class="fila">
            <ion-input label="Teléfono / WhatsApp *" labelPlacement="floating" fill="outline" type="tel"
              name="telefono" autocomplete="tel" [(ngModel)]="datos.telefono" />
            <ion-input label="Correo" labelPlacement="floating" fill="outline" type="email"
              name="correo" autocomplete="email" [(ngModel)]="datos.correo" />
          </div>
          <ion-textarea label="Cuéntanos brevemente tu caso *" labelPlacement="floating" fill="outline"
            [autoGrow]="true" rows="4" name="mensaje" [(ngModel)]="datos.mensaje" />
          <button type="submit" hidden></button>
        </form>
      }
    </ion-content>

    @if (!enviada()) {
      <ion-footer class="ion-padding acciones">
        <span class="espacio"></span>
        <ion-button fill="outline" (click)="cerrar()">Cancelar</ion-button>
        <ion-button [disabled]="enviando()" (click)="enviar()">
          @if (enviando()) { <ion-spinner name="crescent" /> } @else { Enviar solicitud }
        </ion-button>
      </ion-footer>
    }
  `,
  styleUrl: './formularios.scss',
  styles: `
    .paso {
      margin: 4px 0 10px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--ion-color-secondary-shade);
    }

    .abogadas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 18px;

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .opcion {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border: 2px solid var(--despacho-borde);
      border-radius: 14px;
      background: #fff;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;

      strong {
        display: block;
        font-size: 14px;
        color: var(--ion-color-primary);
      }

      small {
        font-size: 12px;
        color: var(--despacho-suave);
      }

      &.activa {
        border-color: var(--ion-color-secondary);
        box-shadow: 0 0 0 4px rgba(var(--ion-color-secondary-rgb), 0.15);
      }
    }

    .iniciales {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: #fff;
      font-weight: 600;
      font-size: 14px;
    }

    .enviada {
      padding: 48px 16px;
      text-align: center;

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-success);
      }

      h2 {
        margin: 8px 0;
      }

      p {
        color: var(--despacho-suave);
        margin-bottom: 24px;
      }
    }
  `,
})
export class SolicitudForm implements OnInit {
  private modal = inject(ModalController);
  private api = inject(ApiService);
  private avisos = inject(AvisosService);

  /** Las dos abogadas (vienen de la página pública) */
  @Input() abogadas: AbogadaPublica[] = [];
  /** Abogada preseleccionada (si se pulsó "Consultar con ...") */
  @Input() abogadaId?: number;

  enviando = signal(false);
  enviada = signal(false);
  private elegidaId = signal<number | null>(null);

  readonly elegida = computed(() => this.abogadas.find((a) => a.id === this.elegidaId()) ?? null);

  datos: Solicitud = { nombre: '', telefono: '', correo: '', mensaje: '', abogada: null, rama: '' };

  ngOnInit(): void {
    this.elegir(this.abogadaId ?? this.abogadas[0]?.id ?? null);
  }

  elegir(id: number | null): void {
    this.datos.abogada = id;
    this.datos.rama = '';
    this.elegidaId.set(id);
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  cerrar(): void {
    this.modal.dismiss();
  }

  enviar(): void {
    const d = this.datos;
    if (!d.abogada || !d.nombre.trim() || !d.telefono.trim() || !d.mensaje.trim()) {
      this.avisos.mostrar('Elige una abogada y completa nombre, teléfono y mensaje.', 'danger');
      return;
    }
    this.enviando.set(true);
    this.api.post('publico/solicitud/', d).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviada.set(true);
      },
      error: (e) => {
        this.enviando.set(false);
        if (e.status === 429) {
          this.avisos.mostrar('Has enviado muchas solicitudes. Intenta más tarde.', 'danger');
        } else {
          this.avisos.error(e);
        }
      },
    });
  }
}
