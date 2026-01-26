import { fetchWithAuth } from './client';

export interface ItemComposicao {
    codigo_composicao: string;
    descricao: string;
    unidade: string;
    grupo?: string;
    preco?: number;
}

export interface PrecosEstado {
    [key: string]: number | string | null;
}

export async function buscarComposicoes(termo: string): Promise<ItemComposicao[]> {
    if (!termo) return [];

    const response = await fetchWithAuth(`/composicoes/buscar/${encodeURIComponent(termo)}`);

    if (!response.ok) {
        throw new Error('Erro ao buscar composições');
    }

    return response.json();
}

export async function getEstadosComposicao(codigo: string): Promise<PrecosEstado[]> {
    const response = await fetchWithAuth(`/composicoes/${codigo}/estados`);

    if (!response.ok) {
        throw new Error('Erro ao buscar preços por estado');
    }

    return response.json();
}
