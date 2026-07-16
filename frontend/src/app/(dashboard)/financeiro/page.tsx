"use client";

import Link from "next/link";
import { useState } from "react";
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
} from "@phosphor-icons/react";

const projetos = [
  {
    nome: "Residencial Skyline",
    gestor: "André Torres",
    previsto: "R$ 8,5M",
    realizado: "R$ 3,2M",
    percent: 38,
    status: "NO PRAZO",
    statusClass: "bg-color-success-bg text-color-success-dark",
    barColor: "bg-color-success",
    href: "/financeiro/aurora",
  },
  {
    nome: "Centro Comercial Norte",
    gestor: "Marina Lins",
    previsto: "R$ 12,4M",
    realizado: "R$ 7,8M",
    percent: 63,
    status: "ALERTA",
    statusClass: "bg-color-warning-bg text-color-warning-dark",
    barColor: "bg-color-warning",
    href: "#",
  },
  {
    nome: "Condomínio Ocean Blue",
    gestor: "Carlos Mendes",
    previsto: "R$ 4,5M",
    realizado: "R$ 4,1M",
    percent: 91,
    status: "CRÍTICO",
    statusClass: "bg-color-danger-bg text-color-danger-dark",
    barColor: "bg-color-danger",
    href: "#",
  },
  {
    nome: "Expansão Porto Velho",
    gestor: "André Torres",
    previsto: "R$ 2,1M",
    realizado: "R$ 0,1M",
    percent: 7,
    status: "NO PRAZO",
    statusClass: "bg-color-success-bg text-color-success-dark",
    barColor: "bg-color-success",
    href: "#",
  },
];

const trimestres = [
  { label: "TRIMESTRE 1", planejado: "R$ 2,9M", realizado: "R$ 3,2M", pct: 53, rPct: 44 },
  { label: "TRIMESTRE 2", planejado: "R$ 4,5M", realizado: "R$ 4,8M", pct: 48, rPct: 52 },
  { label: "TRIMESTRE 3", planejado: "R$ 4,4M", realizado: "R$ 5,1M", pct: 52, rPct: 48 },
];

export default function FinanceiroVisaoPage() {
  const [periodOpen, setPeriodOpen] = useState(false);

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
            Out 2023 – Set 2024
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
              +12% vs ano ant.
            </span>
          </div>
          <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-[0.6px] mb-1.5">
            Orçamento Global Total
          </p>
          <p className="text-[26px] font-bold text-color-heading">R$ 25.420.000</p>
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
          <p className="text-[26px] font-bold text-color-heading">R$ 12.108.450</p>
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
                style={{ width: "47.6%" }}
              />
            </div>
          </div>
          <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-[0.6px] mb-1.5">
            % do Orçamento Utilizado
          </p>
          <p className="text-[26px] font-bold text-color-heading">47,6%</p>
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
          <p className="text-[26px] font-bold text-color-heading">R$ 13.311.550</p>
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
                {projetos.map((p, i) => (
                  <tr
                    key={i}
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
                      {p.previsto}
                    </td>
                    <td className="px-4 py-4 text-[13px] font-semibold text-color-heading whitespace-nowrap">
                      {p.realizado}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-color-bg-subtle rounded-full overflow-hidden">
                          <div
                            className={`h-full ${p.barColor} rounded-full transition-all`}
                            style={{ width: `${p.percent}%` }}
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
          </div>

          <div className="px-7 py-3 border-t border-color-border">
            <p className="text-[10px] font-bold text-color-text-muted uppercase tracking-wide text-right">
              Última Atualização: Hoje, 08:42 AM
            </p>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-5">
          {/* Execução Trimestral */}
          <div className="bg-color-white border border-color-border rounded-xl p-6">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-color-heading mb-5">
              Execução Trimestral
            </h4>
            <div className="flex flex-col gap-5">
              {trimestres.map((t, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-2">
                    <span className="text-color-text-muted">{t.label}</span>
                    <span className="text-color-heading">
                      {t.planejado} / {t.realizado}
                    </span>
                  </div>
                  <div className="h-5 flex bg-color-bg-subtle rounded-md overflow-hidden">
                    <div
                      className="h-full bg-color-primary-dark rounded-l-md transition-all"
                      style={{ width: `${t.pct}%` }}
                    />
                    <div
                      className="h-full bg-color-teal rounded-r-md transition-all"
                      style={{ width: `${t.rPct}%` }}
                    />
                  </div>
                </div>
              ))}
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
              O projeto{" "}
              <strong className="text-white">Centro Comercial Norte</strong> excedeu o
              planejado para o trimestre em 8%. Recomenda-se revisão imediata da cadeia de
              suprimentos.
            </p>
            <button className="relative z-10 flex items-center gap-2 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wide rounded-lg py-2 px-4 hover:bg-white/10 transition-colors">
              Analisar Detalhes <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Mini Mapa */}
          <div className="flex-1 bg-color-bg-subtle rounded-xl border border-color-border relative overflow-hidden min-h-[160px] bg-[radial-gradient(var(--color-text-subtle)_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-color-primary-dark text-white text-[11px] font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
                <MapPin weight="fill" className="text-color-brand-accent" size={14} />
                4 Obras Ativas
              </div>
            </div>
            <button className="absolute bottom-4 right-4 w-11 h-11 bg-color-brand-accent text-color-primary-dark rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-all hover:scale-105">
              <Plus size={20} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
