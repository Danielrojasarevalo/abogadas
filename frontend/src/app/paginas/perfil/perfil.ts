import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

/** Nombre legible de los campos obligatorios de la política */
const NOMBRES_CAMPOS: Record<string, string> = {
  responsable_nombre: 'responsable',
  responsable_identificacion: 'identificación',
  ciudad: 'ciudad',
  direccion: 'dirección del despacho',
  telefono: 'teléfono del despacho',
  area_peticiones: 'quién atiende las peticiones',
  vigencia_politica: 'fecha de vigencia',
  correo_datos: 'correo para peticiones',
};

/**
 * "Mi perfil": lo que el público ve de cada abogada en la página principal.
 * - Título y presentación.
 * - Ramas del derecho: OPCIONALES. Si no agrega ninguna, en la página pública no aparece esa sección.
 * - Datos generales del despacho (los comparten las dos abogadas).
 * - Protección de datos: lo que exige la ley para la Política de Tratamiento (Ley 1581 de 2012).
 */
@Component({
  selector: 'app-perfil',
  imports: [
    FormsModule,
    RouterLink,
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
  /** Campos obligatorios de la política que faltan (según lo último guardado) */
  private faltanCampos = signal<string[]>([]);
  readonly faltantes = computed(() => this.faltanCampos().map((c) => NOMBRES_CAMPOS[c] ?? c));
  ramas = signal<Rama[]>([]);
  nuevaRama: Rama = { nombre: '', descripcion: '' };

  ionViewWillEnter(): void {
    this.api.get<PerfilAbogada>('perfil/').subscribe((p) => (this.perfil = p));
    this.api.get<InfoDespacho>('despacho/').subscribe((d) => this.ponerDespacho(d));
    this.cargarRamas();
  }

  cargarRamas(): void {
    this.api.listar<Rama>('ramas').subscribe((lista) => this.ramas.set(lista));
  }

  guardarPerfil(): void {
    // Si borran los años de experiencia, se guarda vacío (null) y no se muestra
    const datos = { ...this.perfil, anios_experiencia: this.perfil.anios_experiencia || null };
    this.api.patch<PerfilAbogada>('perfil/', datos).subscribe({
      next: (p) => {
        this.perfil = p;
        this.avisos.mostrar('Perfil guardado. Ya se ve en la página principal.');
      },
      error: (e) => this.avisos.error(e),
    });
  }

  private ponerDespacho(d: InfoDespacho): void {
    this.despacho = d;
    this.faltanCampos.set(d.faltantes ?? []);
  }

  guardarDespacho(): void {
    // Si borran la fecha de vigencia se guarda vacía (null)
    const datos = {
      ...this.despacho,
      vigencia_politica: this.despacho.vigencia_politica || null,
      meses_conservacion_solicitudes: Number(this.despacho.meses_conservacion_solicitudes) || 12,
    };
    this.api.patch<InfoDespacho>('despacho/', datos).subscribe({
      next: (d) => {
        this.ponerDespacho(d);
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
