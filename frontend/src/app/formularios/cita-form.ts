import { Component, Input, OnInit, inject, signal } from '@angular/core';
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
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

import { ApiService } from '../servicios/api.service';
import { AvisosService } from '../servicios/avisos.service';
import { aCampoFechaHora, deCampoFechaHora } from '../servicios/fechas';
import { Caso, Cita, Cliente, TIPOS_CITA } from '../servicios/modelos';

/**
 * Ventana para crear o editar una cita de la agenda.
 * La cita se puede ligar (opcionalmente) a un cliente y a un caso.
 */
@Component({
  selector: 'app-cita-form',
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
    IonCheckbox,
    IonFooter,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ datos.id ? 'Editar cita' : 'Nueva cita' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()" aria-label="Cerrar">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form class="formulario" (ngSubmit)="guardar()">
        <ion-input label="Título *" labelPlacement="floating" fill="outline"
          name="titulo" [(ngModel)]="datos.titulo" />

        <div class="fila">
          <ion-select label="Tipo" labelPlacement="floating" fill="outline"
            name="tipo" [(ngModel)]="datos.tipo" interface="popover">
            @for (t of tipos; track t.valor) {
              <ion-select-option [value]="t.valor">{{ t.texto }}</ion-select-option>
            }
          </ion-select>
          <ion-input label="Fecha y hora *" labelPlacement="stacked" fill="outline" type="datetime-local"
            name="fecha_hora" [(ngModel)]="fechaHora" />
        </div>

        <ion-input label="Lugar" labelPlacement="floating" fill="outline"
          name="lugar" [(ngModel)]="datos.lugar" />

        <div class="fila">
          <ion-select label="Cliente (opcional)" labelPlacement="floating" fill="outline"
            name="cliente" [(ngModel)]="datos.cliente" interface="popover">
            <ion-select-option [value]="null">— Ninguno —</ion-select-option>
            @for (c of clientes(); track c.id) {
              <ion-select-option [value]="c.id">{{ c.nombre }}</ion-select-option>
            }
          </ion-select>
          <ion-select label="Caso (opcional)" labelPlacement="floating" fill="outline"
            name="caso" [(ngModel)]="datos.caso" interface="popover">
            <ion-select-option [value]="null">— Ninguno —</ion-select-option>
            @for (c of casos(); track c.id) {
              <ion-select-option [value]="c.id">{{ c.titulo }}</ion-select-option>
            }
          </ion-select>
        </div>

        <ion-textarea label="Notas" labelPlacement="floating" fill="outline" [autoGrow]="true" rows="3"
          name="notas" [(ngModel)]="datos.notas" />

        @if (datos.id) {
          <label class="casilla">
            <ion-checkbox name="completada" [(ngModel)]="datos.completada" />
            Marcar como completada
          </label>
        }

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
})
export class CitaForm implements OnInit {
  private modal = inject(ModalController);
  private api = inject(ApiService);
  private avisos = inject(AvisosService);

  /** Cita a editar (vacío = nueva) */
  @Input() cita?: Cita;
  /** Caso preseleccionado (al crear una cita desde la ficha de un caso) */
  @Input() caso?: Caso;

  readonly tipos = TIPOS_CITA;
  clientes = signal<Cliente[]>([]);
  casos = signal<Caso[]>([]);
  guardando = signal(false);

  /** Valor del campo fecha/hora en formato del navegador */
  fechaHora = aCampoFechaHora(null);

  datos: Cita = {
    titulo: '',
    tipo: 'reunion',
    fecha_hora: '',
    lugar: '',
    cliente: null,
    caso: null,
    notas: '',
    completada: false,
  };

  ngOnInit(): void {
    if (this.cita) {
      this.datos = { ...this.cita };
      this.fechaHora = aCampoFechaHora(this.cita.fecha_hora);
    } else if (this.caso) {
      this.datos.caso = this.caso.id ?? null;
      this.datos.cliente = this.caso.cliente;
    }
    this.api.listar<Cliente>('clientes').subscribe((lista) => this.clientes.set(lista));
    this.api.listar<Caso>('casos').subscribe((lista) => this.casos.set(lista));
  }

  cerrar(): void {
    this.modal.dismiss(null, 'cancelar');
  }

  guardar(): void {
    if (!this.datos.titulo.trim() || !this.fechaHora) {
      this.avisos.mostrar('El título y la fecha son obligatorios.', 'danger');
      return;
    }
    this.guardando.set(true);
    const datos = { ...this.datos, fecha_hora: deCampoFechaHora(this.fechaHora) };
    const peticion = datos.id
      ? this.api.actualizar<Cita>('citas', datos.id, datos)
      : this.api.crear<Cita>('citas', datos);

    peticion.subscribe({
      next: (cita) => {
        this.avisos.mostrar('Cita guardada.');
        this.modal.dismiss(cita, 'guardado');
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisos.error(e);
      },
    });
  }

  async borrar(): Promise<void> {
    if (!(await this.avisos.confirmar('Borrar cita', '¿Seguro que quieres borrar esta cita?'))) return;
    if (!this.datos.id) return;

    this.api.borrar('citas', this.datos.id).subscribe({
      next: () => {
        this.avisos.mostrar('Cita borrada.');
        this.modal.dismiss(null, 'borrado');
      },
      error: (e) => this.avisos.error(e),
    });
  }
}
