import { Component, Input, OnInit, inject, signal } from '@angular/core';
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
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';

import { ApiService } from '../servicios/api.service';
import { AvisosService } from '../servicios/avisos.service';
import { Cliente, TIPOS_DOCUMENTO } from '../servicios/modelos';

/**
 * Ventana (modal) para crear o editar un cliente.
 * Se abre con ModalController; si recibe `cliente`, edita; si no, crea uno nuevo.
 * Al cerrarse devuelve role = 'guardado' o 'borrado' para que la lista se recargue.
 */
@Component({
  selector: 'app-cliente-form',
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
        <ion-title>{{ datos.id ? 'Editar cliente' : 'Nuevo cliente' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()" aria-label="Cerrar">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form class="formulario" (ngSubmit)="guardar()">
        <ion-input label="Nombre completo o razón social *" labelPlacement="floating" fill="outline"
          name="nombre" [(ngModel)]="datos.nombre" />

        <div class="fila">
          <ion-select label="Tipo de documento" labelPlacement="floating" fill="outline"
            name="tipo_documento" [(ngModel)]="datos.tipo_documento" interface="popover">
            @for (tipo of tiposDocumento; track tipo.valor) {
              <ion-select-option [value]="tipo.valor">{{ tipo.texto }}</ion-select-option>
            }
          </ion-select>
          <ion-input label="Número de documento *" labelPlacement="floating" fill="outline"
            name="numero_documento" [(ngModel)]="datos.numero_documento" />
        </div>

        <div class="fila">
          <ion-input label="Teléfono" labelPlacement="floating" fill="outline" type="tel"
            name="telefono" [(ngModel)]="datos.telefono" />
          <ion-input label="Correo" labelPlacement="floating" fill="outline" type="email"
            name="correo" [(ngModel)]="datos.correo" />
        </div>

        <ion-input label="Dirección" labelPlacement="floating" fill="outline"
          name="direccion" [(ngModel)]="datos.direccion" />

        <ion-textarea label="Notas" labelPlacement="floating" fill="outline" [autoGrow]="true" rows="3"
          name="notas" [(ngModel)]="datos.notas" />

        <!-- Acceso al portal de clientes (solo cuando el cliente ya existe) -->
        @if (datos.id) {
          <div class="acceso">
            <div class="acceso-texto">
              <strong><ion-icon name="lock-closed-outline" /> Portal de clientes</strong>
              @if (datos.usuario_portal) {
                <span>Tiene acceso. Usuario: <b>{{ datos.usuario_portal }}</b></span>
              } @else {
                <span>Sin acceso. Al dárselo, entra con su número de documento.</span>
              }
            </div>
            <div class="acceso-botones">
              @if (datos.usuario_portal) {
                <ion-button size="small" fill="outline" (click)="darAcceso()">Nueva contraseña</ion-button>
                <ion-button size="small" fill="clear" color="danger" (click)="quitarAcceso()">Quitar</ion-button>
              } @else {
                <ion-button size="small" (click)="darAcceso()">Dar acceso</ion-button>
              }
            </div>
          </div>
        }

        <!-- Botón oculto para que Enter también guarde -->
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
    .acceso {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 14px;
      border-radius: 12px;
      border: 1px dashed var(--ion-color-secondary);
      background: rgba(var(--ion-color-secondary-rgb), 0.06);
    }
    .acceso-texto {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 14px;
      strong { display: flex; align-items: center; gap: 6px; color: var(--ion-color-primary); }
      span { color: var(--despacho-suave); }
    }
    .acceso-botones ion-button { --border-radius: 8px; text-transform: none; letter-spacing: 0; }
  `,
})
export class ClienteForm implements OnInit {
  private modal = inject(ModalController);
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private alerta = inject(AlertController);

  /** Cliente a editar (si viene vacío se crea uno nuevo) */
  @Input() cliente?: Cliente;
  /** Datos para prellenar un cliente nuevo (ej: desde una solicitud) */
  @Input() datosIniciales?: Partial<Cliente>;

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  guardando = signal(false);

  datos: Cliente = {
    nombre: '',
    tipo_documento: 'CC',
    numero_documento: '',
    telefono: '',
    correo: '',
    direccion: '',
    notas: '',
  };

  ngOnInit(): void {
    // Copiamos el cliente para no modificar la lista mientras se edita
    if (this.cliente) {
      this.datos = { ...this.cliente };
    } else if (this.datosIniciales) {
      this.datos = { ...this.datos, ...this.datosIniciales };
    }
  }

  cerrar(): void {
    this.modal.dismiss(null, 'cancelar');
  }

  guardar(): void {
    if (!this.datos.nombre.trim() || !this.datos.numero_documento.trim()) {
      this.avisos.mostrar('El nombre y el número de documento son obligatorios.', 'danger');
      return;
    }
    this.guardando.set(true);
    const peticion = this.datos.id
      ? this.api.actualizar<Cliente>('clientes', this.datos.id, this.datos)
      : this.api.crear<Cliente>('clientes', this.datos);

    peticion.subscribe({
      next: (cliente) => {
        this.avisos.mostrar('Cliente guardado.');
        this.modal.dismiss(cliente, 'guardado');
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisos.error(e);
      },
    });
  }

  /** Crea el acceso al portal o le pone una contraseña nueva */
  async darAcceso(): Promise<void> {
    // Sugerimos una contraseña aleatoria fácil de dictar (ej: Clave-4821-xk)
    const sugerida = `Clave-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).slice(2, 4)}`;
    const ventana = await this.alerta.create({
      header: this.datos.usuario_portal ? 'Nueva contraseña' : 'Dar acceso al portal',
      message: `Usuario: ${this.datos.numero_documento.toLowerCase()}. Anota la contraseña y entrégasela al cliente.`,
      inputs: [{ name: 'password', type: 'text', value: sugerida }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: ({ password }: { password: string }) => {
            this.api.post<Cliente>(`clientes/${this.datos.id}/acceso/`, { password }).subscribe({
              next: (cliente) => {
                this.datos.usuario_portal = cliente.usuario_portal;
                this.avisos.mostrar(`Acceso listo. Usuario: ${cliente.usuario_portal} · Contraseña: ${password}`);
              },
              error: (e) => this.avisos.error(e),
            });
          },
        },
      ],
    });
    await ventana.present();
  }

  async quitarAcceso(): Promise<void> {
    if (!(await this.avisos.confirmar('Quitar acceso', 'El cliente ya no podrá entrar al portal.', 'Quitar'))) return;
    this.api.delete<Cliente>(`clientes/${this.datos.id}/acceso/`).subscribe({
      next: () => {
        this.datos.usuario_portal = '';
        this.avisos.mostrar('Acceso quitado.');
      },
      error: (e) => this.avisos.error(e),
    });
  }

  async borrar(): Promise<void> {
    const seguro = await this.avisos.confirmar(
      'Borrar cliente',
      `¿Seguro que quieres borrar a ${this.datos.nombre}? Esta acción no se puede deshacer.`,
    );
    if (!seguro || !this.datos.id) return;

    this.api.borrar('clientes', this.datos.id).subscribe({
      next: () => {
        this.avisos.mostrar('Cliente borrado.');
        this.modal.dismiss(null, 'borrado');
      },
      error: (e) => this.avisos.error(e),
    });
  }
}
