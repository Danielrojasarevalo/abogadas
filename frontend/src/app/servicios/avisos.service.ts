import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/standalone';

/**
 * Mensajes al usuario: avisos cortos (toast) y ventanas de confirmación.
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private toast = inject(ToastController);
  private alerta = inject(AlertController);

  /** Muestra un mensaje corto abajo de la pantalla */
  async mostrar(mensaje: string, color: 'success' | 'danger' | 'primary' = 'success'): Promise<void> {
    const aviso = await this.toast.create({ message: mensaje, color, duration: 2500, position: 'bottom' });
    await aviso.present();
  }

  /** Muestra el error que devolvió la API de forma entendible */
  error(error: unknown): void {
    this.mostrar(this.textoError(error), 'danger');
  }

  /** Pregunta antes de hacer algo delicado (como borrar). Devuelve true si aceptan */
  async confirmar(titulo: string, mensaje: string, textoBoton = 'Borrar'): Promise<boolean> {
    const ventana = await this.alerta.create({
      header: titulo,
      message: mensaje,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: textoBoton, role: 'confirm', cssClass: 'boton-peligro' },
      ],
    });
    await ventana.present();
    const { role } = await ventana.onDidDismiss();
    return role === 'confirm';
  }

  /** Convierte la respuesta de error de Django en un texto corto */
  private textoError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No hay conexión con el servidor. ¿Está encendido el backend?';
      }
      const cuerpo = error.error;
      if (cuerpo?.detail) {
        return cuerpo.detail;
      }
      // Errores de validación: { campo: ["mensaje"] }
      if (cuerpo && typeof cuerpo === 'object') {
        const [campo, mensajes] = Object.entries(cuerpo)[0] ?? [];
        if (campo) {
          return `${campo}: ${Array.isArray(mensajes) ? mensajes[0] : mensajes}`;
        }
      }
    }
    return 'Ocurrió un error inesperado.';
  }
}
