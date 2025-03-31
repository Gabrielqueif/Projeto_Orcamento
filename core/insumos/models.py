from django.db import models


class insumos(models.Model):
    
    codigo_insumo = models.IntegerField(max_length=10)
