"""
Votality SIG - Django / GeoDjango Models
Arquitectura de Base de Datos Multi-Tenant por Alcance Territorial:
1. Usuario (AbstractUser con UUID, Roles y Sesión Única)
2. TipoPlan (Catálogo de Planes: Free, Comunal, Municipal, Departamental)
3. Campana (Entorno de Campaña con Delimitación y Perímetro Geográfico MultiPolygon)
4. AsignacionEncuestador (Relación y Control Estricto de Cuotas de Encuestadores)
5. Encuesta (Pines de Campo con Aislamiento Multi-Tenant, Inmutabilidad y PostGIS PointField)
6. Infraestructura de Geodatos Oficiales de Colombia (MGN DANE, IDECA, Malla Vial y Barrios)
"""

import uuid
import secrets
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


# ==============================================================================
# 1. USUARIO BASE DEL SISTEMA
# ==============================================================================

class Usuario(AbstractUser):
    ROLES = (
        ('SUPERADMIN', 'Super Administrador'),
        ('ADMIN_CAMPANA', 'Administrador de Campaña'),
        ('ENCUESTADOR', 'Encuestador de Campo'),
        ('USUARIO_FREE', 'Usuario Free'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rol = models.CharField(max_length=20, choices=ROLES, default='ENCUESTADOR', db_index=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    proyecto_nombre = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text=_("Nombre identificador del proyecto asignado por el usuario.")
    )
    active_session_token = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text=_("Token de sesión activa para control estricto de sesión única por dispositivo.")
    )

    class Meta:
        db_table = 'votality_usuarios'
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"

    def revoke_active_session(self):
        """Invalida inmediatamente la sesión y el token de acceso."""
        self.active_session_token = None
        self.save(update_fields=['active_session_token'])

    @property
    def es_superadmin(self) -> bool:
        return self.is_superuser or self.rol == 'SUPERADMIN'

    @property
    def es_admin_campana(self) -> bool:
        return self.rol == 'ADMIN_CAMPANA'

    @property
    def es_encuestador(self) -> bool:
        return self.rol == 'ENCUESTADOR'

    # Propiedades de compatibilidad con código existente
    @property
    def role(self):
        return self.rol

    @role.setter
    def role(self, value):
        self.rol = value

    @property
    def phone_number(self):
        return self.telefono

    @phone_number.setter
    def phone_number(self, value):
        self.telefono = value

    @property
    def assigned_campaign(self):
        asignacion = self.asignaciones.filter(activo=True).select_related('campana').first()
        return asignacion.campana if asignacion else None

    @assigned_campaign.setter
    def assigned_campaign(self, value):
        if value is None:
            self.asignaciones.filter(activo=True).update(activo=False)
        else:
            asignacion, created = AsignacionEncuestador.objects.get_or_create(
                encuestador=self,
                campana=value,
                defaults={'activo': True}
            )
            if not created and not asignacion.activo:
                asignacion.activo = True
                asignacion.save(update_fields=['activo'])

    @property
    def assigned_campaign_id(self):
        camp = self.assigned_campaign
        return camp.id if camp else None


# ==============================================================================
# 2. CATÁLOGO DE PLANES TERRITORIALES
# ==============================================================================

class TipoPlan(models.Model):
    ALCANCES = (
        ('FREE', 'Plan Gratuito / Prueba'),
        ('COMUNAL', 'Campaña Comunal / JAL'),
        ('MUNICIPAL', 'Alcaldía / Concejo Municipal'),
        ('DEPARTAMENTAL', 'Gobernación / Asamblea'),
    )
    codigo = models.CharField(max_length=20, choices=ALCANCES, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    limite_encuestadores = models.PositiveIntegerField(default=15)
    limite_encuestas = models.PositiveIntegerField(default=1000)

    class Meta:
        db_table = 'votality_tipos_planes'
        verbose_name = _('Tipo de Plan')
        verbose_name_plural = _('Tipos de Planes')

    def __str__(self):
        return f"{self.nombre} (Máx: {self.limite_encuestadores} encuestadores)"


# ==============================================================================
# 3. ENTORNO DE CAMPAÑA (PERFIL DEL CLIENTE)
# ==============================================================================

class Campana(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=150)  # Ej: "Campaña Comuna 2 - Cali" o "Alcaldía Campoalegre"
    tipo_plan = models.ForeignKey(TipoPlan, on_delete=models.PROTECT, related_name='campanas')
    administrador = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='campana_administrada')

    # Delimitación territorial asignada a la campaña
    departamento_id = models.IntegerField(null=True, blank=True)
    municipio_id = models.IntegerField(null=True, blank=True)
    comuna_localidad_id = models.IntegerField(null=True, blank=True)

    # Polígono geográfico que encierra el área contratada (para filtrar el mapa Leaflet)
    perimetro_geografico = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)

    activa = models.BooleanField(default=True)
    preguntas_formulario = models.JSONField(default=list, blank=True)
    creada_el = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'votality_campanas'
        verbose_name = _('Campaña')
        verbose_name_plural = _('Campañas')

    def __str__(self):
        return f"{self.nombre} - {self.tipo_plan.nombre}"

    @property
    def total_encuestadores_activos(self) -> int:
        return self.encuestadores.filter(activo=True).count()

    @property
    def limite_encuestadores(self) -> int:
        return self.tipo_plan.limite_encuestadores if self.tipo_plan else 0

    @property
    def puede_agregar_encuestador(self) -> bool:
        return self.total_encuestadores_activos < self.limite_encuestadores

    @property
    def total_encuestas(self) -> int:
        return self.encuestas.count()

    @property
    def limite_encuestas(self) -> int:
        return self.tipo_plan.limite_encuestas if self.tipo_plan else 0

    @property
    def puede_registrar_encuesta(self) -> bool:
        if not self.tipo_plan or not self.tipo_plan.limite_encuestas:
            return True
        return self.total_encuestas < self.tipo_plan.limite_encuestas

    # Propiedades de compatibilidad con servicios existentes
    @property
    def owner(self):
        return self.administrador

    @owner.setter
    def owner(self, value):
        self.administrador = value

    @property
    def title(self):
        return self.nombre

    @title.setter
    def title(self, value):
        self.nombre = value

    @property
    def plan_tier(self):
        return self.tipo_plan.codigo if self.tipo_plan else None

    @property
    def interviewers(self):
        return Usuario.objects.filter(asignaciones__campana=self, asignaciones__activo=True)

    def can_add_interviewer(self) -> bool:
        return self.puede_agregar_encuestador


