"use client";

import { ObraTabs } from "@/components/obras/ObraTabs";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MagnifyingGlass,
  Warning,
  Plus,
  X,
  CheckCircle,
  Trash,
} from "@phosphor-icons/react";
import {
  getOrcamento,
  getItens,
  type Orcamento,
  type OrcamentoItem,
} from "@/lib/api/orcamentos";
import {
  getEstoqueInsumos,
  criarInsumo,
  registrarMovimentacao,
  getLocacoes,
  registrarLocacao,
  atualizarStatusLocacao,
  deletarInsumo,
  deletarLocacao,
  type InsumoAlmoxarifado,
  type Locacao,
} from "@/lib/api/almoxarifado";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AlmoxarifadoPage() {
  const { showToast } = useToast();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [insumos, setInsumos] = useState<InsumoAlmoxarifado[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [importando, setImportando] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [aba, setAba] = useState<"est" | "loc">("est");

  // Estados para Modal de Movimentação de Estoque
  const [modalTipo, setModalTipo] = useState<"ENTRADA" | "SAIDA" | null>(null);
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>("");
  const [movQtd, setMovQtd] = useState<string>("");
  const [movResponsavel, setMovResponsavel] = useState("");
  const [movObs, setMovObs] = useState("");
  const [movError, setMovError] = useState<string | null>(null);
  const [movSuccess, setMovSuccess] = useState(false);

  // Estados para Modal de Nova Locação
  const [showLocacaoModal, setShowLocacaoModal] = useState(false);
  const [locEquipamento, setLocEquipamento] = useState("");
  const [locLocadora, setLocLocadora] = useState("");
  const [locDevolucao, setLocDevolucao] = useState("");
  const [locResponsavel, setLocResponsavel] = useState("");
  const [locError, setLocError] = useState<string | null>(null);

  // Estados para Modal de Novo Material
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMatCodigo, setNewMatCodigo] = useState("");
  const [newMatDescricao, setNewMatDescricao] = useState("");
  const [newMatCategoria, setNewMatCategoria] = useState("ESTRUTURA");
  const [newMatQtdAtual, setNewMatQtdAtual] = useState("");
  const [newMatQtdMinima, setNewMatQtdMinima] = useState("");
  const [newMatUnidade, setNewMatUnidade] = useState("");
  const [newMatPrecoUnitario, setNewMatPrecoUnitario] = useState("");
  const [addMatError, setAddMatError] = useState<string | null>(null);

  const carregarDados = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [orcData, itensData, dbInsumos, dbLocacoes] = await Promise.all([
        getOrcamento(id),
        getItens(id),
        getEstoqueInsumos(id).catch(() => []),
        getLocacoes(id).catch(() => []),
      ]);
      setOrcamento(orcData);
      setItens(itensData);

      setInsumos(dbInsumos);
      setLocacoes(dbLocacoes);
    } catch (err) {
      console.error("Erro ao carregar dados do almoxarifado:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [id]);

  const categoriaPorDescricao = (descricao: string) => {
    const desc = descricao.toLowerCase();
    if (desc.includes("capacete") || desc.includes("luva") || desc.includes("epi")) return "EPI";
    if (desc.includes("martelo") || desc.includes("enxada") || /pá/.test(desc)) return "FERRAMENTAS";
    return "ESTRUTURA";
  };

  // Cria os insumos do orçamento com estoque zerado: o usuário informa o saldo real depois.
  const handleImportarInsumosDoOrcamento = async () => {
    setImportando(true);
    setImportError(null);
    try {
      const criados = await Promise.all(
        itens.map((item) =>
          criarInsumo(id, {
            codigo_insumo: item.codigo_composicao,
            descricao: item.descricao,
            categoria: categoriaPorDescricao(item.descricao),
            quantidade_atual: 0,
            quantidade_minima: 0,
            unidade: item.unidade,
            preco_unitario: item.preco_unitario || 0,
          })
        )
      );
      setInsumos(criados);
    } catch (err: any) {
      setImportError(err.message || "Erro ao importar insumos do orçamento.");
    } finally {
      setImportando(false);
    }
  };

  const handleDeleteInsumo = async (insumoId: string) => {
    if (!window.confirm("Tem certeza que deseja remover este material do estoque físico? Isso também apagará o histórico de movimentações associado.")) {
      return;
    }
    try {
      await deletarInsumo(id, insumoId);
      setInsumos(insumos.filter(i => i.id !== insumoId));
    } catch (err: any) {
      showToast(err.message || "Erro ao deletar material.", undefined, "error");
    }
  };

  const handleDeleteLocacao = async (locacaoId: string) => {
    if (!window.confirm("Tem certeza que deseja remover esta locação de equipamento?")) {
      return;
    }
    try {
      await deletarLocacao(id, locacaoId);
      setLocacoes(locacoes.filter((l) => l.id !== locacaoId));
    } catch (err: any) {
      showToast(err.message || "Erro ao deletar locação.", undefined, "error");
    }
  };

  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMatError(null);

    if (!newMatCodigo.trim() || !newMatDescricao.trim() || !newMatUnidade.trim()) {
      setAddMatError("Preencha todos os campos obrigatórios (*).");
      return;
    }

    const qtdMin = Number(newMatQtdMinima || 0);
    const qtdAtual = Number(newMatQtdAtual || 0);
    const preco = Number(newMatPrecoUnitario || 0);

    if (isNaN(qtdMin) || qtdMin < 0 || isNaN(qtdAtual) || qtdAtual < 0 || isNaN(preco) || preco < 0) {
      setAddMatError("Os valores numéricos não podem ser negativos.");
      return;
    }

    try {
      const novoInsumo = await criarInsumo(id, {
        codigo_insumo: newMatCodigo.trim(),
        descricao: newMatDescricao.trim(),
        categoria: newMatCategoria,
        quantidade_atual: qtdAtual,
        quantidade_minima: qtdMin,
        unidade: newMatUnidade.trim(),
        preco_unitario: preco,
      });

      // Recarrega todos os insumos para re-calcular status do banco de dados e formatar
      const dbInsumos = await getEstoqueInsumos(id);
      setInsumos(dbInsumos);
      setShowAddMaterialModal(false);
      
      // Limpar campos
      setNewMatCodigo("");
      setNewMatDescricao("");
      setNewMatCategoria("ESTRUTURA");
      setNewMatQtdAtual("");
      setNewMatQtdMinima("");
      setNewMatUnidade("");
      setNewMatPrecoUnitario("");
    } catch (err: any) {
      setAddMatError(err.message || "Erro ao adicionar material.");
    }
  };

  if (loading) {
    return (
      <p role="status" className="gp-sub" style={{ padding: 48, textAlign: "center" }}>
        Carregando informações do almoxarifado...
      </p>
    );
  }

  if (!orcamento) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 48 }}>
        <span className="gp-sub">Obra não encontrada.</span>
        <button type="button" onClick={() => router.push("/obras")} className="gp-btn gp-bd">
          Voltar para Obras
        </button>
      </div>
    );
  }

  // Filtros aplicados na listagem de estoque físico
  const insumosFiltrados = insumos.filter((insumo) => {
    const matchesSearch =
      insumo.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insumo.codigo_insumo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "TODOS"
        ? true
        : selectedCategory === "CRITICO"
        ? insumo.status === "Crítico" || Number(insumo.quantidade_atual) <= Number(insumo.quantidade_minima)
        : insumo.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Lógica para submissão de movimentações (Dar Baixa / Entrada)
  const handleMovimentacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovError(null);
    setMovSuccess(false);

    if (!selectedInsumoId) {
      setMovError("Selecione um insumo.");
      return;
    }
    const qtd = Number(movQtd);
    if (isNaN(qtd) || qtd <= 0) {
      setMovError("Insira uma quantidade válida maior que zero.");
      return;
    }
    if (!movResponsavel.trim()) {
      setMovError("Preencha o nome do responsável.");
      return;
    }

    try {
      await registrarMovimentacao(id, selectedInsumoId, {
        tipo_movimentacao: modalTipo!,
        quantidade: qtd,
        responsavel: movResponsavel,
        observacoes: movObs || undefined,
      });

      setMovSuccess(true);
      // Recarregar os dados do banco atualizados
      const novosInsumos = await getEstoqueInsumos(id);
      setInsumos(novosInsumos);

      // Limpar campos
      setTimeout(() => {
        setModalTipo(null);
        setSelectedInsumoId("");
        setMovQtd("");
        setMovResponsavel("");
        setMovObs("");
        setMovSuccess(false);
      }, 1500);
    } catch (err: any) {
      setMovError(err.message || "Ocorreu um erro ao registrar a movimentação.");
    }
  };

  // Lógica para submissão de locação
  const handleLocacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocError(null);

    if (!locEquipamento.trim() || !locLocadora.trim() || !locDevolucao) {
      setLocError("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const novaLoc = await registrarLocacao(id, {
        nome_equipamento: locEquipamento,
        locadora: locLocadora,
        status: "AGUARDANDO_RETIRADA",
        devolucao_prevista: locDevolucao,
        responsavel: locResponsavel.trim() || undefined,
      });

      setLocacoes([...locacoes, novaLoc]);
      setShowLocacaoModal(false);
      setLocEquipamento("");
      setLocLocadora("");
      setLocDevolucao("");
      setLocResponsavel("");
    } catch (err: any) {
      setLocError(err.message || "Erro ao registrar locação.");
    }
  };

  // Altera status da locação de forma dinâmica
  const handleToggleLocStatus = async (locId: string, currentStatus: string) => {
    let novoStatus: "EM_USO" | "AGUARDANDO_RETIRADA" | "FINALIZADO" = "EM_USO";
    if (currentStatus === "AGUARDANDO_RETIRADA") {
      novoStatus = "EM_USO";
    } else if (currentStatus === "EM_USO") {
      novoStatus = "FINALIZADO";
    } else {
      novoStatus = "AGUARDANDO_RETIRADA";
    }

    try {
      const atualizada = await atualizarStatusLocacao(id, locId, novoStatus);
      setLocacoes(locacoes.map((l) => (l.id === locId ? atualizada : l)));
    } catch (err) {
      console.error("Erro ao atualizar status do equipamento:", err);
    }
  };

  const criticos = insumos.filter((i) => i.status === "Crítico");
  const fmt = (n: number | string) => Number(n).toLocaleString("pt-BR");
  const locBadge = (s: string) =>
    s === "EM_USO" ? "gp-bg gp-te" : s === "AGUARDANDO_RETIRADA" ? "gp-bg gp-wa" : "gp-bg gp-ne";
  const locLabel = (s: string) =>
    s === "EM_USO" ? "Em uso" : s === "AGUARDANDO_RETIRADA" ? "Aguardando retirada" : "Finalizado";
  const abas = [
    { k: "est" as const, label: "Estoque", n: insumos.length },
    { k: "loc" as const, label: "Locações", n: locacoes.length },
  ];
  const fecharMov = () => {
    setModalTipo(null);
    setMovError(null);
  };
  const fecharLoc = () => {
    setShowLocacaoModal(false);
    setLocError(null);
  };
  const fecharMat = () => {
    setShowAddMaterialModal(false);
    setAddMatError(null);
  };
  const insumoSel = insumos.find((i) => i.id === selectedInsumoId);
  const erroBox = { margin: 0, padding: "10px 14px", borderRadius: 12, background: "#FEE2E2", color: "#991B1B", fontSize: 14 } as const;
  const vazio = { textAlign: "center", padding: 32, color: "#475569" } as const;

  return (
    <>
      <PageHeader
        back={`/obras/${id}`}
        backLabel="Voltar para a obra"
        crumb={
          <>
            <Link href="/obras">Obras</Link> / <Link href={`/obras/${id}`}>{orcamento.nome}</Link> /{" "}
            <span aria-current="page" style={{ color: "#001b3d" }}>Almoxarifado</span>
          </>
        }
        eyebrow="Almoxarifado"
        title={orcamento.nome}
        subtitle="Estoque do canteiro e equipamentos locados."
        actions={
          <>
            <button type="button" className="gp-btn gp-bd" onClick={() => setModalTipo("SAIDA")}>
              Registrar saída
            </button>
            <button type="button" className="gp-btn gp-bp" onClick={() => setModalTipo("ENTRADA")}>
              Registrar entrada
            </button>
          </>
        }
      />

      <ObraTabs id={id} atual="almoxarifado" />

      {criticos.length > 0 && (
        <div
          role="alert"
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 16, background: "#FFEDD5", color: "#7C2D12" }}
        >
          <span
            aria-hidden="true"
            style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: 10, background: "#fff", color: "#9A3412", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Warning size={20} weight="bold" />
          </span>
          <span style={{ flex: "1 1 auto", fontSize: 15 }}>
            <strong>
              {criticos.length} {criticos.length === 1 ? "item abaixo" : "itens abaixo"} do estoque mínimo:
            </strong>{" "}
            {criticos.map((c) => c.descricao).join(", ")}.
          </span>
        </div>
      )}

      <section className="gp-card" style={{ overflow: "hidden" }}>
        <div role="tablist" aria-label="Almoxarifado" style={{ display: "flex", gap: 4, padding: "12px 16px 0", borderBottom: "1px solid #E6EBF2" }}>
          {abas.map((a) => {
            const sel = a.k === aba;
            return (
              <button
                key={a.k}
                type="button"
                role="tab"
                id={`tab-${a.k}`}
                aria-selected={sel}
                aria-controls="painel-almox"
                onClick={() => setAba(a.k)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 16px", border: 0, background: "transparent",
                  fontSize: 15, cursor: "pointer", fontFamily: "inherit",
                  ...(sel ? { color: "#001b3d", fontWeight: 800, boxShadow: "inset 0 -3px 0 #9fd300" } : { color: "#475569", fontWeight: 600 }),
                }}
              >
                {a.label}
                <span className="gp-cnt">{a.n}</span>
              </button>
            );
          })}
        </div>

        <div id="painel-almox" role="tabpanel" aria-labelledby={`tab-${aba}`} style={{ overflowX: "auto" }}>
          {aba === "est" && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "14px 22px" }}>
                <label className="gp-srch" style={{ flex: "1 1 260px", maxWidth: 360 }}>
                  <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
                  <span className="gp-sr">Buscar material</span>
                  <input
                    type="search"
                    placeholder="Buscar material ou código"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
                <label className="gp-sr" htmlFor="alm-cat">Categoria</label>
                <select
                  id="alm-cat"
                  className="gp-in"
                  style={{ width: "auto", height: 44 }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="TODOS">Todas as categorias</option>
                  <option value="CRITICO">Apenas críticos / reposição</option>
                  <option value="ESTRUTURA">Estrutura</option>
                  <option value="EPI">EPI</option>
                  <option value="ELÉTRICA">Elétrica</option>
                  <option value="HIDRÁULICA">Hidráulica</option>
                  <option value="ACABAMENTO">Acabamento</option>
                  <option value="FERRAMENTAS">Ferramentas</option>
                </select>
                <button type="button" className="gp-btn gp-bs gp-sm" style={{ marginLeft: "auto" }} onClick={() => setShowAddMaterialModal(true)}>
                  <Plus size={16} weight="bold" aria-hidden="true" />
                  Adicionar material
                </button>
              </div>
              <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}>
                <caption className="gp-sr">Estoque atual</caption>
                <thead>
                  <tr>
                    <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Insumo</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Saldo</th>
                    <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Mínimo</th>
                    <th scope="col" className="gp-th" style={{ width: 240 }}>Nível</th>
                    <th scope="col" className="gp-th">Situação</th>
                    <th scope="col" className="gp-th">Atualizado em</th>
                    <th scope="col" className="gp-th" style={{ paddingRight: 22, textAlign: "right" }}>
                      <span className="gp-sr">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="gp-td" style={vazio}>
                        <p style={{ margin: 0 }}>O estoque desta obra está vazio.</p>
                        {itens.length > 0 && (
                          <button
                            type="button"
                            onClick={handleImportarInsumosDoOrcamento}
                            disabled={importando}
                            className="gp-btn gp-bp gp-sm"
                            style={{ marginTop: 12 }}
                          >
                            {importando ? "Importando..." : "Importar insumos do orçamento"}
                          </button>
                        )}
                        {importError && <p style={{ margin: "8px 0 0", color: "#B91C1C", fontSize: 13 }}>{importError}</p>}
                      </td>
                    </tr>
                  ) : insumosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="gp-td" style={vazio}>
                        Nenhum material encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    insumosFiltrados.map((insumo) => {
                      const baixo = insumo.status === "Crítico";
                      const atual = Number(insumo.quantidade_atual);
                      const min = Number(insumo.quantidade_minima);
                      const max = Math.max(atual, min * 2, 1);
                      return (
                        <tr key={insumo.id} className="gp-row">
                          <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left", fontWeight: 700 }}>
                            <p style={{ margin: 0 }}>{insumo.descricao}</p>
                            <p className="gp-mono" style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 500, color: "#475569" }}>
                              Cód: {insumo.codigo_insumo} ({insumo.fonte || "Próprio"})
                            </p>
                            <span className="gp-cnt" style={{ marginTop: 4, display: "inline-block" }}>{insumo.categoria}</span>
                          </th>
                          <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: 600 }}>
                            {fmt(atual)} {insumo.unidade}
                          </td>
                          <td className="gp-td gp-mono" style={{ textAlign: "right", color: "#475569" }}>{fmt(min)}</td>
                          <td className="gp-td">
                            <span className="gp-bar" style={{ position: "relative", overflow: "visible" }}>
                              <span style={{ width: `${Math.min(100, (atual / max) * 100)}%`, background: baixo ? "#F97316" : "#00a3b1" }} />
                              <span
                                aria-hidden="true"
                                style={{ position: "absolute", top: -4, bottom: -4, width: 2, height: "auto", borderRadius: 0, background: "#001b3d", left: `${(min / max) * 100}%` }}
                              />
                            </span>
                          </td>
                          <td className="gp-td">
                            <span className={baixo ? "gp-bg gp-wa" : "gp-bg gp-ok"}>
                              <span className="gp-dot" aria-hidden="true" style={{ background: baixo ? "#F97316" : "#65A30D" }} />
                              {baixo ? "Abaixo do mínimo" : "OK"}
                            </span>
                          </td>
                          <td className="gp-td" style={{ color: "#475569" }}>
                            {insumo.updated_at ? new Date(insumo.updated_at).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="gp-td" style={{ paddingRight: 22, textAlign: "right" }}>
                            <button
                              type="button"
                              className="gp-ib"
                              style={{ width: 36, height: 36, color: "#B91C1C" }}
                              aria-label={`Remover ${insumo.descricao} do estoque`}
                              title="Remover material do estoque"
                              onClick={() => handleDeleteInsumo(insumo.id)}
                            >
                              <Trash size={16} weight="bold" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}

          {aba === "loc" && (
            <>
              <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}>
                <caption className="gp-sr">Locações</caption>
                <thead>
                  <tr>
                    <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Equipamento</th>
                    <th scope="col" className="gp-th">Fornecedor</th>
                    <th scope="col" className="gp-th">Responsável</th>
                    <th scope="col" className="gp-th">Devolução</th>
                    <th scope="col" className="gp-th">Situação</th>
                    <th scope="col" className="gp-th" style={{ paddingRight: 22, textAlign: "right" }}>
                      <span className="gp-sr">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locacoes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="gp-td" style={vazio}>
                        Nenhuma locação registrada.
                      </td>
                    </tr>
                  ) : (
                    locacoes.map((eq) => (
                      <tr key={eq.id} className="gp-row">
                        <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left", fontWeight: 700 }}>
                          {eq.nome_equipamento}
                        </th>
                        <td className="gp-td">{eq.locadora}</td>
                        <td className="gp-td" style={{ color: "#475569" }}>{eq.responsavel || "—"}</td>
                        <td className="gp-td">{new Date(eq.devolucao_prevista).toLocaleDateString("pt-BR")}</td>
                        <td className="gp-td">
                          <button
                            type="button"
                            className={locBadge(eq.status)}
                            style={{ border: 0, cursor: "pointer", fontFamily: "inherit" }}
                            title="Clique para alternar o status do equipamento"
                            onClick={() => handleToggleLocStatus(eq.id, eq.status)}
                          >
                            <span className="gp-dot" aria-hidden="true" style={{ background: "currentColor" }} />
                            {locLabel(eq.status)}
                          </button>
                        </td>
                        <td className="gp-td" style={{ paddingRight: 22, textAlign: "right" }}>
                          <button
                            type="button"
                            className="gp-ib"
                            style={{ width: 36, height: 36, color: "#B91C1C" }}
                            aria-label={`Excluir locação de ${eq.nome_equipamento}`}
                            title="Excluir locação"
                            onClick={() => handleDeleteLocacao(eq.id)}
                          >
                            <Trash size={16} weight="bold" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div style={{ padding: "14px 22px", borderTop: "1px solid #E6EBF2" }}>
                <button type="button" className="gp-btn gp-bs gp-sm" onClick={() => setShowLocacaoModal(true)}>
                  Nova locação
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {modalTipo && (
        <div className="gp-ov">
          <div className="gp-dlg" role="dialog" aria-modal="true" aria-labelledby="mv-t">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="mv-t" className="gp-h2">{modalTipo === "ENTRADA" ? "Registrar entrada" : "Registrar saída"}</h2>
              <button type="button" className="gp-ib" aria-label="Fechar" onClick={fecharMov}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            {movSuccess ? (
              <div role="status" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 0", textAlign: "center" }}>
                <CheckCircle size={48} color="#65A30D" weight="fill" aria-hidden="true" />
                <strong>Movimentação registrada!</strong>
                <span className="gp-hint">O saldo de estoque foi atualizado.</span>
              </div>
            ) : (
              <form onSubmit={handleMovimentacaoSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {movError && <p role="alert" style={erroBox}>{movError}</p>}
                <div className="gp-fld">
                  <label htmlFor="mv-i" className="gp-lb">Insumo <span className="gp-req">(obrigatório)</span></label>
                  <select id="mv-i" className="gp-in" value={selectedInsumoId} onChange={(e) => setSelectedInsumoId(e.target.value)}>
                    <option value="">Selecione um item do estoque...</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.descricao} (Estoque: {Number(i.quantidade_atual)} {i.unidade})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="gp-fld">
                  <label htmlFor="mv-q" className="gp-lb">Quantidade <span className="gp-req">(obrigatório)</span></label>
                  <div className="gp-affix">
                    <input id="mv-q" type="number" step="any" inputMode="decimal" placeholder="0" value={movQtd} onChange={(e) => setMovQtd(e.target.value)} />
                    {insumoSel && <span>{insumoSel.unidade}</span>}
                  </div>
                </div>
                <div className="gp-fld">
                  <label htmlFor="mv-r" className="gp-lb">Responsável <span className="gp-req">(obrigatório)</span></label>
                  <input id="mv-r" className="gp-in" placeholder="Mestre de obras, almoxarife, etc." value={movResponsavel} onChange={(e) => setMovResponsavel(e.target.value)} />
                </div>
                <div className="gp-fld">
                  <label htmlFor="mv-o" className="gp-lb">
                    {modalTipo === "ENTRADA" ? "Nota fiscal ou fornecedor" : "Destino (etapa)"}
                  </label>
                  <textarea
                    id="mv-o"
                    className="gp-in"
                    rows={2}
                    placeholder={modalTipo === "ENTRADA" ? "NF de entrada, fornecedor, etc." : "Etapa ou finalidade da baixa"}
                    value={movObs}
                    onChange={(e) => setMovObs(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" className="gp-btn gp-bs" onClick={fecharMov}>Cancelar</button>
                  <button type="submit" className="gp-btn gp-bp">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showLocacaoModal && (
        <div className="gp-ov">
          <div className="gp-dlg" role="dialog" aria-modal="true" aria-labelledby="loc-t">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="loc-t" className="gp-h2">Nova locação</h2>
              <button type="button" className="gp-ib" aria-label="Fechar" onClick={fecharLoc}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleLocacaoSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {locError && <p role="alert" style={erroBox}>{locError}</p>}
              <div className="gp-fld">
                <label htmlFor="loc-e" className="gp-lb">Equipamento <span className="gp-req">(obrigatório)</span></label>
                <input id="loc-e" className="gp-in" placeholder="Betoneira, andaime, etc." value={locEquipamento} onChange={(e) => setLocEquipamento(e.target.value)} />
              </div>
              <div className="gp-fld">
                <label htmlFor="loc-l" className="gp-lb">Fornecedor <span className="gp-req">(obrigatório)</span></label>
                <input id="loc-l" className="gp-in" placeholder="Nome da locadora" value={locLocadora} onChange={(e) => setLocLocadora(e.target.value)} />
              </div>
              <div className="gp-fld">
                <label htmlFor="loc-d" className="gp-lb">Devolução prevista <span className="gp-req">(obrigatório)</span></label>
                <input id="loc-d" type="date" className="gp-in" value={locDevolucao} onChange={(e) => setLocDevolucao(e.target.value)} />
              </div>
              <div className="gp-fld">
                <label htmlFor="loc-r" className="gp-lb">Responsável</label>
                <input id="loc-r" className="gp-in" placeholder="Colaborador responsável pelo uso" value={locResponsavel} onChange={(e) => setLocResponsavel(e.target.value)} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="gp-btn gp-bs" onClick={fecharLoc}>Cancelar</button>
                <button type="submit" className="gp-btn gp-bp">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMaterialModal && (
        <div className="gp-ov">
          <div className="gp-dlg" role="dialog" aria-modal="true" aria-labelledby="mat-t">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="mat-t" className="gp-h2">Adicionar material</h2>
              <button type="button" className="gp-ib" aria-label="Fechar" onClick={fecharMat}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleAddMaterialSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {addMatError && <p role="alert" style={erroBox}>{addMatError}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <div className="gp-fld">
                  <label htmlFor="mat-c" className="gp-lb">Código <span className="gp-req">(obrigatório)</span></label>
                  <input id="mat-c" className="gp-in" placeholder="SINAPI-XXXX" value={newMatCodigo} onChange={(e) => setNewMatCodigo(e.target.value)} />
                </div>
                <div className="gp-fld">
                  <label htmlFor="mat-k" className="gp-lb">Categoria</label>
                  <select id="mat-k" className="gp-in" value={newMatCategoria} onChange={(e) => setNewMatCategoria(e.target.value)}>
                    <option value="ESTRUTURA">Estrutura</option>
                    <option value="EPI">EPI</option>
                    <option value="ELÉTRICA">Elétrica</option>
                    <option value="HIDRÁULICA">Hidráulica</option>
                    <option value="ACABAMENTO">Acabamento</option>
                    <option value="FERRAMENTAS">Ferramentas</option>
                  </select>
                </div>
              </div>
              <div className="gp-fld">
                <label htmlFor="mat-d" className="gp-lb">Descrição <span className="gp-req">(obrigatório)</span></label>
                <input id="mat-d" className="gp-in" placeholder="Cimento Portland, barra de ferro..." value={newMatDescricao} onChange={(e) => setNewMatDescricao(e.target.value)} />
              </div>
              <div className="gp-fld">
                <label htmlFor="mat-u" className="gp-lb">Unidade de medida <span className="gp-req">(obrigatório)</span></label>
                <input id="mat-u" className="gp-in" placeholder="sacos, kg, un" value={newMatUnidade} onChange={(e) => setNewMatUnidade(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                <div className="gp-fld">
                  <label htmlFor="mat-qa" className="gp-lb">Saldo atual</label>
                  <input id="mat-qa" type="number" className="gp-in gp-mono" placeholder="0" value={newMatQtdAtual} onChange={(e) => setNewMatQtdAtual(e.target.value)} />
                </div>
                <div className="gp-fld">
                  <label htmlFor="mat-qm" className="gp-lb">Mínimo</label>
                  <input id="mat-qm" type="number" className="gp-in gp-mono" placeholder="0" value={newMatQtdMinima} onChange={(e) => setNewMatQtdMinima(e.target.value)} />
                </div>
                <div className="gp-fld">
                  <label htmlFor="mat-p" className="gp-lb">Preço unit.</label>
                  <div className="gp-affix">
                    <span>R$</span>
                    <input id="mat-p" type="number" step="any" placeholder="0,00" value={newMatPrecoUnitario} onChange={(e) => setNewMatPrecoUnitario(e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="gp-btn gp-bs" onClick={fecharMat}>Cancelar</button>
                <button type="submit" className="gp-btn gp-bp">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
