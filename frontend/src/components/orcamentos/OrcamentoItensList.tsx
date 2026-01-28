'use client';

import * as React from "react";
import { getItens, getEtapas, deleteItem, type OrcamentoItem, type Etapa } from "@/lib/api/orcamentos";
import { Modal } from "@/components/ui/Modal";
import { OrcamentoItemForm } from "./OrcamentoItemForm";

const formatarMoeda = (valor: number | null): string => {
  if (valor === null || valor === undefined) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

type OrcamentoItensListProps = {
  orcamentoId: string;
  valorTotal: number | null;
  refreshTrigger?: number;
  onItemDeleted?: () => void;
};

export function OrcamentoItensList({ orcamentoId, valorTotal, refreshTrigger, onItemDeleted }: OrcamentoItensListProps) {
  const [itens, setItens] = React.useState<OrcamentoItem[]>([]);
  const [etapas, setEtapas] = React.useState<Etapa[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingItem, setEditingItem] = React.useState<OrcamentoItem | null>(null);

  const carregarDados = async () => {
    try {
      if (itens.length === 0) setLoading(true); // Only show generic loading on first load or if empty
      const [itensData, etapasData] = await Promise.all([
        getItens(orcamentoId),
        getEtapas(orcamentoId)
      ]);
      setItens(itensData);
      setEtapas(etapasData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    carregarDados();
  }, [orcamentoId, refreshTrigger]);

  const handleDelete = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) {
      return;
    }

    try {
      await deleteItem(orcamentoId, itemId);
      carregarDados();
      if (onItemDeleted) {
        onItemDeleted();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover item');
    }
  };

  const handleSuccessEdit = () => {
    setEditingItem(null);
    carregarDados();
    if (onItemDeleted) onItemDeleted(); // Refresh parent if needed (total value)
  };

  const renderTable = (listaItens: OrcamentoItem[]) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
          <tr>
            <th className="p-3 border-b">Código</th>
            <th className="p-3 border-b">Descrição</th>
            <th className="p-3 border-b text-center">Qtd</th>
            <th className="p-3 border-b text-center">Und</th>
            <th className="p-3 border-b text-right">Unitário</th>
            <th className="p-3 border-b text-right">Total</th>
            <th className="p-3 border-b text-center">Estado</th>
            <th className="p-3 border-b text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {listaItens.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="p-3 font-medium text-slate-700">{item.codigo_composicao}</td>
              <td className="p-3 text-slate-700">{item.descricao}</td>
              <td className="p-3 text-center text-slate-600">{item.quantidade.toLocaleString('pt-BR')}</td>
              <td className="p-3 text-center text-slate-600">{item.unidade}</td>
              <td className="p-3 text-right font-medium text-slate-700">
                {formatarMoeda(item.preco_unitario)}
              </td>
              <td className="p-3 text-right font-bold text-green-600">
                {formatarMoeda(item.preco_total)}
              </td>
              <td className="p-3 text-center">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold uppercase">
                  {item.estado}
                </span>
              </td>
              <td className="p-3 text-center">
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800 hover:underline cursor-pointer text-sm"
                  >
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const itensSemEtapa = itens.filter(i => !i.etapa_id);

  if (loading && itens.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-slate-500 text-center">Carregando itens...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <h3 className="text-lg font-bold text-slate-800">Itens do Orçamento</h3>
        {valorTotal !== null && (
          <div className="text-right">
            <p className="text-sm text-slate-600">Valor Total</p>
            <p className="text-2xl font-bold text-green-600">{formatarMoeda(valorTotal)}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {itens.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-500">
          <p>Nenhum item adicionado ainda.</p>
        </div>
      )}

      {/* Renderizar Itens por Etapa */}
      {etapas.map(etapa => {
        const itensDaEtapa = itens.filter(i => i.etapa_id === etapa.id);
        const totalEtapa = itensDaEtapa.reduce((acc, curr) => acc + (curr.preco_total || 0), 0);

        return (
          <div key={etapa.id} className="mb-8">
            <div className="flex justify-between items-end mb-2 border-b border-gray-200 pb-1">
              <h4 className="text-md font-bold text-[#1F5F7A] uppercase tracking-wide">
                {etapa.nome}
              </h4>
              <span className="text-sm font-semibold text-slate-600">
                Total: {formatarMoeda(totalEtapa)}
              </span>
            </div>

            {itensDaEtapa.length > 0 ? (
              renderTable(itensDaEtapa)
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded text-slate-400 text-sm italic text-center">
                Nenhum item nesta etapa.
              </div>
            )}
          </div>
        );
      })}

      {/* Itens Sem Etapa */}
      {itensSemEtapa.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2 border-b border-gray-200 pb-1">
            <h4 className="text-md font-bold text-slate-500 uppercase tracking-wide">
              Outros / Sem Etapa
            </h4>
            <span className="text-sm font-semibold text-slate-600">
              Total: {formatarMoeda(itensSemEtapa.reduce((acc, curr) => acc + (curr.preco_total || 0), 0))}
            </span>
          </div>
          {renderTable(itensSemEtapa)}
        </div>
      )}

      {/* Modal de Edição */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="" // Title is in the form
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {editingItem && (
            <OrcamentoItemForm
              orcamentoId={orcamentoId}
              estadoOrcamento={editingItem.estado} // Pass item's state or parent's state? Item has state, but form uses it to check prices. Usually same as budget.
              onItemAdded={handleSuccessEdit}
              itemToEdit={editingItem}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
