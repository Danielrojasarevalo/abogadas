import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner, ModalController } from '@ionic/angular/standalone';

import { SolicitudForm } from '../../formularios/solicitud-form';
import { ApiService } from '../../servicios/api.service';
import { enlaceWhatsapp } from '../../servicios/enlaces';
import { AbogadaPublica, Presentacion } from '../../servicios/modelos';
import { SesionService } from '../../servicios/sesion.service';
import { VentanasService } from '../../servicios/ventanas.service';
import { Aparecer } from '../../sitio/aparecer';
import { Cabecera } from '../../sitio/cabecera';
import { PerfilCompleto } from '../../sitio/perfil-completo';
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
  imports: [RouterLink, IonContent, IonButton, IonIcon, IonSpinner, Cabecera, Pie, Aparecer],
  templateUrl: './publico.html',
  styleUrl: './publico.scss',
})
export class PublicoPagina {
  private api = inject(ApiService);
  private ventanas = inject(VentanasService);
  private modal = inject(ModalController);
  readonly sesion = inject(SesionService);

  private contenido = viewChild.required(IonContent);
  private pagina = viewChild.required<ElementRef<HTMLElement>>('pagina');

  datos = signal<Presentacion | null>(null);
  error = signal(false);
  /** true cuando ya se bajó un poco: la cabecera toma sombra */
  desplazada = signal(false);

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

  alDesplazar(evento: CustomEvent<{ scrollTop: number }>): void {
    const bajo = evento.detail.scrollTop > 24;
    if (bajo !== this.desplazada()) this.desplazada.set(bajo);
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
    this.ventanas.abrir(SolicitudForm, { abogadas: datos.abogadas, abogadaId, despacho: datos.despacho });
  }

  /** Abre la ventana con todo el perfil de la abogada */
  async verPerfil(abogada: AbogadaPublica): Promise<void> {
    const ventana = await this.modal.create({
      component: PerfilCompleto,
      componentProps: { abogada },
      cssClass: 'ventana-formulario',
    });
    await ventana.present();
    const { role } = await ventana.onDidDismiss();
    // Si desde el perfil pulsó "Consultar", abrimos la solicitud con ella elegida
    if (role === 'consultar') {
      this.consultar(abogada.id);
    }
  }

  /** Chat de WhatsApp con la abogada, con un saludo ya escrito */
  whatsapp(abogada: AbogadaPublica): string {
    const nombre = abogada.nombre.split(' ')[0];
    return enlaceWhatsapp(abogada.whatsapp, `Hola ${nombre}, quiero hacer una consulta legal.`);
  }

  /** Primeras líneas de un texto con varias líneas (para el resumen de la tarjeta) */
  primeras(texto: string | undefined, cantidad: number): string[] {
    return (texto ?? '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, cantidad);
  }

  /** Botón de la cabecera: a dónde lleva si ya hay sesión */
  readonly rutaCuenta = () => (this.sesion.conectada() ? this.sesion.paginaInicial() : '/login');
}
