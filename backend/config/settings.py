"""
Configuración principal del backend del despacho de abogadas.

Las contraseñas y datos sensibles NO se escriben aquí: se leen del archivo
.env que está en la carpeta raíz del proyecto (derecho_eli_kathe/.env).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Carpeta del backend (donde está manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

# Cargamos las variables del archivo .env de la carpeta raíz del proyecto
load_dotenv(BASE_DIR.parent / ".env")

# Llave secreta de Django (viene del .env)
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

# Modo desarrollo: muestra errores detallados. En producción poner False en el .env
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"

# Aceptamos peticiones desde cualquier IP de la red local (para ng serve --host 0.0.0.0)
ALLOWED_HOSTS = ["*"]


# Aplicaciones instaladas
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Librerías externas
    "rest_framework",
    "rest_framework.authtoken",  # Tokens para iniciar sesión desde Angular
    "corsheaders",  # Permite que el frontend (otro puerto) hable con la API
    # Nuestras aplicaciones
    "cuentas",  # Inicio de sesión de las abogadas
    "despacho",  # Clientes, casos, citas y actuaciones
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Debe ir lo más arriba posible
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Base de datos: SOLO abogadas_db (no se toca tecnologo_ph ni ninguna otra)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "abogadas_db"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}


# Reglas para las contraseñas
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Idioma y zona horaria de Colombia
LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True


# Archivos estáticos (CSS del panel de administración de Django)
STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Configuración de la API (Django REST Framework)
REST_FRAMEWORK = {
    # Cada petición debe traer el token: "Authorization: Token <token>"
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    # Solo las administradoras (las dos abogadas) pueden usar la API
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAdminUser",
    ],
}

# CORS: dejamos entrar al frontend desde cualquier origen mientras estamos en desarrollo
CORS_ALLOW_ALL_ORIGINS = DEBUG


# ---------- Correo (para enviar el código de recuperar contraseña) ----------
# Si en el .env están EMAIL_HOST_USER y EMAIL_HOST_PASSWORD (contraseña de aplicación
# de Gmail), los correos se envían de verdad. Si no, el correo se muestra en la
# terminal del backend (útil para probar).
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_USE_TLS = True
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER or "no-responder@abogadas.local"
