import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';

import { CitaForm } from '../../formularios/cita-form';
import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { aFechaLocal } from '../../servicios/fechas';
import { Cita } from '../../servicios/modelos';
import { VentanasService } from '../../servicios/ventanas.service';
import { Ubicacion } from '../../sitio/ubicacion';

/** Un día de la agenda con sus citas */
interface DiaAgenda {
  fecha: string; // AAAA-MM-DD
  citas: Cita[];
}

/**
 * Agenda del despacho: citas agrupadas por día.
 * Pestañas: próximas (desde hoy y sin completar) o todas.
 * Cada cita muestra su ubicación y un botón para verla en el mapa.
 */
@Component({
  selector: 'app-agenda',
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
    IonCheckbox,
    IonIcon,
    IonFab,
    IonFabButton,
    IonProgressBar,
  ],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss',
})
export class AgendaPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private ventanas = inject(VentanasService);
  private modal = inject(ModalController);

  citas = signal<Cita[]>([]);
  cargando = signal(false);
  vista = signal<'proximas' | 'todas'>('proximas');

  readonly hoy = aFechaLocal(new Date());

  /** Citas filtradas según la pestaña y agrupadas por día */
  readonly dias = computed<DiaAgenda[]>(() => {
    let lista = this.citas();
    if (this.vista() === 'proximas') {
      lista = lista.filter((c) => !c.completada && aFechaLocal(new Date(c.fecha_hora)) >= this.hoy);
    }
    const grupos = new Map<string, Cita[]>();
    for (const cita of lista) {
      const dia = aFechaLocal(new Date(cita.fecha_hora));
      grupos.set(dia, [...(grupos.get(dia) ?? []), cita]);
    }
    return [...grupos.entries()].map(([fecha, citas]) => ({ fecha, citas }));
  });

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.listar<Cita>('citas').subscribe({
      next: (lista) => {
        this.citas.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisos.error(e);
      },
    });
  }

  cambiarVista(evento: CustomEvent): void {
    this.vista.set(evento.detail.value);
  }

  /** Marca o desmarca una cita como completada directamente desde la lista */
  cambiarCompletada(cita: Cita, evento: CustomEvent): void {
    const completada = evento.detail.checked as boolean;
    this.api.actualizar<Cita>('citas', cita.id!, { completada }).subscribe({
      next: (actualizada) => {
        this.citas.update((lista) => lista.map((c) => (c.id === actualizada.id ? actualizada : c)));
        if (completada) this.avisos.mostrar('Cita completada.');
      },
      error: (e) => this.avisos.error(e),
    });
  }

  /** Lugar de la cita; si es una reunión sin lugar escrito, la dirección del cliente */
  ubicacion(cita: Cita): string {
    return cita.lugar.trim() || (cita.tipo === 'reunion' ? (cita.cliente_direccion ?? '').trim() : '');
  }

  /** Abre la ventana con el mapa del lugar de la cita */
  async verUbicacion(cita: Cita): Promise<void> {
    const ventana = await this.modal.create({
      component: Ubicacion,
      componentProps: {
        titulo: cita.titulo,
        lugar: this.ubicacion(cita),
        fechaHora: cita.fecha_hora,
        persona: cita.cliente_nombre,
        esDireccionCliente: !cita.lugar.trim(),
      },
      cssClass: 'ventana-formulario',
    });
    await ventana.present();
  }

  async nueva(): Promise<void> {
    if (await this.ventanas.abrir(CitaForm)) this.cargar();
  }

  async editar(cita: Cita): Promise<void> {
    if (await this.ventanas.abrir(CitaForm, { cita })) this.cargar();
  }
}
