"""
ASGI config for Votality SIG project.
Routes HTTP and WebSocket connections to Django Channels.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from surveys.consumers import SurveyPinConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'votality_core.settings')

django_asgi_app = get_asgi_application()

websocket_urlpatterns = [
    path('ws/campaign/<uuid:campaign_id>/pins/', SurveyPinConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})

