import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular/standalone';

import { ApiService } from '../../servicios/api.service';
import { AvisosService } from '../../servicios/avisos.service';
import { Presentacion, TIPOS_DOCUMENTO, Usuaria } from '../../servicios/modelos';
import { SesionService } from '../../servicios/sesion.service';
import { Logo } from '../logo';

/** Qué formulario se muestra en la tarjeta */
type Modo = 'entrar' | 'crear' | 'recuperar' | 'codigo';

/**
 * Pantalla de acceso con tres opciones:
 * - Entrar: abogadas (van al panel) y clientes (van a su portal).
 * - Crear cuenta: para clientes (el usuario será su número de documento).
 * - Recuperar contraseña: se envía un código al correo y con él se pone una nueva.
 */
@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonCheckbox,
    IonIcon,
    IonSpinner,
    Logo,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPagina {
  private sesion = inject(SesionService);
  private api = inject(ApiService);
  private router = inject(Router);
  private avisos = inject(AvisosService);

  readonly tiposDocumento = TIPOS_DOCUMENTO;

  modo = signal<Modo>('entrar');
  verPassword = signal(false);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  // Entrar
  usuario = '';
  password = '';

  // Crear cuenta
  nueva = {
    nombre: '',
    tipo_documento: 'CC',
    numero_documento: '',
    correo: '',
    telefono: '',
    password: '',
    confirmar: '',
    // Autorización de datos (Ley 1581 de 2012), dirigida a una abogada
    abogada: null as number | null,
    acepta_datos: false,
    datos_sensibles: false,
  };

  /** Abogadas para elegir a quién se autoriza el tratamiento de datos */
  abogadas = signal<{ id: number; nombre: string }[]>([]);

  // Recuperar contraseña
  codigo = '';
  passwordNueva = '';

  constructor() {
    // Desde el footer se puede llegar con ?modo=crear o ?modo=recuperar
    const modo = inject(ActivatedRoute).snapshot.queryParamMap.get('modo');
    if (modo === 'crear' || modo === 'recuperar') {
      this.modo.set(modo);
    }
    this.api.get<Presentacion>('publico/').subscribe((r) => this.abogadas.set(r.abogadas));
  }

  cambiarModo(modo: Modo): void {
    this.modo.set(modo);
    this.error.set('');
    this.mensaje.set('');
  }

  /** Inicia sesión y manda a cada quien a su página */
  entrar(): void {
    if (!this.usuario || !this.password) {
      this.error.set('Escribe tu usuario y tu contraseña.');
      return;
    }
    this.empezar();
    this.sesion.iniciarSesion(this.usuario.trim().toLowerCase(), this.password).subscribe({
      next: ({ usuaria }) => this.bienvenida(usuaria),
      error: (e) => {
        this.cargando.set(false);
        // 400 = datos incorrectos; cualquier otro caso suele ser que el backend está apagado
        this.error.set(e.status === 400 ? 'Usuario o contraseña incorrectos.' : 'No hay conexión con el servidor.');
      },
    });
  }

  /** Crea la cuenta de cliente y entra directamente al portal */
  crearCuenta(): void {
    const datos = this.nueva;
    if (!datos.nombre.trim() || !datos.numero_documento.trim() || !datos.correo.trim()) {
      this.error.set('Nombre, documento y correo son obligatorios.');
      return;
    }
    if (!datos.abogada) {
      this.error.set('Elige tu abogada.');
      return;
    }
    if (!datos.acepta_datos) {
      this.error.set('Debes aceptar la política de tratamiento de datos.');
      return;
    }
    if (datos.password !== datos.confirmar) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.empezar();
    this.sesion.registrarse(datos).subscribe({
      next: ({ usuaria }) => this.bienvenida(usuaria),
      error: (e) => this.fallo(e),
    });
  }

  /** Paso 1: pide el código al correo */
  pedirCodigo(): void {
    if (!this.usuario.trim()) {
      this.error.set('Escribe tu usuario (clientes: número de documento).');
      return;
    }
    this.empezar();
    this.api.post<{ detail: string }>('cuentas/recuperar/', { usuario: this.usuario.trim().toLowerCase() }).subscribe({
      next: (r) => {
        this.cargando.set(false);
        this.modo.set('codigo');
        this.mensaje.set(r.detail);
      },
      error: (e) => this.fallo(e),
    });
  }

  /** Paso 2: con el código, guarda la contraseña nueva */
  cambiarConCodigo(): void {
    if (!this.codigo.trim() || !this.passwordNueva) {
      this.error.set('Escribe el código y la contraseña nueva.');
      return;
    }
    this.empezar();
    this.api
      .post<{ detail: string }>('cuentas/recuperar/confirmar/', {
        usuario: this.usuario.trim().toLowerCase(),
        codigo: this.codigo.trim(),
        password: this.passwordNueva,
      })
      .subscribe({
        next: (r) => {
          this.cargando.set(false);
          this.codigo = '';
          this.passwordNueva = '';
          this.password = '';
          this.cambiarModo('entrar');
          this.avisos.mostrar(r.detail);
        },
        error: (e) => this.fallo(e),
      });
  }

  private empezar(): void {
    this.error.set('');
    this.mensaje.set('');
    this.cargando.set(true);
  }

  private bienvenida(usuaria: Usuaria): void {
    this.cargando.set(false);
    this.password = '';
    this.avisos.mostrar(`¡Hola, ${usuaria.nombre}!`);
    this.router.navigateByUrl(this.sesion.paginaInicial(), { replaceUrl: true });
  }

  private fallo(e: { status: number; error?: { detail?: string } }): void {
    this.cargando.set(false);
    if (e.status === 0) {
      this.error.set('No hay conexión con el servidor.');
    } else if (e.status === 429) {
      this.error.set('Demasiados intentos. Espera un rato y vuelve a intentarlo.');
    } else {
      this.error.set(e.error?.detail ?? 'No se pudo completar. Revisa los datos.');
    }
  }
}
