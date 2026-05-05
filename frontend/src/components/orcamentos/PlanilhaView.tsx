"use client";

import * as React from "react";
import { 
  getEtapas, 
  getItens, 
  getInsumos,
  updateEtapa, 
  deleteEtapa, 
  createEtapa, 
  deleteItem, 
  updateInsumo,
  type Etapa, 
  type OrcamentoItem,
  type OrcamentoItemInsumo
} from "@/lib/api/orcamentos";
import { Plus, Trash, PencilSimple, Cube, CaretRight, CaretDown, Spinner } from "@phosphor-icons/react";

import { Modal } from "@/components/ui/Modal";
import { OrcamentoItemForm } from "./OrcamentoItemForm";
import { InsumosDrawer } from "./InsumosDrawer";


interface PlanilhaViewProps {
  orcamentoId: string;
  estadoOrcamento?: string;
  fonteOrcamento?: string;
  onTotalChanged?: () => void;
}

export function PlanilhaView({ orcamentoId, estadoOrcamento, fonteOrcamento = "SINAPI", onTotalChanged }: PlanilhaViewProps) {
  const [etapas, setEtapas] = React.useState<Etapa[]>([]);
  const [itens, setItens] = React.useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeEtapaId, setActiveEtapaId] = React.useState<string>("");
  const [editingItem, setEditingItem] = React.useState<OrcamentoItem | null>(null);

  // Insumos Drawer State
  const [drawerItem, setDrawerItem] = React.useState<OrcamentoItem | null>(null);

  // Expansion State
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [insumosCache, setInsumosCache] = React.useState<Record<string, OrcamentoItemInsumo[]>>({});
  const [loadingInsumos, setLoadingInsumos] = React.useState<Set<string>>(new Set());



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
      await createEtapa(orcamentoId, {
        nome: "Nova Etapa",
        ordem: etapas.length
      });
      carregarDados();
    } catch (error) {
      alert("Erro ao criar etapa.");
    }
  };

  const handleRemoveEtapa = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta etapa? Os itens nela ficarão sem etapa vinculada.")) return;
    try {
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

  const toggleRow = async (itemId: string) => {
    const newExpanded = new Set(expandedRows);
    
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
      // Carrega insumos se não estiverem no cache
      if (!insumosCache[itemId]) {
        try {
          setLoadingInsumos(prev => new Set(prev).add(itemId));
          const data = await getInsumos(orcamentoId, itemId);
          setInsumosCache(prev => ({ ...prev, [itemId]: data }));
        } catch (err) {
          console.error("Erro ao carregar insumos para expansão:", err);
        } finally {
          setLoadingInsumos(prev => {
            const n = new Set(prev);
            n.delete(itemId);
            return n;
          });
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  const handleUpdateInsumo = async (itemId: string, insumoId: string, data: Partial<OrcamentoItemInsumo>) => {
    try {
      await updateInsumo(orcamentoId, itemId, insumoId, data);
      
      // Limpa cache do item para forçar recarga ou atualiza localmente
      const newData = await getInsumos(orcamentoId, itemId);
      setInsumosCache(prev => ({ ...prev, [itemId]: newData }));
      
      // Recarrega orçamentos para atualizar totais do pai e global
      carregarDados();
    } catch (error) {
      alert("Erro ao atualizar insumo.");
    }
  };



  const formatarReal = (valor: number | null) => {
    if (valor === null || valor === undefined) return "R$ 0,00";
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading && etapas.length === 0) {
    return <div className="text-center p-10 text-text-muted">Carregando estrutura da planilha...</div>;
  }

  // Identifica itens sem etapa
  const itensSemEtapa = itens.filter(i => !i.etapa_id);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-main mb-1">Composição Dinâmica de Custos</h3>
          <p className="text-[12px] text-text-muted">Gerencie as etapas e insumos do seu orçamento.</p>
        </div>
        <button 
          onClick={handleAddEtapa} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded text-[12px] font-bold transition-colors hover:bg-bg-light shadow-sm text-text-main"
        >
          <Plus size={16} /> NOVA ETAPA
        </button>
      </div>

      {etapas.length === 0 && itensSemEtapa.length === 0 ? (
        <div className="text-center p-10 text-[13px] text-text-muted italic border border-dashed border-border rounded-lg bg-white">
          Nenhuma etapa adicionada. Clique em "Nova Etapa" para começar.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Mapeamento de Etapas */}
          {etapas.map((etapa, index) => {
            const itensDaEtapa = itens.filter(i => i.etapa_id === etapa.id);
            const subtotal = itensDaEtapa.reduce((acc, curr) => acc + (curr.preco_total || 0), 0);

            return (
              <div key={etapa.id} className="relative p-6 bg-white border border-border rounded-lg shadow-sm">
                <button 
                  onClick={() => handleRemoveEtapa(etapa.id)} 
                  className="absolute top-6 right-6 text-status-danger hover:text-red-700 transition-colors"
                  title="Excluir Etapa"
                >
                  <Trash size={20} />
                </button>
                
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-2">ETAPA {(index + 1).toString().padStart(2, '0')}</div>
                <input 
                  type="text" 
                  defaultValue={etapa.nome}
                  onBlur={(e) => handleUpdateEtapaNome(etapa.id, e.target.value)}
                  className="text-lg font-bold text-text-main mb-4 border-none border-b border-border outline-none w-[80%] pb-2 bg-transparent focus:border-brand-primary transition-colors" 
                  placeholder="Nome da etapa..."
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse mb-4 min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Fonte</th>
                        <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Código</th>
                        <th className="w-[30%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Descrição</th>
                        <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Und</th>
                        <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-center">Qtd</th>
                        <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">Preço Un.</th>
                        <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">Subtotal</th>
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
                        itensDaEtapa.map(item => (
                          <React.Fragment key={item.id}>
                            <tr className={`hover:bg-bg-light transition-colors group ${expandedRows.has(item.id) ? 'bg-bg-light' : ''}`}>
                              <td className="py-3 pr-2 border-b border-border border-dashed align-middle">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => toggleRow(item.id)}
                                    className="p-1 hover:bg-border rounded transition-colors text-text-muted"
                                  >
                                    {expandedRows.has(item.id) ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
                                  </button>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    item.fonte === 'SEINFRA' 
                                      ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}>
                                    {item.fonte || "SINAPI"}
                                  </span>
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
                              <td className="py-3 pr-2 border-b border-border border-dashed text-xs text-text-main text-right align-middle">
                                {formatarReal(item.preco_unitario)}
                              </td>
                              <td className="py-3 pr-2 border-b border-border border-dashed text-xs font-bold text-brand-primary text-right align-middle">
                                {formatarReal(item.preco_total)}
                              </td>
                              <td className="py-3 pl-2 border-b border-border border-dashed text-right align-middle">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setDrawerItem(item)} className="p-1.5 text-text-muted hover:text-[#A78BFA] hover:bg-purple-50 rounded transition-colors" title="Ver Recursos (Insumos)">
                                    <Cube size={16} />
                                  </button>
                                  <button onClick={() => openModalToEdit(item)} className="p-1.5 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors" title="Editar Item">
                                    <PencilSimple size={16} />
                                  </button>
                                  <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-text-muted hover:text-status-danger hover:bg-red-50 rounded transition-colors" title="Remover Item">
                                    <Trash size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Linha de Expansão */}
                            {expandedRows.has(item.id) && (
                              <tr className="bg-[#F8FAFC]">
                                <td colSpan={8} className="p-0 border-b border-border">
                                  <div className="px-12 py-4">
                                    {loadingInsumos.has(item.id) ? (
                                      <div className="flex items-center gap-2 text-[11px] text-text-muted py-2">
                                        <Spinner size={14} className="animate-spin" />
                                        Carregando recursos...
                                      </div>
                                    ) : !insumosCache[item.id] || insumosCache[item.id].length === 0 ? (
                                      <div className="text-[11px] text-text-muted py-2 italic">
                                        Nenhum recurso encontrado para esta composição.
                                      </div>
                                    ) : (
                                      <div className="border border-border/60 rounded overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                          <thead>
                                            <tr className="bg-bg-light/50">
                                              <th className="px-3 py-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider">Insumo</th>
                                              <th className="px-3 py-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider text-center w-16">Un</th>
                                              <th className="px-3 py-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider text-right w-20">Coef.</th>
                                              <th className="px-3 py-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider text-right w-24">P. Unit.</th>
                                              <th className="px-3 py-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider text-right w-28">Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {insumosCache[item.id].map(ins => (
                                              <tr key={ins.id} className="border-t border-border/40 hover:bg-bg-light/30 transition-colors">
                                                <td className="px-3 py-2">
                                                  <div className="text-[11px] font-medium text-text-main line-clamp-1">{ins.descricao}</div>
                                                  <div className="text-[9px] text-text-muted">{ins.codigo_insumo}</div>
                                                </td>
                                                <td className="px-3 py-2 text-[10px] text-text-muted text-center font-bold uppercase">{ins.unidade}</td>
                                                <td className="px-3 py-2 text-[10px] text-center font-bold uppercase">
                                                  <input 
                                                    type="number" 
                                                    defaultValue={(ins.quantidade_unitaria / item.quantidade).toFixed(6)}
                                                    onBlur={(e) => {
                                                      const novoCoef = parseFloat(e.target.value);
                                                      if (!isNaN(novoCoef)) {
                                                        handleUpdateInsumo(item.id, ins.id, { 
                                                          quantidade_unitaria: novoCoef * item.quantidade 
                                                        });
                                                      }
                                                    }}
                                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-brand-primary text-right outline-none px-1"
                                                  />
                                                </td>
                                                <td className="px-3 py-2 text-[10px] text-text-muted text-right">
                                                  <div className="flex items-center justify-end">
                                                    <span className="text-[8px] mr-1">R$</span>
                                                    <input 
                                                      type="number"
                                                      step="0.01"
                                                      defaultValue={(ins.preco_unitario_custom ?? ins.preco_unitario_base ?? 0).toFixed(2)}
                                                      onBlur={(e) => {
                                                        const novoPreco = parseFloat(e.target.value);
                                                        if (!isNaN(novoPreco)) {
                                                          handleUpdateInsumo(item.id, ins.id, { 
                                                            preco_unitario_custom: novoPreco 
                                                          });
                                                        }
                                                      }}
                                                      className="w-16 bg-transparent border-none focus:ring-1 focus:ring-brand-primary text-right outline-none px-1"
                                                    />
                                                  </div>
                                                </td>
                                                <td className="px-3 py-2 text-[10px] font-bold text-text-main text-right">
                                                  {formatarReal(ins.total)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <button 
                    onClick={() => openModalToCreate(etapa.id)} 
                    className="px-4 py-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[12px] font-bold text-text-main hover:bg-[#E2E8F0] transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} /> ADICIONAR ITEM NESTA ETAPA
                  </button>
                  <div className="font-bold text-text-main text-sm">
                    Subtotal: <span className="ml-2 text-base text-brand-primary">{formatarReal(subtotal)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Itens sem etapa */}
          {itensSemEtapa.length > 0 && (
            <div className="relative p-6 bg-white border border-border rounded-lg shadow-sm opacity-80">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-2">OUTROS INSUMOS</div>
              <h4 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2 w-[80%]">Itens sem etapa vinculada</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse mb-4 min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Fonte</th>
                      <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Código</th>
                      <th className="w-[30%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Descrição</th>
                      <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Und</th>
                      <th className="w-[8%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-center">Qtd</th>
                      <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">Preço Un.</th>
                      <th className="w-[12%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">Subtotal</th>
                      <th className="w-[10%] pb-3 border-b border-border"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensSemEtapa.map(item => (
                      <tr key={item.id} className="hover:bg-bg-light transition-colors group">
                        {/* Mesmo formato de linha acima */}
                        <td className="py-3 pr-2 border-b border-border border-dashed align-middle">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            item.fonte === 'SEINFRA' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {item.fonte || "SINAPI"}
                          </span>
                        </td>
                        <td className="py-3 pr-2 border-b border-border border-dashed text-xs font-semibold text-text-main align-middle">{item.codigo_composicao}</td>
                        <td className="py-3 pr-2 border-b border-border border-dashed text-xs text-text-main align-middle">{item.descricao}</td>
                        <td className="py-3 pr-2 border-b border-border border-dashed text-xs text-text-muted font-bold align-middle">{item.unidade}</td>
                        <td className="py-3 pr-2 border-b border-border border-dashed text-xs font-semibold text-text-main text-center align-middle">{item.quantidade}</td>
                        <td className="py-3 pr-2 border-b border-border border-dashed text-xs text-text-main text-right align-middle">{formatarReal(item.preco_unitario)}</td>
                        <td className="py-3 pr-2 border-b border-border border-dashed text-xs font-bold text-brand-primary text-right align-middle">{formatarReal(item.preco_total)}</td>
                        <td className="py-3 pl-2 border-b border-border border-dashed text-right align-middle">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setDrawerItem(item)} className="p-1.5 text-text-muted hover:text-[#A78BFA] hover:bg-purple-50 rounded transition-colors" title="Ver Recursos">
                              <Cube size={16} />
                            </button>
                            <button onClick={() => openModalToEdit(item)} className="p-1.5 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors"><PencilSimple size={16} /></button>
                            <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-text-muted hover:text-status-danger hover:bg-red-50 rounded transition-colors"><Trash size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button 
                  onClick={() => openModalToCreate("")} 
                  className="px-4 py-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[12px] font-bold text-text-main hover:bg-[#E2E8F0] transition-colors flex items-center gap-2"
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
          {isModalOpen && ( // Force re-mount of form to clear states or we can rely on useEffect
            <OrcamentoItemForm
              orcamentoId={orcamentoId}
              estadoOrcamento={estadoOrcamento}
              fonteOrcamento={fonteOrcamento}
              itemToEdit={editingItem || undefined}
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
