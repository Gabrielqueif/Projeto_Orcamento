// noinspection SpellCheckingInspection

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, DownloadSimple, MagnifyingGlass, Trash } from "@phosphor-icons/react";
import { getOrcamentos, getOrcamentoStats, deleteOrcamento, type Orcamento, type OrcamentoStats } from "@/lib/api/orcamentos";

import { STATUS_INFO, STATUS_ORDER, getStatusDisplay, normalizeStatus, type OrcamentoStatus } from "@/lib/orcamentoStatus";
import { useToast } from "@/components/common/toast";

type FilterStatus = "todos" | OrcamentoStatus;

// Cor do selo de status no design system do artefato.
const BADGE: Record<OrcamentoStatus, string> = {
  em_elaboracao: "gp-te",
  pendente: "gp-wa",
  aprovado: "gp-ok",
  recusado: "gp-da",
  cancelado: "gp-ne",
};

const FILTERS: FilterStatus[] = ["todos", ...STATUS_ORDER];

export default function OrcamentosPage() {
  const { showToast } = useToast();
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

  const filteredOrcamentos = orcamentos.filter((o) => {
    if (activeFilter === "todos") return true;
    return normalizeStatus(o.status) === activeFilter;
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (o: Orcamento) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o orçamento "${o.nome}"? Esta ação não pode ser desfeita e remove também seus itens.`
      )
    ) {
      return;
    }
    try {
      setDeletingId(o.id);
      await deleteOrcamento(o.id);
      setOrcamentos((prev) => prev.filter((x) => x.id !== o.id));
      carregarStats();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Erro ao excluir o orçamento.", undefined, "error");
    } finally {
      setDeletingId(null);
    }
  };

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

  const contagem = `${filteredOrcamentos.length} ${filteredOrcamentos.length === 1 ? "orçamento" : "orçamentos"}`;
  const contagemPorFiltro = (f: FilterStatus) =>
    f === "todos" ? orcamentos.length : orcamentos.filter((o) => normalizeStatus(o.status) === f).length;
  const compact = (v: number | null | undefined) =>
    new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 2, style: "currency", currency: "BRL" }).format(v ?? 0);

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <nav aria-label="Trilha" className="gp-crumb">
            Comercial / <span aria-current="page" style={{ color: "#001b3d" }}>Orçamentos</span>
          </nav>
          <h1 className="gp-h1">Orçamentos</h1>
          <p className="gp-sub">Propostas com SINAPI, SEINFRA e as suas bases próprias.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" className="gp-btn gp-bs">
            <DownloadSimple size={18} weight="bold" aria-hidden="true" />
            Exportar lista
          </button>
          <button type="button" onClick={() => router.push("/orcamentos/novo")} className="gp-btn gp-bp">
            <Plus size={18} weight="bold" aria-hidden="true" />
            Novo orçamento
          </button>
        </div>
      </div>

      <section aria-label="Indicadores" className="gp-grid">
        <div className="gp-card gp-met gp-dark">
          <span className="gp-ml">Total orçado</span>
          <span className="gp-mv" title={formatCurrency(stats?.valor_total)}>{stats ? compact(stats.valor_total) : "—"}</span>
          <span className="gp-ms">{stats ? `${stats.total_orcamentos} ${stats.total_orcamentos === 1 ? "orçamento" : "orçamentos"}` : "—"}</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Taxa de aprovação</span>
          <span className="gp-mv">{stats ? `${stats.taxa_aprovacao}%` : "—"}</span>
          <div
            role="progressbar"
            aria-label={`Taxa de aprovação ${stats ? stats.taxa_aprovacao : 0}%, meta 75%`}
            aria-valuenow={stats ? stats.taxa_aprovacao : 0}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ position: "relative", height: 8, borderRadius: 999, background: "#EDF1F6" }}
          >
            <div style={{ width: `${Math.min(stats?.taxa_aprovacao ?? 0, 100)}%`, height: "100%", borderRadius: 999, background: "#00a3b1" }} />
            <span aria-hidden="true" style={{ position: "absolute", left: "75%", top: -4, width: 2, height: 16, background: "#001b3d" }} />
          </div>
          <span className="gp-ms">Meta: 75%</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Ticket médio</span>
          <span className="gp-mv" title={formatCurrency(stats?.ticket_medio)}>{stats ? compact(stats.ticket_medio) : "—"}</span>
          <span className="gp-ms">Com BDI</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Tempo até aprovação</span>
          <span className="gp-mv">{stats ? `${stats.tempo_resposta_medio} dias` : "—"}</span>
          <span className="gp-ms">Média dos aprovados</span>
        </div>
      </section>

      <section aria-labelledby="h-lista" className="gp-card" style={{ overflow: "hidden" }}>
        <h2 id="h-lista" className="gp-sr">Lista de orçamentos</h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid #E6EBF2" }}>
          <div role="group" aria-label="Filtrar por status" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className="gp-chip"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === "todos" ? "Todos" : STATUS_INFO[filter].filterLabel}
                <span className="gp-cnt">{contagemPorFiltro(filter)}</span>
              </button>
            ))}
          </div>
          <div className="gp-srch" style={{ marginLeft: "auto", flex: "0 1 300px" }}>
            <MagnifyingGlass size={18} weight="bold" color="#475569" aria-hidden="true" />
            <label htmlFor="busca-orc" className="gp-sr">Buscar orçamento</label>
            <input
              id="busca-orc"
              type="search"
              placeholder="Nome ou cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 14 }}>
            <caption className="gp-sr">Orçamentos, {contagem}</caption>
            <thead>
              <tr>
                <th scope="col" className="gp-th" style={{ padding: "12px 20px" }}>Orçamento</th>
                <th scope="col" className="gp-th">Cliente</th>
                <th scope="col" className="gp-th">Emissão</th>
                <th scope="col" className="gp-th">Status</th>
                <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Valor com BDI</th>
                <th scope="col" className="gp-th" style={{ padding: "12px 20px", textAlign: "right" }}><span className="gp-sr">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="gp-td" style={{ padding: 40, textAlign: "center", color: "#475569" }}>
                    Carregando orçamentos...
                  </td>
                </tr>
              ) : filteredOrcamentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="gp-td" style={{ padding: "40px 20px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Nenhum orçamento encontrado.</p>
                    <p style={{ margin: "6px 0 0", fontSize: 14, color: "#475569" }}>Escolha outro filtro ou crie um novo orçamento.</p>
                  </td>
                </tr>
              ) : (
                filteredOrcamentos.map((o) => {
                  const statusDisplay = getStatusDisplay(o.status);
                  const norm = normalizeStatus(o.status);
                  return (
                    <tr key={o.id} onClick={() => handleRowClick(o.id)} className="gp-row" style={{ cursor: "pointer" }}>
                      <th scope="row" className="gp-td" style={{ padding: "14px 20px", textAlign: "left", fontWeight: 400 }}>
                        <Link
                          href={`/orcamentos/${o.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "block", fontSize: 15, fontWeight: 800, color: "#001b3d", textDecoration: "none" }}
                        >
                          {o.nome}
                        </Link>
                        <span className="gp-mono" style={{ fontSize: 12, color: "#475569" }}>
                          {`ORC-${o.id.substring(0, 8).toUpperCase()}`}
                        </span>
                      </th>
                      <td className="gp-td" style={{ color: "#334155" }}>{o.cliente || "—"}</td>
                      <td className="gp-td" style={{ color: "#334155" }}>{formatDate(o.data)}</td>
                      <td className="gp-td">
                        <span className={`gp-bg ${norm ? BADGE[norm] : "gp-ne"}`}>
                          <span aria-hidden="true" className="gp-dot"></span>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {formatCurrency(o.valor_total)}
                      </td>
                      <td className="gp-td" style={{ padding: "14px 20px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Excluir orçamento"
                          aria-label={`Excluir orçamento ${o.nome}`}
                          onClick={() => handleDelete(o)}
                          disabled={deletingId === o.id}
                          className="gp-ib"
                          style={{ width: 40, height: 40, borderRadius: 10, opacity: deletingId === o.id ? 0.5 : 1 }}
                        >
                          <Trash size={18} weight="bold" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #E6EBF2", fontSize: 14, color: "#475569" }}>
          <span aria-live="polite">{contagem}</span>
          <span>Página 1 de 1</span>
        </div>
      </section>
    </>
  );
}
