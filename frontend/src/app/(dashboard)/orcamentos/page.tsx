// noinspection SpellCheckingInspection

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, 
  DownloadSimple,
  MagnifyingGlass,
  Clock,
  ArrowRight
} from "@phosphor-icons/react";
import { getOrcamentos, getOrcamentoStats, type Orcamento, type OrcamentoStats } from "@/lib/api/orcamentos";

import { STATUS_INFO, STATUS_ORDER, getStatusDisplay, normalizeStatus, type OrcamentoStatus } from "@/lib/orcamentoStatus";

type FilterStatus = "todos" | OrcamentoStatus;

const FILTERS: FilterStatus[] = ["todos", ...STATUS_ORDER];

export default function OrcamentosPage() {
  const router = useRouter();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos");
  const [stats, setStats] = useState<OrcamentoStats | null>(null);
  
  const carregarStats = async () => {
    try {
      const data = await getOrcamentoStats();
      setStats(data);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  };

  useEffect(() => {
    carregarStats();
  }, []);
  
  const carregarOrcamentos = async (nome?: string) => {
    try {
      setLoading(true);
      const data = await getOrcamentos(undefined, undefined, nome);
      setOrcamentos(data);
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarOrcamentos(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const filteredOrcamentos = orcamentos.filter((o) => {
    if (activeFilter === "todos") return true;
    return normalizeStatus(o.status) === activeFilter;
  });

  const handleRowClick = (id: string) => {
    router.push(`/orcamentos/${id}`);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#00a3b1] uppercase tracking-[0.5px] leading-[15px]">
            Workspace / Comercial
          </p>
          <h1 className="font-['Manrope'] font-extrabold text-[36px] text-[#001b3d] tracking-[-0.9px] leading-[40px]">
            Gestão de Orçamentos
          </h1>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-[#f1f5f9] text-[#001b3d] font-['Manrope'] font-bold text-[14px] px-5 py-3 rounded-[8px] transition-all hover:bg-[#f8fafc] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer">
            <DownloadSimple size={16} weight="bold" className="text-[#00a3b1]" />
            Exportar Relatório
          </button>
          
          <button 
            onClick={() => router.push("/orcamentos/novo")}
            className="flex items-center gap-2 bg-[#001b3d] text-white font-['Manrope'] font-bold text-[16px] px-6 py-3 rounded-[8px] no-underline shadow-[0_10px_15px_-3px_rgba(0,27,61,0.1),0_4px_6px_-4px_rgba(0,27,61,0.1)] transition-all hover:bg-[#00102a] border-none cursor-pointer"
          >
            <Plus size={17} weight="bold" />
            Novo Orçamento
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: TOTAL EM ORÇAMENTOS */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
            TOTAL EM ORÇAMENTOS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="font-['Manrope'] font-extrabold text-[24px] lg:text-[28px] text-[#001b3d] truncate" title={formatCurrency(stats?.valor_total)}>
              {formatCurrency(stats?.valor_total)}
            </h2>
            <span className="font-['JetBrains_Mono'] font-semibold text-[11px] text-[#00a3b1]">
              {stats ? `${stats.total_orcamentos} un` : "—"}
            </span>
          </div>
          <div className="bg-[#f1f5f9] h-[4px] rounded-full w-full overflow-hidden mt-3">
            <div className="bg-[#00a3b1] h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* KPI 2: TAXA DE APROVAÇÃO */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
            TAXA DE APROVAÇÃO
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d]">
              {stats ? `${stats.taxa_aprovacao}%` : "—"}
            </h2>
            <span className="font-['JetBrains_Mono'] font-normal text-[11px] text-[#94a3b8]">
              Meta: 75%
            </span>
          </div>
          <div className="bg-[#f1f5f9] h-[4px] rounded-full w-full overflow-hidden mt-3">
            <div className="bg-[#9fd300] h-full rounded-full" style={{ width: stats ? `${stats.taxa_aprovacao}%` : "0%" }} />
          </div>
        </div>

        {/* KPI 3: TICKET MÉDIO */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
            TICKET MÉDIO
          </span>
          <div className="flex items-end justify-between mt-2">
            <h2 className="font-['Manrope'] font-extrabold text-[24px] lg:text-[28px] text-[#001b3d] truncate" title={formatCurrency(stats?.ticket_medio)}>
              {formatCurrency(stats?.ticket_medio)}
            </h2>
            <div className="flex gap-[4px] items-end h-[28px] pb-[2px]">
              <div className="bg-[rgba(0,163,177,0.2)] w-[5px] h-[14px] rounded-[2px]" />
              <div className="bg-[rgba(0,163,177,0.5)] w-[5px] h-[20px] rounded-[2px]" />
              <div className="bg-[#00a3b1] w-[5px] h-[28px] rounded-[2px]" />
            </div>
          </div>
          <div className="bg-[#f1f5f9] h-[4px] rounded-full w-full overflow-hidden mt-3">
            <div className="bg-[#00a3b1] h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* KPI 4: ELABORAÇÃO MÉDIA */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
            ELABORAÇÃO MÉDIA
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d]">
              {stats ? `${stats.tempo_resposta_medio} Dias` : "—"}
            </h2>
            <span className="font-['JetBrains_Mono'] font-semibold text-[11px] text-[#00a3b1]">
              médio
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 font-['Manrope'] text-[11px] text-[#64748b]">
            <Clock size={14} className="text-[#00a3b1]" />
            <span>Tempo médio até aprovação</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between flex-wrap gap-4">
        {/* Status tabs */}
        <div className="flex items-center gap-4">
          <span className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Status:
          </span>
          <div className="bg-[#f8fafc] flex items-center p-1 rounded-[8px] gap-0.5">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-[6px] rounded-[6px] font-['Manrope'] text-[12px] transition-all whitespace-nowrap border-none cursor-pointer ${
                  activeFilter === filter
                    ? "bg-white text-[#001b3d] font-bold shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                    : "bg-transparent text-[#64748b] font-semibold hover:text-[#001b3d]"
                }`}
              >
                {filter === "todos" ? "Todos" : STATUS_INFO[filter].filterLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Period + Search */}
        <div className="flex items-center gap-4">
          <div className="h-[32px] w-px bg-[#f1f5f9]" />

          {/* Search */}
          <div className="relative">
            <div className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none">
              <MagnifyingGlass size={14} className="text-[#94a3b8]" />
            </div>
            <input
              type="text"
              placeholder="Buscar orçamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] pl-[36px] pr-4 py-[9px] font-['Manrope'] text-[14px] text-[#001b3d] placeholder:text-[#94a3b8] outline-none focus:border-[#00a3b1] transition-colors w-[240px]"
            />
          </div>
        </div>
      </div>

      {/* Budgets Table */}
      <div className="bg-white border border-[#f1f5f9] rounded-[8px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Nome do Orçamento
              </th>
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Cliente
              </th>
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Data de Emissão
              </th>
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Valor Total
              </th>
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Status
              </th>
              <th className="px-6 py-4 w-[72px]" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center font-['Manrope'] text-[14px] text-[#94a3b8]">
                  Carregando orçamentos...
                </td>
              </tr>
            ) : filteredOrcamentos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center font-['Manrope'] text-[14px] text-[#94a3b8]">
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            ) : (
              filteredOrcamentos.map((o, idx) => {
                const statusDisplay = getStatusDisplay(o.status);
                return (
                  <tr
                    key={o.id}
                    onClick={() => handleRowClick(o.id)}
                    className={`group cursor-pointer transition-colors hover:bg-[#f8fafc] ${
                      idx < filteredOrcamentos.length - 1 ? "border-b border-[#f8fafc]" : ""
                    }`}
                  >
                    {/* Nome */}
                    <td className="px-6 py-[20px] align-middle">
                      <div className="font-['Manrope'] font-bold text-[16px] text-[#001b3d] leading-tight group-hover:text-[#00a3b1] transition-colors">
                        {o.nome}
                      </div>
                      <div className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] mt-0.5">
                        #{`ORC-${o.id.substring(0, 8).toUpperCase()}`}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-[20px] align-middle">
                      <span className="font-['Manrope'] font-medium text-[14px] text-[#475569]">
                        {o.cliente || "—"}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-6 py-[20px] align-middle">
                      <span className="font-['Manrope'] font-medium text-[14px] text-[#475569]">
                        {formatDate(o.data)}
                      </span>
                    </td>

                    {/* Valor */}
                    <td className="px-6 py-[20px] align-middle">
                      <span className="font-['Manrope'] font-bold text-[16px] text-[#001b3d]">
                        {formatCurrency(o.valor_total)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-[20px] align-middle">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-[8px] font-['JetBrains_Mono'] font-semibold text-[10px] uppercase tracking-[0.5px] ${statusDisplay.style}`}
                      >
                        {statusDisplay.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/orcamentos/${o.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-[6px] text-[#94a3b8] hover:text-[#001b3d] hover:bg-[#f1f5f9] transition-colors no-underline"
                      >
                        <ArrowRight size={16} weight="bold" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#f1f5f9] bg-white">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Mostrando {filteredOrcamentos.length} orçamentos
          </span>
          <div className="flex gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded-[6px] font-['Manrope'] font-bold text-[12px] bg-[#001b3d] text-white cursor-pointer border-none">
              1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

