"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Wallet,
  Bank,
  ChartBar,
  PiggyBank,
  ArrowRight,
  Warning,
  ArrowUpRight,
  MapPin,
  Plus,
  Calendar,
  Funnel,
  CaretRight,
  CircleNotch,
} from "@phosphor-icons/react";
import { getPortfolioConsolidado, PortfolioConsolidado } from "@/lib/api/financeiro";

export default function FinanceiroVisaoPage() {
  const [periodOpen, setPeriodOpen] = useState(false);
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-color-text-muted">
        <CircleNotch size={32} className="animate-spin text-color-brand-accent" />
        <p className="text-[13px] font-semibold">Carregando dados financeiros das obras...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-color-danger">
        <Warning size={36} />
        <p className="text-[14px] font-bold">{error || "Não foi possível carregar os dados"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-color-primary-dark text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const {
    total_orcado,
    total_realizado,
    saldo_restante,
    desvio_percentual,
    projetos,
    gasto_por_categoria,
    alerta_critico,
  } = data;

  const percentualUtilizado =
    total_orcado > 0 ? Math.min(Math.round((total_realizado / total_orcado) * 1000) / 10, 100) : 0;

  return (
    <div className="flex flex-col h-full bg-color-bg-soft">
      {/* ── Header Section ── */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-color-text-muted mb-2">
            <span>Portfólio</span>
            <CaretRight size={10} />
            <span className="text-color-heading">Financeiro</span>
          </div>
          <h1 className="text-[28px] font-bold text-color-heading leading-tight">
            Visão Geral Financeira
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-color-white border border-color-border rounded-lg text-[13px] font-semibold text-color-heading shadow-sm transition-all hover:bg-color-bg-subtle hover:border-color-text-subtle"
          >
            <Calendar size={16} className="text-color-text-muted" />
            Visão Global
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-color-white border border-color-border rounded-lg text-[13px] font-semibold text-color-heading shadow-sm transition-all hover:bg-color-bg-subtle hover:border-color-text-subtle">
            <Funnel size={16} className="text-color-text-muted" />
            Filtros
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Card 1 */}
        <div className="bg-color-white border border-color-border rounded-xl p-6 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 rounded-lg bg-color-primary-dark text-color-brand-accent flex items-center justify-center flex-shrink-0">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold text-color-success-dark bg-color-success-bg px-2 py-1 rounded-full uppercase tracking-wide">
              {projetos.length} {projetos.length === 1 ? "Obra" : "Obras"}
            </span>
          </div>
          <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-[0.6px] mb-1.5">
            Orçamento Global Total
          </p>
          <p className="text-[26px] font-bold text-color-heading">{formatCurrency(total_orcado)}</p>
        </div>

        {/* Card 2 */}
        <div className="bg-color-white border border-color-border rounded-xl p-6 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 rounded-lg bg-color-primary-dark text-color-brand-accent flex items-center justify-center flex-shrink-0">
              <Bank size={20} />
            </div>
            <span className="text-[10px] font-bold text-color-text-muted bg-color-bg-subtle px-2 py-1 rounded-full uppercase tracking-wide">
              Realizado
            </span>
          </div>
          <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-[0.6px] mb-1.5">
            Gasto Acumulado Total
          </p>
          <p className="text-[26px] font-bold text-color-heading">{formatCurrency(total_realizado)}</p>
        </div>

        {/* Card 3 */}
        <div className="bg-color-white border border-color-border rounded-xl p-6 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 rounded-lg bg-color-primary-dark text-color-brand-accent flex items-center justify-center flex-shrink-0">
              <ChartBar size={20} />
            </div>
            <div className="w-[60px] h-1.5 bg-color-bg-subtle rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-color-brand-accent rounded-full transition-all"
                style={{ width: `${Math.min(percentualUtilizado, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-[0.6px] mb-1.5">
            % do Orçamento Utilizado
          </p>
          <p className="text-[26px] font-bold text-color-heading">{percentualUtilizado.toString().replace(".", ",")}%</p>
        </div>

        {/* Card 4 */}
        <div className="bg-color-white border border-color-border rounded-xl p-6 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 rounded-lg bg-color-primary-dark text-color-brand-accent flex items-center justify-center flex-shrink-0">
              <PiggyBank size={20} />
            </div>
            <span className="text-[10px] font-bold text-color-text-muted bg-color-bg-subtle px-2 py-1 rounded-full uppercase tracking-wide">
              Disponível
            </span>
          </div>
          <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-[0.6px] mb-1.5">
            Saldo Restante
          </p>
          <p className="text-[26px] font-bold text-color-heading">{formatCurrency(saldo_restante)}</p>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 flex-1">
        {/* ── Left: Table ── */}
        <div className="bg-color-white border border-color-border rounded-xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-start px-7 pt-6 pb-5">
            <div>
              <h3 className="text-[17px] font-bold text-color-heading">Projetos Ativos</h3>
              <p className="text-[12px] text-color-text-muted mt-0.5">
                Desempenho financeiro detalhado por unidade
              </p>
            </div>
            <Link
              href="/obras"
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-color-heading hover:text-color-teal transition-colors no-underline"
            >
              Ver Todos <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            {projetos.length === 0 ? (
              <div className="p-8 text-center text-color-text-muted text-[13px]">
                Nenhuma obra ativa com dados financeiros registrados no banco de dados.
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-color-bg-soft">
                    <th className="px-7 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                      Nome da Obra
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                      Previsto
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                      Realizado
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                      Utilização
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-color-border last:border-0 hover:bg-color-bg-soft transition-colors"
                    >
                      <td className="px-7 py-4">
                        <Link
                          href={p.href}
                          className="text-[13px] font-bold text-color-heading hover:text-color-teal transition-colors no-underline block leading-tight"
                        >
                          {p.nome}
                        </Link>
                        <span className="text-[11px] text-color-text-muted">Gestor: {p.gestor}</span>
                      </td>
                      <td className="px-4 py-4 text-[13px] font-semibold text-color-heading whitespace-nowrap">
                        {formatCurrency(p.previsto)}
                      </td>
                      <td className="px-4 py-4 text-[13px] font-semibold text-color-heading whitespace-nowrap">
                        {formatCurrency(p.realizado)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-color-bg-subtle rounded-full overflow-hidden">
                            <div
                              className={`h-full ${p.barColor} rounded-full transition-all`}
                              style={{ width: `${Math.min(p.percent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-bold text-color-heading tabular-nums">
                            {p.percent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${p.statusClass}`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-7 py-3 border-t border-color-border">
            <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-wide text-right">
              Dados atualizados em tempo real via API
            </p>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-5">
          {/* Distribuição por Categoria */}
          <div className="bg-color-white border border-color-border rounded-xl p-6">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-color-heading mb-5">
              Distribuição por Categoria
            </h4>
            <div className="flex flex-col gap-5">
              {gasto_por_categoria.map((cat, i) => {
                const totalCat = cat.orcado + cat.realizado;
                const pctOrc = totalCat > 0 ? (cat.orcado / totalCat) * 100 : 50;
                const pctReal = totalCat > 0 ? (cat.realizado / totalCat) * 100 : 50;

                return (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-2">
                      <span className="text-color-text-muted">{cat.categoria}</span>
                      <span className="text-color-heading">
                        {formatCurrency(cat.orcado)} / {formatCurrency(cat.realizado)}
                      </span>
                    </div>
                    <div className="h-5 flex bg-color-bg-subtle rounded-md overflow-hidden">
                      <div
                        className="h-full bg-color-primary-dark rounded-l-md transition-all"
                        style={{ width: `${pctOrc}%` }}
                      />
                      <div
                        className="h-full bg-color-teal rounded-r-md transition-all"
                        style={{ width: `${pctReal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-5 mt-5 pt-4 border-t border-color-border">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-color-text-muted">
                <span className="w-2.5 h-2.5 bg-color-primary-dark rounded-sm" />
                Planejado
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-color-text-muted">
                <span className="w-2.5 h-2.5 bg-color-teal rounded-sm" />
                Realizado
              </span>
            </div>
          </div>

          {/* Alerta Crítico */}
          {alerta_critico ? (
            <div className="bg-color-primary-dark rounded-xl p-6 relative overflow-hidden">
              <Warning
                weight="fill"
                className="absolute -right-4 -bottom-4 text-color-danger opacity-[0.07] pointer-events-none"
                size={140}
              />
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-color-brand-accent mb-3 relative z-10">
                Alerta Crítico
              </h4>
              <p className="text-[13px] text-color-text-subtle leading-relaxed mb-5 relative z-10">
                O projeto <strong className="text-white">{alerta_critico.obra_nome}</strong> excedeu
                o orçado em <strong className="text-color-danger">{alerta_critico.excesso_pct}%</strong>. Recomenda-se revisão imediata.
              </p>
              <Link
                href={`/obras/${alerta_critico.obra_id}`}
                className="relative z-10 inline-flex items-center gap-2 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wide rounded-lg py-2 px-4 hover:bg-white/10 transition-colors no-underline"
              >
                Analisar Detalhes <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="bg-color-white border border-color-border rounded-xl p-6">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-color-success-dark mb-2">
                Status do Portfólio
              </h4>
              <p className="text-[13px] text-color-text-muted">
                Todas as obras estão com a execução orçamentária dentro dos parâmetros planejados.
              </p>
            </div>
          )}

          {/* Mini Mapa */}
          <div className="flex-1 bg-color-bg-subtle rounded-xl border border-color-border relative overflow-hidden min-h-[160px] bg-[radial-gradient(var(--color-text-subtle)_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-color-primary-dark text-white text-[11px] font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
                <MapPin weight="fill" className="text-color-brand-accent" size={14} />
                {projetos.length} {projetos.length === 1 ? "Obra Ativa" : "Obras Ativas"}
              </div>
            </div>
            <Link
              href="/obras"
              className="absolute bottom-4 right-4 w-11 h-11 bg-color-brand-accent text-color-primary-dark rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-all hover:scale-105"
            >
              <Plus size={20} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

