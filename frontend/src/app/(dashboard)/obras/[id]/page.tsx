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
  Warehouse,
} from "@phosphor-icons/react";
import {
  getOrcamento,
  getEtapas,
  getItens,
  atualizarProgressoEtapa,
  type Orcamento,
  type Etapa,
  type OrcamentoItem,
} from "@/lib/api/orcamentos";
import { getEstoqueInsumos, type InsumoAlmoxarifado } from "@/lib/api/almoxarifado";
import { atualizarStatusObra } from "@/lib/api/obras";

export default function ObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [insumos, setInsumos] = useState<InsumoAlmoxarifado[]>([]);
  const [loading, setLoading] = useState(true);
  const [obraStatus, setObraStatus] = useState<string>("EM_ANDAMENTO");
  const [obraId, setObraId] = useState<string | null>(null);
  const [concluindo, setConcluindo] = useState(false);
  // Estado do modal de progresso de etapa
  const [modalAberto, setModalAberto] = useState(false);
  const [etapaSelecionada, setEtapaSelecionada] = useState<string>("");
  const [progressoEtapa, setProgressoEtapa] = useState<number>(0);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orcData, etapasData, itensData, insumosData] = await Promise.all([
          getOrcamento(id),
          getEtapas(id),
          getItens(id),
          getEstoqueInsumos(id).catch(() => []),
        ]);
        setOrcamento(orcData);
        setEtapas(etapasData);
        setItens(itensData);
        setInsumos(insumosData);
        // Busca o status real da obra filtrando pelo orcamento_id
        try {
          const { getObras } = await import("@/lib/api/obras");
          const obras = await getObras().catch(() => []);
          const obra = obras.find((o) => o.orcamento_id === id);
          if (obra) {
            setObraStatus(obra.status);
            setObraId(obra.id);
          }
        } catch { /* obra ainda não iniciada */ }
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
  const hoje = new Date();

  // Gantt Scale
  const datasSalvas = etapas
    .flatMap((e) => [
      e.data_inicio ? new Date(e.data_inicio + "T12:00:00").getTime() : null,
      e.data_fim ? new Date(e.data_fim + "T12:00:00").getTime() : null,
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

  // Régua de Tempo Dinâmica para o Gantt (8 Colunas)
  const colunasGantt = Array.from({ length: 8 }).map((_, i) => {
    const tempoColuna = escalaMinima + (duracaoTotalMs / 8) * (i + 0.5);
    const dateCol = new Date(tempoColuna);
    return dateCol.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
  });

  // Mapeia etapas com seu progresso — prioriza o valor salvo no banco
  const etapasComProgresso = etapas.map((etapa) => {
    let hasDates = !!(etapa.data_inicio && etapa.data_fim);

    // Se houver um progresso explícito salvo (> 0) usa ele diretamente
    if (etapa.progresso !== undefined && etapa.progresso > 0) {
      return { ...etapa, progresso: etapa.progresso, hasDates };
    }

    // Fallback: calcula pelo tempo decorrido entre inicio e fim
    let progresso = 0;
    if (hasDates) {
      const inicio = new Date(etapa.data_inicio + "T12:00:00").getTime();
      const fim = new Date(etapa.data_fim + "T12:00:00").getTime();
      const agora = hoje.getTime();
      if (agora > fim) {
        progresso = 100;
      } else if (agora < inicio) {
        progresso = 0;
      } else {
        progresso = Math.round(((agora - inicio) / (fim - inicio)) * 100);
      }
    }
    return { ...etapa, progresso, hasDates };
  });

  // Média do progresso das etapas que possuem datas
  const etapasComData = etapasComProgresso.filter((e) => e.hasDates);
  const progressoTotal = etapasComData.length > 0
    ? Math.round(etapasComData.reduce((acc, curr) => acc + curr.progresso, 0) / etapasComData.length)
    : 0;

  // Tarefas Críticas (ativas e restando menos de 5 dias)
  const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;
  const etapasCriticasCount = etapasComProgresso.filter((e) => {
    if (!e.data_inicio || !e.data_fim) return false;
    const inicio = new Date(e.data_inicio + "T12:00:00").getTime();
    const fim = new Date(e.data_fim + "T12:00:00").getTime();
    const agora = hoje.getTime();
    return agora >= inicio && agora <= fim && (fim - agora) <= cincoDiasMs;
  }).length;

  // Dias Decorridos reais
  const dataInicioStr = orcamento.data
    ? `${orcamento.data}T12:00:00`
    : new Date().toISOString();
  const dataInicioOrcamento = new Date(dataInicioStr).getTime();
  const dataInicioProjeto = datasSalvas.length > 0 ? tempoMinimo : dataInicioOrcamento;
  const diasTotais = datasSalvas.length > 0
    ? Math.max(1, Math.ceil((tempoMaximo - tempoMinimo) / (1000 * 60 * 60 * 24)))
    : 30;
  const diffTime = hoje.getTime() - dataInicioProjeto;
  const diasDecorridos = diffTime > 0
    ? Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), diasTotais)
    : 0;

  // Status do Projeto
  let statusProjeto = "No Prazo";
  if (progressoTotal === 100) {
    statusProjeto = "Concluído";
  } else if (etapasCriticasCount > 0) {
    statusProjeto = "Crítico";
  } else if (hoje.getTime() > tempoMaximo) {
    statusProjeto = "Atrasado";
  }

  // Recursos Ativos
  const etapasAtivas = etapasComProgresso.filter((e) => {
    if (!e.data_inicio || !e.data_fim) return false;
    const inicio = new Date(e.data_inicio + "T12:00:00").getTime();
    const fim = new Date(e.data_fim + "T12:00:00").getTime();
    const agora = hoje.getTime();
    return agora >= inicio && agora <= fim;
  }).length;
  const trabalhadoresAtivos = progressoTotal === 100 ? 0 : (12 + etapasAtivas * 8);
  const totalMateriaisEstoque = insumos.length;

  // Top Insumos (Curva A)
  const topItens = [...itens]
    .sort((a, b) => (b.preco_total || 0) - (a.preco_total || 0))
    .slice(0, 3);

  return (
    <>
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
            Controle de cronograma e alocação de recursos para o projeto{" "}
            <strong className="text-[#001b3d]">{orcamento.nome}</strong>. Fase:{" "}
            <span className="font-semibold text-[#00a3b1]">
              {etapasComProgresso.find((e) => e.progresso < 100)?.nome || (progressoTotal === 100 ? "Concluído" : "Planejamento")}
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/obras/${id}/almoxarifado`}
            className="flex items-center gap-3 bg-white border border-[#cbd5e1] px-6 py-[13px] rounded-[8px] font-['Manrope'] font-bold text-[14px] text-[#001b3d] no-underline hover:bg-[#f8fafc] transition-colors"
          >
            <Warehouse size={15} />
            <span>
              Almoxarifado &<br />
              Inventário
            </span>
          </Link>
          <Link
            href={`/financeiro/controle?obra_id=${id}`}
            className="flex items-center gap-3 bg-white border border-[#cbd5e1] px-6 py-[13px] rounded-[8px] font-['Manrope'] font-bold text-[14px] text-[#001b3d] no-underline hover:bg-[#f8fafc] transition-colors"
          >
            <Coins size={15} />
            <span>
              Gestão de
              <br />
              Custos
            </span>
          </Link>
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
              {progressoTotal}%
            </span>
            <span className="font-['Manrope'] font-bold text-[10px] text-[#9fd300] leading-[15px]">
              Média do cronograma
            </span>
          </div>
          <div className="bg-[#f8fafc] h-[6px] rounded-full w-full overflow-hidden">
            <div className="bg-[#9fd300] h-full" style={{ width: `${progressoTotal}%` }} />
          </div>
        </div>

        {/* Tarefas Críticas */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-[25px] flex flex-col gap-4">
          <p className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Tarefas Críticas
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-['Manrope'] font-extrabold text-[30px] text-[#001b3d] leading-[36px]">
              {String(etapasCriticasCount).padStart(2, "0")}
            </span>
            <span className="font-['Manrope'] font-bold text-[10px] text-[#64748b] uppercase leading-[15px]">
              a vencer em 5 dias
            </span>
          </div>
          <div className="flex items-center -space-x-2">
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
              de {diasTotais} dias
            </span>
          </div>
          <p className="font-['Manrope'] font-bold text-[10px] text-[#00a3b1] uppercase">
            Meta: {new Date(tempoMinimo).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Status do Projeto */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] px-[25px] pt-[25px] pb-[42px] flex flex-col gap-4">
          <p className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
            Status do Projeto
          </p>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${statusProjeto === "Crítico" ? "bg-status-danger" : "bg-[#9fd300]"}`} />
            <span className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3d] leading-[28px]">
              {statusProjeto}
            </span>
          </div>
          <p className="font-['Manrope'] font-bold text-[10px] text-[#64748b] uppercase">
            Cronograma Ativo
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
              {colunasGantt.map((colText, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center"
                >
                  <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                    {colText}
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
              backgroundSize: `${100 / 8}% 100%`,
            }}
          />

          {etapasComProgresso.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-['Manrope'] text-[14px] text-[#94a3b8]">
                Nenhuma etapa cadastrada.
              </p>
            </div>
          ) : (
            etapasComProgresso.map((etapa) => {
              let left = 0;
              let width = 0;
              if (etapa.data_inicio && etapa.data_fim) {
                const inicioMs = new Date(etapa.data_inicio + "T12:00:00").getTime();
                const fimMs = new Date(etapa.data_fim + "T12:00:00").getTime();
                left = ((inicioMs - escalaMinima) / duracaoTotalMs) * 100;
                width = Math.max(((fimMs - inicioMs) / duracaoTotalMs) * 100, 2);
              }

              const isConcluida = etapa.progresso === 100;
              const hasDates = etapa.hasDates;
              const progressText = hasDates ? `${etapa.progresso}%` : "S/ Prazos";
              const progressColor = !hasDates
                ? "bg-red-50 text-status-danger"
                : isConcluida
                ? "bg-[rgba(159,211,0,0.1)] text-[#9fd300]"
                : etapa.progresso > 0
                ? "bg-[rgba(0,27,61,0.1)] text-[#001b3d]"
                : "bg-[#f1f5f9] text-[#64748b]";

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
                      className={`inline-flex items-center px-2 py-[2px] rounded-[8px] font-['JetBrains_Mono'] font-medium text-[9px] uppercase tracking-[0.45px] ${progressColor}`}
                    >
                      {progressText}
                    </span>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative h-[64px]">
                    {hasDates ? (
                      <div
                        className={`absolute top-[16px] h-[32px] rounded-[8px] flex items-center px-3 shadow-[0_1px_1px_rgba(0,0,0,0.05)] overflow-hidden ${
                          isConcluida
                            ? "bg-[#9fd300]"
                            : etapa.progresso > 0
                            ? "bg-[#001b3d]"
                            : "bg-[#f8fafc] border border-dashed border-[#cbd5e1]"
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          minWidth: "60px",
                        }}
                      >
                        <span
                          className={`font-['JetBrains_Mono'] font-medium text-[10px] uppercase tracking-[0.5px] whitespace-nowrap truncate ${
                            isConcluida
                              ? "text-[#001b3d]"
                              : etapa.progresso > 0
                              ? "text-white"
                              : "text-[#64748b]"
                          }`}
                        >
                          {isConcluida
                            ? `Finalizado - ${etapa.nome}`
                            : etapa.progresso > 0
                            ? `${etapa.progresso}% - ${etapa.nome}`
                            : `Planejado - ${etapa.nome}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center h-full px-4">
                        <span className="font-['Manrope'] text-[11px] text-[#94a3b8] italic">
                          Aguardando definição de datas
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
          {obraStatus === "CONCLUIDA" ? (
            <div className="flex items-center gap-1.5">
              <CheckSquare size={11.667} weight="fill" className="text-[#9fd300]" />
              <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#9fd300] uppercase tracking-[0.5px]">
                Obra Concluída
              </span>
            </div>
          ) : (
            <button
              id="btn-marcar-concluido"
              onClick={() => {
                if (etapas.length === 0) {
                  alert("Nenhuma etapa cadastrada nesta obra.");
                  return;
                }
                // pré-preenche com a primeira etapa
                setEtapaSelecionada(etapas[0].id);
                setProgressoEtapa(etapas[0].progresso ?? 0);
                setModalAberto(true);
              }}
              className="flex items-center gap-1.5 border-b-2 border-[rgba(0,27,61,0.2)] pb-1 bg-transparent cursor-pointer hover:border-[#9fd300] transition-colors group"
            >
              <CheckSquare size={11.667} className="text-[#001b3d] group-hover:text-[#9fd300] transition-colors" />
              <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#001b3d] uppercase tracking-[0.5px] group-hover:text-[#9fd300] transition-colors">
                Atualizar Progresso
              </span>
            </button>
          )}
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
              {trabalhadoresAtivos}
            </div>
            <div className="font-['JetBrains_Mono'] text-[12px] text-[#94a3b8]">
              COLABORADORES ATIVOS
            </div>
          </div>

          <div className="mb-6">
            <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[1px] mb-2">
              Materiais no Canteiro
            </div>
            <div className="font-['Manrope'] font-extrabold text-[32px] text-[#9fd300] leading-tight mb-1">
              {totalMateriaisEstoque}
            </div>
            <div className="font-['JetBrains_Mono'] text-[12px] text-[#94a3b8]">
              ITENS DE INVENTÁRIO
            </div>
          </div>

          <div className="mt-auto pt-4 flex flex-col gap-2">
            <Link
              href={`/obras/${id}/almoxarifado`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#9fd300] text-[#001b3d] rounded-[8px] font-['Manrope'] font-bold text-[14px] no-underline transition-all hover:opacity-90"
            >
              <Warehouse size={18} />
              Acessar Almoxarifado & Inventário
            </Link>
            <Link
              href="/suprimentos/solicitar"
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 text-white rounded-[8px] font-['Manrope'] font-bold text-[13px] no-underline transition-all hover:bg-white/20"
            >
              <ShoppingCart size={18} />
              Solicitar Suprimentos
            </Link>
          </div>
        </div>
      </div>
      </div>

      {/* Modal: Atualizar Progresso de Etapa */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,27,61,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalAberto(false); }}
        >
          <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-[460px] mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f1f5f9]">
              <div>
                <h2 className="font-['Manrope'] font-extrabold text-[18px] text-[#001b3d] tracking-[-0.4px]">
                  Atualizar Progresso
                </h2>
                <p className="font-['Manrope'] text-[13px] text-[#64748b] mt-0.5">
                  Selecione a etapa e informe a porcentagem concluída
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f1f5f9] transition-colors text-[#94a3b8] text-[18px] font-bold"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-5">
              {/* Etapa */}
              <div className="flex flex-col gap-1.5">
                <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                  Etapa
                </label>
                <select
                  id="modal-etapa-select"
                  value={etapaSelecionada}
                  onChange={(e) => {
                    const etapa = etapas.find((et) => et.id === e.target.value);
                    setEtapaSelecionada(e.target.value);
                    setProgressoEtapa(etapa?.progresso ?? 0);
                  }}
                  className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 font-['Manrope'] text-[14px] text-[#001b3d] bg-white outline-none focus:border-[#001b3d] transition-colors"
                >
                  {etapas.map((et) => (
                    <option key={et.id} value={et.id}>
                      {et.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progresso */}
              <div className="flex flex-col gap-1.5">
                <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                  Progresso — <span className="text-[#001b3d]">{progressoEtapa}%</span>
                </label>
                <input
                  id="modal-progresso-input"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progressoEtapa}
                  onChange={(e) => setProgressoEtapa(Number(e.target.value))}
                  className="w-full accent-[#9fd300] h-2 cursor-pointer"
                />
                <div className="flex justify-between font-['JetBrains_Mono'] text-[10px] text-[#94a3b8]">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Barra de preview */}
              <div className="bg-[#f8fafc] rounded-[8px] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Manrope'] text-[12px] text-[#64748b]">Prévia</span>
                  <span
                    className={`font-['JetBrains_Mono'] font-bold text-[11px] px-2 py-0.5 rounded-[6px] ${
                      progressoEtapa === 100
                        ? "bg-[rgba(159,211,0,0.15)] text-[#9fd300]"
                        : progressoEtapa > 0
                        ? "bg-[rgba(0,27,61,0.08)] text-[#001b3d]"
                        : "bg-[#f1f5f9] text-[#64748b]"
                    }`}
                  >
                    {progressoEtapa === 100 ? "Concluída" : progressoEtapa > 0 ? "Em andamento" : "Planejada"}
                  </span>
                </div>
                <div className="bg-[#e2e8f0] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      progressoEtapa === 100 ? "bg-[#9fd300]" : "bg-[#001b3d]"
                    }`}
                    style={{ width: `${progressoEtapa}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f1f5f9]">
              <button
                onClick={() => setModalAberto(false)}
                className="px-5 py-2.5 border border-[#e2e8f0] rounded-[8px] font-['Manrope'] font-semibold text-[14px] text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Cancelar
              </button>
              <button
                id="modal-btn-salvar"
                disabled={salvandoProgresso}
                onClick={async () => {
                  if (!etapaSelecionada) return;
                  try {
                    setSalvandoProgresso(true);
                    const atualizada = await atualizarProgressoEtapa(id, etapaSelecionada, progressoEtapa);
                    // Atualiza a etapa na lista local de forma imutável
                    setEtapas((prev) =>
                      prev.map((et) =>
                        et.id === etapaSelecionada ? { ...et, progresso: atualizada.progresso ?? progressoEtapa } : et
                      )
                    );
                    setModalAberto(false);
                  } catch (err) {
                    console.error("Erro ao salvar progresso:", err);
                    alert("Não foi possível salvar. Tente novamente.");
                  } finally {
                    setSalvandoProgresso(false);
                  }
                }}
                className="px-5 py-2.5 bg-[#001b3d] rounded-[8px] font-['Manrope'] font-bold text-[14px] text-white hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {salvandoProgresso ? "Salvando..." : "Salvar Progresso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
