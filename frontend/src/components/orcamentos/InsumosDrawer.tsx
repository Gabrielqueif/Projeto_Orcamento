"use client";

import React, { useEffect, useState } from "react";
import { X, Package, HardHat, Wrench, Spinner } from "@phosphor-icons/react";
import { getInsumos, updateInsumo, type OrcamentoItem, type OrcamentoItemInsumo } from "@/lib/api/orcamentos";

interface InsumosDrawerProps {
  orcamentoId: string;
  item: OrcamentoItem | null;
  onClose: () => void;
  onUpdate?: () => void;
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  MATERIAL: <Package size={14} weight="fill" className="text-[#0EA5E9]" />,
  "MÃO DE OBRA": <HardHat size={14} weight="fill" className="text-[#F97316]" />,
  SERVIÇOS: <HardHat size={14} weight="fill" className="text-[#F97316]" />,
  EQUIPAMENTO: <Wrench size={14} weight="fill" className="text-[#A78BFA]" />,
};

const TIPO_COLORS: Record<string, string> = {
  MATERIAL: "bg-[#E0F2FE] text-[#0369A1]",
  "MÃO DE OBRA": "bg-[#FFF7ED] text-[#C2410C]",
  SERVIÇOS: "bg-[#FFF7ED] text-[#C2410C]",
  EQUIPAMENTO: "bg-[#EDE9FE] text-[#6D28D9]",
};

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function InsumosDrawer({ orcamentoId, item, onClose, onUpdate }: InsumosDrawerProps) {
  const [insumos, setInsumos] = useState<OrcamentoItemInsumo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    getInsumos(orcamentoId, item.id)
      .then(setInsumos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orcamentoId, item]);

  const handleUpdateInsumo = async (insumoId: string, data: Partial<OrcamentoItemInsumo>) => {
    if (!item) return;
    try {
      await updateInsumo(orcamentoId, item.id, insumoId, data);
      const newData = await getInsumos(orcamentoId, item.id);
      setInsumos(newData);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert("Erro ao atualizar insumo.");
    }
  };


  if (!item) return null;

  // Agrupa por tipo_item
  const grupos = insumos.reduce<Record<string, OrcamentoItemInsumo[]>>((acc, ins) => {
    const tipo = ins.tipo_item?.toUpperCase() || "OUTROS";
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(ins);
    return acc;
  }, {});

  const totalInsumos = insumos.reduce((acc, i) => acc + (i.total || 0), 0);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[580px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-bg-dark text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#8C9CAB] uppercase tracking-widest mb-1">
                COMPOSIÇÃO · {item.codigo_composicao}
              </p>
              <h2 className="text-base font-bold leading-snug line-clamp-2" title={item.descricao}>
                {item.descricao}
              </h2>
              <p className="text-sm text-[#8C9CAB] mt-1">
                {item.quantidade} {item.unidade} · {formatCurrency(item.preco_total)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-text-muted">
              <Spinner size={20} className="animate-spin" />
              Carregando insumos...
            </div>
          ) : insumos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-8 text-text-muted">
              <Package size={40} className="mb-3 opacity-30" />
              <p className="font-semibold text-sm">Nenhum insumo encontrado.</p>
              <p className="text-xs mt-1">
                Reimporte a planilha SINAPI para que os dados analíticos sejam carregados.
              </p>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-6">
              {/* Totalizador */}
              <div className="bg-bg-light border border-border rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                  Total dos Insumos
                </span>
                <span className="text-lg font-bold text-text-main">
                  {formatCurrency(totalInsumos)}
                </span>
              </div>

              {/* Grupos */}
              {Object.entries(grupos).map(([tipo, itens]) => {
                const subtotal = itens.reduce((s, i) => s + (i.total || 0), 0);
                return (
                  <div key={tipo}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${TIPO_COLORS[tipo] || "bg-bg-light text-text-muted"}`}
                      >
                        {TIPO_ICONS[tipo] || null}
                        {tipo}
                      </span>
                      <span className="text-xs text-text-muted font-semibold ml-auto">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-bg-light border-b border-border">
                            <th className="text-left px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wide">Insumo</th>
                            <th className="text-right px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wide w-20">Qtd</th>
                            <th className="text-right px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wide w-24">P. Unit.</th>
                            <th className="text-right px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wide w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map((ins) => (
                            <tr key={ins.id} className="border-b border-border last:border-0 hover:bg-bg-light transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-xs font-semibold text-text-main leading-snug line-clamp-2" title={ins.descricao}>
                                  {ins.descricao}
                                </div>
                                <div className="text-[10px] text-text-muted mt-0.5">
                                  {ins.codigo_insumo} · {ins.unidade}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-text-muted font-medium">
                                <input 
                                  type="number"
                                  defaultValue={(ins.quantidade_unitaria / item.quantidade).toFixed(6)}
                                  className="w-full bg-transparent border-none text-right outline-none focus:ring-1 focus:ring-brand-primary rounded px-1"
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) handleUpdateInsumo(ins.id, { quantidade_unitaria: val * item.quantidade });
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-text-muted">
                                <div className="flex items-center justify-end">
                                  <span className="text-[10px] mr-1">R$</span>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    defaultValue={(ins.preco_unitario_custom ?? ins.preco_unitario_base ?? 0).toFixed(2)}
                                    className="w-16 bg-transparent border-none text-right outline-none focus:ring-1 focus:ring-brand-primary rounded px-1"
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) handleUpdateInsumo(ins.id, { preco_unitario_custom: val });
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-xs font-semibold text-text-main">
                                {formatCurrency(ins.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
