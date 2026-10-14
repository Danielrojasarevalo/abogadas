import { DatePipe } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';

import { ApiService } from '../../servicios/api.service';
import { AbogadaPublica, InfoDespacho, Presentacion } from '../../servicios/modelos';
import { SesionService } from '../../servicios/sesion.service';
import { Cabecera } from '../../sitio/cabecera';
import { Pie } from '../../sitio/pie';

/**
 * Página pública /privacidad con:
 * - #politica  Política de Tratamiento de Datos Personales (Ley 1581 de 2012, Decreto 1377 de 2013).
 * - #terminos  Términos de uso y aviso legal (Ley 1123 de 2007, Ley 1480 de 2011).
 *
 * El texto se arma con los datos que las abogadas llenan en "Mi perfil" > Protección de datos.
 * Lo que falte aparece marcado como "por completar".
 */
@Component({
  selector: 'app-privacidad',
  imports: [DatePipe, RouterLink, IonContent, IonButton, IonIcon, IonSpinner, Cabecera, Pie],
  template: `
    <ion-content>
      <div class="barra">
        <app-cabecera>
          <ion-button fill="clear" class="btn-volver" [routerLink]="volver()">
            <ion-icon slot="start" name="arrow-back-outline" /> Volver
          </ion-button>
        </app-cabecera>
      </div>

      <main class="documento" #pagina>
        @if (d(); as d) {
          <nav class="indice">
            <button type="button" (click)="irA('politica')">Política de tratamiento de datos</button>
            <button type="button" (click)="irA('terminos')">Términos y aviso legal</button>
          </nav>

          <!-- ================= POLÍTICA DE DATOS ================= -->
          <article id="politica" class="tarjeta">
            <span class="sobre">Ley 1581 de 2012 · Decreto 1377 de 2013</span>
            <h1>Política de Tratamiento de Datos Personales</h1>
            <p class="vigencia">
              Vigente desde:
              @if (d.vigencia_politica) {
                <strong>{{ d.vigencia_politica | date: 'longDate' }}</strong>
              } @else {
                <span class="falta">por completar</span>
              }
              @if (d.politica_actualizada) {
                · Última actualización: {{ d.politica_actualizada | date: 'longDate' }}
              }
            </p>

            <h2>1. Responsable del tratamiento</h2>
            <dl class="ficha">
              <dt>Nombre</dt>
              <dd>{{ d.responsable_nombre || d.nombre }}</dd>
              <dt>Identificación</dt>
              <dd>@if (d.responsable_identificacion) { {{ d.responsable_identificacion }} } @else { <span class="falta">por completar</span> }</dd>
              <dt>Domicilio</dt>
              <dd>@if (d.ciudad) { {{ d.ciudad }}, Colombia } @else { <span class="falta">por completar</span> }</dd>
              <dt>Dirección</dt>
              <dd>@if (d.direccion) { {{ d.direccion }} } @else { <span class="falta">por completar</span> }</dd>
              <dt>Teléfono</dt>
              <dd>@if (d.telefono) { {{ d.telefono }} } @else { <span class="falta">por completar</span> }</dd>
              <dt>Correo</dt>
              <dd>@if (correoDatos()) { {{ correoDatos() }} } @else { <span class="falta">por completar</span> }</dd>
            </dl>

            <h2>2. Marco legal</h2>
            <p>
              Artículo 15 de la Constitución Política (habeas data), Ley Estatutaria 1581 de 2012, Decreto 1377 de
              2013 (compilado en el Decreto 1074 de 2015) y demás normas que los modifiquen o complementen.
            </p>

            <h2>3. Datos que tratamos</h2>
            <ul>
              <li>Identificación y contacto: nombre, tipo y número de documento, teléfono, WhatsApp, correo y dirección.</li>
              <li>Información de tu consulta o de tu proceso: lo que nos cuentas, radicados, actuaciones, citas y documentos.</li>
              <li>Datos de tu cuenta del portal: usuario y fecha de las autorizaciones que nos das.</li>
              <li>
                Ubicación aproximada desde donde envías la consulta, <strong>solo si tu navegador te lo pregunta y
                aceptas</strong>. Es opcional y la ve únicamente la abogada que elegiste.
              </li>
            </ul>

            <h2>4. Tratamiento y finalidades</h2>
            <p>Recogemos, almacenamos, consultamos, usamos y, cuando corresponde, suprimimos tus datos para:</p>
            <ul>
              <li>Responder tu solicitud de consulta y contactarte (y, si la compartiste, saber desde dónde nos escribes).</li>
              <li>Prestarte el servicio jurídico: asesoría, representación, trámites ante juzgados y entidades.</li>
              <li>Agendar y recordarte citas, audiencias y vencimientos.</li>
              <li>Darte acceso al portal de clientes y enviarte códigos para recuperar tu contraseña.</li>
              <li>Cumplir obligaciones legales, contractuales y del Código Disciplinario del Abogado (Ley 1123 de 2007).</li>
              @for (f of lineas(d.finalidades_adicionales); track $index) {
                <li>{{ f }}</li>
              }
            </ul>
            <p>No vendemos ni cedemos tus datos con fines comerciales.</p>

            <h2>5. Datos sensibles y de menores de edad</h2>
            <p>
              Tu consulta puede incluir datos sensibles (salud, vida sexual, origen étnico, convicciones, violencia,
              datos biométricos) o datos de niños, niñas y adolescentes. <strong>No estás obligado(a) a darlos</strong>:
              responder sobre ellos es facultativo. Si los compartes, solo los tratamos con tu autorización expresa,
              para la atención de tu caso y respetando el interés superior de los menores (artículos 5, 6 y 7 de la Ley 1581).
            </p>

            <h2>6. Secreto profesional y seguridad</h2>
            <p>
              Toda la información de tu caso está amparada por el secreto profesional del abogado. Los documentos del
              portal no son públicos: solo los ven tú y tu abogada, con usuario y contraseña. Cada autorización y
              cada petición sobre tus datos llega únicamente a la abogada que tú elegiste.
            </p>

            <h2>7. Con quién se comparten</h2>
            <ul>
              <li>Juzgados, autoridades y contrapartes, solo cuando el trámite de tu caso lo exige.</li>
              <li>
                Proveedores tecnológicos (alojamiento y correo) que actúan como encargados, con deber de confidencialidad.
              </li>
              <li>
                Si decides escribirnos por <strong>WhatsApp</strong>, ese mensaje lo procesa WhatsApp (Meta Platforms), que
                puede tratar datos fuera de Colombia bajo sus propias políticas. Es opcional: también puedes usar el
                formulario, el correo o el teléfono.
              </li>
            </ul>

            <h2>8. Tus derechos como titular</h2>
            <ul>
              <li>Conocer, actualizar y rectificar tus datos.</li>
              <li>Pedir prueba de la autorización que nos diste.</li>
              <li>Ser informado(a) sobre el uso que les damos.</li>
              <li>
                Revocar la autorización o pedir que se borren tus datos, salvo cuando exista un deber legal o contractual
                de conservarlos (por ejemplo, mientras esté vigente tu proceso).
              </li>
              <li>Acceder gratis a tus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), después de agotar el trámite con nosotras.</li>
            </ul>

            <h2>9. Quién atiende tus peticiones</h2>
            <p>
              @if (d.area_peticiones) { <strong>{{ d.area_peticiones }}</strong> } @else { <span class="falta">por completar</span> },
              en el correo
              @if (correoDatos()) { <strong>{{ correoDatos() }}</strong> } @else { <span class="falta">por completar</span> }
              @if (d.telefono) { o al teléfono <strong>{{ d.telefono }}</strong> }.
              Si eres cliente, también puedes hacerlo desde tu portal, en la sección <strong>“Protección de datos”</strong>.
            </p>

            <h2>10. Procedimiento</h2>
            <ul>
              <li>
                <strong>Consultas</strong> (saber qué datos tenemos): respondemos en máximo 10 días hábiles,
                prorrogables 5 días hábiles más avisándote el motivo (art. 14).
              </li>
              <li>
                <strong>Reclamos</strong> (corregir, actualizar, borrar o revocar): incluye tu identificación, la
                descripción de lo que pides, tu dirección y los documentos que quieras hacer valer. Respondemos en
                máximo 15 días hábiles, prorrogables 8 días hábiles más (art. 15). Si falta información te
                avisaremos en 5 días; si no la completas en 2 meses, se entiende que desististe.
              </li>
            </ul>

            <h2>11. Conservación</h2>
            <p>
              Las solicitudes de consulta que no se convierten en un servicio se borran a los
              <strong>{{ d.meses_conservacion_solicitudes || 12 }} meses</strong>.
              Vigencia de la base de datos: {{ d.vigencia_base_datos || 'mientras sea necesario para las finalidades descritas.' }}
            </p>

            <h2>12. Cambios a esta política</h2>
            <p>
              Si la cambiamos, publicaremos la nueva versión en esta página con su fecha. Las autorizaciones guardan la
              versión que aceptaste.
            </p>
          </article>

          <!-- ================= TÉRMINOS Y AVISO LEGAL ================= -->
          <article id="terminos" class="tarjeta">
            <span class="sobre">Aviso legal</span>
            <h1>Términos de uso y aviso legal</h1>

            <h2>Información general, no asesoría</h2>
            <p>
              El contenido de este sitio es informativo y <strong>no constituye asesoría jurídica</strong>.
              Enviar una consulta, escribir por WhatsApp o crear una cuenta <strong>no crea una relación
              abogado–cliente</strong>; esta empieza cuando se acuerda el servicio (contrato y, si aplica, poder).
            </p>

            <h2>Sin promesa de resultados</h2>
            <p>
              El ejercicio de la abogacía es una obligación de medio: ponemos todo nuestro conocimiento y diligencia,
              pero no podemos garantizar el resultado de un proceso, que depende de las autoridades y de las pruebas.
            </p>

            <h2>Condiciones de la consulta</h2>
            <ul>
              <li>Primera consulta: {{ d.costo_consulta || 'te informamos el valor antes de prestar cualquier servicio.' }}</li>
              <li>Tiempo de respuesta: {{ d.tiempo_respuesta || 'te contactaremos lo antes posible.' }}</li>
              <li>Los honorarios de cada caso se pactan por escrito antes de iniciar.</li>
            </ul>

            <h2>Profesionales</h2>
            <p>
              Las abogadas ejercen con tarjeta profesional del Consejo Superior de la Judicatura. Su vigencia puede
              verificarse en el Registro Nacional de Abogados (SIRNA):
              <a href="https://sirna.ramajudicial.gov.co" target="_blank" rel="noopener">sirna.ramajudicial.gov.co</a>.
            </p>

            <h2>Uso del portal de clientes</h2>
            <ul>
              <li>Tu usuario y contraseña son personales; no los compartas.</li>
              <li>Puedes subir archivos PDF o Word de hasta 10 MB; eres responsable de su contenido.</li>
              <li>Las notas internas de tu abogada no se muestran en el portal.</li>
              <li>Cuando el caso termina, los documentos se conservan según los términos legales y luego se eliminan.</li>
            </ul>

            <h2>Ley aplicable</h2>
            <p>Estos términos se rigen por las leyes de la República de Colombia.</p>
          </article>
        } @else {
          <div class="cargando"><ion-spinner name="crescent" /></div>
        }
      </main>

      <app-pie [despacho]="d()" [abogadas]="abogadas()" />
    </ion-content>
  `,
  styles: `
    ion-content {
      --background: #f6f3ee;
    }

    .barra {
      position: sticky;
      top: 0;
      z-index: 10;
      background: rgba(251, 250, 247, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--despacho-borde);
    }

    .btn-volver {
      --color: var(--ion-color-primary);
      text-transform: none;
      letter-spacing: 0;
      font-weight: 600;
    }

    .documento {
      max-width: 860px;
      margin: 0 auto;
      padding: 28px 16px 56px;
    }

    .cargando {
      padding: 80px;
      text-align: center;
    }

    .indice {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;

      button {
        padding: 8px 14px;
        border: 1px solid var(--despacho-borde);
        border-radius: 999px;
        background: #fff;
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-color-primary);
        cursor: pointer;
      }
    }

    article {
      padding: 28px 24px;
      margin-bottom: 20px;
      line-height: 1.65;
      font-size: 15px;

      @media (max-width: 560px) {
        padding: 22px 16px;
      }
    }

    .sobre {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ion-color-secondary-shade);
    }

    h1 {
      margin: 6px 0 4px;
      font-size: clamp(24px, 4vw, 32px);
    }

    h2 {
      margin: 22px 0 6px;
      font-size: 18px;
    }

    ul {
      padding-left: 20px;
      margin: 6px 0;
    }

    .vigencia {
      margin: 0 0 8px;
      font-size: 14px;
      color: var(--despacho-suave);
    }

    .ficha {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 6px 12px;
      margin: 8px 0;

      dt {
        color: var(--despacho-suave);
      }

      dd {
        margin: 0;
        font-weight: 600;
      }
    }

    .falta {
      padding: 1px 8px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      background: rgba(var(--ion-color-warning-rgb), 0.18);
      color: var(--ion-color-warning-shade);
    }
  `,
})
export class PrivacidadPagina {
  private api = inject(ApiService);
  private ruta = inject(ActivatedRoute);
  private sesion = inject(SesionService);

