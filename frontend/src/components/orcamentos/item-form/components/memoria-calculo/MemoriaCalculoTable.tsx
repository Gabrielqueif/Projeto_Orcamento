"use client";

import * as React from "react";
import { Trash, X } from "@phosphor-icons/react";
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
  const campo = {
    height: 36, border: "1px solid #7B8AA0", borderRadius: 10, padding: "0 8px",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#001b3d", background: "#fff",
  } as const;

  return (
    <section className="gp-card" style={{ overflow: "hidden" }}>
      <div style={{ overflow: "auto", minHeight: 140, maxHeight: 288 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <caption className="gp-sr">Elementos da memória de cálculo</caption>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Elemento / Local</th>
              {variableConfigs.map((cfg) => (
                <th key={cfg.id} scope="col" className="gp-th" style={{ whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <input
                      type="text"
                      value={cfg.label}
                      onChange={(e) => onUpdateColumnLabel(cfg.key, e.target.value)}
                      aria-label={`Nome da variável ${cfg.label}`}
                      style={{ background: "transparent", border: 0, borderBottom: "1px solid #CBD5E1", textAlign: "center", fontWeight: 800, fontSize: 12, textTransform: "uppercase", color: "#334155", maxWidth: 140 }}
                      title="Clique para editar o nome da variável"
                    />
                    {variableConfigs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveVariableColumn(cfg.key)}
                        aria-label={`Remover variável ${cfg.label}`}
                        title="Remover esta variável"
                        style={{ border: 0, background: "transparent", color: "#475569", cursor: "pointer", display: "inline-flex", padding: 2 }}
                      >
                        <X size={14} weight="bold" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Subtotal</th>
              <th scope="col" className="gp-th" style={{ textAlign: "center", width: 80, paddingRight: 22 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {elementos.length === 0 ? (
              <tr>
                <td colSpan={variableConfigs.length + 3} className="gp-td" style={{ textAlign: "center", padding: 32, color: "#475569" }}>
                  Nenhum elemento adicionado. Clique em &quot;Adicionar Elemento&quot; para começar.
                </td>
              </tr>
            ) : (
              elementos.map((el, index) => {
                const isDiscount = el.quantidade < 0;
                return (
                  <tr key={el.id} className="gp-row" style={isDiscount ? { background: "#FEF2F2" } : undefined}>
                    {/* ELEMENTO / DESCRIÇÃO */}
                    <td className="gp-td" style={{ paddingLeft: 22 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="gp-bg gp-ne gp-mono" title={`Código da variável: E${index + 1}`}>
                          E{index + 1}
                        </span>
                        <input
                          type="text"
                          value={el.descricao}
                          onChange={(e) => onUpdateElementoDescricao(el.id, e.target.value)}
                          aria-label={`Descrição do elemento E${index + 1}`}
                          style={{ ...campo, fontFamily: "inherit", fontWeight: 700, width: "100%", color: isDiscount ? "#B91C1C" : "#001b3d" }}
                          placeholder="Descrição do elemento"
                        />
                        {locais && locais.length > 0 && (
                          <select
                            aria-label={`Local do elemento E${index + 1}`}
                            onChange={(e) => {
                              if (e.target.value) {
                                onUpdateElementoDescricao(el.id, e.target.value);
                              }
                            }}
                            style={{ ...campo, fontFamily: "inherit", fontSize: 13, maxWidth: 130, cursor: "pointer" }}
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
                        <td key={cfg.id} className="gp-td" style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            value={val}
                            aria-label={`${cfg.label} do elemento E${index + 1}`}
                            onChange={(e) =>
                              onUpdateElementoVariable(el.id, cfg.key, e.target.value)
                            }
                            style={{
                              ...campo, width: 84, textAlign: "center",
                              ...(isDiscount && isQtdKey ? { borderColor: "#B91C1C", color: "#B91C1C", fontWeight: 600 } : null),
                            }}
                            step="any"
                          />
                        </td>
                      );
                    })}

                    {/* SUBTOTAL */}
                    <td
                      className="gp-td gp-mono"
                      style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", color: isDiscount ? "#B91C1C" : "#001b3d" }}
                    >
                      {el.subtotal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}{" "}
                      {unidade}
                    </td>

                    {/* AÇÕES */}
                    <td className="gp-td" style={{ textAlign: "center", paddingRight: 22 }}>
                      <button
                        type="button"
                        onClick={() => onRemoveElemento(el.id)}
                        className="gp-ib"
                        style={{ width: 40, height: 40, margin: "0 auto" }}
                        aria-label={`Remover elemento E${index + 1}`}
                        title="Remover Elemento"
                      >
                        <Trash size={18} weight="bold" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
