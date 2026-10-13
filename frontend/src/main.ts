import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

// Registramos el español de Colombia para mostrar fechas y pesos ($) correctamente
registerLocaleData(localeEsCo, 'es-CO');

// Arranca la aplicación
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
