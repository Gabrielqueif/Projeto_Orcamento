// src/components/features/PlanilhaOrcamento.tsx
'use client';

import { IOrcamentoItem } from "@/types/sinapi";
import { Trash2 } from "lucide-react";

interface PlanilhaOrcamentoProps {
    itens: IOrcamentoItem[];
    onUpdateQuantity: (codigo: string, novaQuantidade: number) => void;
    onRemoveItem: (codigo: string) => void;
}

export function PlanilhaOrcamento({ itens, onUpdateQuantity, onRemoveItem }: PlanilhaOrcamentoProps) {
    if (itens.length === 0) {
        return (
            <div className="border-2 border-dashed rounded-lg p-10 text-center bg-gray-50">
                <p className="text-gray-500">Nenhum item adicionado ao orçamento ainda.</p>
                <p className="text-sm text-gray-400 mt-2">Use a busca ao lado para começar.</p>
            </div>
        );
    }

    // Estilo para o input de quantidade, para consistência
    const quantityInputStyle = "w-24 p-1.5 bg-slate-50 border border-slate-300 rounded-md text-center text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

    return (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                        <th className="px-4 py-2 font-medium w-1/2">Descrição</th>
                        <th className="px-4 py-2 font-medium text-center">Qtd.</th>
                        <th className="px-4 py-2 font-medium text-right">Preço Unit.</th>
                        <th className="px-4 py-2 font-medium text-right">Total</th>
                        <th className="px-4 py-2 font-medium"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                    {itens.map(item => (
                        <tr key={item.codigo} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                                <p className="font-medium text-gray-800">{item.descricao}</p>
                                <p className="text-xs text-gray-500">Cód: {item.codigo} | Unid: {item.unidade}</p>
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    type="number"
                                    value={item.quantidade}
                                    onChange={(e) => onUpdateQuantity(item.codigo, parseFloat(e.target.value))}
                                    className={quantityInputStyle} // Aplicando o estilo
                                    min="0"
                                    step="0.01"
                                />
                            </td>
                            <td className="px-4 py-2 text-right text-gray-700">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco * item.quantidade)}
                            </td>
                            <td className="px-4 py-2 text-center">
                                <button onClick={() => onRemoveItem(item.codigo)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}