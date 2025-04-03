from django.db import models

# Create your models here.
class Insumos(models.Model):
    classificacao = models.CharField(max_length=25)
    codigo_insumo = models.IntegerField()
    descricao_do_insumo = models.TextField()
    unidade = models.CharField(max_length=3)
    origem_de_preco = models.CharField(max_length=3)
    AC = models.IntegerField(default=0,blank=True, null=True)  # Acre
    AL = models.IntegerField(default=0,blank=True, null=True)  # Alagoas
    AP = models.IntegerField(default=0,blank=True, null=True)  # Amapá
    AM = models.IntegerField(default=0,blank=True, null=True)  # Amazonas
    BA = models.IntegerField(default=0,blank=True, null=True)  # Bahia
    CE = models.IntegerField(default=0,blank=True, null=True)  # Ceará
    DF = models.IntegerField(default=0,blank=True, null=True)  # Distrito Federal
    ES = models.IntegerField(default=0,blank=True, null=True)  # Espírito Santo
    GO = models.IntegerField(default=0,blank=True, null=True)  # Goiás
    MA = models.IntegerField(default=0,blank=True, null=True)  # Maranhão
    MT = models.IntegerField(default=0,blank=True, null=True)  # Mato Grosso
    MS = models.IntegerField(default=0,blank=True, null=True)  # Mato Grosso do Sul
    MG = models.IntegerField(default=0,blank=True, null=True)  # Minas Gerais
    PA = models.IntegerField(default=0,blank=True, null=True)  # Pará
    PB = models.IntegerField(default=0,blank=True, null=True)  # Paraíba
    PR = models.IntegerField(default=0,blank=True, null=True)  # Paraná
    PE = models.IntegerField(default=0,blank=True, null=True)  # Pernambuco
    PI = models.IntegerField(default=0,blank=True, null=True)  # Piauí
    RJ = models.IntegerField(default=0,blank=True, null=True)  # Rio de Janeiro
    RN = models.IntegerField(default=0,blank=True, null=True)  # Rio Grande do Norte
    RS = models.IntegerField(default=0,blank=True, null=True)  # Rio Grande do Sul
    RO = models.IntegerField(default=0,blank=True, null=True)  # Rondônia
    RR = models.IntegerField(default=0,blank=True, null=True)  # Roraima
    SC = models.IntegerField(default=0,blank=True, null=True)  # Santa Catarina
    SP = models.IntegerField(default=0,blank=True, null=True)  # São Paulo
    SE = models.IntegerField(default=0,blank=True, null=True)  # Sergipe
    TO = models.IntegerField(default=0,blank=True, null=True)  # Tocantins 
 
