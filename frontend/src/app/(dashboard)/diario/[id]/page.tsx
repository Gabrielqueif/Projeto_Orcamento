"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Cloud, CloudRain, Plus, Sun, User, Warning } from "@phosphor-icons/react";
import { DiarioFormModal } from "@/components/diario/DiarioFormModal";
import { useToast } from "@/components/common/toast";
import {
  alterarStatusDiario,
  excluirDiario,
  getDiarios,
  type Clima,
  type Diario,
  type DiarioListagem,
  type StatusDiario,
} from "@/lib/api/diario";
import { PageHeader } from "@/components/layout/PageHeader";

type FiltroStatus = "TODOS" | StatusDiario;

const CLIMAS: Record<Clima, { rotulo: string; Icone: typeof Sun }> = {
  SOL: { rotulo: "Sol", Icone: Sun },
  NUBLADO: { rotulo: "Nublado", Icone: Cloud },
  CHUVA: { rotulo: "Chuva", Icone: CloudRain },
};

const STATUS_ESTILO: Record<StatusDiario, { rotulo: string; classe: string }> = {
  RASCUNHO: { rotulo: "Rascunho", classe: "gp-ne" },
  ENVIADO: { rotulo: "Enviado", classe: "gp-te" },
  APROVADO: { rotulo: "Aprovado", classe: "gp-ok" },
};

const FILTROS: [FiltroStatus, string][] = [
  ["TODOS", "Todos"],
  ["RASCUNHO", "Rascunhos"],
  ["ENVIADO", "Enviados"],
  ["APROVADO", "Aprovados"],
];

function parseData(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarData(iso: string): string {
  return parseData(iso)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "")
    .toUpperCase();
}

function diaDaSemana(iso: string): string {
  return parseData(iso).toLocaleDateString("pt-BR", { weekday: "long" });
}

