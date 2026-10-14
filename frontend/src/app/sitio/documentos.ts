import { DatePipe } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonCheckbox, IonIcon, IonInput, IonSpinner } from '@ionic/angular/standalone';

import { ApiService } from '../servicios/api.service';
import { AvisosService } from '../servicios/avisos.service';
import { tamanoLegible } from '../servicios/enlaces';
import { Documento } from '../servicios/modelos';

/** Tamaño máximo de un documento (igual que en el backend) */
const TAMANO_MAXIMO = 10 * 1024 * 1024;
const EXTENSIONES = ['pdf', 'doc', 'docx'];

/**
 * Lista de documentos (PDF y Word) de un caso, con el formulario para subir uno nuevo.
 * Se usa en la ficha del caso (abogadas) y en el portal (cliente).
 * - Abogada: sube, descarga, oculta/muestra al cliente y borra cualquier documento.
 * - Cliente: sube, descarga y borra solo los que él mismo subió.
 */
@Component({
  selector: 'app-documentos',
  imports: [DatePipe, FormsModule, IonButton, IonCheckbox, IonIcon, IonInput, IonSpinner],
  template: `
    <form class="subir" (ngSubmit)="subir()">
      <input #selector type="file" hidden accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        (change)="elegirArchivo($event)" />
      <button type="button" class="zona" [class.lleno]="archivo()" (click)="selector.click()">
        <ion-icon [name]="archivo() ? 'document-attach-outline' : 'cloud-upload-outline'" />
        @if (archivo(); as a) {
          <span><strong>{{ a.name }}</strong> · {{ tamano(a.size) }}</span>
        } @else {
          <span><strong>Elegir archivo</strong> · PDF o Word, máximo 10 MB</span>
        }
      </button>
      @if (archivo()) {
        <ion-input fill="outline" label="Nombre del documento" labelPlacement="floating"
          placeholder="Ej: Copia de la cédula, Contrato de arrendamiento..." name="nombre" [(ngModel)]="nombre" />
        @if (modo() === 'abogada') {
          <label class="visible">
            <ion-checkbox name="visible" [(ngModel)]="visibleCliente" />
            El cliente lo ve en su portal
          </label>
        }
        <div class="botones">
          <ion-button fill="clear" size="small" (click)="limpiar()">Cancelar</ion-button>
          <ion-button type="submit" size="small" [disabled]="subiendo()">
            @if (subiendo()) { <ion-spinner name="crescent" /> } @else {
              <ion-icon slot="start" name="cloud-upload-outline" /> Subir
            }
          </ion-button>
        </div>
      }
    </form>

    <ul class="lista">
      @for (doc of documentos(); track doc.id) {
        <li>
          <span class="icono {{ doc.extension === 'pdf' ? 'pdf' : 'word' }}">{{ doc.extension === 'pdf' ? 'PDF' : 'W' }}</span>
          <div class="info">
            <strong>{{ doc.nombre }}</strong>
            <span>
              {{ doc.subido_por_cliente ? (modo() === 'cliente' ? 'Subido por ti' : 'Subido por el cliente') : 'Subido por ' + doc.subido_por_nombre }}
              · {{ doc.creado | date: 'd MMM y' }} · {{ tamano(doc.tamano) }}
            </span>
            @if (modo() === 'abogada' && doc.visible_cliente === false) {
              <span class="interno"><ion-icon name="eye-off-outline" /> Interno: el cliente no lo ve</span>
            }
          </div>
          <div class="acciones-doc">
            <button type="button" title="Descargar" aria-label="Descargar" (click)="descargar(doc)">
              <ion-icon name="download-outline" />
            </button>
            @if (modo() === 'abogada') {
              <button type="button" [title]="doc.visible_cliente ? 'Ocultar al cliente' : 'Mostrar al cliente'"
                [attr.aria-label]="doc.visible_cliente ? 'Ocultar al cliente' : 'Mostrar al cliente'" (click)="cambiarVisible(doc)">
                <ion-icon [name]="doc.visible_cliente ? 'eye-outline' : 'eye-off-outline'" />
              </button>
            }
            @if (modo() === 'abogada' || doc.subido_por_cliente) {
              <button type="button" class="borrar" title="Borrar" aria-label="Borrar documento" (click)="borrar(doc)">
                <ion-icon name="trash-outline" />
              </button>
            }
          </div>
        </li>
      } @empty {
        <p class="sin-datos">Todavía no hay documentos en este caso.</p>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    .subir {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
    }

    .zona {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 14px;
      border: 2px dashed var(--despacho-borde);
      border-radius: 12px;
      background: #fbfaf7;
      font: inherit;
      font-size: 13px;
      text-align: left;
      color: var(--despacho-suave);
      cursor: pointer;
      transition: border-color 0.15s;

      ion-icon {
        flex-shrink: 0;
        font-size: 24px;
        color: var(--ion-color-secondary);
      }

      strong {
        color: var(--ion-color-primary);
        word-break: break-all;
      }

      &:hover,
      &.lleno {
        border-color: var(--ion-color-secondary);
      }
    }

    .visible {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .botones {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }

    .lista {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-top: 1px solid var(--despacho-borde);

        &:first-child {
          border-top: none;
        }
      }
    }

    .icono {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 38px;
      height: 44px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      color: #fff;

      &.pdf { background: #c0392b; }
      &.word { background: #2b579a; font-size: 16px; }
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;

      strong {
        font-size: 14px;
        overflow-wrap: anywhere;
      }

      span {
        font-size: 12px;
        color: var(--despacho-suave);
      }

      .interno {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--ion-color-warning-shade);
      }
    }

    .acciones-doc {
      display: flex;
      flex-shrink: 0;

      button {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: none;
        border-radius: 8px;
        background: none;
        font-size: 18px;
        color: var(--ion-color-primary);
        cursor: pointer;

        &:hover {
          background: rgba(31, 42, 68, 0.06);
        }

        &.borrar {
          color: var(--ion-color-danger);
        }
      }
    }

    .sin-datos {
      margin: 6px 0;
      font-size: 14px;
      color: var(--despacho-suave);
    }
  `,
})
export class Documentos {
  private api = inject(ApiService);
  private avisos = inject(AvisosService);

