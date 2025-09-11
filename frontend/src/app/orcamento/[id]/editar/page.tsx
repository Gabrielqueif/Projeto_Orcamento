// src/app/orcamento/[id]/editar/page.tsx
'use client';

import { useOrcamento } from '@/hooks/useOrcamento';
import { salvarOrcamento } from '@/lib/orcamento-storage';
import { useRouter } from 'next/navigation';
import { OrcamentoHeader } from '@/components/features/OrcamentoHeader';
import { BuscadorSinapi } from '@/components/features/BuscadorSinapi';
import { PlanilhaOrcamento } from '@/components/features/PlanilhaOrcamento';

export default function EditarOrcamentoPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const {
        orcamento,
        loading,
        updateOrcamento,
        addItem,
        updateItemQuantity,
        removeItem,
        custoTotalDireto,
        valorBDI,
        precoTotalVenda,
    } = useOrcamento(params.id); // A única diferença: passamos o ID para o hook!

    const handleSave = () => {
        if (!orcamento) return;
        // ... mesma lógica de salvar da página de novo orçamento
        salvarOrcamento(orcamento);
        alert('Orçamento atualizado com sucesso!');
        router.push('/');
    };

    if (loading || !orcamento) {
        return <div className="flex h-screen items-center justify-center">Carregando orçamento...</div>;
    }

    // O JSX é o mesmo, mas agora os dados vêm do hook!
    return (
        <main className="bg-slate-50 min-h-screen p-4 md:p-8">
            {/* A única diferença será o título e o texto do botão de salvar */}
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Editar Orçamento</h1>
                        <p className="text-slate-600 mt-1">Altere as informações do projeto e sua lista de itens.</p>
                    </div>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                        Salvar Alterações
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
                    <OrcamentoHeader data={orcamento} onUpdate={updateOrcamento} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Adicionar Itens</h2>
                            <BuscadorSinapi onAddItem={addItem} />
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="sticky top-8 flex flex-col gap-8">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h2 className="text-xl font-semibold mb-4 text-gray-800">Planilha</h2>
                                <PlanilhaOrcamento
                                    itens={orcamento.itens}
                                    onUpdateQuantity={updateItemQuantity}
                                    onRemoveItem={removeItem}
                                />
                            </div>
                            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-semibold mb-4 text-white">Resumo Financeiro</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-slate-200">
                                        <span>Custo Direto Total:</span>
                                        <span className="font-semibold text-lg text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotalDireto)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-200">
                                        <span>BDI ({orcamento.bdiPercentual}%):</span>
                                        <span className="font-semibold text-lg text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorBDI)}</span>
                                    </div>
                                    <hr className="border-slate-600"/>
                                    <div className="flex justify-between items-center text-white pt-2">
                                        <span className="text-lg font-bold">Preço Final de Venda:</span>
                                        <span className="text-2xl font-bold text-cyan-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoTotalVenda)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}