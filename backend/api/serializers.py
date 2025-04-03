from rest_framework import serializers
from .models import Insumos


# Corrigido para ModelSerializer
class InsumosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumos
        fields = '__all__'
