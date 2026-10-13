import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { sesionInterceptor } from './servicios/sesion.interceptor';

/** Configuración general de la aplicación Angular */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Ionic con estilo "md" (Material) para que se vea igual en todos los equipos
    provideIonicAngular({ mode: 'md' }),
    // Rutas; withComponentInputBinding permite recibir el :id de la URL como @Input
    provideRouter(routes, withComponentInputBinding()),
    // Peticiones HTTP con el token de sesión agregado automáticamente
    provideHttpClient(withInterceptors([sesionInterceptor])),
    // Fechas en español de Colombia y moneda en pesos colombianos
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'COP' },
  ],
};
