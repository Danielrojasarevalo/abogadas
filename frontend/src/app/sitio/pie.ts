import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';

import { AbogadaPublica, InfoDespacho } from '../servicios/modelos';
import { Logo } from '../paginas/logo';

/**
 * Footer (pie de página) de la página pública y del portal de clientes.
 * Muestra los datos de contacto del despacho solo si están llenos.
 */
@Component({
  selector: 'app-pie',
  imports: [RouterLink, IonIcon, Logo],
  template: `
    <footer class="pie">
      <div class="contenido">
        <div class="columna marca">
          <app-logo [tamano]="44" />
          <strong>Elizabeth Imbachi &amp; Katherine Rojas</strong>
          <span class="sub">Abogadas</span>
          <p>{{ despacho()?.lema || 'Asesoría legal cercana, clara y comprometida.' }}</p>
          <!-- Dónde atiende cada abogada -->
          <ul class="sedes">
            @for (s of sedes(); track s.nombre) {
              <li>
                <ion-icon name="location-outline" />
                <span><span class="sede-nombre">{{ s.nombre }}</span> · {{ s.ciudad }}</span>
              </li>
            }
          </ul>
        </div>

        <div class="columna">
          <h4>Contacto</h4>
          <ul>
            @if (despacho()?.telefono) {
              <li><ion-icon name="call-outline" /> {{ despacho()?.telefono }}</li>
            }
            @if (despacho()?.correo) {
              <li><ion-icon name="mail-outline" /> {{ despacho()?.correo }}</li>
            }
            @if (despacho()?.direccion) {
              <li><ion-icon name="business-outline" /> {{ despacho()?.direccion }}</li>
            }
            @if (despacho()?.horario) {
              <li><ion-icon name="time-outline" /> {{ despacho()?.horario }}</li>
            }
            @if (!despacho()?.telefono && !despacho()?.correo && !despacho()?.direccion) {
              <li>Escríbenos desde el botón “Agenda tu consulta”.</li>
            }
          </ul>
        </div>

        <div class="columna">
          <h4>Clientes</h4>
          <ul>
            <li><a routerLink="/login">Iniciar sesión</a></li>
            <li><a routerLink="/login" [queryParams]="{ modo: 'crear' }">Crear cuenta</a></li>
            <li><a routerLink="/login" [queryParams]="{ modo: 'recuperar' }">Recuperar contraseña</a></li>
          </ul>
        </div>
      </div>

      <div class="legal">
        <nav class="enlaces-legales">
          <a routerLink="/privacidad" fragment="politica">Política de tratamiento de datos</a>
          <a routerLink="/privacidad" fragment="terminos">Términos y aviso legal</a>
          <a href="/manual-usuario.pdf" download="Manual de usuario - Imbachi & Rojas Abogadas.pdf">Manual de usuario (PDF)</a>
        </nav>
        <p class="aviso-legal">
          La información de este sitio no constituye asesoría jurídica. Enviar una consulta no crea una relación
          abogado–cliente hasta que se acuerde el servicio.
        </p>
        © {{ anio }} Elizabeth Imbachi &amp; Katherine Rojas · Abogadas · {{ lugar() }}. Todos los derechos reservados.
      </div>
    </footer>
  `,
  styles: `
    .pie {
      position: relative;
      background: #141b2d;
      color: rgba(255, 255, 255, 0.72);

      /* Línea dorada arriba del footer */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, var(--ion-color-secondary), transparent);
      }
    }

    .contenido {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 32px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 48px 20px 32px;

      @media (max-width: 760px) {
        grid-template-columns: 1fr;
        gap: 24px;
      }
    }

    .marca {
      strong {
        display: block;
        margin-top: 10px;
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 19px;
        color: #fff;
      }

      .sub {
        font-size: 11px;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: var(--ion-color-secondary-tint);
      }

      p {
        max-width: 320px;
        margin: 12px 0 0;
        font-size: 14px;
        line-height: 1.6;
      }

      .sedes {
        margin-top: 14px;

        li {
          margin-bottom: 8px;
        }

        .sede-nombre {
          font-weight: 600;
          color: #fff;
        }

        ion-icon {
          flex-shrink: 0;
          color: var(--ion-color-secondary-tint);
        }
      }
    }

    h4 {
      margin: 0 0 12px;
      font-size: 13px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ion-color-secondary-tint);
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 14px;

      li {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      a {
        color: rgba(255, 255, 255, 0.78);
        text-decoration: none;

        &:hover {
          color: #fff;
          text-decoration: underline;
        }
      }
    }

    .legal {
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.45);
    }
    .enlaces-legales {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px 18px;
      margin-bottom: 8px;
      a {
        color: rgba(255, 255, 255, 0.78);
        font-size: 13px;
        text-decoration: none;
        &:hover {
          color: #fff;
          text-decoration: underline;
        }
      }
    }
    .aviso-legal {
      max-width: 640px;
      margin: 0 auto 8px;
      line-height: 1.5;
    }
  `,
})
export class Pie {
  /** Datos de contacto del despacho (opcional) */
  despacho = input<InfoDespacho | null>(null);
  /** Abogadas con su ciudad (si no llegan, se usan las ciudades conocidas) */
  abogadas = input<AbogadaPublica[]>([]);

  /** Ciudad de cada abogada: Elizabeth en Pitalito y Katherine en Neiva (se cambia en "Mi perfil") */
  readonly sedes = computed(() => {
    const conCiudad = this.abogadas().filter((a) => a.ciudad);
    if (conCiudad.length) return conCiudad.map((a) => ({ nombre: a.nombre, ciudad: a.ciudad! }));
    return [
      { nombre: 'Elizabeth Imbachi', ciudad: 'Pitalito, Huila' },
      { nombre: 'Katherine Rojas', ciudad: 'Neiva, Huila' },
    ];
  });
  readonly anio = new Date().getFullYear();
  /** Ciudad del despacho (la llenan en "Mi perfil"); si no hay, el departamento */
  readonly lugar = computed(() =>
    this.despacho()?.ciudad ? `${this.despacho()!.ciudad}, Colombia` : 'Neiva y Pitalito, Huila, Colombia',
  );
}
