import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  briefcaseOutline,
  businessOutline,
  calendarOutline,
  callOutline,
  cashOutline,
  checkmarkCircle,
  closeOutline,
  createOutline,
  documentTextOutline,
  ellipseOutline,
  eyeOffOutline,
  eyeOutline,
  folderOpenOutline,
  gridOutline,
  homeOutline,
  locationOutline,
  lockClosedOutline,
  logOutOutline,
  mailOutline,
  personOutline,
  peopleOutline,
  sendOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';

/**
 * Componente raíz. Solo contiene el contenedor de Ionic y el router.
 * Aquí registramos una sola vez todos los íconos que usa la aplicación.
 */
@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet />
    </ion-app>
  `,
})
export class App {
  constructor() {
    addIcons({
      addOutline,
      arrowBackOutline,
      briefcaseOutline,
      businessOutline,
      calendarOutline,
      callOutline,
      cashOutline,
      checkmarkCircle,
      closeOutline,
      createOutline,
      documentTextOutline,
      ellipseOutline,
      eyeOffOutline,
      eyeOutline,
      folderOpenOutline,
      gridOutline,
      homeOutline,
      locationOutline,
      lockClosedOutline,
      logOutOutline,
      mailOutline,
      personOutline,
      peopleOutline,
      sendOutline,
      timeOutline,
      trashOutline,
    });
  }
}
