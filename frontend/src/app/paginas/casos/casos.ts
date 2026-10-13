import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonProgressBar,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
} from '@ionic/angular/standalone';

import { CasoForm } from '../../formularios/caso-form';
import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { Caso, ESTADOS } from '../../servicios/modelos';
import { VentanasService } from '../../servicios/ventanas.service';

/** Lista de casos con filtro por estado y buscador. Clic = ver detalle. */
@Component({
  selector: 'app-casos',
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
    IonProgressBar,
  ],
  templateUrl: './casos.html',
  styleUrl: './casos.scss',
})
export class CasosPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private ventanas = inject(VentanasService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  readonly estados = ESTADOS;
  casos = signal<Caso[]>([]);
  cargando = signal(false);
  estado = signal('');
  buscar = '';

  ionViewWillEnter(): void {
    // Si venimos desde Clientes, llega ?buscar=Nombre del cliente
    this.buscar = this.ruta.snapshot.queryParamMap.get('buscar') ?? this.buscar;
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.listar<Caso>('casos', { estado: this.estado(), buscar: this.buscar }).subscribe({
      next: (lista) => {
        this.casos.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisos.error(e);
      },
    });
  }

  cambiarEstado(evento: CustomEvent): void {
    this.estado.set(String(evento.detail.value ?? ''));
    this.cargar();
  }

  alBuscar(evento: CustomEvent): void {
    this.buscar = evento.detail.value ?? '';
    this.cargar();
  }

  abrir(caso: Caso): void {
    this.router.navigate(['/panel/casos', caso.id]);
  }

  async nuevo(): Promise<void> {
    if (await this.ventanas.abrir(CasoForm)) this.cargar();
  }
}
