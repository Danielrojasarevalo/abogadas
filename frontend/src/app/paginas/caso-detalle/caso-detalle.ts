import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonProgressBar,
  IonTextarea,
  IonToolbar,
} from '@ionic/angular/standalone';

import { CasoForm } from '../../formularios/caso-form';
import { CitaForm } from '../../formularios/cita-form';
import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { hoy } from '../../servicios/fechas';
import { Actuacion, Caso, Cita, Documento } from '../../servicios/modelos';
import { VentanasService } from '../../servicios/ventanas.service';
import { Documentos } from '../../sitio/documentos';

/**
 * Ficha de un caso: datos generales, historial de actuaciones (línea de tiempo)
 * documentos (PDF y Word) y citas relacionadas.
 */
@Component({
  selector: 'app-caso-detalle',
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonCheckbox,
    IonContent,
    IonIcon,
    IonInput,
    IonTextarea,
    IonProgressBar,
    Documentos,
  ],
  templateUrl: './caso-detalle.html',
  styleUrl: './caso-detalle.scss',
})
export class CasoDetallePagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private ventanas = inject(VentanasService);
  private router = inject(Router);

  /** Número del caso que viene en la URL /casos/:id */
  @Input() id!: string;

  caso = signal<Caso | null>(null);
  actuaciones = signal<Actuacion[]>([]);
  citas = signal<Cita[]>([]);
  documentos = signal<Documento[]>([]);
  cargando = signal(false);

  // Formulario rápido para agregar una actuación
  nuevaFecha = hoy();
  nuevaDescripcion = '';
  nuevaVisible = true; // ¿El cliente la verá en su portal?

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(): void {
    const id = Number(this.id);
    this.cargando.set(true);
    this.api.obtener<Caso>('casos', id).subscribe({
      next: (caso) => {
        this.caso.set(caso);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisos.error(e);
        this.router.navigateByUrl('/panel/casos');
      },
    });
    this.cargarActuaciones();
    this.cargarDocumentos();
    // Citas ligadas a este caso
    this.api.listar<Cita>('citas', { caso: id }).subscribe((lista) => this.citas.set(lista));
  }

  cargarActuaciones(): void {
    this.api
      .listar<Actuacion>('actuaciones', { caso: this.id })
      .subscribe((lista) => this.actuaciones.set(lista));
  }

  cargarDocumentos(): void {
    this.api
      .listar<Documento>('documentos', { caso: this.id })
      .subscribe((lista) => this.documentos.set(lista));
  }

  agregarActuacion(): void {
    if (!this.nuevaDescripcion.trim() || !this.nuevaFecha) {
      this.avisos.mostrar('Escribe la fecha y la descripción de la actuación.', 'danger');
      return;
    }
    const datos: Actuacion = {
      caso: Number(this.id),
      fecha: this.nuevaFecha,
      descripcion: this.nuevaDescripcion,
      visible_cliente: this.nuevaVisible,
    };
    this.api.crear<Actuacion>('actuaciones', datos).subscribe({
      next: () => {
        this.nuevaDescripcion = '';
        this.nuevaFecha = hoy();
        this.nuevaVisible = true;
        this.avisos.mostrar('Actuación agregada.');
        this.cargarActuaciones();
      },
      error: (e) => this.avisos.error(e),
    });
  }

  /** Cambia si el cliente ve o no esta actuación en su portal */
  cambiarVisible(actuacion: Actuacion): void {
    this.api
      .actualizar<Actuacion>('actuaciones', actuacion.id!, { visible_cliente: !actuacion.visible_cliente })
      .subscribe({
        next: () => this.cargarActuaciones(),
        error: (e) => this.avisos.error(e),
      });
  }

  async borrarActuacion(actuacion: Actuacion): Promise<void> {
    if (!(await this.avisos.confirmar('Borrar actuación', '¿Quieres borrar esta actuación del historial?'))) return;
    this.api.borrar('actuaciones', actuacion.id!).subscribe({
      next: () => this.cargarActuaciones(),
      error: (e) => this.avisos.error(e),
    });
  }

  async editar(): Promise<void> {
    const caso = this.caso();
    if (!caso) return;
    const ventana = await this.ventanas.abrir(CasoForm, { caso });
    if (!ventana) return;
    // Si lo borraron, volvemos a la lista; si no, recargamos la ficha
    this.api.obtener<Caso>('casos', caso.id!).subscribe({
      next: (actualizado) => this.caso.set(actualizado),
      error: () => this.router.navigateByUrl('/panel/casos'),
    });
  }

  async nuevaCita(): Promise<void> {
    if (await this.ventanas.abrir(CitaForm, { caso: this.caso() })) this.cargar();
  }

  async editarCita(cita: Cita): Promise<void> {
    if (await this.ventanas.abrir(CitaForm, { cita })) this.cargar();
  }
}
