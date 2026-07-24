"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  DownloadSimple, 
  Calendar, 
  Funnel, 
  MagnifyingGlass, 
  CaretDown, 
  DotsThreeVertical,
  Clock,
  Coins
} from "@phosphor-icons/react";
import { getOrcamentos, getOrcamentoStats, type Orcamento, type OrcamentoStats } from "@/lib/api/orcamentos";

const STATUS_LABELS: Record<string, string> = {
  aprovado: "APROVADO",
  concluido: "APROVADO",
  orcamento_concluido: "APROVADO",
  em_elaboracao: "PENDENTE",
  pendente: "PENDENTE",
  recusado: "RECUSADO",
  cancelado: "RECUSADO"
};

const STATUS_STYLES: Record<string, string> = {
  APROVADO: "bg-[rgba(185,246,29,0.3)] border border-[rgba(75,103,0,0.2)] text-[#141f00]",
  PENDENTE: "bg-[#fef3c7] border border-[#fde68a] text-[#b45309]",
  RECUSADO: "bg-[#fee2e2] border border-[#fecaca] text-[#b91c1c]",
};

type FilterStatus = "todos" | "pendente" | "aprovado" | "recusado";

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

  const getMappedStatus = (status: string): string => {
    const s = status.toLowerCase();
    return STATUS_LABELS[s] || "PENDENTE";
  };

  const filteredOrcamentos = orcamentos.filter((o) => {
    if (activeFilter === "todos") return true;
    const mapped = getMappedStatus(o.status);
    return mapped.toLowerCase() === activeFilter;
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
      {/* Breadcrumbs & Header Actions */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-['Hanken_Grotesk'] text-[12px] font-bold text-[#44474e] tracking-wider uppercase">
            <span>WORKSPACE</span>
            <span className="text-[#c4c6cf] text-[10px]">&gt;</span>
            <span>OPERAÇÕES</span>
          </div>
          <h1 className="font-['Inter'] font-bold text-[32px] text-[#181c1e] tracking-tight leading-tight mt-1">
            Orçamentos
          </h1>
          <p className="font-['Inter'] font-normal text-[16px] text-[#44474e] mt-1">
            Gestão centralizada de propostas comerciais e previsões orçamentárias.
          </p>
        </div>

        <div className="flex gap-3">
          <button className="bg-[#001b3d] text-white font-['Inter'] font-bold text-[14px] px-6 py-3 rounded-[8px] transition-all hover:bg-[#00102a] flex items-center gap-2 shadow-sm">
            <DownloadSimple size={16} weight="bold" />
            Exportar Relatório
          </button>
          
          <button 
            onClick={() => router.push("/orcamentos/novo")}
            className="bg-[#b9f61d] text-[#141f00] font-['Inter'] font-bold text-[14px] px-6 py-3 rounded-[8px] transition-all hover:bg-[#a5dd15] flex items-center gap-2 shadow-[0px_4px_12px_rgba(185,246,29,0.2)]"
          >
            <Plus size={16} weight="bold" />
            Novo Orçamento
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: TOTAL EM ORÇAMENTOS */}
        <div className="bg-white border border-[#c4c6cf] border-solid rounded-[12px] p-6 flex flex-col justify-between shadow-sm">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            TOTAL EM ORÇAMENTOS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="font-['Inter'] font-bold text-[24px] lg:text-[28px] text-[#181c1e] truncate" title={formatCurrency(stats?.valor_total)}>
              {formatCurrency(stats?.valor_total)}
            </h2>
            <span className="font-['Inter'] font-bold text-[12px] text-[#4b6700]">
              {stats ? `${stats.total_orcamentos} un` : "—"}
            </span>
          </div>
          <div className="bg-[#ebeef0] h-[4px] rounded-[9999px] w-full overflow-hidden mt-3">
            <div className="bg-[#4b6700] h-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* KPI 2: TAXA DE APROVAÇÃO */}
        <div className="bg-white border border-[#c4c6cf] border-solid rounded-[12px] p-6 flex flex-col justify-between shadow-sm">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            TAXA DE APROVAÇÃO
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="font-['Inter'] font-bold text-[28px] text-[#181c1e]">
              {stats ? `${stats.taxa_aprovacao}%` : "—"}
            </h2>
            <span className="font-['Inter'] font-normal text-[11px] text-[#44474e]">
              Meta: 75%
            </span>
          </div>
          <div className="bg-[#ebeef0] h-[4px] rounded-[9999px] w-full overflow-hidden mt-3">
            <div className="bg-[#001b3d] h-full" style={{ width: stats ? `${stats.taxa_aprovacao}%` : "0%" }} />
          </div>
        </div>

        {/* KPI 3: TICKET MÉDIO */}
        <div className="bg-white border border-[#c4c6cf] border-solid rounded-[12px] p-6 flex flex-col justify-between shadow-sm">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            TICKET MÉDIO
          </span>
          <div className="flex items-end justify-between mt-2">
            <h2 className="font-['Inter'] font-bold text-[24px] lg:text-[28px] text-[#181c1e] truncate" title={formatCurrency(stats?.ticket_medio)}>
              {formatCurrency(stats?.ticket_medio)}
            </h2>
            <div className="flex gap-[4px] items-end h-[32px] pb-[2px]">
              <div className="bg-[rgba(75,103,0,0.2)] w-[6px] h-[16px] rounded-[2px]" />
              <div className="bg-[rgba(75,103,0,0.4)] w-[6px] h-[24px] rounded-[2px]" />
              <div className="bg-[#4b6700] w-[6px] h-[32px] rounded-[2px]" />
            </div>
          </div>
          <div className="border-t border-[#f0f2f5] mt-3" />
        </div>

        {/* KPI 4: TEMPO DE RESPOSTA */}
        <div className="bg-white border border-[#c4c6cf] border-solid rounded-[12px] p-6 flex flex-col justify-between shadow-sm">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            ELABORAÇÃO MÉDIA
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="font-['Inter'] font-bold text-[28px] text-[#181c1e]">
              {stats ? `${stats.tempo_resposta_medio} Dias` : "—"}
            </h2>
            <span className="font-['Inter'] font-bold text-[12px] text-[#4b6700]">
              médio
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#44474e]">
            <Clock size={14} className="text-[#64748b]" />
            <span>Tempo médio até aprovação</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#c4c6cf] border-solid rounded-[12px] p-4 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        {/* Left Status Tabs */}
        <div className="bg-[#f1f4f6] p-[4px] rounded-[8px] flex items-center gap-[4px]">
          {(["todos", "pendente", "aprovado", "recusado"] as FilterStatus[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-[6px] font-['Inter'] text-[12px] font-semibold transition-all uppercase cursor-pointer border-none ${
                activeFilter === filter
                  ? "bg-white text-[#4b6700] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                  : "bg-transparent text-[#44474e] hover:text-[#000]"
              }`}
            >
              {filter === "todos" ? "Todos" : filter === "pendente" ? "Pendentes" : filter === "aprovado" ? "Aprovados" : "Recusados"}
            </button>
          ))}
        </div>

        {/* Right Search and Actions */}
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <button className="flex items-center gap-2 bg-white border border-[#c4c6cf] rounded-[8px] px-4 py-2.5 font-['Inter'] font-medium text-[13px] text-[#181c1e] hover:bg-[#f8fafc] transition-colors border-solid">
            <Calendar size={15} className="text-[#44474e]" />
            <span>Últimos 30 dias</span>
            <CaretDown size={12} className="text-[#44474e]" />
          </button>

          {/* Advanced filter button */}
          <button className="flex items-center gap-2 bg-white border border-[#c4c6cf] rounded-[8px] px-4 py-2.5 font-['Inter'] font-medium text-[13px] text-[#181c1e] hover:bg-[#f8fafc] transition-colors border-solid">
            <Funnel size={14} className="text-[#44474e]" />
            <span>Filtros Avançados</span>
          </button>

          {/* Search bar */}
          <div className="relative w-[280px]">
            <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#44474e]">
              <MagnifyingGlass size={16} />
            </span>
            <input
              type="text"
              placeholder="BUSCAR OBRAS, ARQUIVOS OU TAREFAS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#f1f4f6] border border-[#c4c6cf] rounded-[8px] pl-[38px] pr-4 py-2.5 font-['Hanken_Grotesk'] font-bold text-[11px] text-[#181c1e] placeholder-[#6b7280] outline-none focus:bg-white focus:border-[#4b6700] transition-all w-full border-solid"
            />
          </div>
        </div>
      </div>

      {/* Budgets Table */}
      <div className="bg-white border border-[#c4c6cf] border-solid rounded-[12px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f1f4f6] border-b border-[#c4c6cf]">
              <th className="px-6 py-4 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
                ID
              </th>
              <th className="px-6 py-4 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
                CLIENTE
              </th>
              <th className="px-6 py-4 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
                DATA DE EMISSÃO
              </th>
              <th className="px-6 py-4 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
                VALOR TOTAL
              </th>
              <th className="px-6 py-4 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px] text-center">
                STATUS
              </th>
              <th className="px-6 py-4 w-[60px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c4c6cf]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center font-['Inter'] text-[14px] text-[#64748b]">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-t-transparent border-[#4b6700] rounded-full animate-spin" />
                    <span>Carregando orçamentos...</span>
                  </div>
                </td>
              </tr>
            ) : filteredOrcamentos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center font-['Inter'] text-[14px] text-[#64748b] italic">
                  Nenhum orçamento encontrado.
                </td>
              </tr>
            ) : (
              filteredOrcamentos.map((o) => {
                const mappedStatus = getMappedStatus(o.status);
                return (
                  <tr
                    key={o.id}
                    onClick={() => handleRowClick(o.id)}
                    className="group cursor-pointer hover:bg-[#f7fafc] transition-colors"
                  >
                    {/* ID */}
                    <td className="px-6 py-6 font-['Inter'] font-bold text-[14px] text-[#181c1e]">
                      #{o.id.substring(0, 8).toUpperCase()}
                    </td>

                    {/* CLIENTE */}
                    <td className="px-6 py-4">
                      <div className="font-['Inter'] font-bold text-[16px] text-[#181c1e] group-hover:text-[#4b6700] transition-colors">
                        {o.nome}
                      </div>
                      <div className="font-['Inter'] font-normal text-[12px] text-[#44474e] mt-0.5">
                        {o.cliente || "Cliente não informado"}
                      </div>
                    </td>

                    {/* DATA */}
                    <td className="px-6 py-6 font-['Inter'] font-normal text-[14px] text-[#44474e]">
                      {formatDate(o.data)}
                    </td>

                    {/* VALOR */}
                    <td className="px-6 py-6 font-['Inter'] font-bold text-[16px] text-[#181c1e]">
                      {formatCurrency(o.valor_total)}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-6 align-middle text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-['Inter'] font-bold text-[11px] uppercase tracking-[0.5px] ${
                        STATUS_STYLES[mappedStatus] || "bg-[#f1f5f9] text-[#64748b]"
                      }`}>
                        {mappedStatus}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-6 py-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <button className="text-[#94a3b8] hover:text-[#001b3d] p-1.5 rounded-[6px] hover:bg-[#ebeef0] transition-all">
                        <DotsThreeVertical size={20} weight="bold" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Table Footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#c4c6cf] bg-white">
          <span className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
            Mostrando {filteredOrcamentos.length} orçamentos
          </span>
          <div className="flex gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded-[6px] font-['Inter'] font-bold text-[12px] bg-[#001b3d] text-white cursor-pointer border-none">
              1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
