from .models import Insumos, Composicoes
from .serializers import InsumosSerializer, ComposicoesSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response






class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumos.objects.all()
    serializer_class = InsumosSerializer


    @action(detail=False, methods=['get'])
    def por_codigo(self, request):
        codigo = request.query_params.get('codigo')
        if not codigo:
            return Response(
                {"error": "Código do insumo é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            insumo = Insumos.objects.get(codigo_insumo=codigo)
            serializer = self.get_serializer(insumo)
            return Response(serializer.data)
        except Insumos.DoesNotExist:
            return Response(
                {"error": "Insumo não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def buscar(self, request):
        """
        Endpoint para buscar insumos com filtros sem paginação.
        """
        # Obter parâmetros de busca
        classificacao = request.query_params.get('classificacao', '')
        codigo = request.query_params.get('codigo', '')
        descricao = request.query_params.get('descricao', '')
        unidade = request.query_params.get('unidade', '')
        origem = request.query_params.get('origem', '')
        estado = request.query_params.get('estado', '')

        # Iniciar com todos os insumos
        queryset = Insumos.objects.all()

        # Aplicar filtros se fornecidos
        if classificacao:
            queryset = queryset.filter(classificacao__icontains=classificacao)
        if codigo:
            queryset = queryset.filter(codigo_insumo__icontains=codigo)
        if descricao:
            queryset = queryset.filter(
                descricao_do_insumo__icontains=descricao)
        if unidade:
            queryset = queryset.filter(unidade__icontains=unidade)
        if origem:
            queryset = queryset.filter(origem_de_preco__icontains=origem)
        if estado:
            # Verificar se o estado tem valor (não é nulo)
            queryset = queryset.exclude(**{estado: None})

        # Serializar e retornar todos os resultados
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ComposicoesViewSet(viewsets.ModelViewSet):
    queryset = Composicoes.objects.all()
    serializer_class = ComposicoesSerializer

    @action(detail=False, methods=['get'])
    def por_codigo(self, request):
        codigo = request.query_params.get('codigo')
        if not codigo:
            return Response(
                {"error": "Código da composição é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            composicoes = Composicoes.objects.get(codigo_insumo=codigo)
            serializer = self.get_serializer(composicoes)
            return Response(serializer.data)
        except Composicoes.DoesNotExist:
            return Response(
                {"error": "composição não encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def buscar(self, request):
        """
        Endpoint para buscar insumos com filtros sem paginação.
        """
        # Obter parâmetros de busca
        classificacao = request.query_params.get('grupo', '')
        codigo = request.query_params.get('codigo', '')
        descricao = request.query_params.get('descricao', '')
        unidade = request.query_params.get('unidade', '')
        origem = request.query_params.get('origem', '')
        estado = request.query_params.get('estado', '')

        # Iniciar com todos os insumos
        queryset = Insumos.objects.all()

        # Aplicar filtros se fornecidos
        if classificacao:
            queryset = queryset.filter(classificacao__icontains=classificacao)
        if codigo:
            queryset = queryset.filter(codigo_insumo__icontains=codigo)
        if descricao:
            queryset = queryset.filter(
                descricao_do_insumo__icontains=descricao)
        if unidade:
            queryset = queryset.filter(unidade__icontains=unidade)
        if origem:
            queryset = queryset.filter(origem_de_preco__icontains=origem)
        if estado:
            # Verificar se o estado tem valor (não é nulo)
            queryset = queryset.exclude(**{estado: None})

        # Serializar e retornar todos os resultados
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)