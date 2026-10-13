import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Resumen } from './modelos';

/**
 * Dirección del backend de Django.
 * Usamos el mismo nombre de equipo/IP con el que se abrió la página, pero en el
 * puerto 8000. Así funciona tanto en el computador (localhost) como desde un
 * celular en la misma red (ej: 192.168.1.20).
 */
export const API_URL = `${location.protocol}//${location.hostname}:8000/api`;

/** Recursos (tablas) que expone la API */
export type Recurso = 'clientes' | 'casos' | 'actuaciones' | 'citas' | 'ramas' | 'solicitudes';

/**
 * Servicio genérico para hablar con la API: listar, crear, editar y borrar.
 * El token de sesión lo agrega automáticamente el interceptor (sesion.interceptor.ts).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  listar<T>(recurso: Recurso, filtros: Record<string, string | number> = {}): Observable<T[]> {
    // Solo enviamos los filtros que tienen valor
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== '' && valor !== null && valor !== undefined) {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<T[]>(`${API_URL}/${recurso}/`, { params });
  }

  obtener<T>(recurso: Recurso, id: number): Observable<T> {
    return this.http.get<T>(`${API_URL}/${recurso}/${id}/`);
  }

  crear<T>(recurso: Recurso, datos: Partial<T>): Observable<T> {
    return this.http.post<T>(`${API_URL}/${recurso}/`, datos);
  }

  actualizar<T>(recurso: Recurso, id: number, datos: Partial<T>): Observable<T> {
    // PATCH: solo cambia los campos enviados
    return this.http.patch<T>(`${API_URL}/${recurso}/${id}/`, datos);
  }

  borrar(recurso: Recurso, id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${recurso}/${id}/`);
  }

  /** Números de la pantalla de inicio */
  resumen(): Observable<Resumen> {
    return this.http.get<Resumen>(`${API_URL}/resumen/`);
  }

  /** Rutas especiales que no son tablas: perfil/, despacho/, publico/, portal/casos/... */
  get<T>(ruta: string): Observable<T> {
    return this.http.get<T>(`${API_URL}/${ruta}`);
  }

  post<T>(ruta: string, datos: unknown): Observable<T> {
    return this.http.post<T>(`${API_URL}/${ruta}`, datos);
  }

  patch<T>(ruta: string, datos: unknown): Observable<T> {
    return this.http.patch<T>(`${API_URL}/${ruta}`, datos);
  }

  delete<T>(ruta: string): Observable<T> {
    return this.http.delete<T>(`${API_URL}/${ruta}`);
  }
}
