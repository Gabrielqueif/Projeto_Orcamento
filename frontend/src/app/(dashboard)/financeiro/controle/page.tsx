"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CaretRight,
  Plus,
  Funnel,
  Wallet,
  Bank,
  TrendUp,
  Warning,
  ShieldWarning,
  Buildings,
  Image as ImageIcon,
} from "@phosphor-icons/react";

// ── Dados ────────────────────────────────────────────────────
const obras = [
  "Residencial Aurora",
  "Residencial Skyline",
  "Centro Comercial Norte",
  "Condomínio Ocean Blue",
  "Expansão Porto Velho",
];

const categorias = [
  {
    label: "Materiais",
    orcamento: 2_500_000,
    gasto: 2_297_600,
    percentOrc: 91.9,
    percentGasto: 91.9,
    barOrcColor: "bg-color-primary-dark",
    barGastoColor: "bg-color-teal",
    valorStr: "R$ 2.297.600",
    orcStr: "R$ 2.500.000 (91,9%)",
  },
  {
    label: "Mão de Obra",
    orcamento: 1_400_000,
    gasto: 1_296_000,
    percentOrc: 92.6,
    percentGasto: 68.0,
    barOrcColor: "bg-color-primary-dark",
    barGastoColor: "bg-color-warning",
    valorStr: "R$ 1.296.000",
    orcStr: "R$ 1.400.000 (92,6%)",
  },
  {
    label: "Equipamentos",
    orcamento: 600_000,
    gasto: 276_000,
    percentOrc: 46.0,
    percentGasto: 45.0,
    barOrcColor: "bg-color-primary-dark",
    barGastoColor: "bg-color-success",
    valorStr: "R$ 276.000",
    orcStr: "R$ 600.000 (46%)",
  },
  {
    label: "Outros",
    orcamento: 350_000,
    gasto: 285_000,
    percentOrc: 81.4,
    percentGasto: 30.0,
    barOrcColor: "bg-color-primary-dark",
    barGastoColor: "bg-color-text-subtle",
    valorStr: "R$ 285.000",
    orcStr: "R$ 350.000 (81,4%)",
  },
];

const despesas = [
  {
    data: "18 Jun",
    descricao: "Fornecimento de Vigas de Aço",
    sub: "Fat #TX-99021 • MetalWorks Inc.",
    categoria: "Materiais",
    valor: "R$ 184.600,00",
    responsavel: "A. Torres",
    status: "APROVADO",
    statusDot: "bg-color-success",
    statusClass: "text-color-success-dark",
  },
  {
    data: "15 Jun",
    descricao: "Locação de Escavadeira (2 Und)",
    sub: "Taxa Semanal • HeavyRent Solutions",
    categoria: "Equipamentos",
    valor: "R$ 28.400,00",
    responsavel: "C. Mendes",
    status: "APROVADO",
    statusDot: "bg-color-success",
    statusClass: "text-color-success-dark",
  },
  {
    data: "12 Jun",
    descricao: "Equipe Concretagem – Hora Extra",
    sub: "Laje Fase 2 • Sindicato Construção",
    categoria: "Mão de Obra",
    valor: "R$ 52.800,00",
    responsavel: "M. Lins",
    status: "PENDENTE",
    statusDot: "bg-color-warning",
    statusClass: "text-color-warning-dark",
  },
  {
    data: "08 Jun",
    descricao: "Taxas de Inspeção de Segurança",
    sub: "Auditoria Trimestral • Depto. Municipal",
    categoria: "Outros",
    valor: "R$ 9.200,00",
    responsavel: "A. Torres",
    status: "APROVADO",
    statusDot: "bg-color-success",
    statusClass: "text-color-success-dark",
  },
];

const riscos = [
  {
    label: "Atraso Mão de Obra",
    nivel: "ALTO",
    nivelClass: "bg-color-danger-bg text-color-danger-dark",
    icon: Warning,
  },
  {
    label: "Variação Cambial Aço",
    nivel: "MÉDIO",
    nivelClass: "bg-color-warning-bg text-color-warning-dark",
    icon: ShieldWarning,
  },
];

