// src/types/sinapi.ts

// Representa um item básico na lista de busca
export interface ISearchResult {
    codigo: string;
    descricao: string;
    unidade: string;
    preco: number;
    tipo: 'INSUMO' | 'COMPOSICAO';
}

// Representa um componente DENTRO de uma composição analítica
export interface IComponenteAnalitico {
    tipo: 'INSUMO' | 'MAO DE OBRA' | 'EQUIPAMENTO' | 'COMPOSICAO AUXILIAR';
    codigo: string;
    descricao: string;
    unidade: string;
    coeficiente: number;
    precoUnitario: number;
    custoTotal: number;
}

// Representa a composição completa com todos os seus detalhes
export interface IComposicaoAnalitica {
    codigo: string;
    descricao: string;
    unidade: string;
    custoTotal: number;
    componentes: IComponenteAnalitico[];
}

// Novo tipo para representar um item DENTRO da nossa planilha de orçamento
export interface IOrcamentoItem extends ISearchResult {
    quantidade: number;
}

export interface IOrcamento {
    id: string;
    tituloObra: string;
    cliente: string;
    local: string;
    data: string; // Usaremos string para simplicidade no formulário
    itens: IOrcamentoItem[];
    bdiPercentual: number;
    encargosSociaisPercentual: number;
}