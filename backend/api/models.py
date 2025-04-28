from django.db import models

# Create your models here.
class Insumos(models.Model):
    classificacao = models.CharField(max_length=25)
    codigo_insumo = models.IntegerField()
    descricao_do_insumo = models.TextField()
    unidade = models.CharField(max_length=3)
    origem_de_preco = models.CharField(max_length=3)
    AC = models.FloatField(default=0,blank=True, null=True)  # Acre
    AL = models.FloatField(default=0,blank=True, null=True)  # Alagoas
    AP = models.FloatField(default=0,blank=True, null=True)  # Amapá
    AM = models.FloatField(default=0,blank=True, null=True)  # Amazonas
    BA = models.FloatField(default=0,blank=True, null=True)  # Bahia
    CE = models.FloatField(default=0,blank=True, null=True)  # Ceará
    DF = models.FloatField(default=0,blank=True, null=True)  # Distrito Federal
    ES = models.FloatField(default=0,blank=True, null=True)  # Espírito Santo
    GO = models.FloatField(default=0,blank=True, null=True)  # Goiás
    MA = models.FloatField(default=0,blank=True, null=True)  # Maranhão
    MT = models.FloatField(default=0,blank=True, null=True)  # Mato Grosso
    MS = models.FloatField(default=0,blank=True, null=True)  # Mato Grosso do Sul
    MG = models.FloatField(default=0,blank=True, null=True)  # Minas Gerais
    PA = models.FloatField(default=0,blank=True, null=True)  # Pará
    PB = models.FloatField(default=0,blank=True, null=True)  # Paraíba
    PR = models.FloatField(default=0,blank=True, null=True)  # Paraná
    PE = models.FloatField(default=0,blank=True, null=True)  # Pernambuco
    PI = models.FloatField(default=0,blank=True, null=True)  # Piauí
    RJ = models.FloatField(default=0,blank=True, null=True)  # Rio de Janeiro
    RN = models.FloatField(default=0,blank=True, null=True)  # Rio Grande do Norte
    RS = models.FloatField(default=0,blank=True, null=True)  # Rio Grande do Sul
    RO = models.FloatField(default=0,blank=True, null=True)  # Rondônia
    RR = models.FloatField(default=0,blank=True, null=True)  # Roraima
    SC = models.FloatField(default=0,blank=True, null=True)  # Santa Catarina
    SP = models.FloatField(default=0,blank=True, null=True)  # São Paulo
    SE = models.FloatField(default=0,blank=True, null=True)  # Sergipe
    TO = models.FloatField(default=0,blank=True, null=True)  # Tocantins 
 
class Composicoes(models.Model):
    grupo = models.CharField(max_length=55)
    codigo_composicao = models.IntegerField(default=0)
    tipo_item = models.CharField(max_length=100, null=True)
    codigo_item = models.IntegerField(null=True, default=0)
    descricao = models.TextField()
    unidade = models.CharField(max_length=55)
    coeficiente = models.FloatField(default=0, null=True)