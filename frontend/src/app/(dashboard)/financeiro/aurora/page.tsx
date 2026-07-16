"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CaretRight,
  CalendarBlank,
  DownloadSimple,
  Receipt,
  CompassTool,
  Users,
  Wrench,
  ClipboardText,
  Warning,
  CheckCircle,
  Clock,
  X,
} from "@phosphor-icons/react";

// ── Dados ────────────────────────────────────────────────────
const categorias = [
  {
    label: "Materiais",
    icon: CompassTool,
    valor: "R$ 452.300,00",
    orcamento: "R$ 620.000",
    saldo: "-R$ 167.700 (28%)",
    percent: 72,
    barColor: "bg-color-success",
    borderColor: "border-b-color-success",
    saldoClass: "text-color-success-dark",
  },
  {
    label: "Mão de Obra",
    icon: Users,
    valor: "R$ 215.800,00",
    orcamento: "R$ 230.000",
    saldo: "Alerta: 94%",
    percent: 94,
    barColor: "bg-color-danger",
    borderColor: "border-b-color-danger",
    saldoClass: "text-color-danger-dark font-bold",
  },
  {
    label: "Equipamentos",
    icon: Wrench,
    valor: "R$ 88.450,00",
    orcamento: "R$ 195.000",
    saldo: "OK: 45% do teto",
    percent: 45,
    barColor: "bg-color-success",
    borderColor: "border-b-color-text-subtle",
    saldoClass: "text-color-text-muted",
  },
  {
    label: "Administrativo",
    icon: ClipboardText,
    valor: "R$ 42.100,00",
    orcamento: "R$ 50.000",
    saldo: "Atenção: 84%",
    percent: 84,
    barColor: "bg-color-warning",
    borderColor: "border-b-color-warning",
    saldoClass: "text-color-warning-dark",
  },
];

const meses = [
  { label: "JAN", planejado: 68, realizado: 55 },
  { label: "FEV", planejado: 62, realizado: 70 },
  { label: "MAR", planejado: 75, realizado: 88, tooltip: "R$ 198.400 (acima do previsto)" },
  { label: "ABR", planejado: 50, realizado: 42 },
  { label: "MAI", planejado: 55, realizado: 60 },
  { label: "JUN", planejado: 45, realizado: null, projetado: 52 },
];

const transacoes = [
  {
    data: "12 Jan 2024",
    descricao: "Compra Cimento Portland CP-II",
    categoria: "Materiais",
    responsavel: "A. Torres",
    valor: "R$ 45.200,00",
    status: "APROVADO",
    statusClass: "bg-color-success-bg text-color-success-dark",
  },
  {
    data: "15 Jan 2024",
    descricao: "Contrato Mão de Obra Elevação",
    categoria: "Mão de Obra",
    responsavel: "M. Lins",
    valor: "R$ 85.000,00",
    status: "APROVADO",
    statusClass: "bg-color-success-bg text-color-success-dark",
  },
  {
    data: "18 Jan 2024",
    descricao: "Aluguel Guindaste Industrial",
    categoria: "Equipamentos",
    responsavel: "C. Mendes",
    valor: "R$ 12.500,00",
    status: "PENDENTE",
    statusClass: "bg-color-warning-bg text-color-warning-dark",
  },
  {
    data: "22 Jan 2024",
    descricao: "Taxas de Inspeção Municipal",
    categoria: "Administrativo",
    responsavel: "A. Torres",
    valor: "R$ 8.700,00",
    status: "APROVADO",
    statusClass: "bg-color-success-bg text-color-success-dark",
  },
];

