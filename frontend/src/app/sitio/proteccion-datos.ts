import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCheckbox,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
} from '@ionic/angular/standalone';

import { ApiService } from '../servicios/api.service';
import { AvisosService } from '../servicios/avisos.service';
import { EstadoDatos } from '../servicios/modelos';

/**
 * "Protección de datos" en el portal del cliente (Ley 1581 de 2012).
 * - Autorización: a qué abogada le autorizó sus datos y cuándo (o el formulario para darla).
 * - Descargar una copia de sus datos.
 * - Peticiones: conocer, corregir, borrar o revocar. Llegan SOLO a la abogada autorizada.
 */
@Component({
  selector: 'app-proteccion-datos',
  imports: [
    DatePipe,
    FormsModule,
    IonButton,
    IonCheckbox,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
  ],
  template: `
    <h2><ion-icon name="shield-checkmark-outline" /> Protección de datos</h2>

    @if (estado(); as e) {
      @if (e.autorizacion; as a) {
        <p class="autorizada">
          Autorizaste a <strong>{{ a.abogada_nombre }}</strong> el tratamiento de tus datos el
          {{ a.fecha | date: "d 'de' MMMM 'de' y" }}
          @if (a.datos_sensibles) { (incluye datos sensibles) }.
          Solo tú y ella pueden ver esta sección.
        </p>
        @if (a.version_politica !== e.version_actual) {
          <p class="aviso">La política de datos se actualizó después de tu autorización.
            <a href="/privacidad#politica" target="_blank" rel="noopener">Léela aquí</a>.</p>
        }
      } @else {
        <!-- Sin autorización vigente: se la pedimos al entrar -->
        <div class="autorizar">
          <p>
            Para tratar tus datos necesitamos tu autorización. Elige a tu abogada: solo ella recibirá tus datos y tus
            peticiones. <a href="/privacidad#politica" target="_blank" rel="noopener">Ver política de datos</a>
          </p>
          <ion-select label="Tu abogada" labelPlacement="floating" fill="outline" interface="popover"
            [(ngModel)]="abogada">
            @for (ab of e.abogadas; track ab.id) {
              <ion-select-option [value]="ab.id">{{ ab.nombre }}</ion-select-option>
            }
          </ion-select>
          <label class="casilla">
            <ion-checkbox [(ngModel)]="acepta" />
            <span>Autorizo el tratamiento de mis datos según la Política de Tratamiento de Datos.</span>
          </label>
          <label class="casilla">
            <ion-checkbox [(ngModel)]="sensibles" />
            <span>Autorizo también los datos sensibles de mi caso (opcional).</span>
          </label>
          <ion-button expand="block" [disabled]="enviando()" (click)="autorizar()">Dar autorización</ion-button>
        </div>
      }

      <ion-button fill="outline" expand="block" class="descargar" (click)="descargar()">
        <ion-icon slot="start" name="download-outline" /> Descargar mis datos
      </ion-button>

      <!-- Nueva petición -->
      @if (e.autorizacion) {
        <h3>Ejercer mis derechos</h3>
        <ion-select label="¿Qué necesitas?" labelPlacement="floating" fill="outline" interface="popover"
          [(ngModel)]="tipo">
          @for (t of e.tipos; track t.valor) {
            <ion-select-option [value]="t.valor">{{ t.texto }}</ion-select-option>
          }
        </ion-select>
        <ion-textarea label="Detalle (opcional)" labelPlacement="floating" fill="outline" [autoGrow]="true" rows="2"
          [(ngModel)]="detalle" />
        <ion-button expand="block" [disabled]="enviando()" (click)="pedir()">
          @if (enviando()) { <ion-spinner name="crescent" /> } @else { Enviar a {{ e.autorizacion.abogada_nombre }} }
        </ion-button>
        <p class="nota">
          Consultas: respuesta en máximo 10 días hábiles. Correcciones, borrado o revocación: 15 días hábiles.
        </p>
      }

      @if (e.peticiones.length) {
        <h3>Mis peticiones</h3>
        <ul class="peticiones">
          @for (p of e.peticiones; track p.id) {
            <li>
              <div class="cabeza">
                <strong>{{ p.tipo_texto }}</strong>
                <span class="estado {{ p.estado }}">{{ p.estado_texto }}</span>
              </div>
              <small>
                {{ p.creado | date: 'd MMM y' }} · {{ p.abogada_nombre }}
                @if (p.estado !== 'respondida') { · respuesta antes del {{ p.fecha_limite | date: 'd MMM' }} }
              </small>
              @if (p.respuesta) {
                <p class="respuesta">{{ p.respuesta }}</p>
              }
            </li>
          }
        </ul>
      }
    } @else {
      <div class="cargando"><ion-spinner name="crescent" /></div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
      font-size: 20px;
    }

    h3 {
      margin: 18px 0 8px;
      font-size: 15px;
      color: var(--ion-color-primary);
    }

    p {
      font-size: 14px;
      line-height: 1.5;
    }

    a {
      font-weight: 600;
      color: var(--ion-color-secondary-shade);
    }

    .autorizada {
      margin: 0 0 10px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(var(--ion-color-success-rgb), 0.1);
    }

    .aviso,
    .autorizar > p {
      margin: 0 0 10px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(var(--ion-color-warning-rgb), 0.14);
    }

    .casilla {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 10px 0;
      font-size: 13px;
      line-height: 1.4;

      ion-checkbox {
        flex-shrink: 0;
        margin-top: 2px;
      }
    }

    .descargar {
      margin-top: 10px;
    }

    .nota {
      margin: 6px 0 0;
      font-size: 12px;
      color: var(--despacho-suave);
    }

    .cargando {
      padding: 20px;
      text-align: center;
    }

    .peticiones {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        padding: 10px 12px;
        margin-bottom: 8px;
        border: 1px solid var(--despacho-borde);
        border-radius: 12px;
      }

      small {
        color: var(--despacho-suave);
      }
    }

    .cabeza {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 14px;
    }

    .estado {
      flex-shrink: 0;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(var(--ion-color-warning-rgb), 0.18);
      color: var(--ion-color-warning-shade);

      &.respondida {
        background: rgba(var(--ion-color-success-rgb), 0.14);
        color: var(--ion-color-success-shade);
      }
    }

    .respuesta {
      margin: 6px 0 0;
      white-space: pre-line;
    }
  `,
})
export class ProteccionDatos implements OnInit {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);

  estado = signal<EstadoDatos | null>(null);
  enviando = signal(false);

  // Formulario de autorización
  abogada: number | null = null;
  acepta = false;
  sensibles = false;

  // Formulario de petición
  tipo = 'conocer';
  detalle = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.get<EstadoDatos>('portal/datos/').subscribe({
      next: (e) => this.poner(e),
      error: (e) => this.avisos.error(e),
    });
  }

  private poner(e: EstadoDatos): void {
    this.estado.set(e);
    // Si solo hay una abogada posible, queda elegida
    if (e.abogadas.length === 1) this.abogada = e.abogadas[0].id;
  }

  autorizar(): void {
    if (!this.abogada || !this.acepta) {
      this.avisos.mostrar('Elige a tu abogada y marca la autorización.', 'danger');
      return;
    }
    this.enviar('portal/datos/autorizar/', {
      abogada: this.abogada,
      acepta_datos: true,
      datos_sensibles: this.sensibles,
    }, 'Autorización registrada.');
  }

  pedir(): void {
    this.enviar('portal/datos/peticiones/', { tipo: this.tipo, detalle: this.detalle }, 'Petición enviada a tu abogada.');
  }

  descargar(): void {
    this.api.descargar('portal/datos/descargar/', 'mis-datos.json').subscribe({
      error: (e) => this.avisos.error(e),
    });
  }

  private enviar(ruta: string, datos: unknown, mensaje: string): void {
    this.enviando.set(true);
    this.api.post<EstadoDatos>(ruta, datos).subscribe({
      next: (e) => {
        this.enviando.set(false);
        this.poner(e);
        this.detalle = '';
        this.avisos.mostrar(mensaje);
      },
      error: (e) => {
        this.enviando.set(false);
        this.avisos.error(e);
      },
    });
  }
}