# ==============================================================================
# 4. ASIGNACIÓN DE ENCUESTADORES A LA CAMPAÑA
# ==============================================================================

class AsignacionEncuestador(models.Model):
    encuestador = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='asignaciones')
    campana = models.ForeignKey(Campana, on_delete=models.CASCADE, related_name='encuestadores')
    activo = models.BooleanField(default=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'votality_asignaciones_encuestadores'
        verbose_name = _('Asignación de Encuestador')
        verbose_name_plural = _('Asignaciones de Encuestadores')
        unique_together = ('encuestador', 'campana')

    def clean(self):
        """
        Garantiza el cumplimiento estricto del límite máximo de encuestadores
        según el TipoPlan contratado por la campaña (Aislamiento de cuotas).
        """
        if self.activo and self.campana_id:
            qs = AsignacionEncuestador.objects.filter(campana=self.campana, activo=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)

            limite = self.campana.tipo_plan.limite_encuestadores if self.campana.tipo_plan else 0
            if qs.count() >= limite:
                raise ValidationError(
                    _(f"Límite de encuestadores excedido: La campaña '{self.campana.nombre}' solo permite un máximo de "
                      f"{limite} encuestadores activos en su plan '{self.campana.tipo_plan.nombre}'.")
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        estado = "Activo" if self.activo else "Inactivo"
        return f"{self.encuestador.username} -> {self.campana.nombre} ({estado})"


# ==============================================================================
# 4.1. INVITACIONES DE UN SOLO USO (SINGLE-USE TOKENS)
# ==============================================================================

class InvitacionEncuestador(models.Model):
    """
    Control de enlaces de invitación de un solo uso (Single-Use Tokens).
    Garantiza que cada token generado para encuestadores solo pueda ser consumido
    una única vez y se invalide permanentemente tras el registro.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=128, unique=True, default=uuid.uuid4, db_index=True)
    campana = models.ForeignKey(Campana, on_delete=models.CASCADE, related_name='invitaciones')
    creada_por = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='invitaciones_creadas')
    usada = models.BooleanField(default=False, db_index=True)
    usada_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invitacion_usada'
    )
    nombre_encuestador = models.CharField(max_length=200, blank=True, null=True)
    creada_el = models.DateTimeField(auto_now_add=True, db_index=True)
    usada_el = models.DateTimeField(null=True, blank=True)

    @property
    def fecha_uso(self):
        return self.usada_el

    @fecha_uso.setter
    def fecha_uso(self, value):
        self.usada_el = value

    class Meta:
        db_table = 'votality_invitaciones_encuestadores'
        verbose_name = _('Invitación de Encuestador')
        verbose_name_plural = _('Invitaciones de Encuestadores')
        ordering = ['-creada_el']

    def __str__(self):
        estado = f"Completado por {self.nombre_encuestador or (self.usada_por.username if self.usada_por else 'Encuestador')}" if self.usada else "Pendiente"
        return f"Invitación {self.token[:8]}... ({self.campana.nombre}) - {estado}"

    @property
    def estado(self) -> str:
        if self.usada:
            nombre = self.nombre_encuestador or (self.usada_por.username if self.usada_por else "Encuestador")
            return f"Completado por {nombre}"
        return "Pendiente"


# ==============================================================================
# 4.2. CÓDIGOS SMS OTP PARA REGISTRO E INICIO DE SESIÓN
# ==============================================================================

class CodigoSMS(models.Model):
    MOTIVOS = (
        ('REGISTRO', 'Registro de Cuenta'),
        ('LOGIN', 'Inicio de Sesión'),
        ('RECUPERACION', 'Recuperación de Contraseña'),
    )
    telefono = models.CharField(max_length=20, db_index=True)
    codigo = models.CharField(max_length=6)
    motivo = models.CharField(max_length=20, choices=MOTIVOS)
    creado_el = models.DateTimeField(auto_now_add=True)
    expira_el = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = 'votality_codigos_sms'
        verbose_name = _('Código SMS OTP')
        verbose_name_plural = _('Códigos SMS OTP')
        ordering = ['-creado_el']

    def __str__(self):
        estado = "Usado" if self.usado else ("Expirado" if self.ha_expirado else "Activo")
        return f"OTP {self.codigo} ({self.telefono} - {self.get_motivo_display()}) [{estado}]"

    @property
    def ha_expirado(self) -> bool:
        return timezone.now() > self.expira_el

    @classmethod
    def generar_codigo(cls, telefono, motivo):
        # Código numérico de 6 dígitos
        codigo = f"{secrets.randbelow(900000) + 100000}"
        expiracion = timezone.now() + timedelta(minutes=5)
        # Invalidar códigos anteriores no usados para ese teléfono y motivo
        cls.objects.filter(telefono=telefono, motivo=motivo, usado=False).update(usado=True)
        return cls.objects.create(
            telefono=telefono,
            codigo=codigo,
            motivo=motivo,
            expira_el=expiracion
        )


class CodigoEmail(models.Model):
    """
    Gestiona códigos OTP temporales de 6 dígitos enviados por correo electrónico (SMTP).
    Utilizado principalmente para la recuperación de contraseñas.
    """
    MOTIVOS = (
        ('RECUPERACION', 'Recuperación de Contraseña'),
        ('REGISTRO', 'Registro de Cuenta'),
        ('LOGIN', 'Inicio de Sesión'),
    )
    email = models.EmailField(db_index=True)
    codigo = models.CharField(max_length=6)
    motivo = models.CharField(max_length=20, choices=MOTIVOS, default='RECUPERACION')
    creado_el = models.DateTimeField(auto_now_add=True)
    expira_el = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = 'votality_codigos_email'
        verbose_name = _('Código OTP por Email')
        verbose_name_plural = _('Códigos OTP por Email')
        ordering = ['-creado_el']

    def __str__(self):
        estado = "Usado" if self.usado else ("Expirado" if self.ha_expirado else "Activo")
        return f"OTP Email {self.codigo} ({self.email} - {self.get_motivo_display()}) [{estado}]"

    @property
    def ha_expirado(self) -> bool:
        return timezone.now() > self.expira_el

    @classmethod
    def generar_codigo(cls, email: str, motivo: str = 'RECUPERACION', minutos_expiracion: int = 15):
        clean_email = str(email).strip().lower()
        codigo = f"{secrets.randbelow(900000) + 100000}"
        expiracion = timezone.now() + timedelta(minutes=minutos_expiracion)
        cls.objects.filter(email=clean_email, motivo=motivo, usado=False).update(usado=True)
        return cls.objects.create(
            email=clean_email,
            codigo=codigo,
            motivo=motivo,
            expira_el=expiracion
        )


class TokenRecuperacionEmail(models.Model):
    """
    Modelo de token de recuperación de contraseña asociado directamente al usuario.
    """
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='token_recuperacion')
    codigo = models.CharField(max_length=6)
    usado = models.BooleanField(default=False)
    actualizado_el = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'votality_tokens_recuperacion_email'
        verbose_name = _('Token Recuperación Email')
        verbose_name_plural = _('Tokens Recuperación Email')


# ==============================================================================
# 5. ENCUESTA / PIN EN CAMPO (AISLAMIENTO MULTI-TENANT)
# ==============================================================================

class EncuestaQuerySet(models.QuerySet):
    """
    QuerySet personalizado para garantizar el aislamiento estricto de datos (Multi-Tenant)
    entre campañas territoriales en Votality.
    """
    def para_campana(self, campana):
        return self.filter(campana=campana)

    def para_usuario(self, usuario):
        if not usuario or not usuario.is_authenticated:
            return self.none()
        if usuario.is_superuser or getattr(usuario, 'rol', None) == 'SUPERADMIN':
            return self.all()
        if getattr(usuario, 'rol', None) == 'ADMIN_CAMPANA':
            if hasattr(usuario, 'campana_administrada'):
                return self.filter(campana=usuario.campana_administrada)
            return self.none()
        if getattr(usuario, 'rol', None) == 'ENCUESTADOR':
            campanas_ids = usuario.asignaciones.filter(activo=True).values_list('campana_id', flat=True)
            return self.filter(campana_id__in=campanas_ids)
        return self.none()


class EncuestaManager(models.Manager.from_queryset(EncuestaQuerySet)):
    pass


# Bounding box oficial de Colombia (incluye San Andrés, Providencia y zona insular)
COLOMBIA_BBOX = {
    'min_lat': -4.3,
    'max_lat': 13.5,
    'min_lon': -81.8,
    'max_lon': -66.8
}


class Encuesta(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campana = models.ForeignKey(Campana, on_delete=models.CASCADE, related_name='encuestas')
    encuestador = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='encuestas_realizadas')

    # Datos Base
    nombre_completo = models.CharField(max_length=200, db_index=True)
    direccion = models.CharField(max_length=250)

    # Coordenadas inmutables leídas por GPS nativo
    coordenadas = gis_models.PointField(srid=4326, geography=True, db_index=True)  # SRID 4326 (WGS84 Lon/Lat)

    # Campos personalizados configurados por el administrador (JSON)
    respuestas_personalizadas = models.JSONField(default=dict, blank=True)
    plan_origen = models.CharField(max_length=50, default='directo', blank=True)

    creado_el = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = EncuestaManager()

    class Meta:
        db_table = 'votality_encuestas'
        verbose_name = _('Encuesta')
        verbose_name_plural = _('Encuestas')
        indexes = [
            models.Index(fields=['campana', 'creado_el'], name='idx_encuesta_campana_fecha'),
            models.Index(fields=['nombre_completo'], name='idx_encuesta_nombre'),
        ]
        # Regla: Unicidad espacial de pin dentro de la misma campaña
        constraints = [
            models.UniqueConstraint(
                fields=['campana', 'coordenadas'],
                name='unique_campana_coordenadas_pin'
            )
        ]

    def clean(self):
        # 1. Validación de límite de encuestas según el TipoPlan
        if self.campana and self.campana.tipo_plan:
            limite = self.campana.tipo_plan.limite_encuestas
            if limite:
                qs = Encuesta.objects.filter(campana=self.campana)
                if self.pk:
                    qs = qs.exclude(pk=self.pk)
                if qs.count() >= limite:
                    raise ValidationError(
                        _(f"Límite alcanzado: El plan '{self.campana.tipo_plan.nombre}' permite un máximo de {limite} encuestas.")
                    )

        # 2. Validación de asignación activa del encuestador a la campaña
        if self.encuestador and self.campana:
            asignado = AsignacionEncuestador.objects.filter(
                encuestador=self.encuestador,
                campana=self.campana,
                activo=True
            ).exists()
            if not asignado and not (self.encuestador.rol in ['SUPERADMIN', 'ADMIN_CAMPANA']):
                raise ValidationError(
                    _(f"El encuestador '{self.encuestador.username}' no tiene asignación activa en la campaña '{self.campana.nombre}'.")
                )

        # 3. Validación territorial estricta (Territorio Colombiano)
        coord = self.coordenadas
        if coord:
            lat = coord.y
            lon = coord.x
            if not (COLOMBIA_BBOX['min_lat'] <= lat <= COLOMBIA_BBOX['max_lat']) or \
               not (COLOMBIA_BBOX['min_lon'] <= lon <= COLOMBIA_BBOX['max_lon']):
                raise ValidationError(_("El punto geográfico debe pertenecer al territorio colombiano."))

            # 4. Validación de perímetro geográfico de la campaña (si está configurado)
            if self.campana and self.campana.perimetro_geografico:
                if not self.campana.perimetro_geografico.contains(coord):
                    raise ValidationError(
                        _(f"Coordenadas fuera de rango: El punto ({lat:.5f}, {lon:.5f}) se encuentra fuera del perímetro geográfico contratado para '{self.campana.nombre}'.")
                    )

    def save(self, *args, **kwargs):
        """
        Inmutabilidad Post-Guardado y Validación de Auditoría Electoral.
        Rechaza cualquier UPDATE una vez persistido en la base de datos.
        """
        self.clean()
        if self.pk and Encuesta.objects.filter(pk=self.pk).exists():
            raise ValidationError(
                _("Violación de Integridad: Las encuestas y pines de campo son inmutables tras su guardado para garantizar la trazabilidad y auditoría electoral.")
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre_completo} - {self.campana.nombre}"

    # Propiedades de compatibilidad con código previo
    @property
    def respondent_name(self):
        return self.nombre_completo

    @respondent_name.setter
    def respondent_name(self, value):
        self.nombre_completo = value

    @property
    def residential_address(self):
        return self.direccion

    @residential_address.setter
    def residential_address(self, value):
        self.direccion = value

    @property
    def location(self):
        return self.coordenadas

    @location.setter
    def location(self, value):
        self.coordenadas = value

    @property
    def answers(self):
        return self.respuestas_personalizadas

    @answers.setter
    def answers(self, value):
        self.respuestas_personalizadas = value

    @property
    def created_at(self):
        return self.creado_el

    @property
    def surveyor(self):
        return self.encuestador

    @surveyor.setter
    def surveyor(self, value):
        self.encuestador = value


# Alias de compatibilidad semántica para analítica espacial
PinesGeorreferenciados = Encuesta


# ==============================================================================
# 6. INFRAESTRUCTURA DE GEODATOS OFICIALES DE COLOMBIA (DANE / SIG / IDECA)
# ==============================================================================

class Departamento(models.Model):
    id = models.AutoField(primary_key=True)
    dane_code = models.CharField(max_length=5, unique=True, db_index=True)
    nombre = models.CharField(max_length=150, db_index=True)
    geometria = gis_models.MultiPolygonField(srid=4326)

    class Meta:
        db_table = 'votality_departamentos'
        verbose_name = _('Departamento')
        verbose_name_plural = _('Departamentos')
        indexes = [
            GinIndex(
                fields=['nombre'],
                name='idx_depto_nombre_trgm',
                opclasses=['gin_trgm_ops']
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.dane_code})"

    @property
    def centroide(self):
        point = self.geometria.centroid
        return [round(point.y, 6), round(point.x, 6)]

    @property
    def bbox(self):
        min_lon, min_lat, max_lon, max_lat = self.geometria.extent
        return [[round(min_lat, 6), round(min_lon, 6)], [round(max_lat, 6), round(max_lon, 6)]]


class Municipio(models.Model):
    id = models.AutoField(primary_key=True)
    dane_code = models.CharField(max_length=10, unique=True, db_index=True)
    nombre = models.CharField(max_length=150, db_index=True)
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.CASCADE,
        related_name='municipios'
    )
    geometria = gis_models.MultiPolygonField(srid=4326)

    class Meta:
        db_table = 'votality_municipios'
        verbose_name = _('Municipio')
        verbose_name_plural = _('Municipios')
        indexes = [
            GinIndex(
                fields=['nombre'],
                name='idx_muni_nombre_trgm',
                opclasses=['gin_trgm_ops']
            ),
        ]

    def __str__(self):
        return f"{self.nombre}, {self.departamento.nombre}"

    @property
    def centroide(self):
        point = self.geometria.centroid
        return [round(point.y, 6), round(point.x, 6)]

    @property
    def bbox(self):
        min_lon, min_lat, max_lon, max_lat = self.geometria.extent
        return [[round(min_lat, 6), round(min_lon, 6)], [round(max_lat, 6), round(max_lon, 6)]]


class LocalidadComuna(models.Model):
    id = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=20, db_index=True)
    nombre = models.CharField(max_length=150, db_index=True)
    tipo = models.CharField(max_length=30, default='LOCALIDAD')  # 'LOCALIDAD', 'COMUNA', 'CORREGIMIENTO'
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.CASCADE,
        related_name='divisiones_menores'
    )
    geometria = gis_models.MultiPolygonField(srid=4326)

    class Meta:
        db_table = 'votality_localidades_comunas'
        verbose_name = _('Localidad / Comuna')
        verbose_name_plural = _('Localidades y Comunas')
        indexes = [
            GinIndex(
                fields=['nombre'],
                name='idx_loc_com_nombre_trgm',
                opclasses=['gin_trgm_ops']
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.municipio.nombre})"

    @property
    def centroide(self):
        point = self.geometria.centroid
        return [round(point.y, 6), round(point.x, 6)]

    @property
    def bbox(self):
        min_lon, min_lat, max_lon, max_lat = self.geometria.extent
        return [[round(min_lat, 6), round(min_lon, 6)], [round(max_lat, 6), round(max_lon, 6)]]


class Barrio(models.Model):
    id = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=30, blank=True, null=True, db_index=True)
    nombre = models.CharField(max_length=150, db_index=True)
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.CASCADE,
        related_name='barrios'
    )
    localidad_comuna = models.ForeignKey(
        LocalidadComuna,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='barrios'
    )
    punto_referencia = gis_models.PointField(srid=4326, geography=True, db_index=True, null=True, blank=True)
    geometria = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)

    class Meta:
        db_table = 'votality_barrios'
        verbose_name = _('Barrio')
        verbose_name_plural = _('Barrios')
        indexes = [
            GinIndex(
                fields=['nombre'],
                name='idx_barrio_nombre_trgm',
                opclasses=['gin_trgm_ops']
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.municipio.nombre})"

    @property
    def centroide(self):
        if self.punto_referencia:
            return [round(self.punto_referencia.y, 6), round(self.punto_referencia.x, 6)]
        if self.geometria:
            point = self.geometria.centroid
            return [round(point.y, 6), round(point.x, 6)]
        return [0.0, 0.0]


class Via(models.Model):
    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=150, db_index=True)
    tipo_via = models.CharField(max_length=50)
    numero_via = models.CharField(max_length=20, db_index=True)
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.CASCADE,
        related_name='vias'
    )
    geom = gis_models.LineStringField(srid=4326, db_index=True)

    class Meta:
        db_table = 'votality_vias'
        verbose_name = _('Vía')
        verbose_name_plural = _('Vías')
        indexes = [
            GinIndex(
                fields=['nombre'],
                name='idx_via_nombre_trgm',
                opclasses=['gin_trgm_ops']
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.municipio.nombre})"


class DireccionReferencia(models.Model):
    id = models.BigAutoField(primary_key=True)
    texto_busqueda = models.CharField(max_length=255, db_index=True)
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.CASCADE,
        related_name='direcciones'
    )
    punto = gis_models.PointField(srid=4326, geography=True, db_index=True)

    class Meta:
        db_table = 'votality_direcciones_referencia'
        verbose_name = _('Dirección de Referencia / Vía')
        verbose_name_plural = _('Direcciones de Referencia / Vías')
        indexes = [
            GinIndex(
                fields=['texto_busqueda'],
                name='idx_dir_busqueda_trgm',
                opclasses=['gin_trgm_ops']
            ),
        ]

    def __str__(self):
        return f"{self.texto_busqueda} ({self.municipio.nombre})"


class CensusSector(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=150)
    dane_code = models.CharField(max_length=20, db_index=True)
    department = models.CharField(max_length=100)
    municipality = models.CharField(max_length=100)
    total_population = models.PositiveIntegerField(
        help_text=_("Población total del sector censal según censo oficial.")
    )
    sample_goal = models.PositiveIntegerField(
        default=500,
        help_text=_("Muestra requerida para representatividad estadística (95% confianza, 3% error).")
    )
    boundary = gis_models.PolygonField(srid=4326, null=True, blank=True)

    class Meta:
        db_table = 'votality_census_sectors'


class FormQuestion(models.Model):
    FIELD_TYPES = (
        ('text', 'Texto corto'),
        ('number', 'Numérico'),
        ('select', 'Selección múltiple'),
        ('boolean', 'Sí / No'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campana, on_delete=models.CASCADE, related_name='questions')
    label = models.CharField(max_length=255)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES, default='text')
    options = models.JSONField(blank=True, null=True, help_text=_("Lista de opciones para tipos select."))
    is_required = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'votality_form_questions'
        ordering = ['order', 'id']


# ==============================================================================
# ALIASES Y CONSTANTES DE COMPATIBILIDAD CON SERVICIOS PREVIOS
# ==============================================================================

VotalityUser = Usuario
Campaign = Campana
SurveyRecord = Encuesta


class UserRole:
    SUPERADMIN = 'SUPERADMIN'
    ADMIN = 'ADMIN_CAMPANA'
    ADMIN_CAMPANA = 'ADMIN_CAMPANA'
    ENCUESTADOR = 'ENCUESTADOR'
    FREE = 'FREE'
    choices = Usuario.ROLES


class PlanTier:
    FREE = 'FREE'
    COMUNAL = 'COMUNAL'
    MUNICIPAL = 'MUNICIPAL'
    DEPARTAMENTAL = 'DEPARTAMENTAL'
    choices = TipoPlan.ALCANCES


PLAN_QUOTAS = {
    'FREE': {'max_interviewers': 0, 'max_pins': 100, 'allow_stats': False},
    'COMUNAL': {'max_interviewers': 15, 'max_pins': 1000, 'allow_stats': True},
    'MUNICIPAL': {'max_interviewers': 50, 'max_pins': 10000, 'allow_stats': True},
    'DEPARTAMENTAL': {'max_interviewers': 200, 'max_pins': 50000, 'allow_stats': True},
}
