// src/hooks/useOrcamento.ts
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IOrcamento, ISearchResult, IComposicaoAnalitica } from '@/types/sinapi';
import { buscarOrcamentoPorId } from '@/lib/orcamento-storage';

const getInitialOrcamento = (): IOrcamento => ({
    id: crypto.randomUUID(),
    tituloObra: '',
    cliente: '',
    local: '',
    data: new Date().toISOString().split('T')[0],
    itens: [],
    bdiPercentual: 25,
    encargosSociaisPercentual: 80,
});

export function useOrcamento(orcamentoId?: string) {
    const router = useRouter();
    const [orcamento, setOrcamento] = useState<IOrcamento | null>(orcamentoId ? null : getInitialOrcamento());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orcamentoId) {
            const dadosOrcamento = buscarOrcamentoPorId(orcamentoId);
            if (dadosOrcamento) {
                setOrcamento(dadosOrcamento);
            } else {
                alert('Orçamento não encontrado!');
                router.push('/');
            }
        }
        setLoading(false);
    }, [orcamentoId, router]);

    const updateOrcamento = useCallback((field: keyof IOrcamento, value: string | number) => {
        setOrcamento(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    const addItem = useCallback(async (itemToAdd: ISearchResult) => {
        setOrcamento(prev => {
            if (!prev) return null;

            const itemExists = prev.itens.find(item => item.codigo === itemToAdd.codigo);
            if (itemExists) {
                const novosItens = prev.itens.map(item =>
                    item.codigo === itemToAdd.codigo ? { ...item, quantidade: item.quantidade + 1 } : item
                );
                return { ...prev, itens: novosItens };
            } else {
                // Se for composição, no futuro buscaremos os detalhes aqui. Por enquanto, adicionamos direto.
                const novoItem = { ...itemToAdd, quantidade: 1 };
                return { ...prev, itens: [...prev.itens, novoItem] };
            }
        });
    }, []);

    const updateItemQuantity = useCallback((codigo: string, novaQuantidade: number) => {
        const quantidade = Math.max(0, novaQuantidade || 0);
        setOrcamento(prev => prev ? {
            ...prev,
            itens: prev.itens.map(item => item.codigo === codigo ? { ...item, quantidade } : item),
        } : null);
    }, []);

    const removeItem = useCallback((codigo: string) => {
        setOrcamento(prev => prev ? {
            ...prev,
            itens: prev.itens.filter(item => item.codigo !== codigo),
        } : null);
    }, []);

    // --- CÁLCULOS FINAIS DO ORÇAMENTO (MEMOIZADOS) ---

    const custoTotalDireto = useMemo(() => {
        return orcamento?.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0) || 0;
    }, [orcamento?.itens]);

    // AINDA NÃO TEMOS O CÁLCULO DE ENCARGOS AQUI, FAREMOS A SEGUIR

    const valorBDI = useMemo(() => {
        if (!orcamento) return 0;
        return custoTotalDireto * (orcamento.bdiPercentual / 100);
    }, [custoTotalDireto, orcamento?.bdiPercentual]);

    const precoTotalVenda = useMemo(() => {
        if (!orcamento) return 0;
        return custoTotalDireto * (1 + orcamento.bdiPercentual / 100);
    }, [custoTotalDireto, orcamento?.bdiPercentual]);

    return {
        orcamento,
        loading,
        updateOrcamento,
        addItem,
        updateItemQuantity,
        removeItem,
        custoTotalDireto,
        valorBDI,
        precoTotalVenda
    };
}