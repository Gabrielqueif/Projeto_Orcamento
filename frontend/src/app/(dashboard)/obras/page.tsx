"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, MagnifyingGlass, ArrowRight, Trash } from "@phosphor-icons/react";
import { getOrcamentos, getEtapas, type Orcamento, type Etapa } from "@/lib/api/orcamentos";
import { excluirObra, getObras, type Obra } from "@/lib/api/obras";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Fab } from "@/components/layout/Fab";

interface ObraItemData {
  orcamento: Orcamento;
  obra?: Obra;
  etapas: Etapa[];
  progressoCalculado: number;
  faseAtual: string;
  statusCalculado: string;
}

const STATUS_LABELS: Record<string, string> = {
  em_elaboracao: "Em elaboração",
  orcamento_concluido: "Orçamento pronto",
  EM_ANDAMENTO: "Em andamento",
  em_execucao: "Em andamento",
  CONCLUIDA: "Concluída",
  concluido: "Concluída",
  ATRASADO: "Atrasada",
};

const STATUS_CLASSES: Record<string, string> = {
  em_elaboracao: "gp-te",
  orcamento_concluido: "gp-ok",
  EM_ANDAMENTO: "gp-ok",
  em_execucao: "gp-ok",
  CONCLUIDA: "gp-ne",
  concluido: "gp-ne",
  ATRASADO: "gp-wa",
};

const EM_ANDAMENTO = ["EM_ANDAMENTO", "em_execucao"];

