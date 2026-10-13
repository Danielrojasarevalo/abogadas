import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonProgressBar,
  IonSearchbar,
  IonToolbar,
} from '@ionic/angular/standalone';

import { CasoForm } from '../../formularios/caso-form';
import { ClienteForm } from '../../formularios/cliente-form';
import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { Cliente } from '../../servicios/modelos';
import { VentanasService } from '../../servicios/ventanas.service';

/** Lista de clientes con buscador. Clic en un cliente = editar. */
@Component({
  selector: 'app-clientes',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonSearchbar,
    IonIcon,
    IonFab,
    IonFabButton,
    IonProgressBar,
  ],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
})
export class ClientesPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private ventanas = inject(VentanasService);
  private router = inject(Router);

  clientes = signal<Cliente[]>([]);
  cargando = signal(false);
  buscar = '';

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.listar<Cliente>('clientes', { buscar: this.buscar }).subscribe({
      next: (lista) => {
        this.clientes.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisos.error(e);
      },
    });
  }

  /** Se llama cuando cambia el texto del buscador */
  alBuscar(evento: CustomEvent): void {
    this.buscar = evento.detail.value ?? '';
    this.cargar();
  }

  /** Iniciales del cliente para el círculo (ej: "María López" -> "ML") */
  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('');
  }

  async nuevo(): Promise<void> {
    if (await this.ventanas.abrir(ClienteForm)) this.cargar();
  }

  async editar(cliente: Cliente): Promise<void> {
    if (await this.ventanas.abrir(ClienteForm, { cliente })) this.cargar();
  }

  /** Abre un caso nuevo con este cliente ya seleccionado */
  async nuevoCaso(cliente: Cliente, evento: Event): Promise<void> {
    evento.stopPropagation(); // Para que no se abra también la edición del cliente
    if (await this.ventanas.abrir(CasoForm, { clienteId: cliente.id })) this.cargar();
  }

  /** Lleva a la lista de casos filtrada por el nombre del cliente */
  verCasos(cliente: Cliente, evento: Event): void {
    evento.stopPropagation();
    this.router.navigate(['/panel/casos'], { queryParams: { buscar: cliente.nombre } });
  }
}
