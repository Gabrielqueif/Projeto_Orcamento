"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, CaretDown, MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import { getOrcamentos, type Orcamento } from "@/lib/api/orcamentos";

const STATUS_LABELS: Record<string, string> = {
  em_elaboracao: "EM ELABORAÇÃO",
  orcamento_concluido: "ORÇAMENTO PRONTO",
  em_execucao: "EM EXECUÇÃO",
  concluido: "CONCLUÍDO",
};

const STATUS_STYLES: Record<string, string> = {
  em_elaboracao: "bg-[rgba(0,163,177,0.1)] text-[#00a3b1]",
  orcamento_concluido: "bg-[rgba(159,211,0,0.12)] text-[#5a7f00]",
  em_execucao: "bg-[rgba(0,163,177,0.1)] text-[#00a3b1]",
  concluido: "bg-[#f0fdf4] text-[#15803d]",
};

type FilterStatus = "todos" | "em_execucao" | "concluido" | "em_elaboracao";

export default function ObrasPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos");

  const carregarOrcamentos = async (nome?: string) => {
    try {
      setLoading(true);
      const data = await getOrcamentos(undefined, undefined, nome);
      setOrcamentos(data);
    } catch (err) {
      console.error("Erro ao carregar obras:", err);
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
    return o.status === activeFilter;
  });

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "em_execucao", label: "Em Andamento" },
    { key: "concluido", label: "Concluídos" },
    { key: "em_elaboracao", label: "Atrasados" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#00a3b1] uppercase tracking-[0.5px] leading-[15px]">
            Workspace / Operações
          </p>
          <h1 className="font-['Manrope'] font-extrabold text-[36px] text-[#001b3d] tracking-[-0.9px] leading-[40px]">
            Gestão de Obras
          </h1>
        </div>

        <Link
          href="/obras/novo"
          className="flex items-center gap-2 bg-[#001b3d] text-white font-['Manrope'] font-bold text-[16px] px-6 py-3 rounded-[8px] no-underline shadow-[0_10px_15px_-3px_rgba(0,27,61,0.1),0_4px_6px_-4px_rgba(0,27,61,0.1)] transition-all hover:bg-[#00102a]"
        >
          <Plus size={17} weight="bold" />
          Nova Obra
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between flex-wrap gap-4">
        {/* Status tabs */}
        <div className="flex items-center gap-4">
          <span className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Status:
          </span>
          <div className="bg-[#f8fafc] flex items-center p-1 rounded-[8px] gap-0.5">
            {filterTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-5 py-[6px] rounded-[6px] font-['Manrope'] text-[12px] transition-all whitespace-nowrap border-none cursor-pointer ${
                  activeFilter === key
                    ? "bg-white text-[#001b3d] font-bold shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                    : "bg-transparent text-[#64748b] font-semibold hover:text-[#001b3d]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Period + Team + Search */}
        <div className="flex items-center gap-4">
          {/* Vertical divider */}
          <div className="h-[32px] w-px bg-[#f1f5f9]" />

          {/* Period filter */}
          <div className="flex items-center gap-3">
            <span className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
              Período:
            </span>
            <button className="flex items-center gap-2 bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] px-4 py-[9px] font-['Manrope'] font-medium text-[14px] text-[#001b3d] cursor-pointer hover:bg-[#f1f5f9] transition-colors">
              <Calendar size={13.5} className="text-[#64748b]" />
              Últimos 30 dias
              <CaretDown size={9} className="text-[#64748b]" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none">
              <MagnifyingGlass size={14} className="text-[#94a3b8]" />
            </div>
            <input
              type="text"
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] pl-[36px] pr-4 py-[9px] font-['Manrope'] text-[14px] text-[#001b3d] placeholder:text-[#94a3b8] outline-none focus:border-[#9fd300] transition-colors w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#f1f5f9] rounded-[8px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Nome do Projeto
              </th>
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Cliente
              </th>
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Fase
              </th>
              <th className="px-6 py-4 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Progresso
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
                <td
                  colSpan={6}
                  className="py-12 text-center font-['Manrope'] text-[14px] text-[#94a3b8]"
                >
                  Carregando obras...
                </td>
              </tr>
            ) : filteredOrcamentos.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center font-['Manrope'] text-[14px] text-[#94a3b8]"
                >
                  Nenhuma obra encontrada.
                </td>
              </tr>
            ) : (
              filteredOrcamentos.map((o, idx) => (
                <tr
                  key={o.id}
                  className={`group cursor-pointer transition-colors hover:bg-[#f8fafc] ${
                    idx < filteredOrcamentos.length - 1
                      ? "border-b border-[#f8fafc]"
                      : ""
                  }`}
                >
                  {/* Nome */}
                  <td className="px-6 py-[28.5px] align-middle">
                    <Link href={`/obras/${o.id}`} className="no-underline">
                      <div className="font-['Manrope'] font-bold text-[16px] text-[#001b3d] leading-tight">
                        {o.nome}
                      </div>
                      <div className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] mt-0.5">
                        #{`GP-${o.id.substring(0, 8).toUpperCase()}`}
                      </div>
                    </Link>
                  </td>

                  {/* Cliente */}
                  <td className="px-6 py-[28.5px] align-middle">
                    <span className="font-['Manrope'] font-medium text-[14px] text-[#475569]">
                      {o.cliente || "—"}
                    </span>
                  </td>

                  {/* Fase */}
                  <td className="px-6 py-[38.5px] align-middle">
                    <span className="inline-flex items-center px-3 py-1 rounded-full font-['JetBrains_Mono'] font-medium text-[10px] uppercase tracking-[0.5px] bg-[rgba(0,163,177,0.1)] text-[#00a3b1]">
                      Estrutural
                    </span>
                  </td>

                  {/* Progresso */}
                  <td className="px-6 py-[36.5px] align-middle">
                    <div className="flex flex-col gap-1.5 w-[192px]">
                      <div className="flex items-center justify-between">
                        <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#001b3d]">
                          68.0%
                        </span>
                      </div>
                      <div className="bg-[#f1f5f9] h-[6px] rounded-full overflow-hidden w-full">
                        <div
                          className="bg-[#9fd300] h-full rounded-full"
                          style={{ width: "68%" }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-[34px] align-middle">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-[8px] font-['JetBrains_Mono'] font-medium text-[10px] uppercase tracking-[0.5px] ${
                        STATUS_STYLES[o.status] || "bg-[#f1f5f9] text-[#64748b]"
                      }`}
                    >
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 align-middle text-right">
                    <Link
                      href={`/obras/${o.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-[6px] text-[#94a3b8] hover:text-[#001b3d] hover:bg-[#f1f5f9] transition-colors no-underline"
                    >
                      <ArrowRight size={16} weight="bold" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#f1f5f9] bg-white">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Mostrando {filteredOrcamentos.length} obras
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
