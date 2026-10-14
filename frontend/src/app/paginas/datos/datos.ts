import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonToolbar,
} from '@ionic/angular/standalone';

import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { AutorizacionDatos, PeticionDatos } from '../../servicios/modelos';

/**
 * Protección de datos (Ley 1581 de 2012) en el panel de la abogada conectada.
 * - Peticiones: consultas y reclamos de SUS clientes, con la fecha límite para responder.
 * - Autorizaciones: la prueba de quién le autorizó sus datos y cuándo.
 * - Depurar: borra sus solicitudes que ya superaron el plazo de conservación.
 * La otra abogada no ve nada de esto: el backend solo entrega lo dirigido a quien inició sesión.
 */
@Component({
  selector: 'app-datos',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon,
    IonCheckbox,
    IonTextarea,
    IonProgressBar,
  ],
  template: `
    <ion-header class="ion-no-border cabecera-pagina">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
      </ion-toolbar>
      @if (cargando()) {
        <ion-progress-bar type="indeterminate" color="secondary" class="cargando" />
      }
    </ion-header>

    <ion-content>
      <div class="contenedor">
        <div class="encabezado-pagina">
          <h1>Protección de datos</h1>
          <p>Solo ves lo que tus clientes te autorizaron a ti. Política y datos legales en
            <a routerLink="/panel/perfil">Mi perfil</a> · <a routerLink="/privacidad" target="_blank">ver política</a>.</p>
        </div>

        @if (vencidas() > 0) {
          <div class="tarjeta aviso">
            <ion-icon name="warning-outline" />
            <span>
              Tienes <strong>{{ vencidas() }}</strong> solicitud(es) con más de {{ meses() }} meses.
              La política dice que se borran después de ese plazo.
            </span>
            <ion-button size="small" color="danger" (click)="depurar()">Borrar ahora</ion-button>
          </div>
        }

        <ion-segment [value]="pestana()" (ionChange)="pestana.set($any($event.detail.value))" class="pestanas">
          <ion-segment-button value="peticiones">
            <ion-label>Peticiones ({{ pendientes() }} pendientes)</ion-label>
          </ion-segment-button>
          <ion-segment-button value="autorizaciones"><ion-label>Autorizaciones</ion-label></ion-segment-button>
        </ion-segment>

        @if (pestana() === 'peticiones') {
          <div class="lista">
            @for (p of peticiones(); track p.id) {
              <article class="tarjeta peticion" [class.lista-hecha]="p.estado === 'respondida'">
                <div class="arriba">
                  <div>
                    <h3>{{ p.tipo_texto }}</h3>
                    <span class="meta">
                      {{ p.cliente_nombre }} · {{ p.creado | date: 'd MMM y, h:mm a' }}
                    </span>
                  </div>
                  <span class="estado {{ p.estado }}">{{ p.estado_texto }}</span>
                </div>
                @if (p.estado !== 'respondida') {
                  <p class="limite" [class.vencida]="vencida(p)">
                    <ion-icon name="time-outline" />
                    Responder a más tardar el {{ p.fecha_limite | date: "EEEE d 'de' MMMM" }}
                    ({{ p.dias_habiles }} días hábiles)
                  </p>
                }
                @if (p.detalle) {
                  <p class="detalle">{{ p.detalle }}</p>
                }

                @if (p.estado === 'respondida') {
                  <p class="respuesta"><strong>Respuesta ({{ p.respondida_en | date: 'd MMM y' }}):</strong> {{ p.respuesta }}</p>
                } @else {
                  <ion-textarea label="Respuesta para el cliente" labelPlacement="floating" fill="outline"
                    [autoGrow]="true" rows="2" [(ngModel)]="borradores[p.id]" />
                  @if (p.tipo === 'revocar') {
                    <label class="casilla">
                      <ion-checkbox [(ngModel)]="revocar[p.id]" />
                      <span>Aplicar la revocación (la autorización deja de estar vigente)</span>
                    </label>
                  }
                  @if (p.tipo === 'suprimir') {
                    <p class="ayuda">
                      Para borrar sus datos usa “Clientes” → borrar. No procede si hay un deber legal o contractual de
                      conservarlos (por ejemplo, un proceso vigente): explícaselo en la respuesta.
                    </p>
                  }
                  <div class="acciones">
                    @if (p.estado === 'recibida') {
                      <ion-button size="small" fill="outline" (click)="guardar(p, 'en_tramite')">Marcar en trámite</ion-button>
                    }
                    <ion-button size="small" (click)="guardar(p, 'respondida')">Responder</ion-button>
                  </div>
                }
              </article>
            } @empty {
              <p class="vacia">No tienes peticiones de datos.</p>
            }
          </div>
        } @else {
          <div class="lista">
            @for (a of autorizaciones(); track a.id) {
              <article class="tarjeta autorizacion">
                <div class="arriba">
                  <div>
                    <h3>{{ a.nombre }}</h3>
                    <span class="meta">
                      {{ a.origen_texto }} · {{ a.fecha | date: 'd MMM y, h:mm a' }} · versión {{ a.version_politica }}
                      @if (a.datos_sensibles) { · incluye datos sensibles }
                    </span>
                  </div>
                  <span class="estado" [class.respondida]="!a.revocada">{{ a.revocada ? 'Revocada' : 'Vigente' }}</span>
                </div>
              </article>
            } @empty {
              <p class="vacia">Aún no hay autorizaciones.</p>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .encabezado-pagina a {
      font-weight: 600;
      color: var(--ion-color-secondary-shade);
    }

    .aviso {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 14px;
      background: rgba(var(--ion-color-warning-rgb), 0.12);

      ion-icon {
        flex-shrink: 0;
        font-size: 20px;
        color: var(--ion-color-warning-shade);
      }

      span {
        flex: 1;
      }

      @media (max-width: 560px) {
        flex-wrap: wrap;
      }
    }

    .pestanas {
      margin-bottom: 16px;
    }

    .lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    article {
      padding: 16px 18px;

      &.lista-hecha {
        opacity: 0.8;
      }
    }

    .arriba {
      display: flex;
      justify-content: space-between;
      gap: 12px;

      h3 {
        margin: 0;
        font-size: 17px;
      }
    }

    .meta {
      font-size: 13px;
      color: var(--despacho-suave);
    }

    .estado {
      align-self: flex-start;
      flex-shrink: 0;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(var(--ion-color-warning-rgb), 0.18);
      color: var(--ion-color-warning-shade);

      &.respondida {
        background: rgba(var(--ion-color-success-rgb), 0.14);
        color: var(--ion-color-success-shade);
      }
    }

    .limite {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-secondary-shade);

      &::first-letter {
        text-transform: uppercase;
      }

      &.vencida {
        color: var(--ion-color-danger);
      }
    }

    .detalle,
    .respuesta {
      margin: 8px 0;
      font-size: 14px;
      white-space: pre-line;
    }

    .ayuda {
      margin: 4px 0;
      font-size: 13px;
      color: var(--despacho-suave);
    }

    .casilla {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
      font-size: 14px;
    }

    .acciones {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }

    .vacia {
      padding: 32px;
      text-align: center;
      color: var(--despacho-suave);
    }
  `,
})
export class DatosPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);

  pestana = signal<'peticiones' | 'autorizaciones'>('peticiones');
  peticiones = signal<PeticionDatos[]>([]);
  autorizaciones = signal<AutorizacionDatos[]>([]);
  cargando = signal(false);
  vencidas = signal(0);
  meses = signal(12);
  pendientes = signal(0);

  /** Respuesta que se está escribiendo para cada petición */
  borradores: Record<number, string> = {};
  revocar: Record<number, boolean> = {};

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.listar<PeticionDatos>('peticiones-datos').subscribe({
      next: (lista) => {
        this.peticiones.set(lista);
        this.pendientes.set(lista.filter((p) => p.estado !== 'respondida').length);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisos.error(e);
      },
    });
    this.api.listar<AutorizacionDatos>('autorizaciones').subscribe((lista) => this.autorizaciones.set(lista));
    this.api.get<{ vencidas: number; meses: number }>('datos/depurar/').subscribe((r) => {
      this.vencidas.set(r.vencidas);
      this.meses.set(r.meses);
    });
  }

  /** true si ya pasó la fecha límite para responder */
  vencida(p: PeticionDatos): boolean {
    return p.fecha_limite < new Date().toISOString().slice(0, 10);
  }

  guardar(p: PeticionDatos, estado: 'en_tramite' | 'respondida'): void {
    const respuesta = (this.borradores[p.id] ?? '').trim();
    if (estado === 'respondida' && !respuesta) {
      this.avisos.mostrar('Escribe la respuesta para el cliente.', 'danger');
      return;
    }
    const datos = { estado, respuesta, aplicar_revocacion: !!this.revocar[p.id] };
    this.api.patch<PeticionDatos>(`peticiones-datos/${p.id}/`, datos).subscribe({
      next: () => {
        this.avisos.mostrar(estado === 'respondida' ? 'Respuesta enviada al portal del cliente.' : 'Marcada en trámite.');
        this.cargar();
      },
      error: (e) => this.avisos.error(e),
    });
  }

  async depurar(): Promise<void> {
    const ok = await this.avisos.confirmar(
      'Borrar solicitudes vencidas',
      `Se borrarán ${this.vencidas()} solicitud(es) tuyas con más de ${this.meses()} meses. No se puede deshacer.`,
    );
    if (!ok) return;
    this.api.post<{ borradas: number }>('datos/depurar/', {}).subscribe({
      next: (r) => {
        this.avisos.mostrar(`Se borraron ${r.borradas} solicitud(es).`);
        this.cargar();
      },
      error: (e) => this.avisos.error(e),
    });
  }
}
