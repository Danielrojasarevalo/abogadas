import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AlertController, IonButton, IonContent, IonIcon, IonSpinner, ModalController } from '@ionic/angular/standalone';

import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { enlaceWhatsapp } from '../../servicios/enlaces';
import { AbogadaPublica, CasoPortal, InfoDespacho, Presentacion } from '../../servicios/modelos';
import { SesionService } from '../../servicios/sesion.service';
import { Cabecera } from '../../sitio/cabecera';
import { Documentos } from '../../sitio/documentos';
import { Pie } from '../../sitio/pie';
import { ProteccionDatos } from '../../sitio/proteccion-datos';
import { Ubicacion } from '../../sitio/ubicacion';

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
 * - Sus próximas citas (fecha, hora, lugar con mapa y tipo).
 * - Sus casos: estado, abogada y su contacto (WhatsApp), documentos y el historial del proceso.
 * - Sus datos y la opción de cambiar la contraseña.
 * - Protección de datos: su autorización y sus peticiones (Ley 1581 de 2012).
 */
@Component({
  selector: 'app-portal',
  imports: [DatePipe, IonContent, IonButton, IonIcon, IonSpinner, Cabecera, Pie, Documentos, ProteccionDatos],
  templateUrl: './portal.html',
  styleUrl: './portal.scss',
})
export class PortalPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);
  private alerta = inject(AlertController);
  private sesion = inject(SesionService);
  private modal = inject(ModalController);

  datos = signal<DatosPortal | null>(null);
  despacho = signal<InfoDespacho | null>(null);
  abogadas = signal<AbogadaPublica[]>([]);
  cargando = signal(true);

  /** Primer nombre para el saludo */
  readonly nombre = computed(() => (this.datos()?.cliente.nombre ?? this.sesion.usuaria()?.nombre ?? '').split(' ')[0]);

  /** La cita más cercana (se destaca arriba) */
  readonly proxima = computed(() => this.datos()?.citas[0] ?? null);

  ionViewWillEnter(): void {
    this.cargar();
    // Datos de contacto del despacho para el footer
    this.api.get<Presentacion>('publico/').subscribe((r) => {
      this.despacho.set(r.despacho);
      this.abogadas.set(r.abogadas);
    });
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

  /** Abre la ventana con el mapa del lugar de la cita */
  async verUbicacion(cita: CitaCliente): Promise<void> {
    const ventana = await this.modal.create({
      component: Ubicacion,
      componentProps: { titulo: cita.titulo, lugar: cita.lugar, fechaHora: cita.fecha_hora },
      cssClass: 'ventana-formulario',
    });
    await ventana.present();
  }

  /** Chat de WhatsApp con la abogada del caso */
  whatsapp(caso: CasoPortal): string {
    return enlaceWhatsapp(caso.abogada_whatsapp, `Hola, soy ${this.datos()?.cliente.nombre}. Te escribo por mi caso "${caso.titulo}".`);
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
