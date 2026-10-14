# abogadas

Sistema de gestión para el despacho de abogadas **Eli & Kathe**.

- **Backend:** Python + Django + Django REST Framework (carpeta `backend/`)
- **Frontend:** Angular + Ionic (carpeta `frontend/`)
- **Base de datos:** PostgreSQL, base `abogadas_db` (independiente de `tecnologo_ph`)

## Qué tiene

### Página pública (sin iniciar sesión)
- Header, portada, sección "Cómo funciona", tarjetas de **Elizabeth Imbachi** y **Katherine Rojas**
  (con sus ramas, solo si las agregaron) y footer.
- **Agenda tu consulta:** el visitante elige abogada (y rama) y envía una solicitud. Al enviarla
  puede mandar la misma consulta al **WhatsApp** de la abogada elegida (Elizabeth: +57 320 7285053,
  Katherine: +57 313 3957573). Cada tarjeta también tiene el botón "Escribir por WhatsApp".

### Iniciar sesión / Crear cuenta / Recuperar contraseña
- Abogadas: usuarios `eli` y `kathe` → panel de administración.
- Clientes: usuario = número de documento → portal de clientes.
- Crear cuenta: para clientes. Recuperar contraseña: código de 6 dígitos al correo.

### Portal de clientes
- Próxima cita destacada, todas sus citas (fecha, hora, lugar con **mapa**), sus casos con el historial
  y el contacto de su abogada (incluye WhatsApp). Las actuaciones marcadas como "internas" no se muestran.
- **Documentos:** ve los PDF/Word que comparte su abogada y sube los suyos (máx. 10 MB).

### Panel de las abogadas
- **Inicio:** resumen con números, próximas citas y accesos rápidos.
- **Clientes:** registrar, buscar, editar y borrar.
- **Casos:** filtrar por estado, buscar, ficha con datos, honorarios e historial de actuaciones.
- **Agenda:** reuniones, audiencias y vencimientos agrupados por día; se marcan como completadas.
  Cada cita muestra su ubicación y el botón **Mapa** (si una reunión no tiene lugar escrito, se usa
  la dirección del cliente).
- **Documentos** (en la ficha del caso): subir PDF o Word, descargarlos, ocultarlos al cliente o borrarlos.
  En Inicio aparece un aviso cuando un cliente sube documentos.
- **Solicitudes:** consultas que llegan desde la página pública (para mí / todas).
- **Mi perfil:** presentación, contacto (teléfono, WhatsApp, correo) y ramas del derecho (opcionales) + información del despacho.
- En la ficha de cada cliente: **Dar acceso al portal** (genera la contraseña).

## Protección de datos (Ley 1581 de 2012)

- **Mi perfil → Protección de datos:** las abogadas llenan los datos que exige la ley (responsable,
  identificación, ciudad, quién atiende las peticiones, correo, fecha de vigencia, conservación, costo de
  la consulta). Con eso se arma sola la página pública **/privacidad** (política + términos y aviso legal).
- **Autorización obligatoria** (casilla) al enviar una consulta y al crear cuenta, dirigida a una abogada.
  Se guarda como prueba: fecha, versión de la política, IP y si incluye datos sensibles.
- **Portal del cliente → Protección de datos:** ve a quién autorizó, descarga sus datos y pide
  conocer / corregir / borrar / revocar. Solo lo ven el cliente y la abogada que autorizó.
- **Panel → Protección de datos:** cada abogada ve solo sus peticiones (con fecha límite: 10 días hábiles
  consultas, 15 reclamos) y sus autorizaciones; puede borrar solicitudes vencidas.
- **Ubicación de la consulta:** al abrir "Agenda tu consulta" el navegador pregunta si se comparte la
  ubicación (opcional). En **Solicitudes** aparece **Ver ubicación** con el mapa. Solo funciona con
  **https** o en `localhost` (los navegadores no entregan la ubicación en `http://IP...`).
- **Manual de usuario:** `Manual_de_usuario.pdf` en la raíz y descargable desde el pie de página
  (`frontend/public/manual-usuario.pdf`).
- Ciudad de cada abogada (Elizabeth: Pitalito; Katherine: Neiva): Mi perfil → Mi trayectoria.
- Borrar solicitudes vencidas de todas: `./venv/bin/python manage.py depurar_solicitudes` (se puede poner en cron).

## Documentos subidos

Se guardan en `backend/media/documentos/caso_<id>/` (no se sube a GitHub). No son públicos: solo se
descargan por la API, que revisa que sea una abogada o el cliente dueño del caso.

## Correo para recuperar contraseña

En el `.env` llenar `EMAIL_HOST_USER` (correo Gmail del despacho) y `EMAIL_HOST_PASSWORD`
(contraseña de aplicación de Gmail). Si están vacíos, el código se muestra en la terminal del backend.

## Configuración (`.env`)

En la carpeta raíz hay un archivo `.env` (no se sube a GitHub) con los datos de la base de
datos, la llave secreta de Django y el usuario y contraseña de cada abogada.

## Cómo arrancarlo

### 1. Backend (terminal 1)

```bash
cd backend
python3 -m venv venv                 # solo la primera vez
./venv/bin/pip install -r requirements.txt   # solo la primera vez
./venv/bin/python manage.py migrate          # crea/actualiza las tablas en abogadas_db
./venv/bin/python manage.py crear_abogadas   # crea las 2 usuarias (o actualiza su contraseña)
./venv/bin/python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install                          # solo la primera vez
ng serve --host 0.0.0.0
```

O todo junto con un solo comando desde la carpeta raíz: `./iniciar.sh`

Abrir en el navegador: <http://localhost:4200>
(desde un celular en la misma red: `http://IP-DEL-COMPUTADOR:4200`).

## Cambiar la contraseña de una abogada

Editar `ABOGADA1_PASSWORD` o `ABOGADA2_PASSWORD` en el `.env` y ejecutar:

```bash
cd backend && ./venv/bin/python manage.py crear_abogadas
```

## Panel de administración de Django

<http://localhost:8000/admin/> — se entra con las mismas cuentas.
