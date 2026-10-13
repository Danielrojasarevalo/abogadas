import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SesionService } from './sesion.service';

/** Panel de administración: solo las abogadas */
export const abogadaGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (sesion.rol() === 'abogada') return true;
  // Un cliente que intente entrar al panel vuelve a su portal
  return router.parseUrl(sesion.rol() === 'cliente' ? '/portal' : '/login');
};

/** Portal de clientes: solo clientes con acceso */
export const clienteGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (sesion.rol() === 'cliente') return true;
  return router.parseUrl(sesion.rol() === 'abogada' ? '/panel/inicio' : '/login');
};

/** Si ya hay sesión abierta, no muestra el login: manda a su página */
export const sinSesionGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.conectada() ? inject(Router).parseUrl(sesion.paginaInicial()) : true;
};
