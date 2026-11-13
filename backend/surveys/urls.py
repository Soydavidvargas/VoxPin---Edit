from django.urls import path
from .views import (
    SurveyCreateAPIView,
    InterviewerDeleteAPIView,
    CensusCoverageAPIView,
    GeoSearchAPIView,
    GeoSuggestAPIView,
    GeoReverseAPIView,
    InvitacionVerificarAPIView,
    InvitacionCompletarAPIView,
    InvitacionCampanaAPIView,
    SolicitarCodigoSMSAPIView,
    VerificarCodigoSMSAPIView,
    RegistroUsuarioAPIView,
    LoginUsuarioAPIView,
    DefinirProyectoAPIView,
    EncuestadorSessionAPIView,
    CampanaInvitarAPIView,
    CampanaUnirseAPIView,
    CampanaEntrevistadoresAPIView,
    CampanaEliminarEntrevistadorAPIView,
    SolicitarRecuperacionEmailAPIView,
    VerificarRecuperacionEmailAPIView,
    RestablecerPasswordEmailAPIView,
    UpgradePlanAPIView,
)

urlpatterns = [
    # Rutina de Migración de Cuenta: Plan Free -> Campaña de Pago
    path('api/v1/campana/upgrade/', UpgradePlanAPIView.as_view(), name='campana-upgrade-v1'),
    path('api/campana/upgrade/', UpgradePlanAPIView.as_view(), name='campana-upgrade'),

    # Recuperación de Contraseña vía Correo Electrónico (SMTP)
    path('api/v1/auth/password/solicitar/', SolicitarRecuperacionEmailAPIView.as_view(), name='auth-password-solicitar-v1'),
    path('api/auth/password/solicitar/', SolicitarRecuperacionEmailAPIView.as_view(), name='auth-password-solicitar'),
    path('api/v1/auth/password/verificar/', VerificarRecuperacionEmailAPIView.as_view(), name='auth-password-verificar-v1'),
    path('api/auth/password/verificar/', VerificarRecuperacionEmailAPIView.as_view(), name='auth-password-verificar'),
    path('api/v1/auth/password/restablecer/', RestablecerPasswordEmailAPIView.as_view(), name='auth-password-restablecer-v1'),
    path('api/auth/password/restablecer/', RestablecerPasswordEmailAPIView.as_view(), name='auth-password-restablecer'),
    # Gestión Simplificada de Entrevistadores (Activos y Enlaces en Espera)
    path('api/v1/campana/<str:campana_id>/entrevistadores/', CampanaEntrevistadoresAPIView.as_view(), name='campana-entrevistadores-id-v1'),
    path('api/v1/campana/entrevistadores/', CampanaEntrevistadoresAPIView.as_view(), name='campana-entrevistadores-v1'),
    path('api/campana/<str:campana_id>/entrevistadores/', CampanaEntrevistadoresAPIView.as_view(), name='campana-entrevistadores-id'),
    path('api/campana/entrevistadores/', CampanaEntrevistadoresAPIView.as_view(), name='campana-entrevistadores'),
    path('api/v1/campana/entrevistador/<str:encuestador_id>/', CampanaEliminarEntrevistadorAPIView.as_view(), name='campana-eliminar-entrevistador-v1'),
    path('api/campana/entrevistador/<str:encuestador_id>/', CampanaEliminarEntrevistadorAPIView.as_view(), name='campana-eliminar-entrevistador'),

    # Validación de Cupos Máximos y Generación Universal de Enlaces de Invitación
    path('api/v1/campana/invitar/', CampanaInvitarAPIView.as_view(), name='campana-invitar-v1'),
    path('api/campana/invitar/', CampanaInvitarAPIView.as_view(), name='campana-invitar'),

    # Consumo Atómico de Invitación y Registro de Entrevistador
    path('api/v1/campana/unirse/', CampanaUnirseAPIView.as_view(), name='campana-unirse-v1'),
    path('api/campana/unirse/', CampanaUnirseAPIView.as_view(), name='campana-unirse'),
    # Sesión y Contexto del Encuestador (Nombre del Proyecto del Administrador)
    path('api/v1/encuestador/session/', EncuestadorSessionAPIView.as_view(), name='encuestador-session-v1'),
    path('api/encuestador/session/', EncuestadorSessionAPIView.as_view(), name='encuestador-session'),

    # Definir Nombre de Proyecto de Investigación (Obligatorio antes del Mapa)
    path('api/v1/proyecto/definir/', DefinirProyectoAPIView.as_view(), name='definir-proyecto-v1'),
    path('api/proyecto/definir/', DefinirProyectoAPIView.as_view(), name='definir-proyecto'),

    # Registro e Inicio de Sesión Tradicional
    path('api/v1/auth/registro/', RegistroUsuarioAPIView.as_view(), name='auth-registro-v1'),
    path('api/auth/registro/', RegistroUsuarioAPIView.as_view(), name='auth-registro'),
    path('api/v1/auth/login/', LoginUsuarioAPIView.as_view(), name='auth-login-v1'),
    path('api/auth/login/', LoginUsuarioAPIView.as_view(), name='auth-login'),

    # Autenticación por Código SMS (OTP de 6 dígitos)
    path('api/v1/auth/sms/solicitar/', SolicitarCodigoSMSAPIView.as_view(), name='sms-solicitar-v1'),
    path('api/auth/sms/solicitar/', SolicitarCodigoSMSAPIView.as_view(), name='sms-solicitar'),
    path('api/v1/auth/sms/verificar/', VerificarCodigoSMSAPIView.as_view(), name='sms-verificar-v1'),
    path('api/auth/sms/verificar/', VerificarCodigoSMSAPIView.as_view(), name='sms-verificar'),

    # Control de Enlaces de Invitación de Un Solo Uso (Single-Use Tokens)
    path('api/v1/invitacion/verificar/<str:token>/', InvitacionVerificarAPIView.as_view(), name='invitacion-verificar-v1'),
    path('api/invitacion/verificar/<str:token>/', InvitacionVerificarAPIView.as_view(), name='invitacion-verificar'),
    path('api/v1/invitacion/completar/<str:token>/', InvitacionCompletarAPIView.as_view(), name='invitacion-completar-v1'),
    path('api/invitacion/completar/<str:token>/', InvitacionCompletarAPIView.as_view(), name='invitacion-completar'),
    path('api/v1/invitaciones/', InvitacionCampanaAPIView.as_view(), name='invitaciones-campana-v1'),
    path('api/invitaciones/', InvitacionCampanaAPIView.as_view(), name='invitaciones-campana'),
    path('api/v1/campanas/<uuid:campana_id>/invitaciones/', InvitacionCampanaAPIView.as_view(), name='invitaciones-campana-id-v1'),
    # Geocodificación Inversa PostGIS (Coordenadas GPS -> Dirección, Barrio, Municipio)
    path('api/v1/geosearch/reverse/', GeoReverseAPIView.as_view(), name='geosearch-reverse-v1'),
    path('api/geosearch/reverse/', GeoReverseAPIView.as_view(), name='geosearch-reverse'),

    # Autocompletado predictivo ligero tipo Google (<30ms)
    path('api/v1/geosearch/suggest/', GeoSuggestAPIView.as_view(), name='geosearch-suggest'),
    path('api/geosearch/suggest/', GeoSuggestAPIView.as_view(), name='geosearch-suggest-short'),

    # Búsqueda territorial jerárquica PostGIS (Departamento -> Municipio -> Dirección)
    path('api/v1/geosearch/', GeoSearchAPIView.as_view(), name='geosearch-v1'),
    path('api/geosearch/', GeoSearchAPIView.as_view(), name='geosearch'),

    # Ingesta inmutable de encuestas con Kafka streaming
    path('api/surveys/', SurveyCreateAPIView.as_view(), name='survey-create'),

    # Baja inmediata y revocación de encuestador (liberación de cupo)
    path('api/interviewers/<uuid:interviewer_id>/', InterviewerDeleteAPIView.as_view(), name='interviewer-delete'),

    # Analítica de tasa de cobertura poblacional censal
    path('api/census/coverage/<str:sector_id>/', CensusCoverageAPIView.as_view(), name='census-coverage'),
]

