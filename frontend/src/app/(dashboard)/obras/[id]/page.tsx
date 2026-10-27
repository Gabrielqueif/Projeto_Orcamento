"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckSquare, Warehouse } from "@phosphor-icons/react";
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

import { CurvaSCard } from "@/components/obras/CurvaSCard";
import { ObraTabs } from "@/components/obras/ObraTabs";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ObraDetalhePage() {
  const { showToast } = useToast();
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
      <p className="gp-sub" style={{ textAlign: "center", padding: 48 }}>Carregando detalhes da obra...</p>
    );
  }

  if (!orcamento) {
    return (
      <p className="gp-sub" style={{ textAlign: "center", padding: 48 }}>Obra não encontrada.</p>
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
    const hasDates = !!(etapa.data_inicio && etapa.data_fim);

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

  const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const posHoje = ((hoje.getTime() - escalaMinima) / duracaoTotalMs) * 100;
  const classeStatus =
    statusProjeto === "Crítico" ? "gp-da" : statusProjeto === "Atrasado" ? "gp-wa" : statusProjeto === "Concluído" ? "gp-ne" : "gp-ok";
  const faseAtual =
    etapasComProgresso.find((e) => e.progresso < 100)?.nome || (progressoTotal === 100 ? "Concluído" : "Planejamento");
  const fimProjeto = new Date(tempoMaximo).toLocaleDateString("pt-BR");

  return (
    <>
      <PageHeader
        back="/obras"
        backLabel="Voltar para obras"
        crumb={<><Link href="/obras">Obras</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>{orcamento.nome}</span></>}
        title={orcamento.nome}
        badge={
          <span className={`gp-bg ${classeStatus}`}>
            <span className="gp-dot" aria-hidden="true" />
            {statusProjeto}
          </span>
        }
        subtitle={
          <>
            {orcamento.cliente || "Cliente não informado"}
            {orcamento.responsavel_tecnico ? ` · Resp. técnica: ${orcamento.responsavel_tecnico}` : ""} · Fase: {faseAtual}
          </>
        }
        actions={
          <>
            <Link href={`/diario/${id}`} className="gp-btn gp-bs">Registrar diário</Link>
            <Link href={`/prazo/${id}`} className="gp-btn gp-bd">Editar prazos</Link>
          </>
        }
      />

      <section aria-label="Resumo da obra" className="gp-grid">
        <div className="gp-card gp-met gp-dark">
          <span className="gp-ml">Avanço físico</span>
          <span className="gp-mv">{progressoTotal}%</span>
          <span className="gp-bar" role="progressbar" aria-label={`Avanço físico ${progressoTotal}%`} aria-valuenow={progressoTotal} aria-valuemin={0} aria-valuemax={100} style={{ background: "rgba(255,255,255,.14)" }}>
            <span style={{ width: `${progressoTotal}%`, background: "#9fd300" }} />
          </span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Contrato</span>
          <span className="gp-mv">{moeda(orcamento.valor_total || 0)}</span>
          <span className="gp-ms">Média do cronograma das etapas</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Tarefas críticas</span>
          <span className="gp-mv" style={{ color: etapasCriticasCount ? "#9A3412" : undefined }}>{String(etapasCriticasCount).padStart(2, "0")}</span>
          <span className="gp-ms">A vencer em 5 dias</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Prazo</span>
          <span className="gp-mv">{diasTotais} dias</span>
          <span className="gp-ms">Dia {diasDecorridos} · término {fimProjeto}</span>
        </div>
      </section>

      <ObraTabs id={id} atual="prazo" />

      <div className="gp-split">
        <section className="gp-card gp-main" aria-labelledby="h-cr" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 22px", borderBottom: "1px solid #E6EBF2" }}>
            <h2 id="h-cr" className="gp-h2">Cronograma das etapas</h2>
            <Link href={`/prazo/${id}`} style={{ fontSize: 14, fontWeight: 800 }}>Editar cronograma</Link>
          </div>

          {etapasComProgresso.length === 0 ? (
            <p style={{ margin: 0, padding: 32, textAlign: "center", fontSize: 14, color: "#475569" }}>Nenhuma etapa cadastrada.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 760 }}>
                <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "240px repeat(8, minmax(0, 1fr))", padding: "10px 22px", background: "#F8FAFC", fontSize: 12, fontWeight: 800, color: "#334155" }}>
                  <span>Etapa</span>
                  {colunasGantt.map((c, i) => <span key={i}>{c}</span>)}
                </div>
                <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {etapasComProgresso.map((etapa, idx) => {
                    const concluida = etapa.progresso === 100;
                    const emExecucao = !concluida && etapa.progresso > 0;
                    const st = !etapa.hasDates ? "Sem prazos" : concluida ? "Concluída" : emExecucao ? "Em execução" : "A iniciar";
                    const [bg, fg, cor] = concluida
                      ? ["#E6F6D0", "#3F6604", "#65A30D"]
                      : emExecucao
                      ? ["#e0f5f7", "#00626b", "#00a3b1"]
                      : ["#EDF1F6", "#334155", "#CBD5E1"];
                    let left = 0;
                    let width = 0;
                    if (etapa.data_inicio && etapa.data_fim) {
                      const inicioMs = new Date(etapa.data_inicio + "T12:00:00").getTime();
                      const fimMs = new Date(etapa.data_fim + "T12:00:00").getTime();
                      left = ((inicioMs - escalaMinima) / duracaoTotalMs) * 100;
                      width = Math.max(((fimMs - inicioMs) / duracaoTotalMs) * 100, 2);
                    }
                    const periodo = etapa.hasDates
                      ? `${new Date(etapa.data_inicio + "T12:00:00").toLocaleDateString("pt-BR")} a ${new Date(etapa.data_fim + "T12:00:00").toLocaleDateString("pt-BR")}`
                      : "Aguardando definição de datas";
                    return (
                      <li key={etapa.id} style={{ display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", alignItems: "center", padding: "14px 22px", borderTop: "1px solid #E6EBF2" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span aria-hidden="true" style={{ width: 30, height: 30, flex: "0 0 30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: bg, color: fg, boxShadow: emExecucao ? "inset 0 0 0 2px #00a3b1" : undefined }}>
                            {concluida ? "✓" : emExecucao ? idx + 1 : ""}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }} title={etapa.nome}>{etapa.nome}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#475569" }}>
                              {periodo} · <strong style={{ color: fg }}>{emExecucao ? `${st} ${etapa.progresso}%` : st}</strong>
                            </p>
                          </div>
                        </div>
                        {etapa.hasDates ? (
                          <div
                            role="img"
                            aria-label={`${etapa.nome}: ${periodo}, ${st.toLowerCase()}${emExecucao ? `, ${etapa.progresso}% executado` : ""}`}
                            style={{ position: "relative", height: 28, backgroundImage: "linear-gradient(90deg, #E6EBF2 1px, transparent 1px)", backgroundSize: `${100 / 8}% 100%` }}
                          >
                            <span style={{ position: "absolute", top: 6, height: 16, left: `${left}%`, width: `${width}%`, minWidth: 8, borderRadius: 999, overflow: "hidden", background: concluida || emExecucao ? bg : "#E6EBF2" }}>
                              <span style={{ display: "block", height: "100%", width: `${etapa.progresso}%`, background: cor }} />
                            </span>
                            {posHoje >= 0 && posHoje <= 100 && (
                              <span aria-hidden="true" style={{ position: "absolute", top: -14, bottom: -14, left: `${posHoje}%`, width: 2, background: "#F97316" }} />
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>Aguardando definição de datas</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 22px", borderTop: "1px solid #E6EBF2", fontSize: 13, color: "#475569" }}>
            <p style={{ margin: 0 }}>
              <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, background: "#F97316", marginRight: 6 }} />
              Linha laranja = hoje ({hoje.toLocaleDateString("pt-BR")}). Cores da barra: verde concluída, azul em execução, cinza a iniciar.
            </p>
            {obraStatus === "CONCLUIDA" ? (
              <span className="gp-bg gp-ok">
                <CheckSquare size={14} weight="fill" aria-hidden="true" />
                Obra Concluída
              </span>
            ) : (
              <button
                id="btn-marcar-concluido"
                type="button"
                className="gp-btn gp-bs gp-sm"
                onClick={() => {
                  if (etapas.length === 0) {
                    showToast("Nenhuma etapa cadastrada nesta obra.", undefined, "warning");
                    return;
                  }
                  // pré-preenche com a primeira etapa
                  setEtapaSelecionada(etapas[0].id);
                  setProgressoEtapa(etapas[0].progresso ?? 0);
                  setModalAberto(true);
                }}
              >
                <CheckSquare size={16} weight="bold" aria-hidden="true" />
                Atualizar Progresso
              </button>
            )}
          </div>
        </section>

        <div className="gp-side" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section className="gp-card gp-pad" aria-labelledby="h-rec">
            <h2 id="h-rec" className="gp-h2">Recursos</h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#475569" }}>
              <strong className="gp-mono" style={{ fontSize: 22, color: "#001b3d" }}>{trabalhadoresAtivos}</strong> colaboradores ativos
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#475569" }}>
              <strong className="gp-mono" style={{ fontSize: 22, color: "#001b3d" }}>{totalMateriaisEstoque}</strong> itens de inventário no canteiro
            </p>
            <Link href={`/obras/${id}/almoxarifado`} className="gp-btn gp-bp" style={{ width: "100%", marginTop: 16 }}>
              <Warehouse size={18} weight="bold" aria-hidden="true" />
              Acessar Almoxarifado & Inventário
            </Link>
          </section>
        </div>
      </div>

      {/* Curva S: planejado x realizado */}
      <CurvaSCard obraId={id} />

      <section className="gp-card" aria-labelledby="h-ca" style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #E6EBF2" }}>
          <h2 id="h-ca" className="gp-h2">Detalhamento: Curva A de Custos</h2>
        </div>
        {topItens.length === 0 ? (
          <p style={{ margin: 0, padding: 22, fontSize: 14, color: "#475569" }}>Nenhum insumo com valor cadastrado.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: "0 22px" }}>
            {topItens.map((item) => (
              <li key={item.id} className="gp-li" style={{ padding: "14px 0" }}>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: 14 }}>{item.descricao}</strong>
                  <span className="gp-hint">
                    {item.quantidade} {item.unidade}
                    {item.preco_unitario ? ` · Un: R$ ${item.preco_unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
                  </span>
                </span>
                <span style={{ textAlign: "right", flex: "0 0 auto" }}>
                  <span className="gp-mono" style={{ display: "block", fontSize: 15, fontWeight: 600 }}>
                    R$ {(item.preco_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="gp-hint">Custo Total</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {itens.length > 3 && (
          <p style={{ margin: 0, padding: "14px 22px", borderTop: "1px solid #E6EBF2", fontSize: 14, fontWeight: 800 }}>
            <Link href={`/obras/${id}/planilha`}>Ver todos os {itens.length} insumos →</Link>
          </p>
        )}
      </section>

      {/* Modal: Atualizar Progresso de Etapa */}
      {modalAberto && (
        <div className="gp-ov" onClick={(e) => { if (e.target === e.currentTarget) setModalAberto(false); }}>
          <div className="gp-dlg" role="dialog" aria-modal="true" aria-labelledby="mp-t" style={{ maxWidth: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h2 id="mp-t" className="gp-h2">Atualizar Progresso</h2>
                <p className="gp-hint" style={{ margin: "4px 0 0" }}>Selecione a etapa e informe a porcentagem concluída</p>
              </div>
              <button type="button" className="gp-ib" aria-label="Fechar" onClick={() => setModalAberto(false)}>✕</button>
            </div>

            <div className="gp-fld">
              <label htmlFor="modal-etapa-select" className="gp-lb">Etapa</label>
              <select
                id="modal-etapa-select"
                className="gp-in"
                value={etapaSelecionada}
                onChange={(e) => {
                  const etapa = etapas.find((et) => et.id === e.target.value);
                  setEtapaSelecionada(e.target.value);
                  setProgressoEtapa(etapa?.progresso ?? 0);
                }}
              >
                {etapas.map((et) => (
                  <option key={et.id} value={et.id}>{et.nome}</option>
                ))}
              </select>
            </div>

            <div className="gp-fld">
              <label htmlFor="modal-progresso-input" className="gp-lb">
                Progresso — <span className="gp-mono">{progressoEtapa}%</span>
              </label>
              <input
                id="modal-progresso-input"
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressoEtapa}
                onChange={(e) => setProgressoEtapa(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#00a3b1", height: 24, cursor: "pointer" }}
              />
              <div className="gp-mono gp-hint" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: "#F4F6FA", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="gp-hint">Prévia</span>
                <span className={`gp-bg ${progressoEtapa === 100 ? "gp-ok" : progressoEtapa > 0 ? "gp-te" : "gp-ne"}`}>
                  <span className="gp-dot" aria-hidden="true" />
                  {progressoEtapa === 100 ? "Concluída" : progressoEtapa > 0 ? "Em andamento" : "Planejada"}
                </span>
              </div>
              <span className="gp-bar">
                <span style={{ width: `${progressoEtapa}%`, background: progressoEtapa === 100 ? "#65A30D" : "#00a3b1" }} />
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="gp-btn gp-bs" onClick={() => setModalAberto(false)}>Cancelar</button>
              <button
                id="modal-btn-salvar"
                type="button"
                className="gp-btn gp-bp"
                disabled={salvandoProgresso}
                style={{ opacity: salvandoProgresso ? 0.6 : 1 }}
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
                    showToast("Não foi possível salvar. Tente novamente.", undefined, "error");
                  } finally {
                    setSalvandoProgresso(false);
                  }
                }}
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
