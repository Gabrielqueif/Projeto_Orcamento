"use client";

import React, { useEffect, useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { getOrcamentoCronograma, type CronogramaResponse } from "@/lib/api/orcamentos";

interface CronogramaFinanceiroViewProps {
  orcamentoId: string;
}

export function CronogramaFinanceiroView({ orcamentoId }: CronogramaFinanceiroViewProps) {
  const [data, setData] = useState<CronogramaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCronograma() {
      try {
        setLoading(true);
        const res = await getOrcamentoCronograma(orcamentoId);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar Cronograma:", err);
      } finally {
        setLoading(false);
      }
    }
    if (orcamentoId) {
      fetchCronograma();
    }
  }, [orcamentoId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (loading) {
    return (
      <div role="status" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 48, fontSize: 14, color: "#475569" }}>
        <Spinner size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        <span>Calculando Cronograma Financeiro...</span>
      </div>
    );
  }

  if (!data || data.mensal.length === 0) {
    return (
      <div className="gp-card" style={{ padding: 48, textAlign: "center", fontSize: 14, color: "#475569" }}>
        Nenhuma etapa com custos associados disponível para gerar o Cronograma Físico-Financeiro.
      </div>
    );
  }

  const mensalData = data.mensal;
  const maxVal = Math.max(...mensalData.map((item) => item.valor), 1);
  const picoIndex = mensalData.reduce(
    (maxIdx, item, idx, arr) => (item.valor > arr[maxIdx].valor ? idx : maxIdx),
    0
  );
  const mil = (v: number) => `${(v / 1000).toFixed(0)} mil`;
  const ariaGrafico =
    "Desembolso mensal: " + mensalData.map((m) => `${m.mes} ${mil(m.valor)}`).join("; ") + ".";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section className="gp-card" aria-labelledby="h-cf">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 22px", borderBottom: "1px solid #E6EBF2" }}>
          <div>
            <h2 id="h-cf" className="gp-h2">Desembolso mensal</h2>
            <p className="gp-hint" style={{ margin: "2px 0 0" }}>
              Projeção de fluxo de caixa e progresso financeiro acumulado.
            </p>
          </div>
          <div className="gp-card" style={{ padding: "10px 16px", border: "1px solid #E6EBF2" }}>
            <span className="gp-ml">Valor total</span>{" "}
            <strong className="gp-mono" style={{ fontSize: 20 }}>{formatCurrency(data.valor_total)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 22 }}>
          <div
            role="img"
            aria-label={ariaGrafico}
            style={{ flex: "2 1 480px", display: "flex", alignItems: "flex-end", gap: 14, height: 260, paddingBottom: 28, borderBottom: "1px solid #94a3b8" }}
          >
            {mensalData.map((m, idx) => (
              <span
                key={m.mes}
                title={`${m.mes}: ${formatCurrency(m.valor)} (acumulado ${m.acumulado_pct}%)`}
                style={{ flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 6, height: "100%" }}
              >
                <span className="gp-mono" style={{ fontSize: 12, fontWeight: 600 }}>{mil(m.valor)}</span>
                <span
                  style={{
                    width: "100%", maxWidth: 56, borderRadius: "10px 10px 4px 4px",
                    background: idx === picoIndex ? "#9fd300" : "#001b3d",
                    height: Math.max(2, Math.round((m.valor / maxVal) * 190)),
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: -26 }}>{m.mes}</span>
              </span>
            ))}
          </div>

          <table style={{ flex: "1 1 340px", borderCollapse: "collapse", alignSelf: "flex-start" }}>
            <caption className="gp-sr">Cronograma financeiro por mês</caption>
            <thead>
              <tr>
                <th scope="col" className="gp-th">Mês</th>
                <th scope="col" className="gp-th">Serviços previstos</th>
                <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Valor</th>
                <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Acum.</th>
              </tr>
            </thead>
            <tbody>
              {mensalData.map((item, idx) => (
                <tr key={item.mes} className="gp-row">
                  <th scope="row" className="gp-td" style={{ textAlign: "left" }}>{item.mes}</th>
                  <td className="gp-td" style={{ color: "#475569" }}>{item.servicos || "—"}</td>
                  <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: idx === picoIndex ? 800 : 400 }}>
                    {formatCurrency(item.valor)}
                  </td>
                  <td className="gp-td gp-mono" style={{ textAlign: "right" }}>{item.acumulado_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
