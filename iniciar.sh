#!/usr/bin/env bash
# =============================================================
#  Arranca el sistema de las abogadas: backend (Django) + frontend (Angular/Ionic)
#  Uso:   ./iniciar.sh
#  Para apagar todo: Ctrl + C
# =============================================================

# Carpeta donde está este archivo (la raíz del proyecto)
RAIZ="$(cd "$(dirname "$0")" && pwd)"

echo "== Preparando backend (Python / Django) =="
cd "$RAIZ/backend" || exit 1

# Crea el entorno virtual e instala librerías solo si no existe
if [ ! -d venv ]; then
  python3 -m venv venv
  ./venv/bin/pip install -r requirements.txt
fi

# Crea o actualiza las tablas en abogadas_db y las dos usuarias
./venv/bin/python manage.py migrate
./venv/bin/python manage.py crear_abogadas

echo "== Preparando frontend (Angular / Ionic) =="
cd "$RAIZ/frontend" || exit 1

# Instala dependencias solo la primera vez
if [ ! -d node_modules ]; then
  npm install
fi

# Al presionar Ctrl + C se apagan los dos servidores
trap 'echo; echo "Apagando..."; kill 0' INT TERM

echo "== Encendiendo servidores =="
(cd "$RAIZ/backend" && ./venv/bin/python manage.py runserver 0.0.0.0:8000) &
(cd "$RAIZ/frontend" && npx ng serve --host 0.0.0.0 --port 4200) &

echo ""
echo "  Abre en el navegador:  http://localhost:4200"
echo "  (Para apagar: Ctrl + C)"
echo ""

# Espera mientras los servidores estén encendidos
wait
