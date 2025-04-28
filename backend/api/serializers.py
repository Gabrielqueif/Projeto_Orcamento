from rest_framework import serializers
from .models import Insumos, Composicoes


# Corrigido para ModelSerializer
class InsumosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumos
        fields = '__all__'

class ComposicoesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Composicoes
        fields = '__all__'