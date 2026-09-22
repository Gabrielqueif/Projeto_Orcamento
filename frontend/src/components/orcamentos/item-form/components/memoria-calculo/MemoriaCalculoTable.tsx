"use client";

import * as React from "react";
import type { VariableConfig, MemoriaCalculoElemento } from "../../types";

interface MemoriaCalculoTableProps {
  elementos: MemoriaCalculoElemento[];
  variableConfigs: VariableConfig[];
  unidade?: string;
  locais?: Array<string | { nome?: string }> | null;
  onUpdateElementoVariable: (id: string, key: string, rawVal: string) => void;
  onUpdateElementoDescricao: (id: string, desc: string) => void;
  onRemoveElemento: (id: string) => void;
  onUpdateColumnLabel: (key: string, newLabel: string) => void;
  onRemoveVariableColumn: (key: string) => void;
  getElementVariableValue: (el: MemoriaCalculoElemento, key: string) => number;
}

export function MemoriaCalculoTable({
  elementos,
  variableConfigs,
  unidade = "m²",
  locais = [],
  onUpdateElementoVariable,
  onUpdateElementoDescricao,
  onRemoveElemento,
  onUpdateColumnLabel,
  onRemoveVariableColumn,
  getElementVariableValue,
}: MemoriaCalculoTableProps) {
  return (
    <div className="shrink-0 border border-[#c4c6cf] rounded-[12px] overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto overflow-y-auto min-h-[140px] max-h-60 sm:max-h-72">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#f1f4f6] shadow-sm">
            <tr className="bg-[#f1f4f6] text-[#44474e] font-bold text-xs uppercase border-b border-[#c4c6cf]">
              <th className="px-4 py-4 w-1/3">ELEMENTO / DESCRIÇÃO</th>
              {variableConfigs.map((cfg) => (
                <th key={cfg.id} className="px-4 py-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={cfg.label}
                      onChange={(e) => onUpdateColumnLabel(cfg.key, e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-400 focus:border-brand-primary text-center font-bold text-xs uppercase outline-none max-w-[140px]"
                      title="Clique para editar o nome da variável"
                    />
                    {variableConfigs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveVariableColumn(cfg.key)}
                        className="text-slate-400 hover:text-red-500 text-xs p-0.5 rounded transition-colors cursor-pointer"
                        title="Remover esta variável"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-4 text-right">SUBTOTAL</th>
              <th className="px-4 py-4 text-center w-20">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c4c6cf]">
            {elementos.length === 0 ? (
              <tr>
                <td
                  colSpan={variableConfigs.length + 3}
                  className="text-center py-8 text-slate-400 italic text-sm"
                >
                  Nenhum elemento adicionado. Clique em &quot;Adicionar Elemento&quot; para começar.
                </td>
              </tr>
            ) : (
              elementos.map((el, index) => {
                const isDiscount = el.quantidade < 0;
                return (
                  <tr
                    key={el.id}
                    className={`transition-colors ${
                      isDiscount
                        ? "bg-[rgba(255,218,214,0.15)] hover:bg-[rgba(255,218,214,0.25)]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* ELEMENTO / DESCRIÇÃO */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs text-slate-500 font-bold bg-slate-100 rounded px-1.5 py-0.5"
                          title={`Código da variável: E${index + 1}`}
                        >
                          E{index + 1}
                        </span>
                        <input
                          type="text"
                          value={el.descricao}
                          onChange={(e) => onUpdateElementoDescricao(el.id, e.target.value)}
                          className={`w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-primary outline-none py-1 text-sm ${
                            isDiscount ? "text-[#ba1a1a] font-semibold" : "text-[#181c1e]"
                          }`}
                          placeholder="Descrição do elemento"
                        />
                        {locais && locais.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                onUpdateElementoDescricao(el.id, e.target.value);
                              }
                            }}
                            className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-600 cursor-pointer max-w-[120px]"
                          >
                            <option value="">Locais...</option>
                            {locais.map((loc, idx) => {
                              const value = typeof loc === "string" ? loc : loc?.nome || "";
                              return (
                                <option key={idx} value={value}>
                                  {value}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    </td>

                    {/* VARIÁVEIS ATIVAS */}
                    {variableConfigs.map((cfg) => {
                      const val = getElementVariableValue(el, cfg.key);
                      const isQtdKey = cfg.key === "quantidade";
                      return (
                        <td key={cfg.id} className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) =>
                              onUpdateElementoVariable(el.id, cfg.key, e.target.value)
                            }
                            className={`w-20 mx-auto text-center border rounded-md py-1 text-sm outline-none transition-all ${
                              isDiscount && isQtdKey
                                ? "bg-[rgba(255,218,214,0.3)] border-[rgba(186,26,26,0.4)] text-[#ba1a1a] font-bold focus:ring-1 focus:ring-red-500"
                                : "border-slate-300 text-[#181c1e] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            }`}
                            step="any"
                          />
                        </td>
                      );
                    })}

                    {/* SUBTOTAL */}
                    <td
                      className={`px-4 py-3 text-right text-sm font-bold whitespace-nowrap ${
                        isDiscount ? "text-[#ba1a1a]" : "text-[#181c1e]"
                      }`}
                    >
                      {el.subtotal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}{" "}
                      {unidade}
                    </td>

                    {/* AÇÕES */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveElemento(el.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-all active:scale-90 cursor-pointer"
                        title="Remover Elemento"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
