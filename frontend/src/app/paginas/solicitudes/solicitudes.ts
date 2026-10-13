import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
} from '@ionic/angular/standalone';

import { ClienteForm } from '../../formularios/cliente-form';
import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { Solicitud } from '../../servicios/modelos';
import { VentanasService } from '../../servicios/ventanas.service';

/**
 * Solicitudes de consulta que llegan desde la página pública.
 * Cada visitante elige a qué abogada escribirle. Se pueden ver solo las propias o todas.
 */
@Component({
  selector: 'app-solicitudes',
  imports: [
    DatePipe,
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
    IonProgressBar,
  ],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.scss',
})
export class SolicitudesPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private ventanas = inject(VentanasService);

  solicitudes = signal<Solicitud[]>([]);
  cargando = signal(false);
  filtro = signal<'mias' | 'todas'>('mias');

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    const filtros: Record<string, number> = this.filtro() === 'mias' ? { mias: 1 } : {};
    this.api.listar<Solicitud>('solicitudes', filtros).subscribe({
      next: (lista) => {
        this.solicitudes.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisos.error(e);
      },
    });
  }

  cambiarFiltro(evento: CustomEvent): void {
    this.filtro.set(evento.detail.value);
    this.cargar();
  }

  marcar(solicitud: Solicitud, atendida: boolean): void {
    this.api.actualizar<Solicitud>('solicitudes', solicitud.id!, { atendida }).subscribe({
      next: () => this.cargar(),
      error: (e) => this.avisos.error(e),
    });
  }

  /** Convierte la solicitud en cliente (abre el formulario con los datos ya llenos) */
  async registrarCliente(solicitud: Solicitud): Promise<void> {
    const cliente = {
      nombre: solicitud.nombre,
      telefono: solicitud.telefono,
      correo: solicitud.correo,
      notas: solicitud.mensaje,
    };
    if (await this.ventanas.abrir(ClienteForm, { datosIniciales: cliente })) {
      this.marcar(solicitud, true);
    }
  }

  async borrar(solicitud: Solicitud): Promise<void> {
    if (!(await this.avisos.confirmar('Borrar solicitud', `¿Borrar la solicitud de ${solicitud.nombre}?`))) return;
    this.api.borrar('solicitudes', solicitud.id!).subscribe({
      next: () => this.cargar(),
      error: (e) => this.avisos.error(e),
    });
  }
}
