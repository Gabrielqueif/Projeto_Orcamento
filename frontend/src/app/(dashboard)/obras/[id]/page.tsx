"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  Export,
  CheckSquare,
  Square,
  CheckSquareOffset,
  Funnel,
  ShoppingCart,
  Cube,
  User,
  Coins,
} from "@phosphor-icons/react";
import {
  getOrcamento,
  getEtapas,
  getItens,
  type Orcamento,
  type Etapa,
  type OrcamentoItem,
} from "@/lib/api/orcamentos";

const GANTT_WEEKS = ["Ago S1", "Ago S2", "Ago S3", "Ago S4", "Set S1", "Set S2", "Set S3", "Set S4"];

export default function ObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orcData, etapasData, itensData] = await Promise.all([
          getOrcamento(id),
          getEtapas(id),
          getItens(id),
        ]);
        setOrcamento(orcData);
        setEtapas(etapasData);
        setItens(itensData);
      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="font-['Manrope'] text-[14px] text-[#94a3b8]">
          Carregando detalhes da obra...
        </span>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="font-['Manrope'] text-[14px] text-[#94a3b8]">
          Obra não encontrada.
        </span>
      </div>
    );
  }

  // Cálculos dinâmicos
  const dataInicioStr = orcamento.data
    ? `${orcamento.data}T12:00:00`
    : new Date().toISOString();
  const dataInicio = new Date(dataInicioStr);
  const hoje = new Date();
  const diffTime = hoje.getTime() - dataInicio.getTime();
  const diasDecorridos =
    diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  // Top Insumos (Curva A)
  const topItens = [...itens]
    .sort((a, b) => (b.preco_total || 0) - (a.preco_total || 0))
    .slice(0, 3);

  // Gantt Scale
  const datasSalvas = etapas
    .flatMap((e) => [
      e.data_inicio ? new Date(e.data_inicio).getTime() : null,
      e.data_fim ? new Date(e.data_fim).getTime() : null,
    ])
    .filter((d): d is number => d !== null);

  const tempoMinimo =
    datasSalvas.length > 0 ? Math.min(...datasSalvas) : new Date().getTime();
  const tempoMaximo =
    datasSalvas.length > 0
      ? Math.max(...datasSalvas)
      : new Date().getTime() + 30 * 24 * 60 * 60 * 1000;

  const marginMs = 5 * 24 * 60 * 60 * 1000;
  const escalaMinima = tempoMinimo - marginMs;
  const escalaMaxima = tempoMaximo + marginMs;
  const duracaoTotalMs = escalaMaxima - escalaMinima;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href="/obras"
            className="inline-flex items-center gap-2 text-[#94a3b8] no-underline hover:text-[#001b3d] transition-colors mb-2 font-['Manrope'] text-[13px] font-medium"
          >
            <ArrowLeft size={14} weight="bold" />
            Voltar
          </Link>
          <p className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#00a3b1] uppercase tracking-[0.5px] leading-[15px]">
            Projetos / {orcamento.cliente || "Cliente não informado"}
          </p>
          <h1 className="font-['Manrope'] font-extrabold text-[36px] text-[#001b3d] tracking-[-0.9px] leading-[40px]">
            Cronograma de Obra
          </h1>
          <p className="font-['Manrope'] font-medium text-[14px] text-[#64748b] leading-[20px] max-w-[545px] mt-1">
            Controle de cronograma e alocação de recursos para o complexo{" "}
            <strong className="text-[#001b3d]">{orcamento.nome}</strong>. Fase:{" "}
            Estrutural.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/obras/${id}/planilha`}
            className="flex items-center gap-3 bg-white border border-[#cbd5e1] px-6 py-[13px] rounded-[8px] font-['Manrope'] font-bold text-[14px] text-[#001b3d] no-underline hover:bg-[#f8fafc] transition-colors"
          >
            <Coins size={15} />
            <span>
              Planilha de
              <br />
              Orçamento
            </span>
          </Link>
          <Link
            href={`/obras/${id}/prazo`}
            className="flex items-center gap-3 bg-white border border-[#cbd5e1] px-6 py-[13px] rounded-[8px] font-['Manrope'] font-bold text-[14px] text-[#001b3d] no-underline hover:bg-[#f8fafc] transition-colors"
          >
            <CalendarPlus size={15} />
            <span>
              Editar
              <br />
              Prazos
            </span>
          </Link>
          <button className="relative flex items-center gap-3 bg-[#001b3d] text-white px-6 pt-[12.5px] pb-[13.5px] rounded-[8px] font-['Manrope'] font-bold text-[14px] shadow-[0_10px_15px_-3px_rgba(0,27,61,0.1),0_4px_6px_-4px_rgba(0,27,61,0.1)] hover:bg-[#00102a] transition-colors border-none cursor-pointer">
            <Export size={13.5} />
            <span>
              Exportar
              <br />
              Cronograma
            </span>
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Progresso Total */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] px-[25px] pt-[25px] pb-[43px] flex flex-col gap-4">
          <p className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Progresso Total
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-['Manrope'] font-extrabold text-[30px] text-[#9fd300] leading-[36px]">
              64%
            </span>
            <span className="font-['Manrope'] font-bold text-[10px] text-[#9fd300] leading-[15px]">
              +4% esta semana
            </span>
          </div>
          <div className="bg-[#f8fafc] h-[6px] rounded-full w-full overflow-hidden">
            <div className="bg-[#9fd300] h-full" style={{ width: "64%" }} />
          </div>
        </div>

        {/* Tarefas Críticas */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-[25px] flex flex-col gap-4">
          <p className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Tarefas Críticas
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-['Manrope'] font-extrabold text-[30px] text-[#001b3d] leading-[36px]">
              02
            </span>
            <span className="font-['Manrope'] font-bold text-[10px] text-[#64748b] uppercase leading-[15px]">
              em aprovação
            </span>
          </div>
          <div className="flex items-center -space-x-2">
            <div className="w-6 h-6 rounded-[8px] bg-[#e2e8f0] border-2 border-white flex items-center justify-center z-10">
              <User size={12} weight="fill" className="text-[#94a3b8]" />
            </div>
            <div className="w-6 h-6 rounded-[8px] bg-[#001b3d] border-2 border-white flex items-center justify-center z-0">
              <User size={12} weight="fill" className="text-white" />
            </div>
          </div>
        </div>

        {/* Dias Decorridos */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] px-[25px] pt-[25px] pb-[34px] flex flex-col gap-4">
          <p className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Dias Decorridos
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-['Manrope'] font-extrabold text-[30px] text-[#001b3d] leading-[36px]">
              {diasDecorridos}
            </span>
            <span className="font-['Manrope'] font-bold text-[10px] text-[#64748b] uppercase leading-[15px]">
              de 360 dias
            </span>
          </div>
          <p className="font-['Manrope'] font-bold text-[10px] text-[#00a3b1] uppercase">
            Meta: {dataInicio.toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Status do Projeto */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] px-[25px] pt-[25px] pb-[42px] flex flex-col gap-4">
          <p className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Status do Projeto
          </p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#9fd300]" />
            <span className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3d] leading-[28px]">
              No Prazo
            </span>
          </div>
          <p className="font-['Manrope'] font-bold text-[10px] text-[#64748b] uppercase">
            Estabilidade: 98.4%
          </p>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Gantt Header */}
        <div className="flex border-b border-[#f1f5f9]">
          {/* Task column header */}
          <div className="w-[320px] bg-[#f8fafc] border-r border-[#f1f5f9] flex items-center justify-between px-4 py-4 shrink-0">
            <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
              Etapas do Projeto
            </span>
            <Funnel size={10.5} className="text-[#94a3b8]" />
          </div>
          {/* Timeline header */}
          <div className="flex-1 bg-[#f8fafc]">
            <div className="flex h-[48px] items-center">
              {GANTT_WEEKS.map((week) => (
                <div
                  key={week}
                  className="flex-1 flex items-center justify-center"
                >
                  <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                    {week}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Rows */}
        <div className="relative">
          {/* Grid lines */}
          <div
            className="absolute inset-0 left-[320px] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #f1f5f9 1px, transparent 1px)",
              backgroundSize: `${100 / GANTT_WEEKS.length}% 100%`,
            }}
          />

          {etapas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-['Manrope'] text-[14px] text-[#94a3b8]">
                Nenhuma etapa cadastrada.
              </p>
            </div>
          ) : (
            etapas.slice(0, 4).map((etapa, index) => {
              let left = 0;
              let width = 0;
              let hasDates = false;
              const isConcluida = index === 0;

              if (etapa.data_inicio && etapa.data_fim) {
                hasDates = true;
                const inicioMs = new Date(etapa.data_inicio).getTime();
                const fimMs = new Date(etapa.data_fim).getTime();
                left = ((inicioMs - escalaMinima) / duracaoTotalMs) * 100;
                width = Math.max(
                  ((fimMs - inicioMs) / duracaoTotalMs) * 100,
                  5
                );
              }

              return (
                <div
                  key={etapa.id}
                  className="flex border-b border-[#f1f5f9] last:border-b-0"
                >
                  {/* Task name column */}
                  <div className="w-[320px] border-r border-[#f1f5f9] flex items-center justify-between px-4 py-4 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                      {isConcluida ? (
                        <div className="w-[18px] h-[18px] bg-[#9fd300] rounded-[8px] flex items-center justify-center shrink-0">
                          <CheckSquareOffset
                            size={14}
                            weight="fill"
                            className="text-[#001b3d]"
                          />
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-white border border-[#e2e8f0] rounded-[8px] shrink-0" />
                      )}
                      <span className="font-['Manrope'] font-bold text-[14px] text-[#001b3d] truncate max-w-[180px]">
                        {etapa.nome}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-[2px] rounded-[8px] font-['JetBrains_Mono'] font-medium text-[9px] uppercase tracking-[0.45px] ${
                        isConcluida
                          ? "bg-[rgba(159,211,0,0.1)] text-[#9fd300]"
                          : index === 1
                          ? "bg-[rgba(0,27,61,0.1)] text-[#001b3d]"
                          : "bg-[#f1f5f9] text-[#64748b]"
                      }`}
                    >
                      {isConcluida ? "100%" : index === 1 ? "85%" : "0%"}
                    </span>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative h-[64px]">
                    {hasDates ? (
                      <>
                        {/* Background ghost bar */}
                        {!isConcluida && index === 1 && (
                          <div
                            className="absolute top-[16px] h-[32px] bg-[rgba(0,27,61,0.1)] rounded-[8px]"
                            style={{
                              left: `${Math.max(left - 10, 0)}%`,
                              width: "35%",
                            }}
                          />
                        )}
                        {/* Main bar */}
                        <div
                          className={`absolute top-[16px] h-[32px] rounded-[8px] flex items-center px-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)] overflow-hidden ${
                            isConcluida
                              ? "bg-[#9fd300]"
                              : "bg-[#001b3d]"
                          }`}
                          style={{
                            left: hasDates ? `${left}%` : "5%",
                            width: hasDates ? `${width}%` : "30%",
                            minWidth: "60px",
                          }}
                        >
                          {index === 1 && (
                            <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-white uppercase tracking-[0.5px] whitespace-nowrap">
                              Montagem de Lajes (Piso 12)
                            </span>
                          )}
                          {isConcluida && (
                            <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#001b3d] uppercase tracking-[0.5px]">
                              Finalizado
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center h-full px-4">
                        <span className="font-['Manrope'] text-[11px] text-[#94a3b8] italic">
                          Aguardando datas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Gantt Footer */}
        <div className="flex items-center justify-between bg-[#f8fafc] border-t border-[#f1f5f9] px-4 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-[2px] bg-[#9fd300]" />
              <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Concluído
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-[2px] bg-[#001b3d]" />
              <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Em andamento
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-[2px] bg-white border border-dashed border-[#cbd5e1]" />
              <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Planejado
              </span>
            </div>
          </div>
          <Link
            href={`/obras/${id}/prazo`}
            className="flex items-center gap-1.5 border-b-2 border-[rgba(0,27,61,0.2)] pb-1 no-underline"
          >
            <CheckSquare size={11.667} className="text-[#001b3d]" />
            <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#001b3d] uppercase tracking-[0.5px]">
              Marcar como concluído
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Curva A + Recursos */}
      <div className="grid grid-cols-3 gap-6">
        {/* Curva A */}
        <div className="col-span-2 bg-white border border-[#f1f5f9] rounded-[8px] p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <h2 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3d] tracking-[-0.5px] mb-6">
            Detalhamento: Curva A de Custos
          </h2>

          {topItens.length === 0 ? (
            <p className="font-['Manrope'] text-[14px] text-[#94a3b8]">
              Nenhum insumo com valor cadastrado.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topItens.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-[#f1f5f9] rounded-[8px] hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="flex-1 pr-4 min-w-0">
                    <h4 className="font-['Manrope'] font-bold text-[14px] text-[#001b3d] truncate mb-1">
                      {item.descricao}
                    </h4>
                    <p className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] uppercase tracking-[0.5px] flex gap-3">
                      <span>
                        {item.quantidade} {item.unidade}
                      </span>
                      {item.preco_unitario && (
                        <span>
                          • Un: R${" "}
                          {item.preco_unitario.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-['Manrope'] font-bold text-[14px] text-[#9fd300]">
                      R${" "}
                      {(item.preco_total || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[10px] text-[#94a3b8] uppercase mt-0.5">
                      Custo Total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {itens.length > 3 && (
            <div className="text-center mt-4">
              <Link
                href={`/obras/${id}/planilha`}
                className="font-['Manrope'] font-semibold text-[14px] text-[#9fd300] no-underline hover:underline"
              >
                Ver todos os {itens.length} insumos →
              </Link>
            </div>
          )}
        </div>

        {/* Recursos */}
        <div className="bg-[#001b3d] text-white rounded-[8px] p-6 flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 font-['Manrope'] font-semibold text-[18px] mb-8">
            <Cube size={24} />
            Recursos
          </div>

          <div className="mb-6">
            <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[1px] mb-2">
              Mão de Obra
            </div>
            <div className="font-['Manrope'] font-extrabold text-[32px] leading-tight mb-1">
              34
            </div>
            <div className="font-['JetBrains_Mono'] text-[12px] text-[#94a3b8]">
              COLABORADORES ATIVOS
            </div>
          </div>

          <div className="mb-6">
            <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[1px] mb-2">
              Materiais (Concretagem)
            </div>
            <div className="font-['Manrope'] font-extrabold text-[32px] text-[#9fd300] leading-tight mb-1">
              120
            </div>
            <div className="font-['JetBrains_Mono'] text-[12px] text-[#94a3b8]">
              M³ DE CONCRETO
            </div>
          </div>

          <div className="mt-auto pt-4">
            <Link
              href="/suprimentos/solicitar"
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#9fd300] text-[#001b3d] rounded-[8px] font-['Manrope'] font-bold text-[14px] no-underline transition-all hover:opacity-90"
            >
              <ShoppingCart size={20} />
              Solicitar Suprimentos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
