import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AlertController, IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';

import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { CasoPortal, InfoDespacho } from '../../servicios/modelos';
import { SesionService } from '../../servicios/sesion.service';
import { Cabecera } from '../../sitio/cabecera';
import { Pie } from '../../sitio/pie';

/** Cita tal como la ve el cliente */
interface CitaCliente {
  id: number;
  titulo: string;
  tipo: string;
  tipo_texto: string;
  fecha_hora: string;
  lugar: string;
  caso_titulo: string;
}

/** Respuesta de /api/portal/casos/ */
interface DatosPortal {
  cliente: { nombre: string; documento: string; correo: string; telefono: string };
  citas: CitaCliente[];
  casos: CasoPortal[];
}

/**
 * Portal del cliente: al entrar ve todo lo que necesita.
 * - Sus próximas citas (fecha, hora, lugar y tipo).
 * - Sus casos: estado, abogada y su contacto, y el historial del proceso.
 * - Sus datos y la opción de cambiar la contraseña.
 */
@Component({
  selector: 'app-portal',
  imports: [DatePipe, IonContent, IonButton, IonIcon, IonSpinner, Cabecera, Pie],
  templateUrl: './portal.html',
  styleUrl: './portal.scss',
})
export class PortalPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private alerta = inject(AlertController);
  private sesion = inject(SesionService);

  datos = signal<DatosPortal | null>(null);
  despacho = signal<InfoDespacho | null>(null);
  cargando = signal(true);

  /** Primer nombre para el saludo */
  readonly nombre = computed(() => (this.datos()?.cliente.nombre ?? this.sesion.usuaria()?.nombre ?? '').split(' ')[0]);

  /** La cita más cercana (se destaca arriba) */
  readonly proxima = computed(() => this.datos()?.citas[0] ?? null);

  ionViewWillEnter(): void {
    this.cargar();
    // Datos de contacto del despacho para el footer
    this.api.get<{ despacho: InfoDespacho }>('publico/').subscribe((r) => this.despacho.set(r.despacho));
  }

  cargar(): void {
    this.cargando.set(true);
    this.api.get<DatosPortal>('portal/casos/').subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisos.error(e);
      },
    });
  }

  /** Ventana para cambiar la contraseña */
  async cambiarPassword(): Promise<void> {
    const ventana = await this.alerta.create({
      header: 'Cambiar contraseña',
      inputs: [
        { name: 'actual', type: 'password', placeholder: 'Contraseña actual' },
        { name: 'nueva', type: 'password', placeholder: 'Contraseña nueva (mín. 8)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (valores: { actual: string; nueva: string }) => {
            this.api.post<{ detail: string }>('portal/password/', valores).subscribe({
              next: (r) => this.avisos.mostrar(r.detail),
              error: (e) => this.avisos.error(e),
            });
          },
        },
      ],
    });
    await ventana.present();
  }

  async salir(): Promise<void> {
    if (await this.avisos.confirmar('Cerrar sesión', '¿Seguro que quieres salir?', 'Salir')) {
      this.sesion.cerrarSesion();
    }
  }
}
