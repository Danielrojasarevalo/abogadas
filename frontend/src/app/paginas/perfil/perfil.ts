import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonMenuButton,
  IonTextarea,
  IonToolbar,
} from '@ionic/angular/standalone';

import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { InfoDespacho, PerfilAbogada, Rama } from '../../servicios/modelos';

/**
 * "Mi perfil": lo que el público ve de cada abogada en la página principal.
 * - Título y presentación.
 * - Ramas del derecho: OPCIONALES. Si no agrega ninguna, en la página pública no aparece esa sección.
 * - Datos generales del despacho (los comparten las dos abogadas).
 */
@Component({
  selector: 'app-perfil',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class PerfilPagina {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);

  perfil: PerfilAbogada = { titulo: '', descripcion: '', telefono: '', correo: '' };
  despacho: InfoDespacho = { nombre: '', lema: '', descripcion: '', telefono: '', correo: '', direccion: '', horario: '' };
  ramas = signal<Rama[]>([]);
  nuevaRama: Rama = { nombre: '', descripcion: '' };

  ionViewWillEnter(): void {
    this.api.get<PerfilAbogada>('perfil/').subscribe((p) => (this.perfil = p));
    this.api.get<InfoDespacho>('despacho/').subscribe((d) => (this.despacho = d));
    this.cargarRamas();
  }

  cargarRamas(): void {
    this.api.listar<Rama>('ramas').subscribe((lista) => this.ramas.set(lista));
  }

  guardarPerfil(): void {
    this.api.patch<PerfilAbogada>('perfil/', this.perfil).subscribe({
      next: (p) => {
        this.perfil = p;
        this.avisos.mostrar('Perfil guardado. Ya se ve en la página principal.');
      },
      error: (e) => this.avisos.error(e),
    });
  }

  guardarDespacho(): void {
    this.api.patch<InfoDespacho>('despacho/', this.despacho).subscribe({
      next: (d) => {
        this.despacho = d;
        this.avisos.mostrar('Información del despacho guardada.');
      },
      error: (e) => this.avisos.error(e),
    });
  }

  agregarRama(): void {
    if (!this.nuevaRama.nombre.trim()) {
      this.avisos.mostrar('Escribe el nombre de la rama (ej: Familia).', 'danger');
      return;
    }
    this.api.crear<Rama>('ramas', this.nuevaRama).subscribe({
      next: () => {
        this.nuevaRama = { nombre: '', descripcion: '' };
        this.cargarRamas();
      },
      error: (e) => this.avisos.error(e),
    });
  }

  async quitarRama(rama: Rama): Promise<void> {
    if (!(await this.avisos.confirmar('Quitar rama', `¿Quitar "${rama.nombre}" de tu perfil?`, 'Quitar'))) return;
    this.api.borrar('ramas', rama.id!).subscribe({
      next: () => this.cargarRamas(),
      error: (e) => this.avisos.error(e),
    });
  }
}
