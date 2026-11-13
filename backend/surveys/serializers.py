"""
Votality SIG - Django REST Framework Serializers
Includes Spatial Validation for Survey Pins strictly restricted to Colombia.
"""

from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import SurveyRecord, Campaign, CensusSector, COLOMBIA_BBOX


class SurveyRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for georeferenced survey records with PostGIS Point validation.
    """
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)

    class Meta:
        model = SurveyRecord
        fields = [
            'id',
            'campaign',
            'census_sector',
            'surveyor',
            'respondent_name',
            'residential_address',
            'latitude',
            'longitude',
            'location',
            'answers',
            'created_at',
        ]
        read_only_fields = ['id', 'location', 'created_at']

    def validate(self, attrs):
        lat = attrs.get('latitude')
        lon = attrs.get('longitude')

        if lat is not None and lon is not None:
            # Validación territorial estricta: Solo dentro de Colombia
            if not (COLOMBIA_BBOX['min_lat'] <= lat <= COLOMBIA_BBOX['max_lat']) or \
               not (COLOMBIA_BBOX['min_lon'] <= lon <= COLOMBIA_BBOX['max_lon']):
                raise serializers.ValidationError(
                    {"location": "El punto geográfico debe pertenecer al territorio colombiano."}
                )

        return attrs