export default function FinanceiroAuroraPage() {
  const [showAlert, setShowAlert] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full relative bg-color-bg-soft">

      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <Link
            href="/financeiro"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-color-text-muted mb-3 hover:text-color-heading transition-colors no-underline"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-color-text-muted mb-2">
            <span>Financeiro</span>
            <CaretRight size={10} />
            <span className="text-color-heading">Residencial Aurora</span>
          </div>
          <h1 className="text-[28px] font-bold text-color-heading leading-tight">
            Gestão de Custos
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-[12px] text-color-text-muted">
              <CalendarBlank size={14} />
              Última atualização: 24 de Maio, 2024
            </span>
            <span className="px-2.5 py-0.5 bg-color-success-bg text-color-success-dark text-[10px] font-bold uppercase tracking-wide rounded-full">
              Em Execução
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-color-white border border-color-border rounded-lg text-[13px] font-semibold text-color-heading shadow-sm hover:bg-color-bg-subtle transition-all">
            <Receipt size={18} />
            Lançar Custo
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-color-brand-accent text-color-primary-dark rounded-lg text-[13px] font-semibold hover:opacity-90 transition-all shadow-sm">
            <DownloadSimple size={18} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* ── Category Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {categorias.map((cat, i) => (
          <div
            key={i}
            className={`bg-color-white border border-color-border border-b-4 ${cat.borderColor} rounded-xl p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-center mb-5">
              <div className="w-9 h-9 rounded-full bg-color-bg-subtle flex items-center justify-center text-color-heading">
                <cat.icon size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-color-text-muted bg-color-bg-subtle px-2 py-1 rounded-full">
                {cat.label}
              </span>
            </div>
            <p className="text-[11px] text-color-text-muted mb-1">Gasto Realizado</p>
            <p className="text-[22px] font-bold text-color-heading mb-3">{cat.valor}</p>
            <div className="w-full h-1.5 bg-color-bg-subtle rounded-full overflow-hidden mb-2">
              <div
                className={`h-full ${cat.barColor} rounded-full transition-all`}
                style={{ width: `${cat.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
              <span className="text-color-text-muted">Orc: {cat.orcamento}</span>
              <span className={cat.saldoClass}>{cat.saldo}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Fluxo de Caixa ── */}
      <div className="bg-color-white border border-color-border rounded-xl p-7 mb-5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[17px] font-bold text-color-heading">Fluxo de Caixa Mensal</h3>
            <p className="text-[12px] text-color-text-muted mt-0.5">Planejado vs. realizado por mês</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1.5 text-color-text-muted">
              <span className="w-2.5 h-2.5 bg-color-primary-dark rounded-sm" />
              Planejado
            </span>
            <span className="flex items-center gap-1.5 text-color-text-muted">
              <span className="w-2.5 h-2.5 bg-color-teal rounded-sm" />
              Realizado
            </span>
            <span className="flex items-center gap-1.5 text-color-text-muted">
              <span className="w-2.5 h-2.5 bg-color-bg-subtle border border-dashed border-color-text-subtle rounded-sm" />
              Projetado
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-40 relative">
          {meses.map((mes, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Tooltip */}
              {hoveredBar === i && mes.tooltip && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-color-primary-dark text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap z-10 shadow-lg">
                  {mes.tooltip}
                </div>
              )}

              {/* Bars */}
              <div className="w-full flex items-end justify-center gap-1 h-32">
                {/* Planejado */}
                <div
                  className="flex-1 bg-color-primary-dark rounded-t-sm transition-all hover:opacity-80"
                  style={{ height: `${mes.planejado}%` }}
                />
                {/* Realizado ou Projetado */}
                {mes.realizado ? (
                  <div
                    className="flex-1 bg-color-teal rounded-t-sm transition-all hover:opacity-80"
                    style={{ height: `${mes.realizado}%` }}
                  />
                ) : (
                  <div
                    className="flex-1 border-t-2 border-dashed border-color-text-subtle bg-color-bg-subtle rounded-t-sm"
                    style={{ height: `${mes.projetado}%` }}
                  />
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] font-bold uppercase text-color-text-muted tracking-wide">
                {mes.label}
                {!mes.realizado && (
                  <span className="block text-[8px] text-color-text-subtle font-normal normal-case tracking-normal">
                    proj.
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transaction Table ── */}
      <div className="bg-color-white border border-color-border rounded-xl overflow-hidden mb-5">
        <div className="flex justify-between items-center px-7 py-5 border-b border-color-border">
          <div className="flex items-center gap-3">
            <h3 className="text-[17px] font-bold text-color-heading">Lançamentos</h3>
            <span className="text-[10px] font-bold text-color-text-muted bg-color-bg-subtle px-2 py-1 rounded-full">
              {transacoes.length} registros
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select className="text-[12px] border border-color-border rounded-lg px-3 py-2 text-color-heading bg-color-white focus:outline-none focus:ring-2 focus:ring-color-brand-accent">
              <option>Todas as categorias</option>
              <option>Materiais</option>
              <option>Mão de Obra</option>
              <option>Equipamentos</option>
              <option>Administrativo</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-color-bg-soft">
                <th className="px-7 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                  Data
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                  Descrição
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                  Categoria
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border">
                  Responsável
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border text-right">
                  Valor
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-color-text-muted uppercase tracking-wider border-b border-color-border text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transacoes.map((t, i) => (
                <tr
                  key={i}
                  className="border-b border-color-border last:border-0 hover:bg-color-bg-soft transition-colors"
                >
                  <td className="px-7 py-4 text-[12px] text-color-text-muted whitespace-nowrap">
                    {t.data}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[13px] font-semibold text-color-heading">{t.descricao}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] text-color-text-muted">{t.categoria}</span>
                  </td>
                  <td className="px-4 py-4 text-[12px] font-medium text-color-heading">
                    {t.responsavel}
                  </td>
                  <td className="px-4 py-4 text-[13px] font-bold text-color-heading text-right tabular-nums whitespace-nowrap">
                    {t.valor}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${t.statusClass}`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-7 py-4 border-t border-color-border flex items-center justify-between">
          <span className="text-[11px] text-color-text-muted">Exibindo 4 de 47 lançamentos</span>
          <button className="text-[11px] font-bold text-color-heading uppercase tracking-wide flex items-center gap-1 hover:text-color-teal transition-colors">
            Ver Todos <CaretRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Contextual Alert ── */}
      {showAlert && (
        <div className="bg-color-danger-bg-alt border border-color-danger rounded-xl p-5 flex items-start gap-4 relative">
          <div className="w-9 h-9 rounded-full bg-color-danger-bg flex items-center justify-center flex-shrink-0">
            <Warning weight="fill" size={18} className="text-color-danger" />
          </div>
          <div className="flex-1">
            <h4 className="text-[14px] font-bold text-color-danger-dark mb-1">
              Atenção ao Orçamento
            </h4>
            <p className="text-[12px] text-color-danger-dark leading-relaxed">
              A categoria <strong>Mão de Obra</strong> atingiu 94% do orçamento previsto. Considere
              revisar o planejamento ou solicitar aprovação de aditivo contratual.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button className="flex items-center gap-1.5 text-[11px] font-bold text-color-danger-dark hover:underline">
                <CheckCircle size={14} />
                Revisar Orçamento
              </button>
              <span className="text-color-danger/40">|</span>
              <button
                onClick={() => setShowAlert(false)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-color-text-muted hover:text-color-heading transition-colors"
              >
                <Clock size={14} />
                Lembrar Depois
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-color-text-muted hover:text-color-heading transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
