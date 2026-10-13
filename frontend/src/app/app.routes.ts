import { Routes } from '@angular/router';

import { abogadaGuard, clienteGuard, sinSesionGuard } from './servicios/guardias';

/**
 * Rutas de la aplicación.
 * - /          Página pública: presentación del despacho y de las abogadas.
 * - /login     Inicio de sesión (abogadas y clientes).
 * - /portal    Portal del cliente: ve cómo va su proceso.
 * - /panel/... Panel de administración de las abogadas (menú lateral).
 * Las páginas se cargan bajo demanda (loadComponent) para que la app abra más rápido.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./paginas/publico/publico').then((m) => m.PublicoPagina),
  },
  {
    path: 'login',
    canActivate: [sinSesionGuard],
    loadComponent: () => import('./paginas/login/login').then((m) => m.LoginPagina),
  },
  {
    path: 'portal',
    canActivate: [clienteGuard],
    loadComponent: () => import('./paginas/portal/portal').then((m) => m.PortalPagina),
  },
  {
    path: 'panel',
    canActivate: [abogadaGuard],
    loadComponent: () => import('./paginas/marco/marco').then((m) => m.MarcoPagina),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', loadComponent: () => import('./paginas/inicio/inicio').then((m) => m.InicioPagina) },
      { path: 'clientes', loadComponent: () => import('./paginas/clientes/clientes').then((m) => m.ClientesPagina) },
      { path: 'casos', loadComponent: () => import('./paginas/casos/casos').then((m) => m.CasosPagina) },
      {
        path: 'casos/:id',
        loadComponent: () => import('./paginas/caso-detalle/caso-detalle').then((m) => m.CasoDetallePagina),
      },
      { path: 'agenda', loadComponent: () => import('./paginas/agenda/agenda').then((m) => m.AgendaPagina) },
      {
        path: 'solicitudes',
        loadComponent: () => import('./paginas/solicitudes/solicitudes').then((m) => m.SolicitudesPagina),
      },
      { path: 'perfil', loadComponent: () => import('./paginas/perfil/perfil').then((m) => m.PerfilPagina) },
    ],
  },
  // Cualquier otra dirección vuelve a la página pública
  { path: '**', redirectTo: '' },
];
