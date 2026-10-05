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

export interface ContextoPreco {
    estado?: string;
    mes_referencia?: string;
    tipo_composicao?: string;
}

export async function buscarComposicoes(termo: string, fonte: string, contexto?: ContextoPreco): Promise<ItemComposicao[]> {
    if (!termo) return [];

    const params = new URLSearchParams({ fonte });
    if (contexto?.estado) {
        params.set('estado', contexto.estado);
        if (contexto.mes_referencia) params.set('mes_referencia', contexto.mes_referencia);
        if (contexto.tipo_composicao) params.set('tipo_composicao', contexto.tipo_composicao);
    }
    const url = `/composicoes/buscar/${encodeURIComponent(termo)}?${params.toString()}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
        throw new Error('Erro ao buscar composições');
    }

    return response.json();
}

export async function getEstadosComposicao(codigo: string, mes_referencia: string, fonte: string): Promise<PrecosEstado[]> {
    if (!codigo || !mes_referencia) return [];

    const response = await fetchWithAuth(`/composicoes/${encodeURIComponent(codigo)}/estados?mes_referencia=${encodeURIComponent(mes_referencia)}&fonte=${encodeURIComponent(fonte)}`);

    if (!response.ok) {
        console.warn(`Preços não encontrados para ${codigo} (${mes_referencia}, ${fonte}) - status ${response.status}`);
        return [];
    }

    return response.json();
}
export async function getPrecoRegionalParaItem(codigo: string, mes_referencia: string, fonte: string, uf: string): Promise<number | null> {
    try {
        const precosUF = await getEstadosComposicao(codigo, mes_referencia, fonte);
        
        if (precosUF && precosUF.length > 0) {
            const data = precosUF[0];
            const precoRaw = data[uf.toLowerCase()] || data[uf.toUpperCase()];
            
            if (precoRaw !== undefined && precoRaw !== null) {
                // Trata conversão de string para número (ex: "2.450,50" -> 2450.5)
                const precoLimpo = typeof precoRaw === 'string' 
                    ? precoRaw.replace(/\./g, '').replace(',', '.') 
                    : precoRaw;
                
                return Number(precoLimpo);
            }
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar preço regional:", error);
        return null;
    }
}
