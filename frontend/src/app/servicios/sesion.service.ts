import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL } from './api.service';
import { Usuaria } from './modelos';

// Nombres con los que se guarda la sesión en el navegador
const CLAVE_TOKEN = 'abogadas_token';
const CLAVE_USUARIA = 'abogadas_usuaria';

/** Lee un valor del navegador sin romper la app si el almacenamiento está bloqueado */
function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

/** Lee la usuaria guardada; si es de una versión vieja (sin rol) la descarta */
function leerUsuaria(): Usuaria | null {
  try {
    const usuaria = JSON.parse(leer(CLAVE_USUARIA) ?? 'null') as Usuaria | null;
    return usuaria?.rol ? usuaria : null;
  } catch {
    return null;
  }
}

/**
 * Maneja el inicio y cierre de sesión de las abogadas y de los clientes.
 * Guarda el token en el navegador para no tener que entrar cada vez.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private http = inject(HttpClient);
  private router = inject(Router);

  /** Datos de quien inició sesión (abogada o cliente) */
  readonly usuaria = signal<Usuaria | null>(leerUsuaria());

  /** Token de la sesión actual (o null si no ha iniciado sesión) */
  readonly token = signal<string | null>(this.usuaria() ? leer(CLAVE_TOKEN) : null);

  /** true si hay una sesión abierta */
  readonly conectada = computed(() => !!this.token());

  /** 'abogada', 'cliente' o null */
  readonly rol = computed(() => (this.token() ? (this.usuaria()?.rol ?? null) : null));

  /** Página de inicio según quién entró */
  paginaInicial(): string {
    return this.rol() === 'cliente' ? '/portal' : '/panel/inicio';
  }

  iniciarSesion(usuario: string, password: string): Observable<{ token: string; usuaria: Usuaria }> {
    return this.http
      .post<{ token: string; usuaria: Usuaria }>(`${API_URL}/cuentas/login/`, { usuario, password })
      .pipe(
        tap((respuesta) => this.guardar(respuesta.token, respuesta.usuaria)),
      );
  }

  /** Guarda la sesión en memoria y en el navegador */
  private guardar(token: string, usuaria: Usuaria): void {
    this.token.set(token);
    this.usuaria.set(usuaria);
    try {
      localStorage.setItem(CLAVE_TOKEN, token);
      localStorage.setItem(CLAVE_USUARIA, JSON.stringify(usuaria));
    } catch {
      // Si el navegador no deja guardar, la sesión dura solo mientras la pestaña esté abierta
    }
  }

  /** Crea una cuenta de cliente y deja la sesión abierta */
  registrarse(datos: Record<string, string>): Observable<{ token: string; usuaria: Usuaria }> {
    return this.http
      .post<{ token: string; usuaria: Usuaria }>(`${API_URL}/cuentas/registro/`, datos)
      .pipe(tap((respuesta) => this.guardar(respuesta.token, respuesta.usuaria)));
  }

  /** Cierra la sesión en el servidor y en el navegador */
  cerrarSesion(): void {
    if (this.token()) {
      // Avisamos al backend para que invalide el token (si falla no importa)
      this.http.post(`${API_URL}/cuentas/logout/`, {}).subscribe({ error: () => {} });
    }
    this.limpiar();
  }

  /** Borra la sesión local y vuelve al login (se usa también si el token venció) */
  limpiar(): void {
    this.token.set(null);
    this.usuaria.set(null);
    try {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIA);
    } catch {
      // Nada que hacer
    }
    this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
