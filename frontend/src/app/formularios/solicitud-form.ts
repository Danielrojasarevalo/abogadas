import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
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
import { enlaceWhatsapp } from '../servicios/enlaces';
import { AbogadaPublica, InfoDespacho, Solicitud, TIPOS_DOCUMENTO } from '../servicios/modelos';

/**
 * Ventana pública "Agenda tu consulta": el visitante elige a una de las dos
 * abogadas, opcionalmente la rama, y deja sus datos para que lo contacten.
 * Al enviar, puede mandar la misma consulta al WhatsApp de la abogada elegida.
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
    IonCheckbox,
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
          @if (elegida()?.whatsapp) {
            <p class="whatsapp-texto">¿Quieres una respuesta más rápida? Envíale tu consulta por WhatsApp:</p>
            <ion-button class="btn-whatsapp" [href]="enlaceWhatsapp()" target="_blank" rel="noopener">
              <ion-icon slot="start" name="logo-whatsapp" /> Enviar por WhatsApp a {{ primerNombre() }}
            </ion-button>
          }
          <ion-button fill="outline" (click)="cerrar()">Listo</ion-button>
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
          <!-- Identificación (tipo y número de documento) -->
          <div class="fila documento">
            <ion-select label="Tipo de documento *" labelPlacement="floating" fill="outline" interface="popover"
              name="tipo_documento" [(ngModel)]="datos.tipo_documento">
              @for (t of tiposDocumento; track t.valor) {
                <ion-select-option [value]="t.valor">{{ t.texto }}</ion-select-option>
              }
            </ion-select>
            <ion-input label="Número de documento *" labelPlacement="floating" fill="outline"
              name="numero_documento" [inputmode]="soloNumeros() ? 'numeric' : 'text'"
              [placeholder]="datos.tipo_documento === 'NIT' ? 'Ej: 900123456-7' : 'Sin puntos ni espacios'"
              [(ngModel)]="datos.numero_documento" />
          </div>
          <ion-input label="Ciudad o municipio donde vives *" labelPlacement="floating" fill="outline"
            name="ciudad" autocomplete="address-level2" placeholder="Ej: Neiva, Pitalito, Garzón..."
            [(ngModel)]="datos.ciudad" />
          <div class="fila">
            <ion-input label="Teléfono / WhatsApp *" labelPlacement="floating" fill="outline" type="tel"
              name="telefono" autocomplete="tel" [(ngModel)]="datos.telefono" />
            <ion-input label="Correo" labelPlacement="floating" fill="outline" type="email"
              name="correo" autocomplete="email" [(ngModel)]="datos.correo" />
          </div>
          <ion-textarea label="Cuéntanos brevemente tu caso *" labelPlacement="floating" fill="outline"
            [autoGrow]="true" rows="4" name="mensaje" [(ngModel)]="datos.mensaje" />
          @if (elegida()?.whatsapp) {
            <p class="nota-whatsapp">
              <ion-icon name="logo-whatsapp" />
              Al enviar también podrás mandar tu consulta directo al WhatsApp de {{ primerNombre() }}
              ({{ elegida()!.whatsapp }}).
            </p>
          }

          <!-- Condiciones de la consulta (solo si el despacho las llenó) -->
          @if (despacho?.costo_consulta || despacho?.tiempo_respuesta) {
            <p class="condiciones">
              @if (despacho?.costo_consulta) { <span><strong>Primera consulta:</strong> {{ despacho!.costo_consulta }}</span> }
              @if (despacho?.tiempo_respuesta) { <span><strong>Respuesta:</strong> {{ despacho!.tiempo_respuesta }}</span> }
            </p>
          }

          <!-- Ubicación: se pide al abrir el formulario; el navegador pregunta si la quiere compartir -->
          <div class="ubicacion" [class.lista]="ubicacion() === 'lista'">
            <ion-icon [name]="ubicacion() === 'lista' ? 'checkmark-circle' : 'location-outline'" />
            @switch (ubicacion()) {
              @case ('buscando') { <span>Obteniendo tu ubicación…</span> }
              @case ('lista') { <span>Tu ubicación se enviará con la consulta para que tu abogada sepa desde dónde escribes.</span> }
              @case ('no-disponible') { <span>Este navegador no permite compartir la ubicación. Puedes enviar la consulta igual.</span> }
              @default {
                <span>No se compartió tu ubicación (es opcional).</span>
                <button type="button" (click)="pedirUbicacion()">Compartir mi ubicación</button>
              }
            }
          </div>

          <!-- Autorización de datos (Ley 1581 de 2012): previa, expresa e informada -->
          <p class="paso">3. Autorización de tus datos</p>
          <p class="aviso-datos">
            Tus datos los recibe solo {{ elegida()?.nombre || 'la abogada que elijas' }} para responder tu consulta y,
            si lo acuerdan, prestarte el servicio. Puedes conocerlos, corregirlos o pedir que se borren.
            <a href="/privacidad#politica" target="_blank" rel="noopener">Ver política de datos</a>
          </p>
          <label class="casilla">
            <ion-checkbox name="acepta" [(ngModel)]="datos.acepta_datos" />
            <span>Autorizo el tratamiento de mis datos personales según la Política de Tratamiento de Datos. *</span>
          </label>
          <label class="casilla">
            <ion-checkbox name="sensibles" [(ngModel)]="datos.datos_sensibles" />
            <span>
              Si mi consulta incluye datos sensibles (salud, violencia, menores, etc.), autorizo su tratamiento.
              <small>Es opcional: no estás obligado(a) a compartirlos.</small>
            </span>
          </label>
          <p class="aviso-datos">
            Enviar esta consulta no crea una relación abogado–cliente ni es asesoría jurídica todavía.
          </p>
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

      .whatsapp-texto {
        margin-bottom: 10px;
      }

      ion-button {
        display: block;
        max-width: 320px;
        margin: 0 auto 10px;
      }

      .btn-whatsapp {
        --background: #25d366;
        --background-hover: #1ebe5b;
        --color: #fff;

        ion-icon {
          font-size: 20px;
          color: #fff;
        }
      }
    }

    .documento {
      grid-template-columns: 1.1fr 1fr;

      @media (max-width: 560px) {
        grid-template-columns: 1fr;
      }
    }

    .ubicacion {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 8px;
      margin: 12px 0 0;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.4;
      background: rgba(var(--ion-color-primary-rgb), 0.05);
      color: var(--despacho-suave);

      ion-icon {
        flex-shrink: 0;
        font-size: 18px;
        color: var(--ion-color-secondary);
      }

      span {
        flex: 1;
        min-width: 180px;
      }

      button {
        padding: 6px 12px;
        border: 1px solid var(--ion-color-secondary);
        border-radius: 999px;
        background: #fff;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        color: var(--ion-color-secondary-shade);
        cursor: pointer;
      }

      &.lista {
        background: rgba(var(--ion-color-success-rgb), 0.1);
        color: var(--ion-color-success-shade);

        ion-icon {
          color: var(--ion-color-success);
        }
      }
    }

    .condiciones {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 16px;
      margin: 10px 0 0;
      font-size: 13px;
      color: var(--despacho-suave);
    }

    .aviso-datos {
      margin: 0 0 8px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--despacho-suave);

      a {
        font-weight: 600;
        color: var(--ion-color-secondary-shade);
      }
    }

    .casilla {
      align-items: flex-start;
      font-size: 14px;
      line-height: 1.4;

      ion-checkbox {
        flex-shrink: 0;
        margin-top: 2px;
      }

      small {
        display: block;
        color: var(--despacho-suave);
      }
    }

    .nota-whatsapp {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 0;
      font-size: 13px;
      color: var(--despacho-suave);

      ion-icon {
        flex-shrink: 0;
        font-size: 20px;
        color: #25d366;
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
  /** Datos del despacho (costo de la consulta y tiempo de respuesta) */
  @Input() despacho?: InfoDespacho;

  enviando = signal(false);
  enviada = signal(false);
  private elegidaId = signal<number | null>(null);

  readonly elegida = computed(() => this.abogadas.find((a) => a.id === this.elegidaId()) ?? null);
  readonly primerNombre = computed(() => this.elegida()?.nombre.split(' ')[0] ?? '');


  datos: Solicitud = {
    nombre: '',
    tipo_documento: 'CC',
    numero_documento: '',
    ciudad: '',
    telefono: '',
    correo: '',
    mensaje: '',
    abogada: null,
    rama: '',
    acepta_datos: false,
    datos_sensibles: false,
  };

  /** Estado de la ubicación del visitante */
  ubicacion = signal<'buscando' | 'lista' | 'sin-permiso' | 'no-disponible'>('sin-permiso');

  readonly tiposDocumento = TIPOS_DOCUMENTO;

  /** true si el tipo de documento solo lleva números (el celular muestra el teclado numérico) */
  soloNumeros(): boolean {
    return ['CC', 'TI', 'PPT', 'PEP'].includes(this.datos.tipo_documento);
  }

  ngOnInit(): void {
    this.elegir(this.abogadaId ?? this.abogadas[0]?.id ?? null);
    // Se pide de una vez; el navegador le pregunta al visitante si la quiere compartir
    this.pedirUbicacion();
  }

  /**
   * Pide la ubicación al navegador. Solo funciona con https (o en localhost):
   * en una dirección http normal el navegador no la entrega.
   */
  pedirUbicacion(): void {
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      this.ubicacion.set('no-disponible');
      return;
    }
    this.ubicacion.set('buscando');
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        // La base de datos guarda 6 decimales (unos 10 cm de precisión)
        this.datos.latitud = Number(posicion.coords.latitude.toFixed(6));
        this.datos.longitud = Number(posicion.coords.longitude.toFixed(6));
        this.datos.precision_m = Math.round(posicion.coords.accuracy);
        this.ubicacion.set('lista');
      },
      () => this.ubicacion.set('sin-permiso'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  elegir(id: number | null): void {
    this.datos.abogada = id;
    this.datos.rama = '';
    this.elegidaId.set(id);
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  /** Chat de WhatsApp con la abogada elegida y la consulta ya escrita */
  enlaceWhatsapp(): string {
    const abogada = this.elegida();
    if (!abogada?.whatsapp) return '';
    const d = this.datos;
    const lineas = [
      `Hola ${this.primerNombre()}, soy ${d.nombre.trim()}. Quiero hacer una consulta legal.`,
      `Documento: ${d.tipo_documento} ${d.numero_documento.trim()}`,
      `Ciudad: ${d.ciudad.trim()}`,
      d.rama ? `Tema: ${d.rama}` : '',
      `Mi caso: ${d.mensaje.trim()}`,
      `Mi teléfono: ${d.telefono.trim()}`,
      d.correo.trim() ? `Mi correo: ${d.correo.trim()}` : '',
    ];
    return enlaceWhatsapp(abogada.whatsapp, lineas.filter(Boolean).join('\n'));
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
    if (!d.numero_documento.trim() || !d.ciudad.trim()) {
      this.avisos.mostrar('Escribe tu número de documento y tu ciudad o municipio.', 'danger');
      return;
    }
    if (!d.acepta_datos) {
      this.avisos.mostrar('Para enviar la consulta debes autorizar el tratamiento de tus datos.', 'danger');
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
