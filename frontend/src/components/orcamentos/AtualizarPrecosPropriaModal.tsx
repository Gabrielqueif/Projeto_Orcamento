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
      maxWidth="max-w-3xl gp-4b-tela"
    >
      {loading || !previa ? (
        <p className="gp-sub" style={{ textAlign: "center", padding: "24px 0", margin: 0 }}>Calculando prévia...</p>
      ) : (
        <div className="gp-4b-corpo" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <dl className="gp-4b-ap-res" style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "#F4F6FA" }}>
              <dt className="gp-ml">Itens verificados</dt>
              <dd className="gp-mono" style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 600 }}>{previa.total_itens}</dd>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "#FFEDD5", color: "#9A3412" }}>
              <dt style={{ fontSize: 13, fontWeight: 700 }}>Itens alterados</dt>
              <dd className="gp-mono" style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 600 }}>{previa.itens_alterados}</dd>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "#F4F6FA" }}>
              <dt className="gp-ml">Diferença no custo direto</dt>
              <dd
                className="gp-mono"
                style={{
                  margin: "2px 0 0",
                  fontSize: 22,
                  fontWeight: 600,
                  color: previa.diferenca_custo_direto > 0 ? "#9A3412" : previa.diferenca_custo_direto < 0 ? "#3F6604" : "#001b3d",
                }}
              >
                {moeda(previa.diferenca_custo_direto)}
              </dd>
            </div>
          </dl>

          {semMudancas ? (
            <p className="gp-sub" style={{ textAlign: "center", padding: "16px 0", margin: 0 }}>
              Os preços dos itens de bases próprias já estão atualizados.
            </p>
          ) : (
            <div className="gp-m-flat gp-4b-sem-borda" style={{ overflowX: "auto", border: "1px solid #E6EBF2", borderRadius: 14 }}>
              <table className="gp-stack" style={{ width: "100%", borderCollapse: "collapse" }}>
                <caption className="gp-sr">Itens com diferença de preço</caption>
                <thead>
                  <tr>
                    <th scope="col" className="gp-th">Código</th>
                    <th scope="col" className="gp-th">Descrição</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Preço atual</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Preço novo</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Diferença</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {alterados.map((item) => (
                    <tr key={item.item_id} className="gp-row">
                      <td className="gp-td gp-mono" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{item.codigo_composicao}</td>
                      <th scope="row" className="gp-td" style={{ textAlign: "left", fontWeight: 700 }}>{item.descricao}</th>
                      <td className="gp-td gp-mono" data-label="Preço atual" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{moeda(item.preco_atual)}</td>
                      <td className="gp-td gp-mono" data-label="Preço novo" style={{ textAlign: "right", whiteSpace: "nowrap", fontWeight: 600 }}>{moeda(item.preco_novo)}</td>
                      <td className="gp-td gp-mono" data-label="Diferença" style={{ textAlign: "right", whiteSpace: "nowrap", fontWeight: 600, color: item.diferenca > 0 ? "#9A3412" : "#3F6604" }}>
                        {moeda(item.diferenca)}
                      </td>
                      <td className="gp-td" data-label="Variação" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <span className={`gp-bg ${item.diferenca > 0 ? "gp-wa" : "gp-ok"}`}>{percentual(item.variacao_percentual)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ignorados.length > 0 && (
            <div style={{ padding: 14, borderRadius: 14, background: "#FFEDD5", color: "#7C2D12" }}>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800 }}>Itens ignorados ({ignorados.length})</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                {ignorados.map((ig) => (
                  <li key={ig.item_id}>
                    <strong>{ig.codigo_composicao}</strong>: {ig.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="gp-4b-pe" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} disabled={confirmando} className="gp-btn gp-bs" style={confirmando ? { opacity: 0.5 } : undefined}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={confirmando || alterados.length === 0}
              className="gp-btn gp-bp"
              style={confirmando || alterados.length === 0 ? { opacity: 0.5 } : undefined}
            >
              {confirmando ? "Aplicando..." : "Confirmar atualização"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
