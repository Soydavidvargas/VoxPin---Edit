"""
Votality SIG - Django Core Settings
Configured for GeoDjango, PostGIS, Django Channels & Kafka
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'votality-sig-insecure-secret-key-change-in-production-2026')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'daphne',  # ASGI WebSocket Handler
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # GeoDjango & PostgreSQL
    'django.contrib.gis',
    'django.contrib.postgres',
    # Third-party
    'rest_framework',
    'rest_framework_gis',
    'channels',
    'corsheaders',
    # Local Apps
    'surveys.apps.SurveysConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'votality_core.urls'
WSGI_APPLICATION = 'votality_core.wsgi.application'
ASGI_APPLICATION = 'votality_core.asgi.application'

AUTH_USER_MODEL = 'surveys.Usuario'

# PostGIS Database Connection
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.getenv('POSTGIS_DB', 'votality_db'),
        'USER': os.getenv('POSTGIS_USER', 'votality_admin'),
        'PASSWORD': os.getenv('POSTGIS_PASSWORD', 'votality_secure_pass'),
        'HOST': os.getenv('POSTGIS_HOST', 'localhost'),
        'PORT': os.getenv('POSTGIS_PORT', '5432'),
    }
}

# Django Channels (Redis or In-Memory Layer)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
        # En producción: 'channels_redis.core.RedisChannelLayer' con 'hosts': [('localhost', 6379)]
    },
}

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
}

# Configuración de Correo: Alternar fácilmente entre envío real SMTP y modo consola
EMAIL_BACKEND_CHOICE = os.getenv('EMAIL_BACKEND', os.getenv('DJANGO_EMAIL_BACKEND', 'smtp')).lower()
if EMAIL_BACKEND_CHOICE in ['console', 'django.core.mail.backends.console.emailbackend']:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_HOST = os.getenv('EMAIL_HOST', os.getenv('SMTP_HOST', 'smtp.gmail.com'))
EMAIL_PORT = int(os.getenv('EMAIL_PORT', os.getenv('SMTP_PORT', '465')))
EMAIL_USE_SSL = os.getenv('SMTP_SECURE', 'true').lower() == 'true' or EMAIL_PORT == 465
EMAIL_USE_TLS = not EMAIL_USE_SSL and os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', os.getenv('SMTP_USER', 'willianstebangonzalezcortes@gmail.com'))
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', os.environ.get('SMTP_PASS', ''))
DEFAULT_FROM_EMAIL = os.getenv('SMTP_FROM', f'Votality <{EMAIL_HOST_USER}>')

# Autenticación Nativa y Hasheo Seguro (Sin proveedores externos / OAuth)
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

CORS_ALLOW_ALL_ORIGINS = True
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

