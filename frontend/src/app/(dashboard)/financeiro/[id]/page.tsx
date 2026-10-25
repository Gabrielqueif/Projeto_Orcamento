"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Trash, X, MagnifyingGlass } from "@phosphor-icons/react";
import {
  getConsolidadoFinanceiro,
  getDespesas,
  criarDespesa,
  atualizarStatusDespesa,
  deletarDespesa,
  ConsolidadoFinanceiro,
  Despesa,
  DespesaCreate,
} from "@/lib/api/financeiro";
import { getObra } from "@/lib/api/obras";
import { getOrcamento } from "@/lib/api/orcamentos";
import { ObraTabs } from "@/components/obras/ObraTabs";
import { useToast } from "@/components/common/toast";

// O nome da obra é o do orçamento de origem; falha aqui não deve derrubar a tela.
async function buscarNomeObra(obraId: string): Promise<string | null> {
  try {
    const obra = await getObra(obraId);
    return obra.orcamento_id ? (await getOrcamento(obra.orcamento_id)).nome : null;
  } catch {
    return null;
  }
}

export default function GestaoCustosObraPage() {
  const { showToast } = useToast();
  const params = useParams();
  const obraId = params?.id as string;

  const [consolidado, setConsolidado] = useState<ConsolidadoFinanceiro | null>(null);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nomeObra, setNomeObra] = useState<string | null>(null);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("TODAS");
  const [busca, setBusca] = useState<string>("");

  // Modal Lançamento
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState<DespesaCreate>({
    descricao: "",
    valor: 0,
    categoria: "Materiais",
    status: "EM_ANALISE",
    data_competencia: new Date().toISOString().split("T")[0],
    responsavel: "",
    origem: "MANUAL",
  });

  // Modal Confirmação Exclusão
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(null);

  async function carregarDados() {
    if (!obraId) return;
    try {
      setLoading(true);
      setError(null);
      const [consData, despData, obra] = await Promise.all([
        getConsolidadoFinanceiro(obraId),
        getDespesas(obraId),
        buscarNomeObra(obraId),
      ]);
      setNomeObra(obra);
      setConsolidado(consData);
      setDespesas(despData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados financeiros da obra");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [obraId]);

  const handleCriarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId || novaDespesa.valor <= 0 || !novaDespesa.descricao.trim()) return;

    try {
      setSalvando(true);
      await criarDespesa(obraId, novaDespesa);
      setModalAberto(false);
      setNovaDespesa({
        descricao: "",
        valor: 0,
        categoria: "Materiais",
        status: "EM_ANALISE",
        data_competencia: new Date().toISOString().split("T")[0],
        responsavel: "",
        origem: "MANUAL",
      });
      await carregarDados();
    } catch (err: any) {
      showToast(err.message || "Erro ao registrar despesa", undefined, "error");
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarStatus = async (
    despesaId: string,
    novoStatus: "EM_ANALISE" | "APROVADO" | "PAGO" | "RECUSADO"
  ) => {
    try {
      await atualizarStatusDespesa(obraId, despesaId, novoStatus);
      await carregarDados();
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar status", undefined, "error");
    }
  };

  const handleDeletarDespesa = async (despesaId: string) => {
    try {
      await deletarDespesa(obraId, despesaId);
      setDespesaParaExcluir(null);
      await carregarDados();
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir despesa", undefined, "error");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    const [classe, rotulo] =
      status === "PAGO" ? ["gp-ok", "Pago"] : status === "APROVADO" ? ["gp-te", "Aprovado"] : status === "RECUSADO" ? ["gp-da", "Recusado"] : ["gp-wa", "Em Análise"];
    return (
      <span className={`gp-bg ${classe}`}>
        <span className="gp-dot" aria-hidden="true"></span>
        {rotulo}
      </span>
    );
  };

  const despesasFiltradas = despesas.filter((d) => {
    const matchCat = categoriaFiltro === "TODAS" || d.categoria === categoriaFiltro;
    const matchBusca =
      !busca.trim() ||
      d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      d.responsavel.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  if (loading) {
    return (
      <p role="status" style={{ padding: 48, textAlign: "center", color: "#475569" }}>
        Carregando gestão de custos da obra...
      </p>
    );
  }

  if (error || !consolidado) {
    return (
      <div role="alert" style={{ padding: 48, textAlign: "center" }}>
        <p style={{ color: "#B91C1C", margin: 0, fontWeight: 700 }}>{error || "Não foi possível carregar os dados"}</p>
        <button onClick={() => carregarDados()} className="gp-btn gp-bs gp-sm" style={{ marginTop: 16 }}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { total_orcado, total_realizado, saldo_restante, desvio_percentual, gasto_por_categoria } = consolidado;

  const percentualUtilizado = total_orcado > 0 ? Math.round((total_realizado / total_orcado) * 100) : 0;
  const somaFiltradas = despesasFiltradas.reduce((a, d) => a + d.valor, 0);
  const CATEGORIAS = ["Materiais", "Mão de Obra", "Equipamentos", "Administrativo", "Outros"];

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <nav aria-label="Trilha" className="gp-crumb">
            <Link href="/financeiro">Financeiro</Link> /{" "}
            <span aria-current="page" style={{ color: "#001b3d" }}>{nomeObra ?? "Gestão de custos"}</span>
          </nav>
          <h1 className="gp-h1">{nomeObra ?? "Detalhamento de Custos da Obra"}</h1>
          <p className="gp-sub">Despesas lançadas e consumo da verba por categoria.</p>
        </div>
        <button type="button" onClick={() => setModalAberto(true)} className="gp-btn gp-bp">
          <Plus size={16} weight="bold" aria-hidden="true" /> Nova despesa
        </button>
      </div>

      <ObraTabs id={obraId} atual="financeiro" />

      <section aria-label="Indicadores" className="gp-grid">
        <div className="gp-card gp-met gp-dark">
          <span className="gp-ml">Total orçado</span>
          <span className="gp-mv">{formatCurrency(total_orcado)}</span>
          <span className="gp-ms">Orçamento aprovado</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Total realizado</span>
          <span className="gp-mv">{formatCurrency(total_realizado)}</span>
          <span
            className="gp-bar"
            role="progressbar"
            aria-label={`${percentualUtilizado}% do orçamento executado`}
            aria-valuenow={Math.min(percentualUtilizado, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${Math.min(percentualUtilizado, 100)}%`, background: "#00a3b1" }}></span>
          </span>
          <span className="gp-ms">{percentualUtilizado}% do orçamento executado</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Saldo restante</span>
          <span className="gp-mv" style={{ color: saldo_restante >= 0 ? undefined : "#B91C1C" }}>
            {formatCurrency(saldo_restante)}
          </span>
          <span className="gp-ms">{saldo_restante >= 0 ? "Margem disponível" : "Orçamento estourado"}</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Desvio orçamentário</span>
          <span className="gp-mv" style={{ color: desvio_percentual > 0 ? "#9A3412" : "#3F6604" }}>
            {desvio_percentual > 0 ? `+${desvio_percentual.toFixed(1)}%` : `${desvio_percentual.toFixed(1)}%`}
          </span>
          <span className="gp-ms">Variação frente ao planejado</span>
        </div>
      </section>

      <section className="gp-card gp-pad" aria-labelledby="h-cat" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 id="h-cat" className="gp-h2">Comparativo por categoria (orçado vs realizado)</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {gasto_por_categoria.map((cat) => {
            const pctCat = cat.orcado > 0 ? Math.round((cat.realizado / cat.orcado) * 100) : 0;
            const acima = cat.realizado > cat.orcado && cat.orcado > 0;
            return (
              <li key={cat.categoria} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
                  <strong>{cat.categoria}</strong>
                  {acima && <span className="gp-bg gp-wa">Acima</span>}
                </div>
                <div className="gp-mono" style={{ fontSize: 13, color: "#475569" }}>
                  {formatCurrency(cat.realizado)} / {formatCurrency(cat.orcado)}
                </div>
                <span
                  className="gp-bar"
                  role="img"
                  aria-label={`${cat.categoria}: ${pctCat}% do orçado${acima ? ", acima do previsto" : ""}`}
                  style={{ height: 10 }}
                >
                  <span style={{ width: `${Math.min(pctCat, 100)}%`, background: acima ? "#F97316" : "#001b3d" }}></span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="gp-card" aria-labelledby="h-de" style={{ overflow: "hidden" }}>
        <h2 id="h-de" className="gp-sr">Despesas</h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: "1px solid #E6EBF2" }}>
          <div role="group" aria-label="Filtrar por categoria" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["TODAS", ...CATEGORIAS].map((c) => (
              <button key={c} type="button" className="gp-chip" aria-pressed={categoriaFiltro === c} onClick={() => setCategoriaFiltro(c)}>
                {c === "TODAS" ? "Todas" : c}
              </button>
            ))}
          </div>
          <div className="gp-srch" style={{ marginLeft: "auto", flex: "0 1 280px" }}>
            <MagnifyingGlass size={16} aria-hidden="true" />
            <label htmlFor="bd" className="gp-sr">Buscar despesa</label>
            <input id="bd" type="search" placeholder="Descrição ou responsável" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse" }}>
            <caption className="gp-sr">Despesas da obra</caption>
            <thead>
              <tr>
                <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Data</th>
                <th scope="col" className="gp-th">Descrição</th>
                <th scope="col" className="gp-th">Categoria</th>
                <th scope="col" className="gp-th">Responsável</th>
                <th scope="col" className="gp-th">Status</th>
                <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Valor</th>
                <th scope="col" className="gp-th" style={{ paddingRight: 22 }}><span className="gp-sr">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {despesasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="gp-td" style={{ textAlign: "center", padding: 32, color: "#475569" }}>
                    Nenhuma despesa encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                despesasFiltradas.map((despesa) => (
                  <tr key={despesa.id} className="gp-row">
                    <td className="gp-td gp-mono" style={{ paddingLeft: 22 }}>{despesa.data_competencia}</td>
                    <th scope="row" className="gp-td" style={{ textAlign: "left", fontWeight: 700 }}>{despesa.descricao}</th>
                    <td className="gp-td">
                      <span className="gp-bg gp-ne">{despesa.categoria}</span>
                    </td>
                    <td className="gp-td" style={{ color: "#475569" }}>{despesa.responsavel}</td>
                    <td className="gp-td">
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                        {getStatusBadge(despesa.status)}
                        <select
                          aria-label={`Status da despesa ${despesa.descricao}`}
                          value={despesa.status}
                          onChange={(e) =>
                            handleAtualizarStatus(despesa.id, e.target.value as "EM_ANALISE" | "APROVADO" | "PAGO" | "RECUSADO")
                          }
                          className="gp-in"
                          style={{ height: 36, fontSize: 13, width: "auto" }}
                        >
                          <option value="EM_ANALISE">Em Análise</option>
                          <option value="APROVADO">Aprovado</option>
                          <option value="PAGO">Pago</option>
                          <option value="RECUSADO">Recusado</option>
                        </select>
                      </div>
                    </td>
                    <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatCurrency(despesa.valor)}
                    </td>
                    <td className="gp-td" style={{ paddingRight: 22, textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => setDespesaParaExcluir(despesa.id)}
                        className="gp-ib"
                        style={{ width: 40, height: 40, color: "#B91C1C" }}
                        title="Excluir despesa"
                        aria-label={`Excluir despesa ${despesa.descricao}`}
                      >
                        <Trash size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px", borderTop: "1px solid #E6EBF2", fontSize: 14 }}>
          <span aria-live="polite" style={{ color: "#475569" }}>
            {despesasFiltradas.length} {despesasFiltradas.length === 1 ? "despesa" : "despesas"}
          </span>
          <strong className="gp-mono">Total: {formatCurrency(somaFiltradas)}</strong>
        </div>
      </section>

      {modalAberto && (
        <div className="gp-ov" style={{ justifyContent: "flex-end", padding: 0 }} onClick={(e) => { if (e.target === e.currentTarget) setModalAberto(false); }}>
          <div className="gp-drw" role="dialog" aria-modal="true" aria-labelledby="nd-t">
            <div className="gp-dh">
              <h2 id="nd-t" className="gp-h2">Nova despesa</h2>
              <button type="button" className="gp-ib" aria-label="Fechar" onClick={() => setModalAberto(false)}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleCriarDespesa} style={{ display: "contents" }}>
              <div className="gp-db">
                <div className="gp-fld">
                  <label htmlFor="nd-d" className="gp-lb">Descrição <span className="gp-req">(obrigatório)</span></label>
                  <input
                    id="nd-d"
                    type="text"
                    required
                    aria-required="true"
                    placeholder="Ex.: Compra de cimento e agregados"
                    value={novaDespesa.descricao}
                    onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })}
                    className="gp-in"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                  <div className="gp-fld">
                    <label htmlFor="nd-v" className="gp-lb">Valor</label>
                    <div className="gp-affix">
                      <span>R$</span>
                      <input
                        id="nd-v"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0,00"
                        value={novaDespesa.valor || ""}
                        onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="gp-fld">
                    <label htmlFor="nd-dt" className="gp-lb">Data de competência</label>
                    <input
                      id="nd-dt"
                      type="date"
                      required
                      value={novaDespesa.data_competencia}
                      onChange={(e) => setNovaDespesa({ ...novaDespesa, data_competencia: e.target.value })}
                      className="gp-in"
                    />
                  </div>
                </div>
                <div className="gp-fld">
                  <label htmlFor="nd-c" className="gp-lb">Categoria</label>
                  <select
                    id="nd-c"
                    value={novaDespesa.categoria}
                    onChange={(e) => setNovaDespesa({ ...novaDespesa, categoria: e.target.value as any })}
                    className="gp-in"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="gp-fld">
                  <label htmlFor="nd-r" className="gp-lb">Responsável</label>
                  <input
                    id="nd-r"
                    type="text"
                    required
                    placeholder="Nome do responsável"
                    value={novaDespesa.responsavel}
                    onChange={(e) => setNovaDespesa({ ...novaDespesa, responsavel: e.target.value })}
                    className="gp-in"
                  />
                </div>
                <div className="gp-fld">
                  <label htmlFor="nd-s" className="gp-lb">Status inicial</label>
                  <select
                    id="nd-s"
                    value={novaDespesa.status}
                    onChange={(e) => setNovaDespesa({ ...novaDespesa, status: e.target.value as any })}
                    className="gp-in"
                  >
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="PAGO">Pago</option>
                  </select>
                </div>
              </div>
              <div className="gp-df">
                <button type="button" onClick={() => setModalAberto(false)} className="gp-btn gp-bs">Cancelar</button>
                <button type="submit" disabled={salvando} className="gp-btn gp-bp" style={{ opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? "Salvando…" : "Salvar despesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {despesaParaExcluir && (
        <div className="gp-ov">
          <div className="gp-dlg" role="alertdialog" aria-modal="true" aria-labelledby="ex-t" style={{ maxWidth: 440 }}>
            <h2 id="ex-t" className="gp-h2">Confirmar exclusão</h2>
            <p style={{ margin: 0, color: "#475569", fontSize: 15 }}>
              Tem certeza que deseja excluir esta despesa? Esta ação atualizará os consolidados da obra e não pode ser desfeita.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setDespesaParaExcluir(null)} className="gp-btn gp-bs">Cancelar</button>
              <button type="button" onClick={() => handleDeletarDespesa(despesaParaExcluir)} className="gp-btn gp-bx">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
