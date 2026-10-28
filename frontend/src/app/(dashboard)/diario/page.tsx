"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, CloudRain, Sun } from "@phosphor-icons/react";
import {
  getResumoDiario,
  type Clima,
  type ResumoDiario,
  type SituacaoDiario,
} from "@/lib/api/diario";
import { PageHeader } from "@/components/layout/PageHeader";

const SITUACOES: Record<SituacaoDiario, { rotulo: string; classe: string }> = {
  ENVIADO: { rotulo: "Enviado", classe: "gp-ok" },
  RASCUNHO: { rotulo: "Rascunho", classe: "gp-ne" },
  PENDENTE: { rotulo: "Pendente", classe: "gp-te" },
  ALERTA: { rotulo: "Alerta", classe: "gp-da" },
};

// Cartão do mobile: cores do selo da sigla e a ação de cada situação.
const ACAO_MOBILE: Record<SituacaoDiario, { texto: string; botao: string; tile: string; cor: string; ponto: string }> = {
  ENVIADO: { texto: "Ver diário", botao: "gp-bs", tile: "#E6F6D0", cor: "#3F6604", ponto: "#65A30D" },
  RASCUNHO: { texto: "Continuar rascunho", botao: "gp-bd", tile: "#EDF1F6", cor: "#334155", ponto: "#64748b" },
  PENDENTE: { texto: "Registrar agora", botao: "gp-bd", tile: "#e0f5f7", cor: "#00626b", ponto: "#00a3b1" },
  ALERTA: { texto: "Registrar agora", botao: "gp-bd", tile: "#FFEDD5", cor: "#9A3412", ponto: "#F97316" },
};