export default function ControleCustosPage() {
  const [obraSelected, setObraSelected] = useState(obras[0]);
  const [showNewEntry, setShowNewEntry] = useState(false);

  return (
    <div className="flex flex-col h-full bg-color-bg-soft">

      {/* ── Page Header ── */}
      <div className="flex justify-between items-end mb-7">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-color-text-muted mb-2">
            <span>Financeiro</span>
            <CaretRight size={10} />
            <span className="text-color-heading">Controle de Custos</span>
          </div>
          <h1 className="text-[28px] font-bold text-color-heading leading-tight">
            Controle de Custos
          </h1>
          {/* accent bar */}
          <div className="w-16 h-1 bg-color-brand-accent rounded-full mt-2 mb-2" />
          <p className="text-[13px] text-color-text-muted">
            Acompanhe os gastos e orçamentos por categoria e obra
          </p>
        </div>

        <button
          onClick={() => setShowNewEntry(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-color-primary-dark text-white rounded-lg text-[13px] font-semibold shadow-sm hover:opacity-90 transition-all"
        >
          <Plus size={16} weight="bold" />
          Novo Lançamento
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Orçamento Total */}
        <div className="bg-color-white border border-color-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-5">
            <div className="w-9 h-9 rounded-lg bg-color-primary-dark text-color-brand-accent flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <span className="text-[10px] font-bold text-color-text-muted bg-color-bg-subtle px-2 py-1 rounded-full uppercase tracking-wide">
              Anual
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.6px] text-color-text-muted mb-1.5">
            Orçamento Total
          </p>
          <p className="text-[24px] font-bold text-color-heading mb-3">R$ 4.850.000,00</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-color-bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-color-primary-dark rounded-full" style={{ width: "44%" }} />
            </div>
            <span className="text-[11px] font-bold text-color-text-muted">44%</span>
          </div>
        </div>

        {/* Gasto Atual */}
        <div className="bg-color-white border border-color-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-5">
            <div className="w-9 h-9 rounded-lg bg-color-primary-dark text-color-brand-accent flex items-center justify-center">
              <Bank size={18} />
            </div>
            <span className="text-[10px] font-bold text-color-warning-dark bg-color-warning-bg px-2 py-1 rounded-full uppercase tracking-wide">
              Atenção
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.6px] text-color-text-muted mb-1.5">
            Gasto Atual Realizado
          </p>
          <p className="text-[24px] font-bold text-color-heading mb-3">R$ 2.145.280,50</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-color-bg-subtle rounded-full overflow-hidden">
              <div className="h-full bg-color-warning rounded-full" style={{ width: "44.2%" }} />
            </div>
            <span className="text-[11px] font-bold text-color-text-muted">44,2%</span>
          </div>
        </div>

        {/* Variação */}
        <div className="bg-color-white border border-color-border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-5">
            <div className="w-9 h-9 rounded-lg bg-color-success-bg text-color-success-dark flex items-center justify-center">
              <TrendUp size={18} />
            </div>
            <span className="text-[10px] font-bold text-color-success-dark bg-color-success-bg px-2 py-1 rounded-full uppercase tracking-wide">
              Economia
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.6px] text-color-text-muted mb-1.5">
            Variação (Economia)
          </p>
          <p className="text-[24px] font-bold text-color-success-dark mb-3">+R$ 124.500,00</p>
          <div className="flex items-center gap-1.5">
            <TrendUp size={12} className="text-color-success-dark" />
            <span className="text-[11px] text-color-success-dark font-bold">
              2,5% abaixo do planejado
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-5">

        {/* ── Left: Horizontal Bar Chart ── */}
        <div className="bg-color-white border border-color-border rounded-xl p-7">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[17px] font-bold text-color-heading">
                Orçamento vs. Realizado por Categoria
              </h3>
              <p className="text-[12px] text-color-text-muted mt-0.5">
                Comparativo de alocação de recursos
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1.5 text-color-text-muted">
                <span className="w-2.5 h-2.5 bg-color-primary-dark rounded-sm" />
                Orçado
              </span>
              <span className="flex items-center gap-1.5 text-color-text-muted">
                <span className="w-2.5 h-2.5 bg-color-teal rounded-sm" />
                Realizado
              </span>
            </div>
          </div>

          {/* Bars */}
          <div className="flex flex-col gap-6">
            {categorias.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-semibold text-color-heading">{cat.label}</span>
                  <span className="text-[11px] font-bold text-color-text-muted">{cat.orcStr}</span>
                </div>
                {/* Orçado bar */}
                <div className="relative h-7 bg-color-bg-subtle rounded-lg overflow-hidden mb-1">
                  <div
                    className={`absolute left-0 top-0 h-full ${cat.barOrcColor} rounded-lg transition-all opacity-20`}
                    style={{ width: `${cat.percentOrc}%` }}
                  />
                  {/* Realizado bar (inner) */}
                  <div
                    className={`absolute left-0 top-0 h-full ${cat.barGastoColor} rounded-lg transition-all opacity-90`}
                    style={{ width: `${cat.percentGasto}%` }}
                  />
                  {/* Label inside */}
                  {cat.percentOrc > 20 && (
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-color-text-muted"
                      style={{ right: `${100 - cat.percentOrc + 1}%` }}
                    >
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-color-text-muted">
                  <span>Realizado: {cat.valorStr}</span>
                  <span>
                    {cat.percentGasto < 80 ? "✓ No limite" :
                      cat.percentGasto < 90 ? "⚠ Atenção" : "✗ Crítico"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Risk Panel + Audit ── */}
        <div className="flex flex-col gap-5">
          {/* Risk Panel */}
          <div className="bg-color-white border border-color-border rounded-xl p-6 flex-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-color-heading mb-5">
              Exposição a Riscos
            </h4>
            {/* Gauge visual */}
            <div className="flex items-center gap-4 mb-5 p-4 bg-color-bg-soft rounded-lg">
              <div className="relative w-16 h-16 flex-shrink-0">
                {/* SVG Gauge */}
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeDasharray="65 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-color-heading">
                  65
                </span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-color-heading leading-tight">
                  Risco Moderado
                </p>
                <p className="text-[11px] text-color-text-muted mt-0.5">
                  Score de exposição: 65/100
                </p>
              </div>
            </div>

            {/* Risk Items */}
            <div className="flex flex-col gap-3">
              {riscos.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-color-bg-soft rounded-lg border border-color-border"
                >
                  <div className="flex items-center gap-2.5">
                    <r.icon size={16} className="text-color-text-muted flex-shrink-0" />
                    <span className="text-[12px] font-semibold text-color-heading">{r.label}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${r.nivelClass}`}
                  >
                    {r.nivel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Card */}
          <div className="bg-color-primary-dark rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 h-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <Buildings size={20} className="text-color-brand-accent" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-color-text-subtle mb-1">
                Auditoria Estrutural
              </p>
              <p className="text-[15px] font-bold text-white">09/2024</p>
              <p className="text-[11px] text-color-text-subtle mt-1.5">
                Próxima inspeção agendada
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expense Ledger Table ── */}
      <div className="bg-color-white border border-color-border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-7 py-5 border-b border-color-border">
          <div className="flex items-center gap-3">
            <h3 className="text-[17px] font-bold text-color-heading">Razão de Despesas</h3>
            <span className="w-px h-5 bg-color-border" />
            <span className="text-[12px] text-color-text-muted">
              Junho 2024 • 4 de 47 registros
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-[12px] font-semibold text-color-text-muted hover:text-color-heading transition-colors">
              <Funnel size={14} />
              Filtrar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-color-primary-dark text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-all">
              <Plus size={14} weight="bold" />
              Novo Lançamento
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-color-bg-soft">
                <th className="px-7 py-3.5 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                  Data
                </th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                  Descrição
                </th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                  Categoria
                </th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border text-right">
                  Valor
                </th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((d, i) => (
                <tr
                  key={i}
                  className="border-b border-color-border last:border-0 hover:bg-color-bg-soft transition-colors"
                >
                  <td className="px-7 py-4 text-[12px] font-bold text-color-text-muted whitespace-nowrap">
                    {d.data}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[13px] font-semibold text-color-heading leading-tight">
                      {d.descricao}
                    </p>
                    <p className="text-[11px] text-color-text-muted mt-0.5">{d.sub}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] text-color-text-muted">{d.categoria}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-[14px] font-bold text-color-heading tabular-nums">
                      {d.valor}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${d.statusDot}`} />
                      <span className={`text-[11px] font-bold ${d.statusClass}`}>
                        {d.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-7 py-4 border-t border-color-border flex items-center justify-between">
          <span className="text-[11px] text-color-text-muted">
            Mostrando 1–4 de 47 lançamentos
          </span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-color-border flex items-center justify-center text-color-text-muted hover:bg-color-bg-subtle transition-colors text-[12px] font-bold">
              ‹
            </button>
            <button className="w-8 h-8 rounded-lg bg-color-primary-dark text-white text-[12px] font-bold">
              1
            </button>
            <button className="w-8 h-8 rounded-lg border border-color-border flex items-center justify-center text-color-text-muted hover:bg-color-bg-subtle transition-colors text-[12px] font-bold">
              2
            </button>
            <button className="w-8 h-8 rounded-lg border border-color-border flex items-center justify-center text-color-text-muted hover:bg-color-bg-subtle transition-colors text-[12px] font-bold">
              3
            </button>
            <button className="w-8 h-8 rounded-lg border border-color-border flex items-center justify-center text-color-text-muted hover:bg-color-bg-subtle transition-colors text-[12px] font-bold">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
