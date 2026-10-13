import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';

import { SolicitudForm } from '../../formularios/solicitud-form';
import { ApiService } from '../../servicios/api.service';
import { Presentacion } from '../../servicios/modelos';
import { SesionService } from '../../servicios/sesion.service';
import { VentanasService } from '../../servicios/ventanas.service';
import { Cabecera } from '../../sitio/cabecera';
import { Pie } from '../../sitio/pie';

/**
 * Página pública (lo primero que ve cualquier persona, sin iniciar sesión):
 * - Presentación del despacho.
 * - "Cómo funciona" en 3 pasos (espacio corto para los visitantes).
 * - Las dos abogadas con su descripción y ramas (solo si las tienen).
 * - Botón para elegir abogada y enviar una solicitud de consulta.
 */
@Component({
  selector: 'app-publico',
  imports: [RouterLink, IonContent, IonButton, IonIcon, IonSpinner, Cabecera, Pie],
  templateUrl: './publico.html',
  styleUrl: './publico.scss',
})
export class PublicoPagina {
  private api = inject(ApiService);
  private ventanas = inject(VentanasService);
  readonly sesion = inject(SesionService);

  private contenido = viewChild.required(IonContent);
  private pagina = viewChild.required<ElementRef<HTMLElement>>('pagina');

  datos = signal<Presentacion | null>(null);
  error = signal(false);

  /** Pasos de la sección "Cómo funciona" */
  readonly pasos = [
    { icono: 'people-outline', titulo: 'Elige tu abogada', texto: 'Conoce a Elizabeth y a Katherine y escoge con quién quieres hablar.' },
    { icono: 'send-outline', titulo: 'Envía tu consulta', texto: 'Cuéntanos brevemente tu caso y te contactamos muy pronto.' },
    { icono: 'eye-outline', titulo: 'Sigue tu proceso', texto: 'Con tu cuenta ves el estado de tu caso, tus citas, fechas y horarios.' },
  ];

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set(false);
    this.api.get<Presentacion>('publico/').subscribe({
      next: (datos) => this.datos.set(datos),
      error: () => this.error.set(true),
    });
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  /** Desplaza la página hasta una sección (#nosotras, #contacto, ...) */
  irA(id: string): void {
    const seccion = this.pagina().nativeElement.querySelector<HTMLElement>(`#${id}`);
    if (seccion) {
      this.contenido().scrollToPoint(0, seccion.offsetTop - 72, 500);
    }
  }

  /** Abre la ventana para elegir abogada y enviar la consulta */
  consultar(abogadaId?: number): void {
    const datos = this.datos();
    if (!datos) return;
    this.ventanas.abrir(SolicitudForm, { abogadas: datos.abogadas, abogadaId });
  }

  /** Botón de la cabecera: a dónde lleva si ya hay sesión */
  readonly rutaCuenta = () => (this.sesion.conectada() ? this.sesion.paginaInicial() : '/login');
}
