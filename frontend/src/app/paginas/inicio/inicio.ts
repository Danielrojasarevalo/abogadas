import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonToolbar,
} from '@ionic/angular/standalone';

import { CasoForm } from '../../formularios/caso-form';
import { CitaForm } from '../../formularios/cita-form';
import { ClienteForm } from '../../formularios/cliente-form';
import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { Cita, Resumen } from '../../servicios/modelos';
import { SesionService } from '../../servicios/sesion.service';
import { VentanasService } from '../../servicios/ventanas.service';

/**
 * Pantalla de inicio (tablero): saludo, números del despacho,
 * próximas citas y accesos rápidos.
 */
@Component({
  selector: 'app-inicio',
  imports: [
    DatePipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonIcon,
    IonButton,
    IonProgressBar,
    IonRefresher,
    IonRefresherContent,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class InicioPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private ventanas = inject(VentanasService);
  private sesion = inject(SesionService);

  resumen = signal<Resumen | null>(null);
  cargando = signal(false);

  /** Solo el primer nombre para el saludo (ej: "Elizabeth") */
  readonly nombre = computed(() => (this.sesion.usuaria()?.nombre ?? '').split(' ')[0]);

  /** Saludo según la hora del día */
  readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  readonly fechaHoy = new Date();

  /** Ionic llama esto cada vez que se entra a la página */
  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(evento?: CustomEvent): void {
    this.cargando.set(true);
    this.api.resumen().subscribe({
      next: (datos) => {
        this.resumen.set(datos);
        this.cargando.set(false);
        (evento?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: (e) => {
        this.cargando.set(false);
        (evento?.target as HTMLIonRefresherElement | undefined)?.complete();
        this.avisos.error(e);
      },
    });
  }

  /** Accesos rápidos: abren el formulario y recargan los números al guardar */
  async nuevoCliente(): Promise<void> {
    if (await this.ventanas.abrir(ClienteForm)) this.cargar();
  }

  async nuevoCaso(): Promise<void> {
    if (await this.ventanas.abrir(CasoForm)) this.cargar();
  }

  async nuevaCita(): Promise<void> {
    if (await this.ventanas.abrir(CitaForm)) this.cargar();
  }

  async editarCita(cita: Cita): Promise<void> {
    if (await this.ventanas.abrir(CitaForm, { cita })) this.cargar();
  }
}
