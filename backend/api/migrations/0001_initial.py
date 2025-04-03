# Generated by Django 5.1.7 on 2025-04-03 13:48

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Insumos',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('classificacao', models.CharField(max_length=25)),
                ('codigo_insumo', models.IntegerField()),
                ('descricao_do_insumo', models.TextField()),
                ('unidade', models.CharField(max_length=3)),
                ('origem_de_preco', models.CharField(max_length=3)),
                ('AC', models.IntegerField(blank=True, default=0, null=True)),
                ('AL', models.IntegerField(blank=True, default=0, null=True)),
                ('AP', models.IntegerField(blank=True, default=0, null=True)),
                ('AM', models.IntegerField(blank=True, default=0, null=True)),
                ('BA', models.IntegerField(blank=True, default=0, null=True)),
                ('CE', models.IntegerField(blank=True, default=0, null=True)),
                ('DF', models.IntegerField(blank=True, default=0, null=True)),
                ('ES', models.IntegerField(blank=True, default=0, null=True)),
                ('GO', models.IntegerField(blank=True, default=0, null=True)),
                ('MA', models.IntegerField(blank=True, default=0, null=True)),
                ('MT', models.IntegerField(blank=True, default=0, null=True)),
                ('MS', models.IntegerField(blank=True, default=0, null=True)),
                ('MG', models.IntegerField(blank=True, default=0, null=True)),
                ('PA', models.IntegerField(blank=True, default=0, null=True)),
                ('PB', models.IntegerField(blank=True, default=0, null=True)),
                ('PR', models.IntegerField(blank=True, default=0, null=True)),
                ('PE', models.IntegerField(blank=True, default=0, null=True)),
                ('PI', models.IntegerField(blank=True, default=0, null=True)),
                ('RJ', models.IntegerField(blank=True, default=0, null=True)),
                ('RN', models.IntegerField(blank=True, default=0, null=True)),
                ('RS', models.IntegerField(blank=True, default=0, null=True)),
                ('RO', models.IntegerField(blank=True, default=0, null=True)),
                ('RR', models.IntegerField(blank=True, default=0, null=True)),
                ('SC', models.IntegerField(blank=True, default=0, null=True)),
                ('SP', models.IntegerField(blank=True, default=0, null=True)),
                ('SE', models.IntegerField(blank=True, default=0, null=True)),
                ('TO', models.IntegerField(blank=True, default=0, null=True)),
            ],
        ),
    ]
