"use client";

import React, { useEffect, useState } from "react";
import { X, Package, HardHat, Wrench, Spinner, PencilSimple, Trash } from "@phosphor-icons/react";
import { getInsumos, updateInsumo, type OrcamentoItem, type OrcamentoItemInsumo } from "@/lib/api/orcamentos";

interface InsumosDrawerProps {
  orcamentoId: string;
  item: OrcamentoItem | null;
  onClose: () => void;
  onUpdate?: () => void;
  /** Mobile: o cartão do item abre esta folha, que oferece editar e remover no rodapé. */
  onEdit?: (item: OrcamentoItem) => void;
  onRemove?: (item: OrcamentoItem) => void;
}

// Cores da barra de composição do custo (mobile), na ordem dos grupos
const CORES_GRUPO = ["#00a3b1", "#001b3d", "#9fd300", "#F97316", "#94a3b8"];

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

export function InsumosDrawer({ orcamentoId, item, onClose, onUpdate, onEdit, onRemove }: InsumosDrawerProps) {
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

  // Participação de cada grupo no total (barra do mobile)
  const fatias = Object.entries(grupos).map(([tipo, lista], idx) => {
    const valor = lista.reduce((s, i) => s + (i.total || 0), 0);
    return {
      tipo,
      cor: CORES_GRUPO[idx % CORES_GRUPO.length],
      pct: totalInsumos > 0 ? (valor / totalInsumos) * 100 : 0,
    };
  });
  const fmtPct = (v: number) => `${Math.round(v)}%`;

  return (
    <>
      {/* Overlay */}
      <div className="gp-ov" onClick={onClose} aria-hidden="true" style={{ justifyContent: "flex-end", padding: 0 }} />

      {/* Drawer Panel */}
      <aside className="gp-drw gp-4b-ins" role="dialog" aria-modal="true" aria-labelledby="ins-titulo" style={{ width: "min(580px, 100%)" }}>
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

              {/* Mobile: composição do custo por grupo */}
              {totalInsumos > 0 && (
                <section className="gp-only-m" aria-labelledby="ins-comp">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <h3 id="ins-comp" style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Composição do custo</h3>
                    <div
                      role="img"
                      aria-label={fatias.map((f) => `${f.tipo.toLowerCase()} ${fmtPct(f.pct)}`).join(", ")}
                      style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", gap: 2 }}
                    >
                      {fatias.map((f) => (
                        <span key={f.tipo} style={{ width: `${f.pct}%`, minWidth: f.pct > 0 ? 4 : 0, background: f.cor }} />
                      ))}
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13 }}>
                      {fatias.map((f) => (
                        <li key={f.tipo} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: f.cor }} />
                          {f.tipo.charAt(0) + f.tipo.slice(1).toLowerCase()} <strong>{fmtPct(f.pct)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

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

                    <div className="gp-card gp-m-flat gp-4b-sem-borda" style={{ overflow: "hidden", border: "1px solid #E6EBF2" }}>
                      <table className="gp-stack" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                              <td className="gp-td" data-label="Qtd" style={{ textAlign: "right" }}>
                                <input
                                  type="number"
                                  aria-label={`Quantidade de ${ins.descricao}`}
                                  defaultValue={(ins.quantidade_unitaria / item.quantidade).toFixed(6)}
                                  className="gp-mono gp-4b-num"
                                  style={{ width: "100%", height: 34, border: "1px solid #CBD5E1", borderRadius: 8, textAlign: "right", fontSize: 13, padding: "0 6px" }}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) handleUpdateInsumo(ins.id, { quantidade_unitaria: val * item.quantidade });
                                  }}
                                />
                              </td>
                              <td className="gp-td" data-label="P. unit." style={{ textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                  <span className="gp-hint">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    aria-label={`Preço unitário de ${ins.descricao}`}
                                    defaultValue={(ins.preco_unitario_custom ?? ins.preco_unitario_base ?? 0).toFixed(2)}
                                    className="gp-mono gp-4b-num"
                                    style={{ width: 72, height: 34, border: "1px solid #CBD5E1", borderRadius: 8, textAlign: "right", fontSize: 13, padding: "0 6px" }}
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) handleUpdateInsumo(ins.id, { preco_unitario_custom: val });
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="gp-td gp-mono" data-label="Total" style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>
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

        {/* Mobile: o cartão do item abre esta folha, então editar e remover ficam aqui */}
        {(onEdit || onRemove) && (
          <div className="gp-only-m">
            <div className="gp-df" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {onRemove && (
                <button type="button" onClick={() => onRemove(item)} className="gp-btn gp-bs" style={{ color: "#B91C1C", minHeight: 52 }}>
                  <Trash size={18} weight="bold" aria-hidden="true" /> Remover
                </button>
              )}
              {onEdit && (
                <button type="button" onClick={() => onEdit(item)} className="gp-btn gp-bd" style={{ minHeight: 52, gridColumn: onRemove ? undefined : "1 / -1" }}>
                  <PencilSimple size={18} weight="bold" aria-hidden="true" /> Editar item
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