  private contenido = viewChild.required(IonContent);
  private pagina = viewChild<ElementRef<HTMLElement>>('pagina');

  d = signal<InfoDespacho | null>(null);
  abogadas = signal<AbogadaPublica[]>([]);

  /** Correo para peticiones de datos (si no hay uno especial, el del despacho) */
  readonly correoDatos = computed(() => this.d()?.correo_datos || this.d()?.correo || '');

  /** El botón "Volver" lleva a la página de donde viene cada quien */
  readonly volver = () => (this.sesion.conectada() ? this.sesion.paginaInicial() : '/');

  ionViewWillEnter(): void {
    this.api.get<Presentacion>('publico/').subscribe((r) => {
      this.d.set(r.despacho);
      this.abogadas.set(r.abogadas);
      // Si llegó con /privacidad#terminos, baja a esa sección
      const fragmento = this.ruta.snapshot.fragment;
      if (fragmento) setTimeout(() => this.irA(fragmento), 50);
    });
  }

  irA(id: string): void {
    const seccion = this.pagina()?.nativeElement.querySelector<HTMLElement>(`#${id}`);
    if (seccion) this.contenido().scrollToPoint(0, seccion.offsetTop - 80, 400);
  }

  lineas(texto: string | undefined): string[] {
    return (texto ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  }
}
