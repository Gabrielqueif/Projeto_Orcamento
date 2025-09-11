// src/lib/sinapi-mock-data.ts
import { IComposicaoAnalitica, ISearchResult } from '@/types/sinapi';

// Base de dados para a busca simples (simulando o arquivo Busca.csv)
export const mockSearchResults: ISearchResult[] = [
    { codigo: '88317', descricao: 'CIMENTO PORTLAND COMPOSTO CP II-E-32, A GRANEL', unidade: 'KG', preco: 0.75, tipo: 'INSUMO' },
    { codigo: '87289', descricao: 'AREIA MEDIA - POSTO JAZIDA/FORNECEDOR', unidade: 'M3', preco: 85.50, tipo: 'INSUMO' },
    { codigo: '73989/001', descricao: 'CONCRETO FCK = 25MPA, TRACO 1:2,5:3 - PREPARO MECANICO COM BETONEIRA 400 L', unidade: 'M3', preco: 550.20, tipo: 'COMPOSICAO' },
    { codigo: '74151/001', descricao: 'ALVENARIA DE VEDACAO DE BLOCOS DE CONCRETO 14X19X39CM', unidade: 'M2', preco: 95.70, tipo: 'COMPOSICAO' },
];

// Base de dados para a busca analítica (simulando o arquivo Analítico com Custo.csv)
export const mockAnalitico: IComposicaoAnalitica[] = [
    {
        codigo: '73989/001',
        descricao: 'CONCRETO FCK = 25MPA, TRACO 1:2,5:3 - PREPARO MECANICO COM BETONEIRA 400 L',
        unidade: 'M3',
        custoTotal: 550.20,
        componentes: [
            { tipo: 'INSUMO', codigo: '88317', descricao: 'CIMENTO PORTLAND COMPOSTO CP II-E-32', unidade: 'KG', coeficiente: 350, precoUnitario: 0.75, custoTotal: 262.50 },
            { tipo: 'INSUMO', codigo: '87289', descricao: 'AREIA MEDIA', unidade: 'M3', coeficiente: 0.85, precoUnitario: 85.50, custoTotal: 72.68 },
            { tipo: 'INSUMO', codigo: '12345', descricao: 'BRITA 1', unidade: 'M3', coeficiente: 0.90, precoUnitario: 95.00, custoTotal: 85.50 },
            { tipo: 'MAO DE OBRA', codigo: 'P001', descricao: 'PEDREIRO', unidade: 'H', coeficiente: 1.5, precoUnitario: 25.00, custoTotal: 37.50 },
            { tipo: 'MAO DE OBRA', codigo: 'S002', descricao: 'SERVENTE', unidade: 'H', coeficiente: 3.0, precoUnitario: 18.00, custoTotal: 54.00 },
            { tipo: 'EQUIPAMENTO', codigo: 'E001', descricao: 'BETONEIRA 400L', unidade: 'H', coeficiente: 0.5, precoUnitario: 76.04, custoTotal: 38.02 },
        ]
    },
    // ... poderíamos adicionar outras composições aqui
];