import os
from .base import *

def environ_list(key: str, default=""):
  return [
    item.strip() for item in filter(None, os.environ.get(key, default).split(","))
  ]

# base.py already reads these from env, but we enforce them here as a safeguard
DEBUG = False

ALLOWED_HOSTS = environ_list("ALLOWED_HOSTS")

# Force secure cookies in production
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

S3_STORAGE_BACKEND = False

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}

REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # inherit base settings
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",  # JSON only, no browser UI
    ],
}