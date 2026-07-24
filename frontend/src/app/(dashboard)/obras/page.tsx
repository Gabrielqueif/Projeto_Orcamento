"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, CaretDown, MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import { getOrcamentos, getEtapas, type Orcamento, type Etapa } from "@/lib/api/orcamentos";
import { getObras, type Obra } from "@/lib/api/obras";

interface ObraItemData {
  orcamento: Orcamento;
  obra?: Obra;
  etapas: Etapa[];
  progressoCalculado: number;
  faseAtual: string;
  statusCalculado: string;
}

const STATUS_LABELS: Record<string, string> = {
  em_elaboracao: "EM ELABORAÇÃO",
  orcamento_concluido: "ORÇAMENTO PRONTO",
  EM_ANDAMENTO: "EM ANDAMENTO",
  em_execucao: "EM ANDAMENTO",
  CONCLUIDA: "CONCLUÍDO",
  concluido: "CONCLUÍDO",
  ATRASADO: "ATRASADO",
};

const STATUS_STYLES: Record<string, string> = {
  em_elaboracao: "bg-[rgba(0,163,177,0.1)] text-[#00a3b1]",
  orcamento_concluido: "bg-[rgba(159,211,0,0.12)] text-[#5a7f00]",
  EM_ANDAMENTO: "bg-[rgba(0,163,177,0.1)] text-[#00a3b1]",
  em_execucao: "bg-[rgba(0,163,177,0.1)] text-[#00a3b1]",
  CONCLUIDA: "bg-[#f0fdf4] text-[#15803d]",
  concluido: "bg-[#f0fdf4] text-[#15803d]",
  ATRASADO: "bg-[#fef2f2] text-[#dc2626]",
};

type FilterStatus = "todos" | "EM_ANDAMENTO" | "CONCLUIDA" | "em_elaboracao";

export default function ObrasPage() {
  const [obrasItems, setObrasItems] = useState<ObraItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos");

  const carregarDados = async (nome?: string) => {
    try {
      setLoading(true);
      const [orcamentosData, obrasData] = await Promise.all([
        getOrcamentos(undefined, undefined, nome),
        getObras().catch(() => []),
      ]);

      const itemsCompletos: ObraItemData[] = await Promise.all(
        orcamentosData.map(async (orc) => {
          const obraRelacionada = obrasData.find((o) => o.orcamento_id === orc.id);
          const etapas = await getEtapas(orc.id).catch(() => []);

          // Cálculo do progresso médio
          let progressoCalculado = 0;
          if (etapas.length > 0) {
            const somaProgresso = etapas.reduce((acc, e) => {
              let p = e.progresso || 0;
              if (p === 0 && e.data_inicio && e.data_fim) {
                const ini = new Date(e.data_inicio + "T12:00:00").getTime();
                const fim = new Date(e.data_fim + "T12:00:00").getTime();
                const agora = Date.now();
                if (agora > fim) p = 100;
                else if (agora >= ini) p = Math.round(((agora - ini) / (fim - ini)) * 100);
              }
              return acc + p;
            }, 0);
            progressoCalculado = Math.round(somaProgresso / etapas.length);
          }

          // Determinação da fase atual
          let faseAtual = "Planejamento";
          if (etapas.length > 0) {
            const etapaEmAndamento = etapas.find((e) => (e.progresso || 0) < 100);
            if (etapaEmAndamento) {
              faseAtual = etapaEmAndamento.nome;
            } else {
              faseAtual = "Concluído";
            }
          }

          // Status final
          let statusCalculado = obraRelacionada?.status || orc.status || "EM_ANDAMENTO";
          if (progressoCalculado === 100) {
            statusCalculado = "CONCLUIDA";
          }

          return {
            orcamento: orc,
            obra: obraRelacionada,
            etapas,
            progressoCalculado,
            faseAtual,
            statusCalculado,
          };
        })
      );

      setObrasItems(itemsCompletos);
    } catch (err) {
      console.error("Erro ao carregar obras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarDados(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const filteredItems = obrasItems.filter((item) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "EM_ANDAMENTO") {
      return item.statusCalculado === "EM_ANDAMENTO" || item.statusCalculado === "em_execucao";
    }
    if (activeFilter === "CONCLUIDA") {
      return item.statusCalculado === "CONCLUIDA" || item.statusCalculado === "concluido";
    }
    if (activeFilter === "em_elaboracao") {
      return item.statusCalculado === "em_elaboracao" || item.statusCalculado === "ATRASADO";
    }
    return true;
  });

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "EM_ANDAMENTO", label: "Em Andamento" },
    { key: "CONCLUIDA", label: "Concluídos" },
    { key: "em_elaboracao", label: "Em Elaboração / Atrasados" },
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
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] pl-[36px] pr-4 py-[9px] font-['Manrope'] text-[14px] text-[#001b3d] placeholder:text-[#94a3b8] outline-none focus:border-[#9fd300] transition-colors w-[220px]"
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
                Progresso Real
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
            ) : filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center font-['Manrope'] text-[14px] text-[#94a3b8]"
                >
                  Nenhuma obra encontrada.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <tr
                  key={item.orcamento.id}
                  className={`group cursor-pointer transition-colors hover:bg-[#f8fafc] ${
                    idx < filteredItems.length - 1 ? "border-b border-[#f8fafc]" : ""
                  }`}
                >
                  {/* Nome */}
                  <td className="px-6 py-[20px] align-middle">
                    <Link href={`/obras/${item.orcamento.id}`} className="no-underline">
                      <div className="font-['Manrope'] font-bold text-[16px] text-[#001b3d] leading-tight hover:text-[#00a3b1] transition-colors">
                        {item.orcamento.nome}
                      </div>
                      <div className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] mt-0.5">
                        #{`GP-${item.orcamento.id.substring(0, 8).toUpperCase()}`}
                      </div>
                    </Link>
                  </td>

                  {/* Cliente */}
                  <td className="px-6 py-[20px] align-middle">
                    <span className="font-['Manrope'] font-medium text-[14px] text-[#475569]">
                      {item.orcamento.cliente || "—"}
                    </span>
                  </td>

                  {/* Fase */}
                  <td className="px-6 py-[20px] align-middle">
                    <span className="inline-flex items-center px-3 py-1 rounded-full font-['JetBrains_Mono'] font-medium text-[10px] uppercase tracking-[0.5px] bg-[rgba(0,163,177,0.1)] text-[#00a3b1] max-w-[150px] truncate" title={item.faseAtual}>
                      {item.faseAtual}
                    </span>
                  </td>

                  {/* Progresso */}
                  <td className="px-6 py-[20px] align-middle">
                    <div className="flex flex-col gap-1.5 w-[192px]">
                      <div className="flex items-center justify-between">
                        <span className="font-['JetBrains_Mono'] font-semibold text-[11px] text-[#001b3d]">
                          {item.progressoCalculado.toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-[#f1f5f9] h-[6px] rounded-full overflow-hidden w-full">
                        <div
                          className="bg-[#9fd300] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, item.progressoCalculado))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-[20px] align-middle">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-[8px] font-['JetBrains_Mono'] font-semibold text-[10px] uppercase tracking-[0.5px] ${
                        STATUS_STYLES[item.statusCalculado] || "bg-[#f1f5f9] text-[#64748b]"
                      }`}
                    >
                      {STATUS_LABELS[item.statusCalculado] || item.statusCalculado}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 align-middle text-right">
                    <Link
                      href={`/obras/${item.orcamento.id}`}
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
            Mostrando {filteredItems.length} obras
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

