import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { SesionService } from './sesion.service';

/**
 * Interceptor: a cada petición a la API le agrega el token de sesión.
 * Si el servidor responde 401 (token inválido o vencido), cierra la sesión.
 */
export const sesionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  const token = sesion.token();

  // El login no necesita token
  const conToken =
    token && !peticion.url.endsWith('/cuentas/login/')
      ? peticion.clone({ setHeaders: { Authorization: `Token ${token}` } })
      : peticion;

  return siguiente(conToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        sesion.limpiar();
      }
      return throwError(() => error);
    }),
  );
};
