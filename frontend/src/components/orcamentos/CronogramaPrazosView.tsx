"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Info } from "@phosphor-icons/react";
import { getEtapas, updateEtapa, type Etapa } from "@/lib/api/orcamentos";
import { useToast } from "@/components/common/toast";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";

/** Cronograma de prazos do empreendimento: datas por etapa e Gantt. Usado na aba Cronograma e em /prazo/[id]. */
export function CronogramaPrazosView({ orcamentoId: id }: { orcamentoId: string }) {
  const { showToast } = useToast();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const etapasData = await getEtapas(id);
      setEtapas(etapasData.sort((a, b) => a.ordem - b.ordem));
    } catch (err) {
      console.error("Erro ao carregar prazos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleDateChange = async (etapaId: string, field: 'data_inicio' | 'data_fim', value: string) => {
    // Optimistic update
    setEtapas(prev => prev.map(e => e.id === etapaId ? { ...e, [field]: value } : e));
    
    try {
      await updateEtapa(id, etapaId, { [field]: value || null });
    } catch (err) {
      console.error("Erro ao salvar data", err);
      showToast("Erro ao salvar data.", undefined, "error");
      fetchData(); // revert
    }
  };

  if (loading) {
    return <PrazoSkeleton />;
  }

  // --- Lógica do Gráfico de Gantt ---
  // Encontrar data mínima e máxima para a escala
  const datasSalgas = etapas
    .flatMap(e => [e.data_inicio ? new Date(e.data_inicio).getTime() : null, e.data_fim ? new Date(e.data_fim).getTime() : null])
    .filter((d): d is number => d !== null);

  const tempoMinimo = datasSalgas.length > 0 ? Math.min(...datasSalgas) : new Date().getTime();
  const tempoMaximo = datasSalgas.length > 0 ? Math.max(...datasSalgas) : new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
  
  // Adiciona margem de 5 dias nas bordas do gráfico
  const marginMs = 5 * 24 * 60 * 60 * 1000;
  const escalaMinima = tempoMinimo - marginMs;
  const escalaMaxima = tempoMaximo + marginMs;
  const duracaoTotalMs = escalaMaxima - escalaMinima;

  // Gerar marcadores de mês para o cabeçalho
  const marcadores = [];
  const minDateObj = new Date(escalaMinima);
  const maxDateObj = new Date(escalaMaxima);
  const atual = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);
  while (atual <= maxDateObj) {
    marcadores.push(new Date(atual));
    atual.setMonth(atual.getMonth() + 1);
  }

  const fmt = (ms: number) => new Date(ms).toLocaleDateString("pt-BR");
  // Mobile: resumo do cabeçalho (datas como dd/mm/aa, sem conversão de fuso)
  const dataCurta = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(2, 4)}` : "—");
  const inicios = etapas.map((e) => e.data_inicio).filter((d): d is string => !!d).sort();
  const fins = etapas.map((e) => e.data_fim).filter((d): d is string => !!d).sort();
  const semDatas = etapas.filter((e) => !e.data_inicio || !e.data_fim).length;
  const duracaoDias = (e: Etapa) =>
    Math.round((new Date(e.data_fim + "T12:00:00").getTime() - new Date(e.data_inicio + "T12:00:00").getTime()) / 86400000) + 1;

  const grade = { backgroundImage: "linear-gradient(to right, #E6EBF2 1px, transparent 1px)", backgroundSize: "10% 100%" };

  return (
    <>
      <dl className="gp-4c-prk" aria-label="Resumo do cronograma">
          <div>
            <dt>Início</dt>
            <dd>{dataCurta(inicios[0])}</dd>
          </div>
          <div>
            <dt>Término</dt>
            <dd>{dataCurta(fins[fins.length - 1])}</dd>
          </div>
          <div data-alerta={semDatas > 0 ? "" : undefined}>
            <dt>Sem datas</dt>
            <dd>{semDatas}</dd>
          </div>
      </dl>

      <div role="note" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", borderRadius: 16, background: "#e0f5f7", color: "#00626b", fontSize: 14 }}>
        <Info size={20} weight="bold" aria-hidden="true" style={{ flex: "0 0 20px" }} />
        <span className="gp-only-d"><strong>Gráfico de Gantt dinâmico.</strong> Preencha as datas na tabela; o gráfico é montado automaticamente e o salvamento é feito ao sair do campo.</span>
        <span className="gp-only-m">Preencha as datas de início e fim de cada etapa; o salvamento é feito ao sair do campo.</span>
      </div>

      {etapas.length === 0 ? (
        <div className="gp-card gp-pad" style={{ textAlign: "center", color: "#475569" }}>
          Nenhuma etapa encontrada. Crie as etapas na <Link href={`/empreendimentos/${id}`}>planilha orçamentária</Link>.
        </div>
      ) : (
        <>
          {/* Mobile: em vez do Gantt, uma lista de etapas com os campos de data */}
          <section className="gp-only-m gp-4c-prl" aria-labelledby="h-dpm">
            <h2 id="h-dpm" className="gp-h2">Definição de prazos</h2>
            <ul>
              {etapas.map((etapa, i) => {
                const ok = !!(etapa.data_inicio && etapa.data_fim);
                const dias = ok ? duracaoDias(etapa) : 0;
                return (
                  <li key={etapa.id} className="gp-card">
                    <div className="gp-4c-prh">
                      <span className="gp-4c-prn gp-mono" data-ok={ok ? "" : undefined} aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 title={etapa.nome}>{etapa.nome}</h3>
                      <span className={`gp-bg ${ok ? "gp-te" : "gp-wa"}`}>{ok ? `${dias} ${dias === 1 ? "dia" : "dias"}` : "Sem datas"}</span>
                    </div>
                    <div className="gp-4c-prd">
                      <div className="gp-fld">
                        <label htmlFor={`m-ini-${etapa.id}`} className="gp-lb">Início<span className="gp-sr"> de {etapa.nome}</span></label>
                        <input id={`m-ini-${etapa.id}`} type="date" className="gp-in" value={etapa.data_inicio || ""} onChange={(e) => handleDateChange(etapa.id, "data_inicio", e.target.value)} />
                      </div>
                      <div className="gp-fld">
                        <label htmlFor={`m-fim-${etapa.id}`} className="gp-lb">Fim<span className="gp-sr"> de {etapa.nome}</span></label>
                        <input id={`m-fim-${etapa.id}`} type="date" className="gp-in" value={etapa.data_fim || ""} onChange={(e) => handleDateChange(etapa.id, "data_fim", e.target.value)} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="gp-only-d">
            <div className="gp-card" style={{ display: "flex", flexWrap: "wrap", overflow: "hidden" }}>
              <section aria-labelledby="h-dp" style={{ flex: "1 1 380px", maxWidth: 460, borderRight: "1px solid #E6EBF2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: 53, padding: "0 22px", background: "#F8FAFC", borderBottom: "1px solid #E6EBF2" }}>
                  <Calendar size={18} weight="bold" aria-hidden="true" />
                  <h2 id="h-dp" className="gp-h2" style={{ fontSize: 15 }}>Definição de prazos</h2>
                </div>
                {etapas.map((etapa) => (
                  <div key={etapa.id} style={{ height: 96, boxSizing: "border-box", padding: "10px 22px", borderBottom: "1px solid #E6EBF2", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                    <h3 title={etapa.nome} style={{ margin: 0, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{etapa.nome}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                      <div className="gp-fld" style={{ gap: 2 }}>
                        <label htmlFor={`ini-${etapa.id}`} className="gp-hint">Início</label>
                        <input id={`ini-${etapa.id}`} type="date" className="gp-in" style={{ height: 36, fontSize: 14 }} value={etapa.data_inicio || ""} onChange={(e) => handleDateChange(etapa.id, "data_inicio", e.target.value)} />
                      </div>
                      <div className="gp-fld" style={{ gap: 2 }}>
                        <label htmlFor={`fim-${etapa.id}`} className="gp-hint">Fim</label>
                        <input id={`fim-${etapa.id}`} type="date" className="gp-in" style={{ height: 36, fontSize: 14 }} value={etapa.data_fim || ""} onChange={(e) => handleDateChange(etapa.id, "data_fim", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <section aria-label="Gráfico de Gantt" style={{ flex: "999 1 420px", minWidth: 0, overflowX: "auto", background: "#F8FAFC" }}>
                <div style={{ minWidth: 600 }}>
                  <div style={{ position: "relative", height: 53, boxSizing: "border-box", background: "#fff", borderBottom: "1px solid #E6EBF2", ...grade }}>
                    <div className="gp-mono" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontSize: 12, color: "#475569" }}>
                      <span>{fmt(escalaMinima)}</span><span>{fmt(escalaMaxima)}</span>
                    </div>
                  </div>
                  <div style={{ position: "relative", ...grade }}>
                    {etapas.map((etapa) => {
                      if (!etapa.data_inicio || !etapa.data_fim) {
                        return <div key={etapa.id} style={{ height: 96, boxSizing: "border-box", borderBottom: "1px dashed #CBD5E1", display: "flex", alignItems: "center", padding: "0 22px", fontSize: 13, color: "#475569" }}>Aguardando definição de datas</div>;
                      }
                      const inicioMs = new Date(etapa.data_inicio).getTime();
                      const fimMs = new Date(etapa.data_fim).getTime();
                      const left = ((inicioMs - escalaMinima) / duracaoTotalMs) * 100;
                      const width = Math.max(((fimMs - inicioMs) / duracaoTotalMs) * 100, 1); // ao menos 1% para ficar visível
                      return (
                        <div key={etapa.id} style={{ position: "relative", height: 96, boxSizing: "border-box", borderBottom: "1px dashed #CBD5E1" }}>
                          <div
                            title={`${etapa.nome}: ${fmt(inicioMs)} até ${fmt(fimMs)}`}
                            style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `${left}%`, width: `${width}%`, height: 32, borderRadius: 10, background: "#00a3b1", color: "#001b3d", display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12, fontWeight: 800, boxSizing: "border-box", overflow: "hidden", whiteSpace: "nowrap" }}
                          >
                            {etapa.nome}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/** Esqueleto do cronograma: cabeçalho, aviso e a tabela de etapas com as barras do Gantt. */
function PrazoSkeleton() {
  const barras: [string, string][] = [["2%", "28%"], ["20%", "35%"], ["45%", "25%"], ["60%", "30%"], ["75%", "20%"]];
  return (
    <SkeletonStatus texto="Carregando cronograma…">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Skeleton height={48} radius={16} />
        <div className="gp-card" style={{ overflow: "hidden" }}>
          {barras.map(([inicio, largura], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(140px, 1.2fr) minmax(0, 2fr)", gap: 16, alignItems: "center", padding: "16px 20px", borderTop: i ? "1px solid #E6EBF2" : undefined }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton width={i % 2 ? "60%" : "80%"} height={14} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Skeleton width="45%" height={36} radius={8} />
                  <Skeleton width="45%" height={36} radius={8} />
                </div>
              </div>
              <div style={{ position: "relative", height: 20 }}>
                <Skeleton height={20} radius={6} style={{ position: "absolute", left: inicio, width: largura }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonStatus>
  );
}