  /** Caso al que pertenecen los documentos */
  casoId = input.required<number>();
  documentos = input<Documento[]>([]);
  /** Quién está viendo la lista: cambia las rutas de la API y los botones */
  modo = input<'abogada' | 'cliente'>('abogada');
  /** Avisa que se subió, borró o cambió algo (para recargar la lista) */
  cambio = output<void>();

  private selector = viewChild.required<ElementRef<HTMLInputElement>>('selector');

  archivo = signal<File | null>(null);
  subiendo = signal(false);
  nombre = '';
  visibleCliente = true;

  readonly tamano = tamanoLegible;

  elegirArchivo(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES.includes(extension)) {
      this.avisos.mostrar('Solo se pueden subir archivos PDF o Word (.pdf, .doc, .docx).', 'danger');
      this.limpiar();
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      this.avisos.mostrar('El archivo pesa más de 10 MB.', 'danger');
      this.limpiar();
      return;
    }
    this.archivo.set(archivo);
    // Nombre sugerido: el del archivo sin la extensión
    this.nombre = archivo.name.replace(/\.[^.]+$/, '');
  }

  limpiar(): void {
    this.archivo.set(null);
    this.nombre = '';
    this.visibleCliente = true;
    this.selector().nativeElement.value = '';
  }

  subir(): void {
    const archivo = this.archivo();
    if (!archivo) return;
    const datos = new FormData();
    datos.append('caso', String(this.casoId()));
    datos.append('nombre', this.nombre.trim());
    datos.append('archivo', archivo);
    if (this.modo() === 'abogada') datos.append('visible_cliente', String(this.visibleCliente));

    const ruta = this.modo() === 'abogada' ? 'documentos/' : 'portal/documentos/';
    this.subiendo.set(true);
    this.api.post<Documento>(ruta, datos).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.avisos.mostrar('Documento subido.');
        this.limpiar();
        this.cambio.emit();
      },
      error: (e) => {
        this.subiendo.set(false);
        this.avisos.error(e);
      },
    });
  }

  descargar(doc: Documento): void {
    const ruta = this.modo() === 'abogada' ? `documentos/${doc.id}/descargar/` : `portal/documentos/${doc.id}/descargar/`;
    const nombre = doc.nombre.toLowerCase().endsWith(`.${doc.extension}`) ? doc.nombre : `${doc.nombre}.${doc.extension}`;
    this.api.descargar(ruta, nombre).subscribe({ error: (e) => this.avisos.error(e) });
  }

  cambiarVisible(doc: Documento): void {
    this.api.actualizar<Documento>('documentos', doc.id, { visible_cliente: !doc.visible_cliente }).subscribe({
      next: () => this.cambio.emit(),
      error: (e) => this.avisos.error(e),
    });
  }

  async borrar(doc: Documento): Promise<void> {
    if (!(await this.avisos.confirmar('Borrar documento', `¿Quieres borrar "${doc.nombre}"?`))) return;
    const peticion =
      this.modo() === 'abogada' ? this.api.borrar('documentos', doc.id) : this.api.delete(`portal/documentos/${doc.id}/`);
    peticion.subscribe({
      next: () => {
        this.avisos.mostrar('Documento borrado.');
        this.cambio.emit();
      },
      error: (e) => this.avisos.error(e),
    });
  }
}
