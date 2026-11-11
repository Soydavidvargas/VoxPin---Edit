from django.apps import AppConfig


class SurveysConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'surveys'

    def ready(self):
        # Iniciar consumidor de Kafka en segundo plano
        from .kafka_streaming import start_kafka_consumer_worker
        start_kafka_consumer_worker()

