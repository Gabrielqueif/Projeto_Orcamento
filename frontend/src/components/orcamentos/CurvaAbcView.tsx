"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { getOrcamentoCurvaABC, type CurvaABCResponse } from "@/lib/api/orcamentos";

interface CurvaAbcViewProps {
  orcamentoId: string;
}

// [cor da barra/letra, cor do texto sobre ela, estilo do selo]
const CLASSES: Record<string, { cor: string; texto: string; selo: React.CSSProperties }> = {
  A: { cor: "#001b3d", texto: "#fff", selo: { background: "#001b3d", color: "#fff" } },
  B: { cor: "#00a3b1", texto: "#001b3d", selo: { background: "#e0f5f7", color: "#00626b" } },
  C: { cor: "#9fd300", texto: "#001b3d", selo: { background: "#E6F6D0", color: "#3F6604" } },
};

const fmtPct = (v: number) => `${v.toFixed(1).replace(".", ",")}%`;

export function CurvaAbcView({ orcamentoId }: CurvaAbcViewProps) {
  const [data, setData] = useState<CurvaABCResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todas");

  useEffect(() => {
    async function fetchABC() {
      try {
        setLoading(true);
        const res = await getOrcamentoCurvaABC(orcamentoId);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar Curva ABC:", err);
      } finally {
        setLoading(false);
      }
    }
    if (orcamentoId) {
      fetchABC();
    }
  }, [orcamentoId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (loading) {
    return (
      <div role="status" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 48, fontSize: 14, color: "#475569" }}>
        <Spinner size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        <span>Calculando Curva ABC...</span>
      </div>
    );
  }

  if (!data || data.insumos.length === 0) {
    return (
      <div className="gp-card" style={{ padding: 48, textAlign: "center", fontSize: 14, color: "#475569" }}>
        Nenhum insumo disponível para gerar a Curva ABC. Adicione composições à planilha orçamentária.
      </div>
    );
  }

  const total = data.valor_total;
  const visiveis = data.insumos.filter((i) => filtro === "todas" || i.classe === filtro);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Filtro por classe */}
      <div role="group" aria-label="Filtrar por classe" className="gp-grid gp-4b-abc-cl" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {["A", "B", "C"].map((k) => {
          const ativo = filtro === k;
          const itens = data.insumos.filter((i) => i.classe === k).length;
          const valor = data.resumo_classes[k] || 0;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={ativo}
              onClick={() => setFiltro(ativo ? "todas" : k)}
              className="gp-card"
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", cursor: "pointer", color: "#001b3d",
                border: ativo ? "2px solid #001b3d" : "1px solid #E6EBF2",
              }}
            >
              <span
                style={{
                  width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 800, background: CLASSES[k].cor, color: CLASSES[k].texto,
                }}
              >
                {k}
              </span>
              <span style={{ textAlign: "left" }}>
                <strong className="gp-mono" style={{ display: "block", fontSize: 24 }}>
                  {total > 0 ? fmtPct((valor / total) * 100) : "0,0%"}
                </strong>
                <span className="gp-4b-abc-txt" style={{ fontSize: 14 }}>do custo · {itens} itens</span>
                <span className="gp-hint" style={{ display: "block" }}>{formatCurrency(valor)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <section className="gp-card" aria-labelledby="h-rk" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "16px 22px", borderBottom: "1px solid #E6EBF2" }}>
          <h2 id="h-rk" className="gp-h2">
            {filtro === "todas" ? "Itens por custo" : `Itens da classe ${filtro}`}
          </h2>
          <span className="gp-hint" aria-live="polite">
            {visiveis.length} itens mostrados · custo direto total {formatCurrency(total)}
          </span>
        </div>
        {/* Mobile: ranking em lista (posição, insumo, classe, valor, % e % acumulado) */}
        <ol className="gp-only-m" aria-label="Ranking da curva ABC" style={{ margin: 0, padding: 6, listStyle: "none" }}>
          {visiveis.map((item, idx) => {
            const pos = data.insumos.indexOf(item) + 1;
            const cl = CLASSES[item.classe] ?? CLASSES.C;
            return (
              <li
                key={item.codigo_insumo}
                style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) auto", gap: 10, alignItems: "center", padding: "12px 10px", borderTop: idx > 0 ? "1px solid #E6EBF2" : undefined }}
              >
                <span className="gp-mono" style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{String(pos).padStart(2, "0")}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <strong style={{ fontSize: 14, lineHeight: 1.3, overflowWrap: "anywhere" }}>{item.descricao}</strong>
                  <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <span style={{ ...cl.selo, fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>{item.classe}</span>
                    <span className="gp-mono" style={{ fontSize: 12, color: "#475569" }}>{formatCurrency(item.total)}</span>
                  </span>
                </span>
                <span className="gp-mono" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <strong style={{ fontSize: 14 }}>{fmtPct(item.porcentagem)}</strong>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    <span className="gp-sr">acumulado </span>
                    {fmtPct(item.acumulado)}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="gp-only-d" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <caption className="gp-sr">Ranking da curva ABC</caption>
            <thead>
              <tr>
                <th scope="col" className="gp-th" style={{ paddingLeft: 22, width: 40 }}>#</th>
                <th scope="col" className="gp-th">Insumo</th>
                <th scope="col" className="gp-th">Classe</th>
                <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Valor</th>
                <th scope="col" className="gp-th" style={{ width: 240 }}>% do total</th>
                <th scope="col" className="gp-th" style={{ textAlign: "right", paddingRight: 22 }}>% acumulado</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((item) => {
                const pos = data.insumos.indexOf(item) + 1;
                const cl = CLASSES[item.classe] ?? CLASSES.C;
                return (
                  <tr key={item.codigo_insumo} className="gp-row">
                    <td className="gp-td gp-mono" style={{ paddingLeft: 22, color: "#475569" }}>{pos}</td>
                    <th scope="row" className="gp-td" style={{ textAlign: "left", fontWeight: 700 }}>
                      {item.descricao}
                      <span className="gp-hint gp-mono" style={{ display: "block", fontWeight: 500 }}>
                        {item.codigo_insumo} · {item.unidade}
                      </span>
                    </th>
                    <td className="gp-td">
                      <span className="gp-bg" style={cl.selo}>{item.classe}</span>
                    </td>
                    <td className="gp-td gp-mono" style={{ textAlign: "right" }}>{formatCurrency(item.total)}</td>
                    <td className="gp-td">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="gp-bar" style={{ flex: "1 1 auto" }}>
                          <span style={{ width: `${Math.min(100, Math.max(item.porcentagem, 0) * 4)}%`, background: cl.cor }} />
                        </span>
                        <span className="gp-mono" style={{ minWidth: 50, textAlign: "right" }}>{fmtPct(item.porcentagem)}</span>
                      </span>
                    </td>
                    <td className="gp-td gp-mono" style={{ textAlign: "right", paddingRight: 22, fontWeight: 600 }}>
                      {fmtPct(item.acumulado)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
