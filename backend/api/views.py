from django.shortcuts import render
from .models import Insumos
from rest_framework import viewsets
from .serializers import InsumosSerializer

class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumos.objects.all()
    serializer_class = InsumosSerializer
