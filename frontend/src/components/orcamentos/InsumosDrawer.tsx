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

const TIPO_COLORS: Record<string, React.CSSProperties> = {
  MATERIAL: { background: "#e0f5f7", color: "#00626b" },
  "MÃO DE OBRA": { background: "#FFEDD5", color: "#9A3412" },
  SERVIÇOS: { background: "#FFEDD5", color: "#9A3412" },
  EQUIPAMENTO: { background: "#EDF1F6", color: "#001b3d" },
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
      <div className="gp-ov" onClick={onClose} aria-hidden="true" style={{ justifyContent: "flex-end", padding: 0 }} />

      {/* Drawer Panel */}
      <aside className="gp-drw" role="dialog" aria-modal="true" aria-labelledby="ins-titulo" style={{ width: "min(580px, 100%)" }}>
        <div className="gp-dh" style={{ alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <p className="gp-ml gp-mono" style={{ margin: 0 }}>
              Composição · {item.codigo_composicao}
            </p>
            <h2 id="ins-titulo" className="gp-h2" style={{ marginTop: 4, lineHeight: 1.35 }} title={item.descricao}>
              {item.descricao}
            </h2>
            <p className="gp-hint" style={{ margin: "4px 0 0" }}>
              {item.quantidade} {item.unidade} · {formatCurrency(item.preco_total)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="gp-ib" aria-label="Fechar">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="gp-db">
          {loading ? (
            <div role="status" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, height: 192, color: "#475569" }}>
              <Spinner size={20} weight="bold" className="animate-spin" aria-hidden="true" />
              Carregando insumos...
            </div>
          ) : insumos.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 192, textAlign: "center", color: "#475569" }}>
              <Package size={40} weight="bold" aria-hidden="true" style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 800 }}>Nenhum insumo encontrado.</p>
              <p className="gp-hint" style={{ margin: "4px 0 0" }}>
                Reimporte a planilha SINAPI para que os dados analíticos sejam carregados.
              </p>
            </div>
          ) : (
            <>
              {/* Totalizador */}
              <div className="gp-card gp-pad gp-dark" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="gp-ml">Total dos insumos</span>
                <span className="gp-mono" style={{ fontSize: 22, fontWeight: 600 }}>{formatCurrency(totalInsumos)}</span>
              </div>

              {/* Grupos */}
              {Object.entries(grupos).map(([tipo, itens]) => {
                const subtotal = itens.reduce((s, i) => s + (i.total || 0), 0);
                return (
                  <section key={tipo} aria-label={tipo}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span className="gp-bg" style={TIPO_COLORS[tipo] || { background: "#EDF1F6", color: "#334155" }}>
                        {TIPO_ICONS[tipo] || null}
                        {tipo}
                      </span>
                      <span className="gp-mono" style={{ marginLeft: "auto", fontWeight: 600 }}>
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="gp-card" style={{ overflow: "hidden", border: "1px solid #E6EBF2" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <caption className="gp-sr">Insumos do grupo {tipo}</caption>
                        <thead>
                          <tr>
                            <th scope="col" className="gp-th">Insumo</th>
                            <th scope="col" className="gp-th" style={{ textAlign: "right", width: 84 }}>Qtd</th>
                            <th scope="col" className="gp-th" style={{ textAlign: "right", width: 104 }}>P. unit.</th>
                            <th scope="col" className="gp-th" style={{ textAlign: "right", width: 96 }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map((ins) => (
                            <tr key={ins.id} className="gp-row">
                              <th scope="row" className="gp-td" style={{ textAlign: "left", fontWeight: 700 }}>
                                <span style={{ display: "block", fontSize: 13, lineHeight: 1.35 }} title={ins.descricao}>
                                  {ins.descricao}
                                </span>
                                <span className="gp-hint gp-mono" style={{ fontWeight: 500 }}>
                                  {ins.codigo_insumo} · {ins.unidade}
                                </span>
                              </th>
                              <td className="gp-td" style={{ textAlign: "right" }}>
                                <input
                                  type="number"
                                  aria-label={`Quantidade de ${ins.descricao}`}
                                  defaultValue={(ins.quantidade_unitaria / item.quantidade).toFixed(6)}
                                  className="gp-mono"
                                  style={{ width: "100%", height: 34, border: "1px solid #CBD5E1", borderRadius: 8, textAlign: "right", fontSize: 13, padding: "0 6px" }}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) handleUpdateInsumo(ins.id, { quantidade_unitaria: val * item.quantidade });
                                  }}
                                />
                              </td>
                              <td className="gp-td" style={{ textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                  <span className="gp-hint">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    aria-label={`Preço unitário de ${ins.descricao}`}
                                    defaultValue={(ins.preco_unitario_custom ?? ins.preco_unitario_base ?? 0).toFixed(2)}
                                    className="gp-mono"
                                    style={{ width: 72, height: 34, border: "1px solid #CBD5E1", borderRadius: 8, textAlign: "right", fontSize: 13, padding: "0 6px" }}
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) handleUpdateInsumo(ins.id, { preco_unitario_custom: val });
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                                {formatCurrency(ins.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
