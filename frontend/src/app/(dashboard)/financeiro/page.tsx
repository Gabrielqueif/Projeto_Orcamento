"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPortfolioConsolidado, PortfolioConsolidado } from "@/lib/api/financeiro";
import { PageHeader } from "@/components/layout/PageHeader";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val);

// O backend devolve classes de tema antigas em barColor; aqui só se lê a gravidade.
const gravidade = (barColor: string) =>
  barColor.includes("danger")
    ? { badge: "gp-da", cor: "#DC2626" }
    : barColor.includes("warning")
    ? { badge: "gp-wa", cor: "#F97316" }
    : { badge: "gp-ok", cor: "#00a3b1" };

export default function FinanceiroVisaoPage() {
  const [data, setData] = useState<PortfolioConsolidado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getPortfolioConsolidado();
        setData(res);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar dados financeiros do portfólio");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <p role="status" style={{ padding: 48, textAlign: "center", color: "#475569" }}>
        Carregando dados financeiros das obras...
      </p>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" style={{ padding: 48, textAlign: "center" }}>
        <p style={{ color: "#B91C1C", margin: 0, fontWeight: 700 }}>{error || "Não foi possível carregar os dados"}</p>
        <button onClick={() => window.location.reload()} className="gp-btn gp-bs gp-sm" style={{ marginTop: 16 }}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { total_orcado, total_realizado, saldo_restante, projetos, gasto_por_categoria, alerta_critico } = data;

  const percentualUtilizado =
    total_orcado > 0 ? Math.min(Math.round((total_realizado / total_orcado) * 1000) / 10, 100) : 0;
  const pctTexto = percentualUtilizado.toString().replace(".", ",");

  return (
    <>
      <PageHeader
        crumb={<>Gestão / <span aria-current="page" style={{ color: "#001b3d" }}>Financeiro</span></>}
        eyebrow="Gestão"
        back="/mais"
        title="Financeiro"
        subtitle="Verba, gasto e saldo de todas as obras ativas."
      />

      <section aria-label="Indicadores" className="gp-grid">
        <div className="gp-card gp-met gp-dark">
          <span className="gp-ml">Verba das obras ativas</span>
          <span className="gp-mv">{formatCurrency(total_orcado)}</span>
          <span className="gp-ms">
            {projetos.length} {projetos.length === 1 ? "obra" : "obras"}
          </span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Gasto acumulado</span>
          <span className="gp-mv">{formatCurrency(total_realizado)}</span>
          <span className="gp-ms">realizado</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Utilizado</span>
          <span className="gp-mv">{pctTexto}%</span>
          <span
            className="gp-bar"
            role="progressbar"
            aria-label={`Verba utilizada ${pctTexto}%`}
            aria-valuenow={percentualUtilizado}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${percentualUtilizado}%`, background: "#00a3b1" }}></span>
          </span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Saldo</span>
          <span className="gp-mv" style={{ color: saldo_restante >= 0 ? "#3F6604" : "#B91C1C" }}>
            {formatCurrency(saldo_restante)}
          </span>
          <span className="gp-ms">{saldo_restante >= 0 ? "Dentro do planejado" : "Acima do planejado"}</span>
        </div>
      </section>

      <div className="gp-split">
        <section className="gp-card gp-main" aria-labelledby="h-po" style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #E6EBF2" }}>
            <h2 id="h-po" className="gp-h2">Por obra</h2>
          </div>
          {projetos.length === 0 ? (
            <p style={{ margin: 0, padding: 32, textAlign: "center", color: "#475569" }}>
              Nenhuma obra ativa com dados financeiros registrados no banco de dados.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
                <caption className="gp-sr">Financeiro por obra</caption>
                <thead>
                  <tr>
                    <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Obra</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Verba</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Gasto</th>
                    <th scope="col" className="gp-th" style={{ width: 200 }}>Uso da verba</th>
                    <th scope="col" className="gp-th" style={{ paddingRight: 22 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => {
                    const g = gravidade(p.barColor);
                    return (
                      <tr key={p.id} className="gp-row">
                        <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left" }}>
                          <Link href={p.href} style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#001b3d", textDecoration: "none" }}>
                            {p.nome}
                          </Link>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>Gestor: {p.gestor}</span>
                        </th>
                        <td className="gp-td gp-mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(p.previsto)}</td>
                        <td className="gp-td gp-mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(p.realizado)}</td>
                        <td className="gp-td">
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="gp-bar" style={{ flex: "1 1 auto" }}>
                              <span style={{ width: `${Math.min(p.percent, 100)}%`, background: g.cor }}></span>
                            </span>
                            <span className="gp-mono" style={{ fontWeight: 600 }}>{p.percent}%</span>
                          </span>
                        </td>
                        <td className="gp-td" style={{ paddingRight: 22 }}>
                          <span className={`gp-bg ${g.badge}`}>
                            <span className="gp-dot" aria-hidden="true"></span>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {alerta_critico ? (
            <p style={{ margin: 0, padding: "12px 22px", borderTop: "1px solid #E6EBF2", fontSize: 13, color: "#9A3412", fontWeight: 700 }}>
              {alerta_critico.obra_nome}: gasto {alerta_critico.excesso_pct}% acima do orçado. Recomenda-se revisão imediata.{" "}
              <Link href={alerta_critico.href} style={{ color: "#9A3412", textDecoration: "underline" }}>
                Analisar detalhes
              </Link>
            </p>
          ) : (
            <p style={{ margin: 0, padding: "12px 22px", borderTop: "1px solid #E6EBF2", fontSize: 13, color: "#3F6604", fontWeight: 700 }}>
              Todas as obras estão com a execução orçamentária dentro dos parâmetros planejados.
            </p>
          )}
        </section>

        <section className="gp-card gp-pad gp-side" aria-labelledby="h-cat" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 id="h-cat" className="gp-h2">Por categoria</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {gasto_por_categoria.map((cat) => {
              const pct = cat.orcado > 0 ? Math.round((cat.realizado / cat.orcado) * 100) : 0;
              const acima = pct > 100;
              return (
                <li key={cat.categoria} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
                    <strong>{cat.categoria}</strong>
                    <span className="gp-mono">{formatCurrency(cat.realizado)} / {formatCurrency(cat.orcado)}</span>
                  </div>
                  <span
                    className="gp-bar"
                    role="img"
                    aria-label={`${cat.categoria}: ${pct}% do planejado${acima ? ", acima do previsto" : ""}`}
                    style={{ height: 10 }}
                  >
                    <span style={{ width: `${Math.min(100, pct)}%`, background: acima ? "#F97316" : "#001b3d" }}></span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="gp-hint" style={{ margin: 0 }}>Barra = realizado sobre o planejado da categoria.</p>
        </section>
      </div>
    </>
  );
}
