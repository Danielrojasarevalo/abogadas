import { Injectable, Type, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';

/**
 * Abre los formularios (cliente, caso, cita) en una ventana modal.
 * Devuelve true si se guardó o borró algo, para que la página recargue su lista.
 */
@Injectable({ providedIn: 'root' })
export class VentanasService {
  private modal = inject(ModalController);

  async abrir(componente: Type<unknown>, datos: Record<string, unknown> = {}): Promise<boolean> {
    const ventana = await this.modal.create({
      component: componente,
      componentProps: datos,
      cssClass: 'ventana-formulario',
    });
    await ventana.present();
    const { role } = await ventana.onDidDismiss();
    return role === 'guardado' || role === 'borrado';
  }
}
