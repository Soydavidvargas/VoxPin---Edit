"""
Votality SIG - Django Channels WebSocket Consumer
Broadcasts new pins streamed from Kafka directly into the Leaflet Map in real time.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class SurveyPinConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint: ws://<host>/ws/campaign/<campaign_id>/pins/
    """
    async def connect(self):
        self.campaign_id = self.scope['url_route']['kwargs']['campaign_id']
        self.room_group_name = f"campaign_{self.campaign_id}"

        # Unirse al grupo de difusión de la campaña
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Enviar confirmación de suscripción al cliente Leaflet
        await self.send(text_data=json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "message": f"Conectado a stream reactivo de la campaña {self.campaign_id}",
            "topic": "votality-pines"
        }))

    async def disconnect(self, close_code):
        # Abandonar el grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Manejo de mensajes bidireccionales si se requiere ping / heartbeat desde el mapa.
        """
        try:
            data = json.loads(text_data)
            if data.get('action') == 'ping':
                await self.send(text_data=json.dumps({"action": "pong"}))
        except Exception:
            pass

    async def survey_pin_broadcast(self, event):
        """
        Manejador invocado por channel_layer.group_send.
        Envía el pin en formato GeoJSON / JSON listo para pintar en Leaflet.
        """
        payload = event['payload']
        await self.send(text_data=json.dumps({
            "type": "NEW_PIN_EVENT",
            "data": payload
        }))

