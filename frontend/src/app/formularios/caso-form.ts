import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

import { API_URL, ApiService } from '../servicios/api.service';
import { AvisosService } from '../servicios/avisos.service';
import { hoy } from '../servicios/fechas';
import { AREAS, Caso, Cliente, ESTADOS, Usuaria } from '../servicios/modelos';
import { SesionService } from '../servicios/sesion.service';

/**
 * Ventana para crear o editar un caso.
 * Carga la lista de clientes y de abogadas para elegir en los desplegables.
 */
@Component({
  selector: 'app-caso-form',
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
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ datos.id ? 'Editar caso' : 'Nuevo caso' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()" aria-label="Cerrar">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form class="formulario" (ngSubmit)="guardar()">
        <ion-input label="Título del caso *" labelPlacement="floating" fill="outline"
          name="titulo" [(ngModel)]="datos.titulo" />

        <ion-select label="Cliente *" labelPlacement="floating" fill="outline"
          name="cliente" [(ngModel)]="datos.cliente" interface="popover">
          @for (c of clientes(); track c.id) {
            <ion-select-option [value]="c.id">{{ c.nombre }}</ion-select-option>
          }
        </ion-select>
        @if (clientes().length === 0) {
          <p class="nota">Primero debes registrar un cliente en la sección Clientes.</p>
        }

        <div class="fila">
          <ion-select label="Área" labelPlacement="floating" fill="outline"
            name="area" [(ngModel)]="datos.area" interface="popover">
            @for (a of areas; track a.valor) {
              <ion-select-option [value]="a.valor">{{ a.texto }}</ion-select-option>
            }
          </ion-select>
          <ion-select label="Estado" labelPlacement="floating" fill="outline"
            name="estado" [(ngModel)]="datos.estado" interface="popover">
            @for (e of estados; track e.valor) {
              <ion-select-option [value]="e.valor">{{ e.texto }}</ion-select-option>
            }
          </ion-select>
        </div>

        <div class="fila">
          <ion-input label="Número de radicado" labelPlacement="floating" fill="outline"
            name="radicado" [(ngModel)]="datos.radicado" />
          <ion-input label="Juzgado o entidad" labelPlacement="floating" fill="outline"
            name="juzgado" [(ngModel)]="datos.juzgado" />
        </div>

        <div class="fila">
          <ion-select label="Abogada responsable" labelPlacement="floating" fill="outline"
            name="abogada" [(ngModel)]="datos.abogada" interface="popover">
            @for (a of abogadas(); track a.id) {
              <ion-select-option [value]="a.id">{{ a.nombre }}</ion-select-option>
            }
          </ion-select>
          <ion-input label="Fecha de inicio *" labelPlacement="stacked" fill="outline" type="date"
            name="fecha_inicio" [(ngModel)]="datos.fecha_inicio" />
        </div>

        <ion-input label="Honorarios (COP)" labelPlacement="floating" fill="outline" type="number" min="0"
          name="honorarios" [(ngModel)]="datos.honorarios" />

        <ion-textarea label="Descripción" labelPlacement="floating" fill="outline" [autoGrow]="true" rows="4"
          name="descripcion" [(ngModel)]="datos.descripcion" />

        <button type="submit" hidden></button>
      </form>
    </ion-content>

    <ion-footer class="ion-padding acciones">
      @if (datos.id) {
        <ion-button fill="clear" color="danger" (click)="borrar()">
          <ion-icon slot="start" name="trash-outline" /> Borrar
        </ion-button>
      }
      <span class="espacio"></span>
      <ion-button fill="outline" (click)="cerrar()">Cancelar</ion-button>
      <ion-button [disabled]="guardando()" (click)="guardar()">Guardar</ion-button>
    </ion-footer>
  `,
  styleUrl: './formularios.scss',
  styles: `
    .nota { margin: -6px 0 12px; font-size: 13px; color: var(--ion-color-danger); }
  `,
})
export class CasoForm implements OnInit {
  private modal = inject(ModalController);
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private avisos = inject(AvisosService);
  private sesion = inject(SesionService);

  /** Caso a editar (vacío = nuevo) */
  @Input() caso?: Caso;
  /** Cliente preseleccionado al crear un caso desde la ficha del cliente */
  @Input() clienteId?: number;

  readonly areas = AREAS;
  readonly estados = ESTADOS;
  clientes = signal<Cliente[]>([]);
  abogadas = signal<Usuaria[]>([]);
  guardando = signal(false);

  datos: Caso = {
    cliente: null,
    abogada: null,
    titulo: '',
    radicado: '',
    juzgado: '',
    area: 'civil',
    estado: 'abierto',
    descripcion: '',
    honorarios: 0,
    fecha_inicio: hoy(),
  };

  ngOnInit(): void {
    if (this.caso) {
      this.datos = { ...this.caso };
    } else {
      // Por defecto, la responsable es quien está creando el caso
      this.datos.abogada = this.sesion.usuaria()?.id ?? null;
      this.datos.cliente = this.clienteId ?? null;
    }
    // Listas para los desplegables
    this.api.listar<Cliente>('clientes').subscribe((lista) => this.clientes.set(lista));
    this.http.get<Usuaria[]>(`${API_URL}/cuentas/abogadas/`).subscribe((lista) => this.abogadas.set(lista));
  }

  cerrar(): void {
    this.modal.dismiss(null, 'cancelar');
  }

  guardar(): void {
    if (!this.datos.titulo.trim() || !this.datos.cliente || !this.datos.fecha_inicio) {
      this.avisos.mostrar('Título, cliente y fecha de inicio son obligatorios.', 'danger');
      return;
    }
    this.guardando.set(true);
    const datos = { ...this.datos, honorarios: this.datos.honorarios || 0 };
    const peticion = datos.id
      ? this.api.actualizar<Caso>('casos', datos.id, datos)
      : this.api.crear<Caso>('casos', datos);

    peticion.subscribe({
      next: (caso) => {
        this.avisos.mostrar('Caso guardado.');
        this.modal.dismiss(caso, 'guardado');
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisos.error(e);
      },
    });
  }

  async borrar(): Promise<void> {
    const seguro = await this.avisos.confirmar(
      'Borrar caso',
      'Se borrará el caso y todo su historial de actuaciones. ¿Continuar?',
    );
    if (!seguro || !this.datos.id) return;

    this.api.borrar('casos', this.datos.id).subscribe({
      next: () => {
        this.avisos.mostrar('Caso borrado.');
        this.modal.dismiss(null, 'borrado');
      },
      error: (e) => this.avisos.error(e),
    });
  }
}
