// src/app/page.tsx
'use client'; // Necessário para usar hooks e interagir com o localStorage

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IOrcamento } from '@/types/sinapi';
import { listarOrcamentos, deletarOrcamento } from '@/lib/orcamento-storage';
import { FileText, PlusCircle, Trash2 } from 'lucide-react'; // Ícones para a UI

export default function HomePage() {
    const [orcamentos, setOrcamentos] = useState<IOrcamento[]>([]);

    // useEffect para carregar os orçamentos do storage quando o componente montar
    useEffect(() => {
        const orcamentosSalvos = listarOrcamentos();
        setOrcamentos(orcamentosSalvos);
    }, []);

    const handleDelete = (id: string) => {
        // Confirmação para evitar exclusões acidentais
        if (window.confirm('Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.')) {
            deletarOrcamento(id);
            // Atualiza o estado local para refletir a exclusão na UI imediatamente
            setOrcamentos(prevOrcamentos => prevOrcamentos.filter(o => o.id !== id));
        }
    };

    return (
        <main className="bg-slate-50 min-h-screen p-4 md:p-8">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Meus Orçamentos</h1>
                        <p className="text-slate-600 mt-1">Visualize, edite ou exclua seus projetos salvos.</p>
                    </div>
                    <Link href="/orcamento/novo" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
                        <PlusCircle size={20} />
                        Criar Novo Orçamento
                    </Link>
                </div>

                {/* Grid para listar os orçamentos */}
                {orcamentos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orcamentos.map(orcamento => {
                            // Calculamos o valor total para exibir no card
                            const custoTotal = orcamento.itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
                            const precoVenda = custoTotal * (1 + orcamento.bdiPercentual / 100);

                            return (
                                <div key={orcamento.id} className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-100 p-2 rounded-md">
                                                <FileText className="text-slate-500" />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-lg text-gray-800">{orcamento.tituloObra}</h2>
                                                <p className="text-sm text-slate-500">{orcamento.cliente}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-sm text-slate-600">
                                            <p>Data: {new Date(orcamento.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                            <p className="font-semibold text-lg mt-2 text-gray-800">
                                                Valor Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoVenda)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 px-5 py-3 flex justify-end gap-3 border-t">
                                        <button
                                            onClick={() => handleDelete(orcamento.id)}
                                            className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1.5"
                                        >
                                            <Trash2 size={16} />
                                            Excluir
                                        </button>
                                        {/* O link de edição aponta para uma página que ainda vamos criar */}
                                        <Link
                                            href={`/orcamento/${orcamento.id}/editar`}
                                            className="text-sm font-medium bg-slate-700 text-white px-4 py-1.5 rounded-md hover:bg-slate-800"
                                        >
                                            Editar
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Mensagem para quando não houver orçamentos
                    <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed">
                        <h2 className="text-xl font-semibold text-slate-700">Nenhum orçamento salvo ainda.</h2>
                        <p className="text-slate-500 mt-2">Clique em "Criar Novo Orçamento" para começar.</p>
                    </div>
                )}
            </div>
        </main>
    );
}