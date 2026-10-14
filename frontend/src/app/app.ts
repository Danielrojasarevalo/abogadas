import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  bookOutline,
  briefcaseOutline,
  businessOutline,
  calendarOutline,
  cardOutline,
  callOutline,
  cashOutline,
  checkmarkCircle,
  chevronDownOutline,
  closeOutline,
  cloudUploadOutline,
  createOutline,
  documentAttachOutline,
  documentTextOutline,
  downloadOutline,
  ellipseOutline,
  eyeOffOutline,
  eyeOutline,
  folderOpenOutline,
  gridOutline,
  homeOutline,
  locationOutline,
  lockClosedOutline,
  logOutOutline,
  logoWhatsapp,
  mailOutline,
  mapOutline,
  navigateOutline,
  peopleOutline,
  personOutline,
  sendOutline,
  shieldCheckmarkOutline,
  timeOutline,
  trashOutline,
  warningOutline,
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
      bookOutline,
      briefcaseOutline,
      businessOutline,
      calendarOutline,
      cardOutline,
      callOutline,
      cashOutline,
      checkmarkCircle,
      chevronDownOutline,
      closeOutline,
      cloudUploadOutline,
      createOutline,
      documentAttachOutline,
      documentTextOutline,
      downloadOutline,
      ellipseOutline,
      eyeOffOutline,
      eyeOutline,
      folderOpenOutline,
      gridOutline,
      homeOutline,
      locationOutline,
      lockClosedOutline,
      logOutOutline,
      logoWhatsapp,
      mailOutline,
      mapOutline,
      navigateOutline,
      peopleOutline,
      personOutline,
      sendOutline,
      shieldCheckmarkOutline,
      timeOutline,
      trashOutline,
      warningOutline,
    });
  }
}
