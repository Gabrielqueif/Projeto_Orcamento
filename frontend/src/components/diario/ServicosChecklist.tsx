"use client";

import { useState } from "react";
import type { ServicoObra } from "@/lib/api/diario";

export type ServicosFeitos = Record<string, { qtd: string; pct: string }>;

// Quantidade e % do serviço andam juntos: digitar um calcula o outro (% sobre a quantidade orçada).
export function arredondar(n: number, casas: number): string {
  return Number.isFinite(n) ? String(Number(n.toFixed(casas))) : "";
}
export const paraNumero = (texto: string) => Number(texto.replace(",", "."));

interface Props {
  servicos: ServicoObra[];
  feitos: ServicosFeitos;
  onChange: (atualizar: (atual: ServicosFeitos) => ServicosFeitos) => void;
  /** O que sobra do orçado, já descontando o que este mesmo diário lançou. */
  restanteDe: (servico: ServicoObra) => number;
}

/** Checklist de serviços executados no dia (busca, quantidade e % ligados). Compartilhado pelo modal e pelo canteiro. */
export function ServicosChecklist({ servicos, feitos, onChange: setFeitos, restanteDe }: Props) {
  const [busca, setBusca] = useState("");

  const marcar = (id: string, marcado: boolean) =>
    setFeitos((atual) => {
      if (marcado) return { ...atual, [id]: { qtd: "", pct: "" } };
      return Object.fromEntries(Object.entries(atual).filter(([chave]) => chave !== id));
    });
  const digitarQuantidade = (servico: ServicoObra, qtd: string) =>
    setFeitos((atual) => ({
      ...atual,
      [servico.id]: { qtd, pct: qtd.trim() === "" ? "" : arredondar((paraNumero(qtd) / servico.quantidade) * 100, 1) },
    }));
  const digitarPercentual = (servico: ServicoObra, pct: string) =>
    setFeitos((atual) => ({
      ...atual,
      [servico.id]: { pct, qtd: pct.trim() === "" ? "" : arredondar((paraNumero(pct) / 100) * servico.quantidade, 3) },
    }));

  const termo = busca.trim().toLowerCase();
  // Serviços já concluídos em outros diários vão para o fim da lista.
  const visiveis = servicos
    .filter((s) => !termo || `${s.codigo ?? ""} ${s.descricao} ${s.etapa_nome ?? ""}`.toLowerCase().includes(termo))
    .sort((a, b) => Number(restanteDe(a) === 0) - Number(restanteDe(b) === 0));

  if (servicos.length === 0) return null;
  return (
    <>
        
          <div className="gp-4d-sec">
          <div className="gp-fld">
            <span className="gp-lb">Serviços executados ({Object.keys(feitos).length} marcados)</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar serviço por código, nome ou etapa"
              aria-label="Buscar serviço"
              className="gp-in"
            />
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 288, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {visiveis.map((servico) => {
                const feito = feitos[servico.id];
                const restante = restanteDe(servico);
                const concluido = restante === 0;
                return (
                  <li
                    key={servico.id}
                    style={{
                      border: `1px solid ${concluido ? "#65A30D" : "#E6EBF2"}`,
                      background: concluido ? "#E6F6D0" : "#fff",
                      borderRadius: 12,
                      padding: "10px 12px",
                    }}
                  >
                    <label
                      style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: concluido ? "#3F6604" : "#001b3d", cursor: concluido ? "default" : "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={!!feito}
                        disabled={concluido}
                        onChange={(e) => marcar(servico.id, e.target.checked)}
                        className="gp-4d-chk"
                        style={{ marginTop: 3, width: 16, height: 16, flex: "0 0 auto" }}
                      />
                      <span style={{ flex: 1 }}>
                        {servico.descricao}
                        <span className="gp-hint" style={{ display: "block", color: concluido ? "#3F6604" : undefined }}>
                          {[servico.codigo, servico.etapa_nome].filter(Boolean).join(" · ")}
                          {" · "}
                          {concluido
                            ? `concluído (100% de ${servico.quantidade} ${servico.unidade})`
                            : `falta ${restante} de ${servico.quantidade} ${servico.unidade}`}
                        </span>
                      </span>
                    </label>
                    {feito && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingLeft: 24 }}>
                        <input
                          inputMode="decimal"
                          aria-label={`Quantidade de ${servico.descricao}`}
                          value={feito.qtd}
                          placeholder="0"
                          onChange={(e) => digitarQuantidade(servico, e.target.value)}
                          className="gp-in gp-mono gp-4d-num"
                          style={{ width: 96, height: 40, textAlign: "right", fontSize: 14 }}
                        />
                        <span className="gp-hint">{servico.unidade}</span>
                        <input
                          inputMode="decimal"
                          aria-label={`Percentual de ${servico.descricao}`}
                          value={feito.pct}
                          placeholder="0"
                          onChange={(e) => digitarPercentual(servico, e.target.value)}
                          className="gp-in gp-mono gp-4d-num"
                          style={{ width: 80, height: 40, textAlign: "right", fontSize: 14 }}
                        />
                        <span className="gp-hint">%</span>
                      </div>
                    )}
                  </li>
                );
              })}
              {visiveis.length === 0 && <li className="gp-hint">Nenhum serviço encontrado.</li>}
            </ul>
            <p className="gp-hint" style={{ margin: 0 }}>
              Marque o que foi feito no dia e informe a quantidade ou o percentual do serviço: um calcula o outro.
            </p>
          </div>
          </div>
        
    </>
  );
}
