import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
} from '@ionic/angular/standalone';

import { AvisosService } from '../../servicios/avisos.service';
import { SesionService } from '../../servicios/sesion.service';
import { Logo } from '../logo';

/**
 * Marco general de la aplicación: menú lateral + contenido.
 * En computador el menú queda fijo; en celular se abre con el botón ☰.
 */
@Component({
  selector: 'app-marco',
  imports: [
    RouterLink,
    RouterLinkActive,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonFooter,
    IonRouterOutlet,
    Logo,
  ],
  templateUrl: './marco.html',
  styleUrl: './marco.scss',
})
export class MarcoPagina {
  private sesion = inject(SesionService);
  private avisos = inject(AvisosService);

  /** Opciones del menú */
  readonly opciones = [
    { titulo: 'Inicio', ruta: '/panel/inicio', icono: 'grid-outline' },
    { titulo: 'Clientes', ruta: '/panel/clientes', icono: 'people-outline' },
    { titulo: 'Casos', ruta: '/panel/casos', icono: 'briefcase-outline' },
    { titulo: 'Agenda', ruta: '/panel/agenda', icono: 'calendar-outline' },
    { titulo: 'Solicitudes', ruta: '/panel/solicitudes', icono: 'mail-outline' },
    { titulo: 'Mi perfil', ruta: '/panel/perfil', icono: 'person-outline' },
  ];

  readonly usuaria = this.sesion.usuaria;

  /** Inicial del nombre para el círculo de la usuaria */
  readonly inicial = computed(() => (this.usuaria()?.nombre ?? '?').charAt(0).toUpperCase());

  async salir(): Promise<void> {
    if (await this.avisos.confirmar('Cerrar sesión', '¿Seguro que quieres salir?', 'Salir')) {
      this.sesion.cerrarSesion();
    }
  }
}
