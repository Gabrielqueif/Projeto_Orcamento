"use client";

import * as React from "react";
import { 
  getEtapas, 
  getItens, 
  updateEtapa, 
  deleteEtapa, 
  createEtapa, 
  deleteItem, 
  atualizarPrecosPropria,
  type AtualizacaoPrecosPropriaResponse,
  type Etapa, 
  type OrcamentoItem
} from "@/lib/api/orcamentos";
import { Plus, Trash, PencilSimple, Database, Check, ArrowsClockwise, CaretDown, FolderPlus } from "@phosphor-icons/react";

import { Modal } from "@/components/ui/Modal";
import { OrcamentoItemForm } from "./OrcamentoItemForm";
import { InsumosDrawer } from "./InsumosDrawer";
import { AtualizarPrecosPropriaModal } from "./AtualizarPrecosPropriaModal";
import { useToast } from "@/components/common/toast";
import { EtapasEstrutura, MAX_NIVEL_ETAPAS, type DropPos } from "./EtapasEstrutura";

interface PlanilhaViewProps {
  orcamentoId: string;
  estadoOrcamento?: string;
  fonteOrcamento?: string;
  bdiOrcamento?: number;
  onTotalChanged?: () => void;
}

export function PlanilhaView({ orcamentoId, estadoOrcamento, fonteOrcamento = "SINAPI", bdiOrcamento = 0, onTotalChanged }: PlanilhaViewProps) {
  const { showToast } = useToast();
  const [etapas, setEtapas] = React.useState<Etapa[]>([]);
  const [previaPrecos, setPreviaPrecos] = React.useState<AtualizacaoPrecosPropriaResponse | null>(null);
  const [modalPrecosAberto, setModalPrecosAberto] = React.useState(false);
  const [carregandoPrevia, setCarregandoPrevia] = React.useState(false);
  const [aplicandoPrecos, setAplicandoPrecos] = React.useState(false);
  const [itens, setItens] = React.useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modoPreco, setModoPreco] = React.useState<"VENDA" | "DIRETO">("VENDA");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeEtapaId, setActiveEtapaId] = React.useState<string>("");
  const [editingItem, setEditingItem] = React.useState<OrcamentoItem | null>(null);

  // Insumos Drawer State
  const [drawerItem, setDrawerItem] = React.useState<OrcamentoItem | null>(null);

  // Acordeão de etapas do mobile (null = só a primeira etapa aberta)
  const [etapasAbertas, setEtapasAbertas] = React.useState<Set<string> | null>(null);

  // Refs e estado de edição de nome de etapas/sub-etapas
  const [editingEtapaId, setEditingEtapaId] = React.useState<string | null>(null);
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [etapasData, itensData] = await Promise.all([
        getEtapas(orcamentoId),
        getItens(orcamentoId)
      ]);
      setEtapas(etapasData.sort((a, b) => a.ordem - b.ordem));
      setItens(itensData);
      if (onTotalChanged) onTotalChanged();
    } catch (error) {
      console.error("Erro ao carregar dados da planilha:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    carregarDados();
  }, [orcamentoId]);

  const handleAddEtapa = async () => {
    try {
      const etapasRaiz = etapas.filter(e => !e.parent_id);
      await createEtapa(orcamentoId, {
        nome: "Nova Etapa",
        ordem: etapasRaiz.length,
        parent_id: null
      });
      carregarDados();
    } catch (error) {
      showToast("Erro ao criar etapa.", undefined, "error");
    }
  };

  const getNivelEtapa = (id: string): number => {
    let nivel = 1;
    let atual = etapas.find(e => e.id === id);
    while (atual?.parent_id) {
      nivel++;
      atual = etapas.find(e => e.id === atual!.parent_id);
    }
    return nivel;
  };

  const handleMoveEtapa = async (dragId: string, targetId: string | null, pos: DropPos) => {
    const dragged = etapas.find(e => e.id === dragId);
    if (!dragged) return;
    const target = targetId ? etapas.find(e => e.id === targetId) : null;

    const novoPai = !target ? null : pos === "inside" ? target.id : target.parent_id ?? null;
    const irmaos = etapas
      .filter(e => (e.parent_id ?? null) === novoPai && e.id !== dragId)
      .sort((a, b) => a.ordem - b.ordem);

    let indice = irmaos.length;
    if (target && pos !== "inside") {
      indice = irmaos.findIndex(e => e.id === target.id) + (pos === "after" ? 1 : 0);
    }
    irmaos.splice(indice, 0, { ...dragged, parent_id: novoPai });

    // Reindexa a nova lista de irmãos e, se o pai mudou, também a lista de origem
    const alteracoes = new Map<string, { parent_id: string | null; ordem: number }>();
    irmaos.forEach((e, i) => alteracoes.set(e.id, { parent_id: novoPai, ordem: i }));
    const paiOriginal = dragged.parent_id ?? null;
    if (paiOriginal !== novoPai) {
      etapas
        .filter(e => (e.parent_id ?? null) === paiOriginal && e.id !== dragId)
        .sort((a, b) => a.ordem - b.ordem)
        .forEach((e, i) => alteracoes.set(e.id, { parent_id: paiOriginal, ordem: i }));
    }

    const mudou = [...alteracoes].filter(([id, v]) => {
      const atual = etapas.find(e => e.id === id)!;
      return atual.ordem !== v.ordem || (atual.parent_id ?? null) !== v.parent_id;
    });
    if (mudou.length === 0) return;

    // Atualização otimista
    setEtapas(prev =>
      prev
        .map(e => (alteracoes.has(e.id) ? { ...e, ...alteracoes.get(e.id)! } : e))
        .sort((a, b) => a.ordem - b.ordem)
    );
    try {
      await Promise.all(mudou.map(([id, v]) => updateEtapa(orcamentoId, id, v)));
      carregarDados();
    } catch (error) {
      showToast("Erro ao mover etapa.", undefined, "error");
      carregarDados();
    }
  };

  const handleAddSubEtapa = async (parentId: string) => {
    if (getNivelEtapa(parentId) >= MAX_NIVEL_ETAPAS) {
      showToast(`O limite é de ${MAX_NIVEL_ETAPAS} níveis de etapas.`, undefined, "warning");
      return;
    }
    try {
      const subEtapasExistentes = etapas.filter(e => e.parent_id === parentId);
      await createEtapa(orcamentoId, {
        nome: "Nova Sub-etapa",
        ordem: subEtapasExistentes.length,
        parent_id: parentId
      });
      carregarDados();
    } catch (error) {
      showToast("Erro ao criar sub-etapa.", undefined, "error");
    }
  };

  const handleRemoveEtapa = async (id: string) => {
    // Descendentes ordenados do mais profundo para o mais raso, para excluir filhos antes dos pais
    const coletarDescendentes = (parentId: string): string[] =>
      etapas.filter(e => e.parent_id === parentId).flatMap(s => [...coletarDescendentes(s.id), s.id]);
    const descendentes = coletarDescendentes(id);
    let msg = "Tem certeza que deseja excluir esta etapa? Os itens nela ficarão sem etapa vinculada.";
    if (descendentes.length > 0) {
      msg = `Esta etapa possui ${descendentes.length} sub-etapa(s). Ao excluí-la, todas as sub-etapas e seus itens correspondentes serão excluídos ou ficarão órfãos. Confirma a exclusão?`;
    }

    if (!confirm(msg)) return;

    try {
      for (const subId of descendentes) {
        await deleteEtapa(orcamentoId, subId);
      }
      await deleteEtapa(orcamentoId, id);
      carregarDados();
    } catch (error) {
      showToast("Erro ao remover etapa.", undefined, "error");
    }
  };

  const handleUpdateEtapaNome = async (id: string, novoNome: string) => {
    const etapaOriginal = etapas.find(e => e.id === id);
    if (!etapaOriginal || etapaOriginal.nome === novoNome) return;
    
    // Optimistic update
    setEtapas(prev => prev.map(e => e.id === id ? { ...e, nome: novoNome } : e));
    try {
      await updateEtapa(orcamentoId, id, { nome: novoNome });
    } catch (error) {
      showToast("Erro ao renomear etapa.", undefined, "error");
      carregarDados(); // revert on error
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    try {
      await deleteItem(orcamentoId, itemId);
      carregarDados();
    } catch (error) {
      showToast("Erro ao remover item.", undefined, "error");
    }
  };

  const abrirPreviaPrecos = async () => {
    setModalPrecosAberto(true);
    setPreviaPrecos(null);
    setCarregandoPrevia(true);
    try {
      setPreviaPrecos(await atualizarPrecosPropria(orcamentoId, false));
    } catch (error) {
      setModalPrecosAberto(false);
      showToast(
        "Erro ao calcular prévia",
        error instanceof Error ? error.message : undefined,
        "error",
      );
    } finally {
      setCarregandoPrevia(false);
    }
  };

  const confirmarAtualizacaoPrecos = async () => {
    setAplicandoPrecos(true);
    try {
      const resultado = await atualizarPrecosPropria(orcamentoId, true);
      setModalPrecosAberto(false);
      showToast(
        "Preços atualizados",
        `${resultado.itens_alterados} item(ns) atualizado(s) a partir da base própria.`,
        "success",
      );
      await carregarDados();
    } catch (error) {
      showToast(
        "Erro ao atualizar preços",
        error instanceof Error ? error.message : undefined,
        "error",
      );
    } finally {
      setAplicandoPrecos(false);
    }
  };

  const openModalToCreate =  (etapaId: string = "") => {
    setActiveEtapaId(etapaId);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openModalToEdit = (item: OrcamentoItem) => {
    setEditingItem(item);
    setActiveEtapaId(item.etapa_id || "");
    setIsModalOpen(true);
  };

  const handleSuccessForm = () => { 
    setIsModalOpen(false);
    setEditingItem(null);
    carregarDados();
  };

  const formatarReal = (valor: number | null) => {
    if (valor === null || valor === undefined) return "R$ 0,00";
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Preços do item conforme o modo (venda com BDI ou custo direto); usados pela tabela e pelos cartões do mobile
  const precosItem = (item: OrcamentoItem) => {
    const taxaBdiItem = item.bdi_aplicado !== null && item.bdi_aplicado !== undefined ? item.bdi_aplicado : bdiOrcamento;
    const precoUn = modoPreco === "VENDA"
      ? (item.preco_unitario_bdi ?? ((item.preco_unitario || 0) * (1 + taxaBdiItem / 100)))
      : item.preco_unitario;
    const precoTot = modoPreco === "VENDA"
      ? (item.preco_total_bdi ?? ((item.preco_total || 0) * (1 + taxaBdiItem / 100)))
      : item.preco_total;
    return { taxaBdiItem, precoUn, precoTot };
  };

  const seloFonte = (item: OrcamentoItem) =>
    item.fonte === "PROPRIA"
      ? { bg: "#e0f5f7", fg: "#00626b" }
      : item.fonte === "SEINFRA"
        ? { bg: "#EDF1F6", fg: "#001b3d" }
        : { bg: "#E6F6D0", fg: "#3F6604" };

  const rotuloFonte = (item: OrcamentoItem) =>
    item.fonte === "PROPRIA"
      ? `Própria${item.base_propria_nome ? `: ${item.base_propria_nome}` : ""}`
      : item.fonte;

  const renderItemTable = (itensDaEtapa: OrcamentoItem[], etapaId: string) => {
    const subtotal = itensDaEtapa.reduce((acc, curr) => {
      const taxa = curr.bdi_aplicado !== null && curr.bdi_aplicado !== undefined ? curr.bdi_aplicado : bdiOrcamento;
      const tot = modoPreco === "VENDA" 
        ? (curr.preco_total_bdi ?? ((curr.preco_total || 0) * (1 + taxa / 100))) 
        : (curr.preco_total || 0);
      return acc + tot;
    }, 0);

    return (
      <div style={{ overflowX: "auto", marginTop: 8, marginBottom: 16 }}>
        <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse", fontSize: 14 }}>
          <caption className="gp-sr">Itens da etapa</caption>
          <thead>
            <tr>
              <th scope="col" className="gp-th">Fonte / BDI</th>
              <th scope="col" className="gp-th">Código</th>
              <th scope="col" className="gp-th">Descrição</th>
              <th scope="col" className="gp-th" style={{ textAlign: "center" }}>Un.</th>
              <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Quant.</th>
              <th scope="col" className="gp-th" style={{ textAlign: "right" }}>
                {modoPreco === "VENDA" ? "Preço venda un." : "Custo direto un."}
              </th>
              <th scope="col" className="gp-th" style={{ textAlign: "right" }}>
                {modoPreco === "VENDA" ? "Subtotal venda" : "Subtotal direto"}
              </th>
              <th scope="col" className="gp-th"><span className="gp-sr">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {itensDaEtapa.length === 0 ? (
              <tr>
                <td colSpan={8} className="gp-td" style={{ textAlign: "center", color: "#475569" }}>
                  Nenhum insumo nesta etapa.
                </td>
              </tr>
            ) : (
              itensDaEtapa.map(item => {
                const { taxaBdiItem, precoUn, precoTot } = precosItem(item);
                const selo = seloFonte(item);

                return (
                  <tr key={item.id} className="gp-row">
                    <td className="gp-td">
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: selo.bg, color: selo.fg }}>
                          {rotuloFonte(item)}
                        </span>
                        {item.tipo_bdi_item === "DIFERENCIADO" ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#9A3412" }}>
                            BDI dif. {item.bdi_aplicado ? `${item.bdi_aplicado}%` : ""}
                          </span>
                        ) : (
                          modoPreco === "VENDA" && <span className="gp-ms" style={{ fontSize: 12 }}>BDI {taxaBdiItem}%</span>
                        )}
                      </div>
                    </td>
                    <td className="gp-td gp-mono" style={{ fontSize: 13, fontWeight: 600 }}>{item.codigo_composicao}</td>
                    <td className="gp-td" style={{ fontWeight: 600, lineHeight: 1.4 }}>{item.descricao}</td>
                    <td className="gp-td" style={{ textAlign: "center", color: "#475569" }}>{item.unidade}</td>
                    <td className="gp-td gp-mono" style={{ textAlign: "right" }}>{item.quantidade}</td>
                    <td className="gp-td gp-mono" style={{ textAlign: "right" }}>{formatarReal(precoUn)}</td>
                    <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: 600 }}>{formatarReal(precoTot)}</td>
                    <td className="gp-td" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button type="button" onClick={() => setDrawerItem(item)} className="gp-ib" style={{ width: 36, height: 36, borderRadius: 10, marginRight: 6 }} title="Ver recursos (insumos)" aria-label={`Ver insumos de ${item.descricao}`}>
                        <Database size={16} weight="bold" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => openModalToEdit(item)} className="gp-ib" style={{ width: 36, height: 36, borderRadius: 10, marginRight: 6 }} title="Editar item" aria-label={`Editar item ${item.descricao}`}>
                        <PencilSimple size={16} weight="bold" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="gp-ib" style={{ width: 36, height: 36, borderRadius: 10, color: "#B91C1C" }} title="Remover item" aria-label={`Remover item ${item.descricao}`}>
                        <Trash size={16} weight="bold" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {itensDaEtapa.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12, paddingRight: 12, fontWeight: 800 }}>
            <span>Subtotal:</span>
            <span className="gp-mono">{formatarReal(subtotal)}</span>
          </div>
        )}
      </div>
    );
  };

  const getSubEtapas = (parentId: string) =>
    etapas.filter(e => e.parent_id === parentId).sort((a, b) => a.ordem - b.ordem);

  const getDescendantIds = (id: string): string[] =>
    getSubEtapas(id).flatMap(s => [s.id, ...getDescendantIds(s.id)]);

  const totalItem = (curr: OrcamentoItem) => {
    const taxa = curr.bdi_aplicado !== null && curr.bdi_aplicado !== undefined ? curr.bdi_aplicado : bdiOrcamento;
    return modoPreco === "VENDA"
      ? (curr.preco_total_bdi ?? ((curr.preco_total || 0) * (1 + taxa / 100)))
      : (curr.preco_total || 0);
  };

  // Total acumulado (itens diretos + itens de todas as sub-etapas) por etapa
  const totaisPorEtapa: Record<string, number> = {};
  etapas.forEach(e => {
    const ids = new Set([e.id, ...getDescendantIds(e.id)]);
    totaisPorEtapa[e.id] = itens.filter(i => i.etapa_id && ids.has(i.etapa_id)).reduce((acc, i) => acc + totalItem(i), 0);
  });

  const scrollToEtapa = (id: string) => {
    document.getElementById(`etapa-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderEtapa = (etapa: Etapa, prefix: string, nivel: number): React.ReactNode => {
    const subEtapas = getSubEtapas(etapa.id);
    const itensDaEtapa = itens.filter(i => i.etapa_id === etapa.id);
    const isRaiz = nivel === 1;
    const labelNivel = isRaiz ? "ETAPA" : "SUB-ETAPA";

    return (
      <div
        key={etapa.id}
        id={`etapa-${etapa.id}`}
        className={`relative scroll-mt-4 ${isRaiz ? "gp-card" : ""}`}
        style={isRaiz ? { padding: 24 } : { padding: 16, borderRadius: 16, background: "#F8FAFC", border: "1px solid #E6EBF2" }}
      >
        <button
          onClick={() => handleRemoveEtapa(etapa.id)}
          type="button"
          className={`absolute border-none bg-transparent cursor-pointer ${isRaiz ? "top-6 right-6" : "top-4 right-4"}`}
          style={{ color: "#B91C1C" }}
          title={isRaiz ? "Excluir etapa completa" : "Excluir sub-etapa"}
          aria-label={isRaiz ? "Excluir etapa completa" : "Excluir sub-etapa"}
        >
          <Trash size={isRaiz ? 20 : 16} weight="bold" aria-hidden="true" />
        </button>

        <div className="gp-mono" style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
          {labelNivel} {isRaiz ? prefix.padStart(2, "0") : prefix}
        </div>
        <div className={`flex items-center gap-1.5 max-w-[80%] ${isRaiz ? "mb-4" : "mb-3"}`}>
          <input
            ref={(el) => { inputRefs.current[etapa.id] = el; }}
            type="text"
            defaultValue={etapa.nome}
            readOnly={editingEtapaId !== etapa.id}
            onMouseDown={(e) => {
              if (editingEtapaId !== etapa.id) e.preventDefault();
            }}
            onInput={(e) => {
              const val = e.currentTarget.value;
              e.currentTarget.style.width = `${Math.max(val.length + 1, 10)}ch`;
            }}
            onBlur={(e) => {
              handleUpdateEtapaNome(etapa.id, e.target.value);
              setEditingEtapaId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className={`outline-none max-w-full transition-colors ${isRaiz ? "text-lg pb-2" : "text-sm pb-1"} ${
              editingEtapaId === etapa.id
                ? 'border-b-2 border-[#00a3b1] bg-white px-2 py-0.5 rounded cursor-text'
                : 'border-none cursor-default bg-transparent'
            }`}
            style={{ fontWeight: 800, color: "#001b3d", width: `${Math.max((etapa.nome || "").length + 1, 10)}ch`, fieldSizing: "content" } as React.CSSProperties}
            aria-label="Nome da etapa"
            placeholder="Nome da etapa..."
          />
          <button
            type="button"
            onClick={() => {
              if (editingEtapaId === etapa.id) {
                const el = inputRefs.current[etapa.id];
                if (el) el.blur();
                setEditingEtapaId(null);
              } else {
                setEditingEtapaId(etapa.id);
                setTimeout(() => {
                  const el = inputRefs.current[etapa.id];
                  if (el) {
                    el.focus();
                    el.select();
                  }
                }, 50);
              }
            }}
            className={`text-[#475569] hover:text-[#007a85] rounded transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center shrink-0 ${isRaiz ? "p-1.5 mb-2" : "p-1 mb-1"}`}
            title={editingEtapaId === etapa.id ? "Salvar nome" : "Alterar nome"}
            aria-label={editingEtapaId === etapa.id ? "Salvar nome da etapa" : "Alterar nome da etapa"}
          >
            {editingEtapaId === etapa.id ? <Check size={isRaiz ? 18 : 16} weight="bold" color="#3F6604" /> : <PencilSimple size={isRaiz ? 18 : 16} weight="bold" />}
          </button>
        </div>

        {/* Itens diretos desta etapa */}
        {(itensDaEtapa.length > 0 || subEtapas.length === 0) && (
          <div className="mb-4">
            {subEtapas.length > 0 && (
              <h3 className="gp-ml" style={{ margin: "0 0 8px" }}>Itens diretos da etapa</h3>
            )}
            {renderItemTable(itensDaEtapa, etapa.id)}
          </div>
        )}

        {/* Sub-etapas aninhadas (recursivo, até 3 níveis) */}
        {subEtapas.length > 0 && (
          <div className="pl-6 ml-2 space-y-6 my-4" style={{ borderLeft: "2px solid #E6EBF2" }}>
            {subEtapas.map((sub, sIdx) => renderEtapa(sub, `${prefix}.${sIdx + 1}`, nivel + 1))}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, borderTop: "1px solid #E6EBF2", paddingTop: 16, marginTop: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {nivel < MAX_NIVEL_ETAPAS && (
              <button type="button" onClick={() => handleAddSubEtapa(etapa.id)} className="gp-btn gp-bs gp-sm">
                <Plus size={14} weight="bold" aria-hidden="true" /> Adicionar sub-etapa
              </button>
            )}
            <button type="button" onClick={() => openModalToCreate(etapa.id)} className="gp-btn gp-bp gp-sm">
              <Plus size={14} weight="bold" aria-hidden="true" /> Adicionar item à etapa
            </button>
          </div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>
            Total da etapa: <span className="gp-mono" style={{ marginLeft: 8, fontSize: 16, fontWeight: 600 }}>{formatarReal(totaisPorEtapa[etapa.id] || 0)}</span>
          </div>
        </div>
      </div>
    );
  };
  // ===== Mobile: etapas em acordeão e itens como cartões (mesmos dados e ações do desktop) =====
  const contarItens = (etapaId: string) => {
    const ids = new Set([etapaId, ...getDescendantIds(etapaId)]);
    return itens.filter(i => i.etapa_id && ids.has(i.etapa_id)).length;
  };

  const formatarQtd = (valor: number) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 4 });

  const renomearEtapaMobile = (etapa: Etapa) => {
    const nome = window.prompt("Novo nome da etapa", etapa.nome);
    if (nome && nome.trim()) handleUpdateEtapaNome(etapa.id, nome.trim());
  };

  const renderItemCartao = (item: OrcamentoItem) => {
    const { precoUn, precoTot } = precosItem(item);
    const selo = seloFonte(item);
    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => setDrawerItem(item)}
          aria-haspopup="dialog"
          style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, padding: 12, border: 0, borderRadius: 14, background: "#F4F6FA", color: "#001b3d", textAlign: "left", cursor: "pointer", font: "inherit" }}
        >
          <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <span className="gp-mono" style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{item.codigo_composicao}</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: selo.bg, color: selo.fg }}>{rotuloFonte(item)}</span>
            {item.tipo_bdi_item === "DIFERENCIADO" && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9A3412" }}>BDI dif. {item.bdi_aplicado ? `${item.bdi_aplicado}%` : ""}</span>
            )}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{item.descricao}</span>
          <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 13, color: "#475569" }}>
            <span className="gp-mono">{formatarQtd(item.quantidade)} {item.unidade} × {formatarReal(precoUn)}</span>
            <strong className="gp-mono" style={{ color: "#001b3d" }}>{formatarReal(precoTot)}</strong>
          </span>
        </button>
      </li>
    );
  };

  const botaoTracejado: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, border: "2px dashed #94a3b8",
    borderRadius: 14, background: "transparent", color: "#001b3d", fontSize: 14, fontWeight: 800, cursor: "pointer", font: "inherit",
  };
  const botaoAcaoEtapa: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 10px", border: 0, borderRadius: 12,
    background: "transparent", color: "#001b3d", fontSize: 14, fontWeight: 700, cursor: "pointer", font: "inherit",
  };

  // Conteúdo da etapa aberta: itens diretos, sub-etapas (recursivo), adicionar item e ações da etapa
  const renderPainelEtapaMobile = (etapa: Etapa, prefix: string, nivel: number): React.ReactNode => {
    const subEtapas = getSubEtapas(etapa.id);
    const itensDaEtapa = itens.filter(i => i.etapa_id === etapa.id);
    return (
      <>
        {itensDaEtapa.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {itensDaEtapa.map(renderItemCartao)}
          </ul>
        )}
        {subEtapas.map((sub, sIdx) => {
          const subPrefix = `${prefix}.${sIdx + 1}`;
          return (
            <section
              key={sub.id}
              aria-label={`Sub-etapa ${subPrefix} ${sub.nome}`}
              style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 10, borderLeft: "2px solid #E6EBF2" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, paddingTop: 4 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>
                  <span className="gp-mono" style={{ fontWeight: 600, color: "#475569" }}>{subPrefix}</span> {sub.nome}
                </h4>
                <span className="gp-mono" style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{formatarReal(totaisPorEtapa[sub.id] || 0)}</span>
              </div>
              {renderPainelEtapaMobile(sub, subPrefix, nivel + 1)}
            </section>
          );
        })}
        <button type="button" onClick={() => openModalToCreate(etapa.id)} style={botaoTracejado}>
          <Plus size={16} weight="bold" aria-hidden="true" /> Adicionar item
        </button>
        <div role="group" aria-label={`Ações de ${etapa.nome}`} style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 4 }}>
          <button type="button" onClick={() => renomearEtapaMobile(etapa)} style={botaoAcaoEtapa}>
            <PencilSimple size={16} weight="bold" aria-hidden="true" /> Renomear
          </button>
          {nivel < MAX_NIVEL_ETAPAS && (
            <button type="button" onClick={() => handleAddSubEtapa(etapa.id)} style={botaoAcaoEtapa}>
              <FolderPlus size={16} weight="bold" aria-hidden="true" /> Sub-etapa
            </button>
          )}
          <button type="button" onClick={() => handleRemoveEtapa(etapa.id)} style={{ ...botaoAcaoEtapa, color: "#B91C1C" }}>
            <Trash size={16} weight="bold" aria-hidden="true" /> Excluir
          </button>
        </div>
      </>
    );
  };

  if (loading && etapas.length === 0) {
    return <div role="status" className="gp-sub" style={{ textAlign: "center", padding: 40 }}>Carregando estrutura da planilha...</div>;
  }

  // Identifica itens sem etapa e separa etapas em raiz e filhas
  const itensSemEtapa = itens.filter(i => !i.etapa_id);
  const etapasPrincipais = etapas.filter(e => !e.parent_id);

  return (
    <div className="flex flex-col">
      <EtapasEstrutura
        etapas={etapas}
        totais={totaisPorEtapa}
        formatarValor={formatarReal}
        onAdd={(parentId) => (parentId ? handleAddSubEtapa(parentId) : handleAddEtapa())}
        onRename={handleUpdateEtapaNome}
        onRemove={handleRemoveEtapa}
        onSelect={scrollToEtapa}
        onMove={handleMoveEtapa}
      />
      <div className="gp-only-d">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 id="h-etapas" className="gp-h2">Etapas e itens</h2>
          <p className="gp-ms" style={{ margin: "2px 0 0" }}>Gerencie as etapas, sub-etapas e insumos do seu orçamento.</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div className="gp-seg" role="group" aria-label="Modo de preço">
            <button type="button" aria-pressed={modoPreco === "VENDA"} onClick={() => setModoPreco("VENDA")} style={{ padding: "0 14px" }}>
              Preço de venda (com BDI)
            </button>
            <button type="button" aria-pressed={modoPreco === "DIRETO"} onClick={() => setModoPreco("DIRETO")} style={{ padding: "0 14px" }}>
              Custo direto (sem BDI)
            </button>
          </div>

          <button type="button" onClick={abrirPreviaPrecos} className="gp-btn gp-bs gp-sm">
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" /> Atualizar preços da base própria
          </button>

          <button type="button" onClick={handleAddEtapa} className="gp-btn gp-bs gp-sm">
            <Plus size={16} weight="bold" aria-hidden="true" /> Nova etapa
          </button>
        </div>
      </div>
      </div>

      {/* Mobile: cabeçalho da lista, modo de preço e etapas em acordeão */}
      <section className="gp-only-m" aria-labelledby="h-etapas-m" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 4px" }}>
            <h2 id="h-etapas-m" className="gp-h2">
              Etapas <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>· {etapasPrincipais.length}</span>
            </h2>
            <button type="button" onClick={handleAddEtapa} style={{ ...botaoAcaoEtapa, color: "#00626b", fontWeight: 800, paddingRight: 4 }}>
              <Plus size={16} weight="bold" aria-hidden="true" /> Nova etapa
            </button>
          </div>
          <div className="gp-seg" role="group" aria-label="Modo de preço">
            <button type="button" aria-pressed={modoPreco === "VENDA"} onClick={() => setModoPreco("VENDA")} style={{ minHeight: 44 }}>
              Com BDI
            </button>
            <button type="button" aria-pressed={modoPreco === "DIRETO"} onClick={() => setModoPreco("DIRETO")} style={{ minHeight: 44 }}>
              Custo direto
            </button>
          </div>
          <button type="button" onClick={abrirPreviaPrecos} className="gp-btn gp-bs gp-sm" style={{ minHeight: 44 }}>
            <ArrowsClockwise size={16} weight="bold" aria-hidden="true" /> Atualizar preços da base própria
          </button>

          {etapasPrincipais.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {etapasPrincipais.map((etapa, index) => {
                const abertas = etapasAbertas ?? new Set(etapasPrincipais.slice(0, 1).map(e => e.id));
                const aberta = abertas.has(etapa.id);
                const qtdItens = contarItens(etapa.id);
                const painelId = `etapa-m-${etapa.id}`;
                return (
                  <li key={etapa.id} className="gp-card" style={{ overflow: "hidden" }}>
                    <h3 style={{ margin: 0 }}>
                      <button
                        type="button"
                        aria-expanded={aberta}
                        aria-controls={painelId}
                        onClick={() => {
                          const prox = new Set(abertas);
                          if (aberta) prox.delete(etapa.id);
                          else prox.add(etapa.id);
                          setEtapasAbertas(prox);
                        }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: 68, padding: "10px 14px", border: 0, background: "transparent", color: "#001b3d", textAlign: "left", cursor: "pointer", font: "inherit" }}
                      >
                        <span aria-hidden="true" className="gp-mono" style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: 11, background: "#F4F6FA", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {index + 1}
                        </span>
                        <span style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, overflowWrap: "anywhere" }}>{etapa.nome}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>{qtdItens} {qtdItens === 1 ? "item" : "itens"}</span>
                        </span>
                        <span className="gp-mono" style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>{formatarReal(totaisPorEtapa[etapa.id] || 0)}</span>
                        <CaretDown size={18} weight="bold" color="#475569" aria-hidden="true" style={{ flex: "0 0 18px", transition: "transform 150ms", transform: aberta ? "rotate(180deg)" : undefined }} />
                      </button>
                    </h3>
                    {aberta && (
                      <div id={painelId} style={{ padding: "0 10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {renderPainelEtapaMobile(etapa, String(index + 1), 1)}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {itensSemEtapa.length > 0 && (
            <section className="gp-card" aria-labelledby="h-sem-etapa-m" style={{ padding: "14px 10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <h3 id="h-sem-etapa-m" style={{ margin: "0 4px", fontSize: 15, fontWeight: 800 }}>Itens sem etapa vinculada</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {itensSemEtapa.map(renderItemCartao)}
              </ul>
              <button type="button" onClick={() => openModalToCreate("")} style={botaoTracejado}>
                <Plus size={16} weight="bold" aria-hidden="true" /> Vincular novo item
              </button>
            </section>
          )}
        </div>
      </section>

      {etapas.length === 0 && itensSemEtapa.length === 0 ? (
        <div className="gp-card" style={{ textAlign: "center", padding: 40, fontSize: 14, color: "#475569", border: "1px dashed #CBD5E1" }}>
          Nenhuma etapa adicionada. Clique em &quot;Nova Etapa&quot; para começar.
        </div>
      ) : (
        <div className="space-y-8 gp-only-d">
          {etapasPrincipais.map((etapa, index) => renderEtapa(etapa, String(index + 1), 1))}

          {/* Itens sem etapa */}
          {itensSemEtapa.length > 0 && (
            <div className="gp-card relative" style={{ padding: 24 }}>
              <div className="gp-ml" style={{ marginBottom: 6 }}>Outros insumos</div>
              <h3 className="gp-h2" style={{ marginBottom: 16 }}>Itens sem etapa vinculada</h3>
              
              {renderItemTable(itensSemEtapa, "")}

              <div className="flex justify-between items-center mt-4">
                <button type="button" onClick={() => openModalToCreate("")} className="gp-btn gp-bs gp-sm"><Plus size={14} weight="bold" aria-hidden="true" /> Vincular novo item</button><div className="font-bold text-text-main text-sm">Subtotal: <span className="gp-mono ml-2 text-base">{formatarReal(itensSemEtapa.reduce((acc, curr) => acc + (curr.preco_total || 0), 0))}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal com Formulário de Item (Criação/Edição) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        title={editingItem ? "Editar Insumo" : "Adicionar Atividade / Serviço"}
        maxWidth="max-w-2xl gp-4b-tela"
      >
        {/* No mobile o formulário ocupa a tela (gp-4b-tela) e rola junto com o diálogo */}
        <div className="lg:max-h-[80vh] lg:overflow-y-auto gp-4b-corpo">
          {isModalOpen && (
            <OrcamentoItemForm
              orcamentoId={orcamentoId}
              estadoOrcamento={estadoOrcamento}
              fonteOrcamento={fonteOrcamento}
              itemToEdit={editingItem || undefined}
              initialEtapaId={activeEtapaId}
              onItemAdded={handleSuccessForm}
              onCancel={() => { setIsModalOpen(false); setEditingItem(null); }}
            />
          )}
        </div>
      </Modal>
      <AtualizarPrecosPropriaModal
        isOpen={modalPrecosAberto}
        onClose={() => setModalPrecosAberto(false)}
        previa={previaPrecos}
        loading={carregandoPrevia}
        confirmando={aplicandoPrecos}
        onConfirmar={confirmarAtualizacaoPrecos}
      />
      {/* Insumos Drawer */}
      <InsumosDrawer
        orcamentoId={orcamentoId}
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onUpdate={carregarDados}
        onEdit={(item) => {
          setDrawerItem(null);
          openModalToEdit(item);
        }}
        onRemove={(item) => {
          setDrawerItem(null);
          handleRemoveItem(item.id);
        }}
      />
    </div>
  );
}