function formatarAtualizacao(iso?: string | null): string {
  if (!iso) return "sem registros";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function DiarioObraPage() {
  const params = useParams();
  const obraId = params.id as string;
  const { showToast } = useToast();

  const [dados, setDados] = useState<DiarioListagem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroStatus>("TODOS");
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Diario | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setDados(await getDiarios(obraId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o diário");
    } finally {
      setCarregando(false);
    }
  }, [obraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const mudarStatus = async (registro: Diario, status: StatusDiario) => {
    try {
      await alterarStatusDiario(obraId, registro.id, status);
      await carregar();
    } catch (e) {
      showToast("Não foi possível alterar o status", e instanceof Error ? e.message : undefined, "error");
    }
  };

  const excluir = async (registro: Diario) => {
    if (!window.confirm(`Excluir o diário de ${formatarData(registro.data)}? As fotos também serão apagadas.`)) return;
    try {
      await excluirDiario(obraId, registro.id);
      showToast("Diário excluído", undefined, "success");
      await carregar();
    } catch (e) {
      showToast("Não foi possível excluir", e instanceof Error ? e.message : undefined, "error");
    }
  };

  const abrirNovo = () => {
    setEmEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (registro: Diario) => {
    setEmEdicao(registro);
    setModalAberto(true);
  };

  if (carregando) {
    return (
      <p role="status" style={{ padding: 48, textAlign: "center", color: "#475569" }}>
        Carregando diário da obra…
      </p>
    );
  }

  if (erro || !dados) {
    return (
      <div role="alert" style={{ padding: 48, textAlign: "center" }}>
        <p style={{ color: "#B91C1C", margin: 0 }}>{erro ?? "Obra não encontrada."}</p>
        <Link href="/diario" className="gp-btn gp-bs gp-sm" style={{ marginTop: 16 }}>
          Voltar ao diário
        </Link>
      </div>
    );
  }

  const { obra, registros } = dados;
  const visiveis = filtro === "TODOS" ? registros : registros.filter((r) => r.status === filtro);
  const nOcorrencias = registros.filter((r) => r.tem_ocorrencia).length;
  const sub = [
    `${registros.length} ${registros.length === 1 ? "registro" : "registros"}`,
    `${nOcorrencias} ${nOcorrencias === 1 ? "ocorrência" : "ocorrências"}`,
    obra.local,
    obra.responsavel ? `Responsável: ${obra.responsavel}` : null,
    obra.prazo_dias != null ? `Prazo: ${obra.prazo_dias} dias` : null,
    `Progresso: ${obra.progresso}%`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        back="/diario"
        backLabel="Voltar para o diário de obra"
        crumb={<><Link href="/diario">Diário de obra</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>{obra.nome}</span></>}
        eyebrow="Registros da obra"
        title={obra.nome}
        subtitle={
          <>
            <span className="gp-only-d">
              {sub}
              <span className="gp-hint" style={{ display: "block", marginTop: 4 }}>
                Último registro alterado em {formatarAtualizacao(obra.ultima_atualizacao)}
              </span>
            </span>
            <span className="gp-only-m">
              Diário de obra{obra.local ? ` · ${obra.local}` : ""}
            </span>
          </>
        }
        actions={
          <button type="button" onClick={abrirNovo} className="gp-btn gp-bp gp-only-d">
            <Plus size={16} weight="bold" aria-hidden="true" /> Novo registro
          </button>
        }
      >
        <div className="gp-only-m">
          <dl className="gp-4d-dl gp-4d-dk">
            <div><dt>Registros</dt><dd>{registros.length}</dd></div>
            <div><dt>Ocorrências</dt><dd>{nOcorrencias}</dd></div>
            <div><dt>Progresso</dt><dd>{obra.progresso}%</dd></div>
          </dl>
        </div>
      </PageHeader>

      <button type="button" onClick={abrirNovo} className="gp-fab gp-4d-fabb" aria-haspopup="dialog">
        <Plus size={24} weight="bold" aria-hidden="true" />
        Novo registro
      </button>

      <div role="group" aria-label="Filtrar registros" className="gp-chips gp-4d-fl">
        {FILTROS.map(([k, rotulo]) => (
          <button key={k} type="button" className="gp-chip" aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
            {rotulo}
            <span className="gp-cnt">{k === "TODOS" ? registros.length : registros.filter((r) => r.status === k).length}</span>
          </button>
        ))}
      </div>

      <p className="gp-only-m gp-4d-cnt" aria-live="polite">
        {visiveis.length} {visiveis.length === 1 ? "registro" : "registros"}
      </p>

      {visiveis.length === 0 ? (
        <div className="gp-card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ margin: 0, color: "#475569" }}>
            {registros.length === 0 ? "Nenhum registro ainda. Comece pelo diário de hoje." : "Nenhum registro com esse status."}
          </p>
        </div>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {visiveis.map((registro) => {
            const { rotulo, Icone } = CLIMAS[registro.clima];
            const status = STATUS_ESTILO[registro.status];
            const editavel = registro.status !== "APROVADO";
            const btn = "gp-btn gp-sm ";
            return (
              <li key={registro.id}>
                <article className="gp-card gp-4d-reg">
                  <span className="gp-4d-rd">
                    <strong className="gp-mono" style={{ display: "block", fontSize: 22 }} aria-hidden="true">
                      {String(parseData(registro.data).getDate()).padStart(2, "0")}
                    </strong>
                    <span
                      aria-hidden="true"
                      style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "capitalize" }}
                    >
                      <span className="gp-only-d">{diaDaSemana(registro.data).split("-")[0]}</span>
                      <span className="gp-only-m">{diaDaSemana(registro.data).slice(0, 3)}</span>
                    </span>
                    <span className="gp-sr">
                      {formatarData(registro.data)}, {diaDaSemana(registro.data)}
                    </span>
                  </span>
                  <div className="gp-4d-rc">
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                      <span className={`gp-bg ${status.classe}`}>
                        <span className="gp-dot" aria-hidden="true"></span>
                        {status.rotulo}
                      </span>
                      {registro.tem_ocorrencia && (
                        <span className="gp-bg gp-da">
                          <Warning size={12} weight="fill" aria-hidden="true" /> Ocorrência
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: "#475569", display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Icone size={16} weight="bold" aria-hidden="true" /> {rotulo}
                        {registro.temperatura != null && ` / ${registro.temperatura}°C`} ·{" "}
                        <User size={16} weight="bold" aria-hidden="true" /> {registro.responsavel || "Sem responsável"} ·{" "}
                        {registro.equipe_presente} na equipe
                      </span>
                    </div>
                    <h2 className="gp-h2" style={{ fontSize: 16 }}>
                      {registro.titulo}
                    </h2>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-line" }}>{registro.atividades}</p>

                    {registro.tem_ocorrencia && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: "#B91C1C",
                          background: "#FEE2E2",
                          borderRadius: 12,
                          padding: "10px 14px",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {registro.ocorrencias}
                      </p>
                    )}

                    {registro.servicos.length > 0 && (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {registro.servicos.map((servico) => (
                          <li key={servico.item_id} className="gp-li" style={{ fontSize: 14 }}>
                            <span>✓ {servico.descricao}</span>
                            <span className="gp-mono" style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                              {servico.quantidade} {servico.unidade} · {servico.percentual}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {registro.fotos.length > 0 && (
                      <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                        {registro.fotos.map((foto, i) =>
                          foto.url ? (
                            <a
                              key={foto.id}
                              href={foto.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ aspectRatio: "16/9", display: "block", borderRadius: 12, overflow: "hidden", border: "1px solid #E6EBF2" }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={foto.url}
                                alt={foto.legenda ?? `Foto ${i + 1} de ${registro.titulo}`}
                                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                              />
                            </a>
                          ) : (
                            <div
                              key={foto.id}
                              style={{
                                aspectRatio: "16/9",
                                borderRadius: 12,
                                background: "#EDF1F6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                color: "#475569",
                              }}
                            >
                              Foto indisponível
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="gp-4d-ra">
                    {registro.status === "RASCUNHO" && (
                      <button onClick={() => mudarStatus(registro, "ENVIADO")} className={btn + "gp-bd"}>
                        Enviar
                      </button>
                    )}
                    {registro.status === "ENVIADO" && (
                      <>
                        <button onClick={() => mudarStatus(registro, "APROVADO")} className={btn + "gp-bp"}>
                          Aprovar
                        </button>
                        <button onClick={() => mudarStatus(registro, "RASCUNHO")} className={btn + "gp-bs"}>
                          Devolver
                        </button>
                      </>
                    )}
                    {registro.status === "APROVADO" && (
                      <button onClick={() => mudarStatus(registro, "ENVIADO")} className={btn + "gp-bs"}>
                        Reabrir
                      </button>
                    )}
                    {editavel && (
                      <>
                        <button onClick={() => abrirEdicao(registro)} className={btn + "gp-bs"}>
                          Editar
                        </button>
                        <button onClick={() => excluir(registro)} className={btn + "gp-bs"} style={{ color: "#B91C1C" }}>
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      <DiarioFormModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        obraId={obraId}
        obraNome={obra.nome}
        registro={emEdicao}
        responsavelPadrao={obra.responsavel}
        servicos={obra.servicos}
        onSaved={carregar}
      />
    </>
  );
}
