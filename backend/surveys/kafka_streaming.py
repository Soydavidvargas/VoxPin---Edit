"""
Votality SIG - Apache Kafka Producer & Consumer Bridge
Topic: votality-pines
Connects Kafka Event Stream with Django Channels WebSockets for Real-time Leaflet Pin Rendering.
"""

import json
import logging
import threading
from typing import Optional
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

KAFKA_TOPIC_PINES = 'votality-pines'
KAFKA_BOOTSTRAP_SERVERS = ['localhost:9092']


class VotalityKafkaProducer:
    """
    Kafka Producer for georeferenced survey pins.
    Supports real Kafka cluster or graceful local buffer fallback.
    """
    def __init__(self):
        self._producer = None
        try:
            from kafka import KafkaProducer
            self._producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k if isinstance(k, bytes) else str(k).encode('utf-8'),
                acks='all',
                retries=3
            )
            logger.info("Kafka Producer conectado exitosamente a %s", KAFKA_BOOTSTRAP_SERVERS)
        except Exception as e:
            logger.warning(
                "Kafka Broker no detectado localmente (%s). Operando en modo puente de memoria directo para WebSockets.",
                str(e)
            )

    def send(self, topic: str, key: bytes, value: dict):
        if self._producer:
            self._producer.send(topic, key=key, value=value)
            self._producer.flush()
        else:
            # Fallback en desarrollo: Despacha directamente a Django Channels
            broadcast_to_channels(value)


_producer_instance: Optional[VotalityKafkaProducer] = None


def get_kafka_producer() -> VotalityKafkaProducer:
    global _producer_instance
    if _producer_instance is None:
        _producer_instance = VotalityKafkaProducer()
    return _producer_instance


def broadcast_to_channels(pin_event: dict):
    """
    Retransmite el evento del pin hacia el mapa Leaflet de los clientes conectados vía WebSocket.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.debug("Canal de Channels no inicializado aún.")
        return

    campaign_id = pin_event.get('campaign_id')
    group_name = f"campaign_{campaign_id}"

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "survey_pin_broadcast",
            "payload": pin_event
        }
    )


def start_kafka_consumer_worker():
    """
    Worker en segundo plano para consumir del topic 'votality-pines'
    y retransmitir a WebSockets.
    """
    def _run():
        try:
            from kafka import KafkaConsumer
            consumer = KafkaConsumer(
                KAFKA_TOPIC_PINES,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                auto_offset_reset='latest',
                enable_auto_commit=True,
                group_id='votality-map-consumers',
                value_deserializer=lambda m: json.loads(m.decode('utf-8'))
            )
            logger.info("Kafka Consumer iniciado en topic '%s'", KAFKA_TOPIC_PINES)
            for message in consumer:
                pin_event = message.value
                broadcast_to_channels(pin_event)
        except Exception as e:
            logger.warning("Worker Kafka Consumer en reposo: %s", str(e))

    thread = threading.Thread(target=_run, daemon=True, name="KafkaConsumerWorker")
    thread.start()

