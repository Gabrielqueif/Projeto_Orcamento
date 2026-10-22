"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import type { AtualizacaoPrecosPropriaResponse } from "@/lib/api/orcamentos";

interface AtualizarPrecosPropriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Prévia retornada por `aplicar=false`; null enquanto carrega. */
  previa: AtualizacaoPrecosPropriaResponse | null;
  loading?: boolean;
  confirmando?: boolean;
  onConfirmar: () => void;
}

const moeda = (valor: number | null | undefined) =>
  valor == null
    ? "-"
    : valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const percentual = (valor: number | null | undefined) =>
  valor == null ? "-" : `${valor > 0 ? "+" : ""}${valor.toFixed(2).replace(".", ",")}%`;

export function AtualizarPrecosPropriaModal({
  isOpen,
  onClose,
  previa,
  loading = false,
  confirmando = false,
  onConfirmar,
}: AtualizarPrecosPropriaModalProps) {
  const alterados = previa?.itens.filter((i) => i.alterado) ?? [];
  const ignorados = previa?.ignorados ?? [];
  const semMudancas = previa !== null && alterados.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atualizar preços da base própria"
      maxWidth="max-w-3xl"
    >
      {loading || !previa ? (
        <p className="text-sm text-slate-500 py-6 text-center">Calculando prévia...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-[10px] uppercase font-bold text-slate-500">Itens verificados</p>
              <p className="text-lg font-bold text-slate-800">{previa.total_itens}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-[10px] uppercase font-bold text-slate-500">Itens alterados</p>
              <p className="text-lg font-bold text-slate-800">{previa.itens_alterados}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-[10px] uppercase font-bold text-slate-500">Diferença no custo direto</p>
              <p
                className={`text-lg font-bold ${
                  previa.diferenca_custo_direto > 0
                    ? "text-red-600"
                    : previa.diferenca_custo_direto < 0
                      ? "text-emerald-600"
                      : "text-slate-800"
                }`}
              >
                {moeda(previa.diferenca_custo_direto)}
              </p>
            </div>
          </div>

          {semMudancas ? (
            <p className="text-sm text-slate-600 text-center py-4">
              Os preços dos itens de bases próprias já estão atualizados.
            </p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="text-left p-2">Código</th>
                    <th className="text-left p-2">Descrição</th>
                    <th className="text-right p-2">Preço atual</th>
                    <th className="text-right p-2">Preço novo</th>
                    <th className="text-right p-2">Diferença</th>
                    <th className="text-right p-2">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {alterados.map((item) => (
                    <tr key={item.item_id} className="border-t border-slate-100">
                      <td className="p-2 font-semibold whitespace-nowrap">{item.codigo_composicao}</td>
                      <td className="p-2">{item.descricao}</td>
                      <td className="p-2 text-right whitespace-nowrap">{moeda(item.preco_atual)}</td>
                      <td className="p-2 text-right whitespace-nowrap">{moeda(item.preco_novo)}</td>
                      <td
                        className={`p-2 text-right whitespace-nowrap font-semibold ${
                          item.diferenca > 0 ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {moeda(item.diferenca)}
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        {percentual(item.variacao_percentual)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ignorados.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs font-bold text-amber-800 mb-2">
                Itens ignorados ({ignorados.length})
              </p>
              <ul className="text-xs text-amber-900 space-y-1">
                {ignorados.map((ig) => (
                  <li key={ig.item_id}>
                    <span className="font-semibold">{ig.codigo_composicao}</span>: {ig.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={confirmando}
              className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={confirmando || alterados.length === 0}
              className="px-4 py-2 rounded-md bg-brand-primary hover:bg-brand-navy text-white text-sm font-bold cursor-pointer disabled:opacity-50"
            >
              {confirmando ? "Aplicando..." : "Confirmar atualização"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