function sigla(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function IconeClima({ clima }: { clima?: Clima | null }) {
  if (clima === "SOL") return <Sun weight="fill" size={24} color="#F59E0B" aria-label="Sol" />;
  if (clima === "NUBLADO") return <Cloud weight="fill" size={24} color="#94a3b8" aria-label="Nublado" />;
  if (clima === "CHUVA") return <CloudRain weight="fill" size={24} color="#00626b" aria-label="Chuva" />;
  return <span style={{ color: "#94a3b8" }}>—</span>;
}

function descreverUltimoRegistro(data?: string | null): string {
  if (!data) return "Sem registros";
  const [ano, mes, dia] = data.split("-").map(Number);
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((hoje.getTime() - alvo.getTime()) / 86_400_000);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  return `Há ${dias} dias`;
}

export default function DiarioVisaoPage() {
  const router = useRouter();
  const [resumo, setResumo] = useState<ResumoDiario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [soAlertas, setSoAlertas] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      setResumo(await getResumoDiario());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o diário");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return <p role="status" style={{ padding: 48, textAlign: "center", color: "#475569" }}>Carregando diário de obra…</p>;
  }

  if (erro || !resumo) {
    return (
      <div role="alert" style={{ padding: 48, textAlign: "center" }}>
        <p style={{ color: "#B91C1C", margin: 0 }}>{erro ?? "Não foi possível carregar o diário."}</p>
        <button onClick={carregar} className="gp-btn gp-bs gp-sm" style={{ marginTop: 16 }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const obras = soAlertas ? resumo.obras.filter((o) => o.situacao === "ALERTA") : resumo.obras;

  return (
    <>
      <PageHeader
        crumb={<>Operação / <span aria-current="page" style={{ color: "#001b3d" }}>Diário de obra</span></>}
        eyebrow="Operação"
        title="Diário de obra"
        subtitle={
          resumo.total_obras === 0
            ? "Nenhuma obra ativa no momento."
            : `${resumo.enviados_hoje} de ${resumo.total_obras} obras ativas já enviaram o diário de hoje.`
        }
      >
        {/* Mobile: taxa de preenchimento dentro do cabeçalho */}
        {resumo.total_obras > 0 && (
          <p className="gp-only-m gp-4a-taxa">
            <strong>{resumo.taxa_preenchimento_7d}%</strong>
            <span>dos dias com diário nos últimos 7 dias</span>
          </p>
        )}
      </PageHeader>

      <section aria-label="Indicadores" className="gp-grid gp-only-d">
        <div className="gp-card gp-met gp-dark">
          <span className="gp-ml">Preenchimento (7 dias)</span>
          <span className="gp-mv">{resumo.taxa_preenchimento_7d}%</span>
          <span className="gp-ms">dos dias com diário</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">{resumo.alertas === 1 ? "Alerta" : "Alertas"}</span>
          <span className="gp-mv" style={{ color: resumo.alertas > 0 ? "#B91C1C" : undefined }}>
            {String(resumo.alertas).padStart(2, "0")}
          </span>
          <span className="gp-ms">Obras há dois dias ou mais sem diário.</span>
          {resumo.alertas > 0 && (
            <button
              type="button"
              onClick={() => setSoAlertas((v) => !v)}
              aria-pressed={soAlertas}
              className="gp-chip"
              style={{ alignSelf: "flex-start" }}
            >
              {soAlertas ? "Mostrar todas as obras" : "Ver só as obras em alerta"}
            </button>
          )}
        </div>
      </section>

      <section className="gp-card gp-m-flat" aria-labelledby="h-sem" style={{ overflow: "hidden" }}>
        <div className="gp-4a-sech" style={{ padding: "18px 22px", borderBottom: "1px solid #E6EBF2" }}>
          <h2 id="h-sem" className="gp-h2">Projetos ativos</h2>
          <p className="gp-sub" style={{ fontSize: 14 }}>Situação do diário de cada obra em andamento.</p>
          {resumo.alertas > 0 && (
            <div className="gp-only-m gp-4a-filtro">
              <button type="button" onClick={() => setSoAlertas((v) => !v)} aria-pressed={soAlertas} className="gp-chip">
                {soAlertas ? "Mostrar todas as obras" : `Ver só as obras em alerta (${resumo.alertas})`}
              </button>
            </div>
          )}
        </div>
        {obras.length === 0 ? (
          <div className="gp-4a-cartao" style={{ padding: 40, textAlign: "center" }}>
            <p style={{ margin: 0, color: "#475569" }}>
              {resumo.total_obras === 0 ? "Você ainda não tem obras em andamento." : "Nenhuma obra em alerta."}
            </p>
            {resumo.total_obras === 0 && (
              <Link href="/obras/novo" className="gp-btn gp-bp gp-sm" style={{ marginTop: 16 }}>
                Criar uma obra
              </Link>
            )}
          </div>
        ) : (
          <>
          {/* Mobile: um cartão por obra, com a ação do dia */}
          <ul className="gp-only-m gp-4a-dlista">
            {obras.map((obra) => {
              const estilo = SITUACOES[obra.situacao];
              const acao = ACAO_MOBILE[obra.situacao];
              return (
                <li key={obra.obra_id}>
                  <div className="gp-4a-dtopo">
                    <span aria-hidden="true" className="gp-4a-tile" style={{ background: acao.tile, color: acao.cor }}>
                      {sigla(obra.nome)}
                    </span>
                    <span className="gp-4a-dnome">
                      <strong>{obra.nome}</strong>
                      <span style={{ color: acao.cor }}>
                        <span className="gp-dot" aria-hidden="true" style={{ background: acao.ponto }} />
                        {estilo.rotulo} · último registro: {descreverUltimoRegistro(obra.ultimo_registro).toLowerCase()}
                      </span>
                      {(obra.local || obra.responsavel) && (
                        <span>{[obra.local, obra.responsavel && `Gestor: ${obra.responsavel}`].filter(Boolean).join(" · ")}</span>
                      )}
                    </span>
                    <span className="gp-4a-dclima"><IconeClima clima={obra.ultimo_clima} /></span>
                  </div>
                  <Link href={`/diario/${obra.obra_id}`} className={`gp-btn ${acao.botao}`} aria-label={`${acao.texto}: ${obra.nome}`}>
                    {acao.texto}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="gp-only-d" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
              <caption className="gp-sr">Situação do diário por obra</caption>
              <thead>
                <tr>
                  <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Obra</th>
                  <th scope="col" className="gp-th">Gestor</th>
                  <th scope="col" className="gp-th">Último registro</th>
                  <th scope="col" className="gp-th" style={{ textAlign: "center" }}>Clima</th>
                  <th scope="col" className="gp-th" style={{ textAlign: "right", paddingRight: 22 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {obras.map((obra) => {
                  const estilo = SITUACOES[obra.situacao];
                  return (
                    <tr key={obra.obra_id} className="gp-row" style={{ cursor: "pointer" }} onClick={() => router.push(`/diario/${obra.obra_id}`)}>
                      <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left" }}>
                        <Link
                          href={`/diario/${obra.obra_id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#001b3d", textDecoration: "none" }}
                        >
                          {obra.nome}
                        </Link>
                        {obra.local && <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>{obra.local}</span>}
                      </th>
                      <td className="gp-td">{obra.responsavel ?? "—"}</td>
                      <td className="gp-td">{descreverUltimoRegistro(obra.ultimo_registro)}</td>
                      <td className="gp-td" style={{ textAlign: "center" }}>
                        <span style={{ display: "inline-flex" }}><IconeClima clima={obra.ultimo_clima} /></span>
                      </td>
                      <td className="gp-td" style={{ textAlign: "right", paddingRight: 22 }}>
                        <span className={`gp-bg ${estilo.classe}`}>
                          <span className="gp-dot" aria-hidden="true"></span>
                          {estilo.rotulo}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </>
  );
}