function formatarValor(v: number): string {
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (v >= 1e3) return `R$ ${(v / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function terminoPrevisto(etapas: Etapa[]): string {
  const fins = etapas.map((e) => e.data_fim).filter((d): d is string => !!d).sort();
  return fins.length ? new Date(fins[fins.length - 1] + "T12:00:00").toLocaleDateString("pt-BR") : "—";
}

function sigla(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

type FilterStatus = "todos" | "EM_ANDAMENTO" | "CONCLUIDA" | "em_elaboracao";

export default function ObrasPage() {
  const [obrasItems, setObrasItems] = useState<ObraItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const { showToast } = useToast();

  const carregarDados = async (nome?: string) => {
    try {
      setLoading(true);
      const [orcamentosData, obrasData] = await Promise.all([
        getOrcamentos(undefined, undefined, nome),
        getObras().catch(() => []),
      ]);

      // Orçamento sem obra gerada ainda não é uma obra: só aparece em /orcamentos.
      const orcamentosComObra = orcamentosData.filter((orc) =>
        obrasData.some((o) => o.orcamento_id === orc.id)
      );

      const itemsCompletos: ObraItemData[] = await Promise.all(
        orcamentosComObra.map(async (orc) => {
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

  const excluirObraDaLista = async (item: ObraItemData) => {
    if (!item.obra) return;
    const confirmado = window.confirm(
      `Excluir a obra "${item.orcamento.nome}"?\n\n` +
        "Serão apagados o diário, as medições, o estoque, as locações e os lançamentos financeiros dela. " +
        "O orçamento é mantido.\n\nEssa ação não pode ser desfeita."
    );
    if (!confirmado) return;

    try {
      setExcluindoId(item.obra.id);
      await excluirObra(item.obra.id);
      showToast("Obra excluída", `"${item.orcamento.nome}" foi removida. O orçamento continua disponível.`, "success");
      await carregarDados(searchTerm);
    } catch (err) {
      showToast("Não foi possível excluir a obra", err instanceof Error ? err.message : undefined, "error");
    } finally {
      setExcluindoId(null);
    }
  };

  const filtros: { key: FilterStatus; label: string; casa: (i: ObraItemData) => boolean }[] = [
    { key: "todos", label: "Todas", casa: () => true },
    { key: "EM_ANDAMENTO", label: "Em andamento", casa: (i) => EM_ANDAMENTO.includes(i.statusCalculado) },
    { key: "CONCLUIDA", label: "Concluídas", casa: (i) => i.statusCalculado === "CONCLUIDA" || i.statusCalculado === "concluido" },
    { key: "em_elaboracao", label: "Em elaboração / atrasadas", casa: (i) => i.statusCalculado === "em_elaboracao" || i.statusCalculado === "ATRASADO" },
  ];
  const filteredItems = obrasItems.filter((item) => (filtros.find((f) => f.key === activeFilter) ?? filtros[0]).casa(item));

  const ativas = obrasItems.filter((i) => EM_ANDAMENTO.includes(i.statusCalculado));
  const valorAtivo = ativas.reduce((acc, i) => acc + (i.orcamento.valor_total || 0), 0);
  const avancoMedio = obrasItems.length
    ? Math.round(obrasItems.reduce((acc, i) => acc + i.progressoCalculado, 0) / obrasItems.length)
    : 0;
  const atrasadas = obrasItems.filter((i) => i.statusCalculado === "ATRASADO");

  return (
    <>
      <PageHeader
        crumb={<>Operação / <span aria-current="page" style={{ color: "#001b3d" }}>Obras</span></>}
        eyebrow="Operação"
        title="Obras"
        subtitle="Execução, prazos e custos de cada canteiro."
        actions={
          <Link href="/obras/novo" className="gp-btn gp-bp gp-only-d">
            <Plus size={18} weight="bold" aria-hidden="true" />
            Nova obra
          </Link>
        }
      />
      <Fab href="/obras/novo" label="Nova obra" />

      <section aria-label="Indicadores" className="gp-grid">
        <div className="gp-card gp-met gp-dark">
          <span className="gp-ml">Em andamento</span>
          <span className="gp-mv">{ativas.length}</span>
          <span className="gp-ms">de {obrasItems.length} {obrasItems.length === 1 ? "obra cadastrada" : "obras cadastradas"}</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Valor contratado ativo</span>
          <span className="gp-mv">{formatarValor(valorAtivo)}</span>
          <span className="gp-ms">{ativas.length === 1 ? "1 obra em andamento" : `${ativas.length} obras em andamento`}</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Avanço físico médio</span>
          <span className="gp-mv">{avancoMedio}%</span>
          <span className="gp-bar" role="progressbar" aria-label="Avanço físico médio" aria-valuenow={avancoMedio} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${avancoMedio}%`, background: "#00a3b1" }} />
          </span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Com atenção</span>
          <span className="gp-mv" style={{ color: atrasadas.length ? "#9A3412" : undefined }}>{atrasadas.length}</span>
          <span className="gp-ms">{atrasadas.length === 1 ? "1 obra atrasada" : `${atrasadas.length} obras atrasadas`}</span>
        </div>
      </section>

      <section className="gp-card" aria-labelledby="h-l" style={{ overflow: "hidden" }}>
        <h2 id="h-l" className="gp-sr">Lista de obras</h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid #E6EBF2" }}>
          <div role="group" aria-label="Filtrar por status" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {filtros.map((f) => (
              <button key={f.key} type="button" className="gp-chip" aria-pressed={activeFilter === f.key} onClick={() => setActiveFilter(f.key)}>
                {f.label}
                <span className="gp-cnt">{obrasItems.filter(f.casa).length}</span>
              </button>
            ))}
          </div>
          <div className="gp-srch" style={{ marginLeft: "auto", flex: "0 1 300px" }}>
            <MagnifyingGlass size={18} color="#475569" weight="bold" aria-hidden="true" />
            <label htmlFor="bo" className="gp-sr">Buscar obra</label>
            <input id="bo" type="search" placeholder="Nome ou cliente" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse" }}>
            <caption className="gp-sr">Obras</caption>
            <thead>
              <tr>
                <th scope="col" className="gp-th" style={{ paddingLeft: 20 }}>Obra</th>
                <th scope="col" className="gp-th">Cliente</th>
                <th scope="col" className="gp-th">Fase atual</th>
                <th scope="col" className="gp-th" style={{ width: 220 }}>Avanço físico</th>
                <th scope="col" className="gp-th">Término previsto</th>
                <th scope="col" className="gp-th">Status</th>
                <th scope="col" className="gp-th"><span className="gp-sr">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="gp-td" style={{ textAlign: "center", padding: 48, color: "#475569" }}>Carregando obras...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="gp-td" style={{ textAlign: "center", padding: 48, color: "#475569" }}>Nenhuma obra encontrada.</td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const pct = Math.min(100, Math.max(0, item.progressoCalculado));
                  const nome = item.orcamento.nome;
                  return (
                    <tr key={item.orcamento.id} className="gp-row">
                      <th scope="row" className="gp-td" style={{ paddingLeft: 20, textAlign: "left", fontWeight: 400 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span aria-hidden="true" style={{ width: 42, height: 42, flex: "0 0 42px", borderRadius: 12, background: "#EDF1F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
                            {sigla(nome)}
                          </span>
                          <span>
                            <Link href={`/obras/${item.orcamento.id}`} style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#001b3d", textDecoration: "none" }}>
                              {nome}
                            </Link>
                            <span className="gp-mono" style={{ fontSize: 12, color: "#475569" }}>
                              {`GP-${item.orcamento.id.substring(0, 8).toUpperCase()}`}
                            </span>
                          </span>
                        </span>
                      </th>
                      <td className="gp-td" style={{ color: "#334155" }}>{item.orcamento.cliente || "—"}</td>
                      <td className="gp-td" style={{ fontWeight: 700 }} title={item.faseAtual}>{item.faseAtual}</td>
                      <td className="gp-td">
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className="gp-bar" role="progressbar" aria-label={`Avanço físico de ${nome}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ flex: "1 1 auto" }}>
                            <span style={{ width: `${pct}%`, background: pct === 100 ? "#65A30D" : "#00a3b1" }} />
                          </span>
                          <span className="gp-mono" style={{ fontWeight: 600, minWidth: 40, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                        </span>
                      </td>
                      <td className="gp-td" style={{ color: "#334155" }}>{terminoPrevisto(item.etapas)}</td>
                      <td className="gp-td">
                        <span className={`gp-bg ${STATUS_CLASSES[item.statusCalculado] || "gp-ne"}`}>
                          <span aria-hidden="true" className="gp-dot" />
                          {STATUS_LABELS[item.statusCalculado] || item.statusCalculado}
                        </span>
                      </td>
                      <td className="gp-td" style={{ textAlign: "right", paddingRight: 20 }}>
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          {item.obra && (
                            <button
                              type="button"
                              onClick={() => excluirObraDaLista(item)}
                              disabled={excluindoId === item.obra.id}
                              aria-label={`Excluir obra ${nome}`}
                              title="Excluir obra"
                              className="gp-ib"
                              style={{ width: 40, height: 40, color: "#B91C1C", opacity: excluindoId === item.obra.id ? 0.5 : 1 }}
                            >
                              <Trash size={18} weight="bold" aria-hidden="true" />
                            </button>
                          )}
                          <Link href={`/obras/${item.orcamento.id}`} className="gp-ib" aria-label={`Abrir obra ${nome}`} style={{ width: 40, height: 40 }}>
                            <ArrowRight size={18} weight="bold" aria-hidden="true" />
                          </Link>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #E6EBF2", fontSize: 14, color: "#475569" }} aria-live="polite">
          {filteredItems.length} {filteredItems.length === 1 ? "obra" : "obras"}
        </div>
      </section>
    </>
  );
}
