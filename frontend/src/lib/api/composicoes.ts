import { fetchWithAuth } from './client';

export interface ItemComposicao {
    codigo_composicao: string;
    descricao: string;
    unidade: string;
    grupo?: string;
    preco?: number;
    mes_referencia: string;
    fonte: string;
}

export interface PrecosEstado {
    [key: string]: number | string | null;
}

export async function buscarComposicoes(termo: string, fonte: string = "SINAPI"): Promise<ItemComposicao[]> {
    if (!termo) return [];

    const url = `/composicoes/buscar/${encodeURIComponent(termo)}?fonte=${encodeURIComponent(fonte)}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
        throw new Error('Erro ao buscar composições');
    }

    return response.json();
}

export async function getEstadosComposicao(codigo: string, mes_referencia: string, fonte: string = "SINAPI"): Promise<PrecosEstado[]> {
    const response = await fetchWithAuth(`/composicoes/${codigo}/estados/${mes_referencia}?fonte=${encodeURIComponent(fonte)}`);

    if (!response.ok) {
        throw new Error('Erro ao buscar preços por estado');
    }

    return response.json();
}
