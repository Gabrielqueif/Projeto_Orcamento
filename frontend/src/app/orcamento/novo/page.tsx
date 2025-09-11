// src/app/orcamento/novo/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { BuscadorSinapi } from "@/components/features/BuscadorSinapi";
import { PlanilhaOrcamento } from '@/components/features/PlanilhaOrcamento';
import { OrcamentoHeader } from '@/components/features/OrcamentoHeader'; // Importamos o novo componente
import { IOrcamento, ISearchResult } from '@/types/sinapi';

// Estado inicial para um novo orçamento
const getInitialOrcamento = (): IOrcamento => ({
    id: crypto.randomUUID(),
    tituloObra: '',
    cliente: '',
    local: '',
    data: new Date().toISOString().split('T')[0], // Data de hoje
    itens: [],
    bdiPercentual: 25,
    encargosSociaisPercentual: 80,
});

export default function NovoOrcamentoPage() {
    // O estado agora é o objeto de orçamento completo
    const [orcamento, setOrcamento] = useState<IOrcamento>(getInitialOrcamento());

    // --- FUNÇÕES DE MANIPULAÇÃO DO ESTADO ---

    const handleUpdateOrcamento = (field: keyof IOrcamento, value: string | number) => {
        setOrcamento(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItem = (itemToAdd: ISearchResult) => {
        setOrcamento(prev => {
            const itemExists = prev.itens.find(item => item.codigo === itemToAdd.codigo);
            if (itemExists) {
                const novosItens = prev.itens.map(item =>
                    item.codigo === itemToAdd.codigo ? { ...item, quantidade: item.quantidade + 1 } : item
                );
                return { ...prev, itens: novosItens };
            } else {
                const novoItem = { ...itemToAdd, quantidade: 1 };
                return { ...prev, itens: [...prev.itens, novoItem] };
            }
        });
    };

    const handleUpdateItemQuantity = (codigo: string, novaQuantidade: number) => {
        const quantidade = Math.max(0, novaQuantidade || 0);
        setOrcamento(prev => ({
            ...prev,
            itens: prev.itens.map(item => item.codigo === codigo ? { ...item, quantidade } : item),
        }));
    };

    const handleRemoveItem = (codigo: string) => {
        setOrcamento(prev => ({
            ...prev,
            itens: prev.itens.filter(item => item.codigo !== codigo),
        }));
    };

    // --- CÁLCULOS FINAIS DO ORÇAMENTO (MEMOIZADOS) ---

    const custoTotalDireto = useMemo(() => {
        return orcamento.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    }, [orcamento.itens]);

    const valorBDI = useMemo(() => {
        return custoTotalDireto * (orcamento.bdiPercentual / 100);
    }, [custoTotalDireto, orcamento.bdiPercentual]);

    const precoTotalVenda = useMemo(() => {
        // A fórmula pode variar, usando uma comum: Custo Direto * (1 + BDI/100)
        return custoTotalDireto * (1 + orcamento.bdiPercentual / 100);
    }, [custoTotalDireto, orcamento.bdiPercentual]);


    return (
        <main className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Criar Orçamento</h1>

            {/* SEÇÃO 1: CABEÇALHO DO ORÇAMENTO */}
            <section className="mb-8">
                <OrcamentoHeader data={orcamento} onUpdate={handleUpdateOrcamento} />
            </section>

            <div className="flex flex-col lg:flex-row lg:gap-8">
                {/* Coluna da Esquerda: Busca de Itens */}
                <div className="lg:w-1/2">
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Adicionar Itens</h2>
                        <BuscadorSinapi onAddItem={handleAddItem} />
                    </section>
                </div>

                {/* Coluna da Direita: Planilha e Resumo */}
                <div className="lg:w-1/2 mt-10 lg:mt-0">
                    <div className="sticky top-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Planilha e Resumo</h2>
                        <PlanilhaOrcamento
                            itens={orcamento.itens}
                            onUpdateQuantity={handleUpdateItemQuantity}
                            onRemoveItem={handleRemoveItem}
                        />

                        {/* RESUMO FINANCEIRO */}
                        <div className="mt-6 space-y-3 p-4 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-center text-gray-700">
                                <span>Custo Direto Total:</span>
                                <span className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotalDireto)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span>BDI ({orcamento.bdiPercentual}%):</span>
                                <span className="font-semibold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorBDI)}</span>
                            </div>
                            <hr/>
                            <div className="flex justify-between items-center text-gray-900">
                                <span className="text-lg font-bold">Preço Final de Venda:</span>
                                <span className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoTotalVenda)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}