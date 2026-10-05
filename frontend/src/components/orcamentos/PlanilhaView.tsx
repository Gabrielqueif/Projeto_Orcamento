"use client";

import * as React from "react";
import { 
  getEtapas, 
  getItens, 
  updateEtapa, 
  deleteEtapa, 
  createEtapa, 
  deleteItem, 
  type Etapa, 
  type OrcamentoItem
} from "@/lib/api/orcamentos";
import { Plus, Trash, PencilSimple, Database, Check } from "@phosphor-icons/react";

import { Modal } from "@/components/ui/Modal";
import { OrcamentoItemForm } from "./OrcamentoItemForm";
import { InsumosDrawer } from "./InsumosDrawer";
import { EtapasEstrutura, MAX_NIVEL_ETAPAS, type DropPos } from "./EtapasEstrutura";

interface PlanilhaViewProps {
  orcamentoId: string;
  estadoOrcamento?: string;
  fonteOrcamento?: string;
  bdiOrcamento?: number;
  onTotalChanged?: () => void;
}

export function PlanilhaView({ orcamentoId, estadoOrcamento, fonteOrcamento = "SINAPI", bdiOrcamento = 0, onTotalChanged }: PlanilhaViewProps) {
  const [etapas, setEtapas] = React.useState<Etapa[]>([]);
  const [itens, setItens] = React.useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modoPreco, setModoPreco] = React.useState<"VENDA" | "DIRETO">("VENDA");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeEtapaId, setActiveEtapaId] = React.useState<string>("");
  const [editingItem, setEditingItem] = React.useState<OrcamentoItem | null>(null);

  // Insumos Drawer State
  const [drawerItem, setDrawerItem] = React.useState<OrcamentoItem | null>(null);

  // Expansion State

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
      alert("Erro ao criar etapa.");
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
      alert("Erro ao mover etapa.");
      carregarDados();
    }
  };

  const handleAddSubEtapa = async (parentId: string) => {
    if (getNivelEtapa(parentId) >= MAX_NIVEL_ETAPAS) {
      alert(`O limite é de ${MAX_NIVEL_ETAPAS} níveis de etapas.`);
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
      alert("Erro ao criar sub-etapa.");
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
      alert("Erro ao remover etapa.");
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
      alert("Erro ao renomear etapa.");
      carregarDados(); // revert on error
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    try {
      await deleteItem(orcamentoId, itemId);
      carregarDados();
    } catch (error) {
      alert("Erro ao remover item.");
    }
  };

  const openModalToCreate = (etapaId: string = "") => {
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

  const renderItemTable = (itensDaEtapa: OrcamentoItem[], etapaId: string) => {
    const subtotal = itensDaEtapa.reduce((acc, curr) => {
      const taxa = curr.bdi_aplicado !== null && curr.bdi_aplicado !== undefined ? curr.bdi_aplicado : bdiOrcamento;
      const tot = modoPreco === "VENDA" 
        ? (curr.preco_total_bdi ?? ((curr.preco_total || 0) * (1 + taxa / 100))) 
        : (curr.preco_total || 0);
      return acc + tot;
    }, 0);

    return (
      <div className="overflow-x-auto mt-2 mb-4">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="w-[10%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Fonte / BDI</th>
              <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Código</th>
              <th className="w-[28%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Descrição</th>
              <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-center">Und</th>
              <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-center">Qtd</th>
              <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">
                {modoPreco === "VENDA" ? "Preço Venda Un." : "Custo Direto Un."}
              </th>
              <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">
                {modoPreco === "VENDA" ? "Subtotal Venda" : "Subtotal Direto"}
              </th>
              <th className="w-[10%] pb-3 border-b border-border"></th>
            </tr>
          </thead>
          <tbody>
            {itensDaEtapa.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-4 text-center text-xs text-text-muted border-b border-border border-dashed italic">
                  Nenhum insumo nesta etapa.
                </td>
              </tr>
            ) : (
              itensDaEtapa.map(item => {
                const taxaBdiItem = item.bdi_aplicado !== null && item.bdi_aplicado !== undefined ? item.bdi_aplicado : bdiOrcamento;
                const precoUn = modoPreco === "VENDA" 
                  ? (item.preco_unitario_bdi ?? ((item.preco_unitario || 0) * (1 + taxaBdiItem / 100))) 
                  : item.preco_unitario;
                const precoTot = modoPreco === "VENDA" 
                  ? (item.preco_total_bdi ?? ((item.preco_total || 0) * (1 + taxaBdiItem / 100))) 
                  : item.preco_total;

                return (
                  <React.Fragment key={item.id}>
                    <tr className={`hover:bg-bg-light/35 transition-colors group`}>
                      <td className="py-3 pr-2 border-b border-border border-dashed align-middle">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              item.fonte === 'SEINFRA'
                                ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {item.fonte}
                            </span>
                          </div>
                          {item.tipo_bdi_item === "DIFERENCIADO" ? (
                            <span className="text-[8px] px-1 py-0.2 rounded font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200 w-fit">
                              BDI Dif. {item.bdi_aplicado ? `${item.bdi_aplicado}%` : ''}
                            </span>
                          ) : (
                            modoPreco === "VENDA" && (
                              <span className="text-[8px] px-1 py-0.2 rounded font-medium bg-slate-100 text-slate-600 w-fit">
                                BDI {taxaBdiItem}%
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-2 border-b border-border border-dashed text-xs font-semibold text-text-main align-middle">
                        {item.codigo_composicao}
                      </td>
                      <td className="py-3 pr-2 border-b border-border border-dashed text-xs text-text-main align-middle">
                        {item.descricao}
                      </td>
                      <td className="py-3 pr-2 border-b border-border border-dashed text-xs text-text-muted font-bold align-middle text-center">
                        {item.unidade}
                      </td>
                      <td className="py-3 pr-2 border-b border-border border-dashed text-xs font-semibold text-text-main text-center align-middle">
                        {item.quantidade}
                      </td>
                      <td className="py-3 pr-2 border-b border-border border-dashed text-xs text-text-main text-right align-middle font-medium">
                        {formatarReal(precoUn)}
                      </td>
                      <td className={`py-3 pr-2 border-b border-border border-dashed text-xs font-bold text-right align-middle ${
                        modoPreco === "VENDA" ? "text-emerald-700" : "text-brand-primary"
                      }`}>
                        {formatarReal(precoTot)}
                      </td>
                      <td className="py-3 pl-2 border-b border-border border-dashed text-right align-middle">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDrawerItem(item)} className="p-1.5 text-text-muted hover:text-[#A78BFA] hover:bg-purple-50 rounded transition-colors cursor-pointer border-none bg-transparent" title="Ver Recursos (Insumos)">
                            <Database size={16} />
                          </button>
                          <button onClick={() => openModalToEdit(item)} className="p-1.5 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors cursor-pointer border-none bg-transparent" title="Editar Item">
                            <PencilSimple size={16} />
                          </button>
                          <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-text-muted hover:text-status-danger hover:bg-red-50 rounded transition-colors cursor-pointer border-none bg-transparent" title="Remover Item">
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                </React.Fragment>
              );
            })
          )}
        </tbody>
        </table>
        {itensDaEtapa.length > 0 && (
          <div className="flex justify-end gap-2 text-xs font-bold text-text-main mt-3 pr-2">
            <span>Subtotal:</span>
            <span className="text-brand-primary">{formatarReal(subtotal)}</span>
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
        className={`relative scroll-mt-4 ${
          isRaiz
            ? "p-6 bg-white border border-border rounded-lg shadow-sm"
            : "p-4 rounded-lg border border-slate-100 bg-slate-50/50"
        }`}
      >
        <button
          onClick={() => handleRemoveEtapa(etapa.id)}
          className={`absolute text-status-danger hover:text-red-700 transition-colors border-none bg-transparent cursor-pointer ${isRaiz ? "top-6 right-6" : "top-4 right-4"}`}
          title={isRaiz ? "Excluir Etapa Completa" : "Excluir Sub-etapa"}
        >
          <Trash size={isRaiz ? 20 : 16} />
        </button>

        <div className={`font-bold text-text-muted uppercase tracking-wide ${isRaiz ? "text-[10px] mb-2" : "text-[9px] mb-1"}`}>
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
            style={{
              width: `${Math.max((etapa.nome || "").length + 1, 10)}ch`,
              fieldSizing: "content"
            } as React.CSSProperties}
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
            className={`font-bold text-text-main outline-none max-w-full transition-colors ${isRaiz ? "text-lg pb-2" : "text-sm pb-1"} ${
              editingEtapaId === etapa.id
                ? 'border-b-2 border-brand-primary bg-white px-2 py-0.5 rounded shadow-2xs cursor-text'
                : 'border-none cursor-default bg-transparent'
            }`}
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
            className={`text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center shrink-0 ${isRaiz ? "p-1.5 mb-2" : "p-1 mb-1"}`}
            title={editingEtapaId === etapa.id ? "Salvar Nome" : "Alterar Nome"}
          >
            {editingEtapaId === etapa.id ? <Check size={isRaiz ? 18 : 16} className="text-emerald-600 font-bold" /> : <PencilSimple size={isRaiz ? 18 : 16} />}
          </button>
        </div>

        {/* Itens diretos desta etapa */}
        {(itensDaEtapa.length > 0 || subEtapas.length === 0) && (
          <div className="mb-4">
            {subEtapas.length > 0 && (
              <h5 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Itens Diretos da Etapa</h5>
            )}
            {renderItemTable(itensDaEtapa, etapa.id)}
          </div>
        )}

        {/* Sub-etapas aninhadas (recursivo, até 3 níveis) */}
        {subEtapas.length > 0 && (
          <div className="pl-6 border-l-2 border-slate-100 ml-2 space-y-6 my-4">
            {subEtapas.map((sub, sIdx) => renderEtapa(sub, `${prefix}.${sIdx + 1}`, nivel + 1))}
          </div>
        )}

        <div className="flex justify-between items-center border-t border-[#f1f5f9] pt-4 mt-6">
          <div className="flex gap-3">
            {nivel < MAX_NIVEL_ETAPAS && (
              <button
                onClick={() => handleAddSubEtapa(etapa.id)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] border-solid rounded text-[12px] font-bold text-[#0f172a] hover:bg-[#f8fafc] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> ADICIONAR SUB-ETAPA
              </button>
            )}
            <button
              onClick={() => openModalToCreate(etapa.id)}
              className="px-4 py-2 bg-slate-900 text-white rounded text-[12px] font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm border-none"
            >
              <Plus size={14} /> ADICIONAR ITEM À ETAPA
            </button>
          </div>
          <div className="font-bold text-text-main text-sm">
            Total da Etapa: <span className="ml-2 text-base text-brand-primary">{formatarReal(totaisPorEtapa[etapa.id] || 0)}</span>
          </div>
        </div>
      </div>
    );
  };
  if (loading && etapas.length === 0) {
    return <div className="text-center p-10 text-text-muted">Carregando estrutura da planilha...</div>;
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
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-main mb-1">Composição Dinâmica de Custos</h3>
          <p className="text-[12px] text-text-muted">Gerencie as etapas, sub-etapas e insumos do seu orçamento.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle Custo Direto vs Preço de Venda */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModoPreco("VENDA")}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                modoPreco === "VENDA"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Preço de Venda (com BDI)
            </button>
            <button
              type="button"
              onClick={() => setModoPreco("DIRETO")}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                modoPreco === "DIRETO"
                  ? "bg-white text-blue-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Custo Direto (sem BDI)
            </button>
          </div>

          <button 
            onClick={handleAddEtapa} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded text-[12px] font-bold transition-colors hover:bg-bg-light shadow-sm text-text-main cursor-pointer"
          >
            <Plus size={16} /> NOVA ETAPA
          </button>
        </div>
      </div>

      {etapas.length === 0 && itensSemEtapa.length === 0 ? (
        <div className="text-center p-10 text-[13px] text-text-muted italic border border-dashed border-border rounded-lg bg-white">
          Nenhuma etapa adicionada. Clique em &quot;Nova Etapa&quot; para começar.
        </div>
      ) : (
        <div className="space-y-8">
          {etapasPrincipais.map((etapa, index) => renderEtapa(etapa, String(index + 1), 1))}

          {/* Itens sem etapa */}
          {itensSemEtapa.length > 0 && (
            <div className="relative p-6 bg-white border border-border rounded-lg shadow-sm opacity-80">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-2">OUTROS INSUMOS</div>
              <h4 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2 w-[80%]">Itens sem etapa vinculada</h4>
              
              {renderItemTable(itensSemEtapa, "")}

              <div className="flex justify-between items-center mt-4">
                <button 
                  onClick={() => openModalToCreate("")} 
                  className="px-4 py-2 bg-[#F1F5F9] border border-[#CBD5E1] border-solid rounded text-[12px] font-bold text-text-main hover:bg-[#E2E8F0] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} /> VINCULAR NOVO ITEM
                </button>
                <div className="font-bold text-text-main text-sm">
                  Subtotal: <span className="ml-2 text-base text-brand-primary">{formatarReal(itensSemEtapa.reduce((acc, curr) => acc + (curr.preco_total || 0), 0))}</span>
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
        title={editingItem ? "Editar Insumo" : "Buscar e Adicionar Insumo"}
        maxWidth="max-w-2xl"
      >
        <div className="max-h-[80vh] overflow-y-auto">
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
      {/* Insumos Drawer */}
      <InsumosDrawer
        orcamentoId={orcamentoId}
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onUpdate={carregarDados}
      />
    </div>
  );
}
