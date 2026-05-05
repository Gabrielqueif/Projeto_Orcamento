"use client";

import Link from "next/link";
import { Check, Robot, MagicWand, Plus, ArrowLeft, ArrowRight, ShieldCheck, Trash } from "@phosphor-icons/react";
import { useState } from "react";

interface Item {
  id: number;
  nome: string;
  qtd: number;
  preco: number;
}

interface Etapa {
  id: number;
  nome: string;
  itens: Item[];
}

export default function NovaObraEtapa3Page() {
  const [metragem, setMetragem] = useState<number>(500);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const CUB_PR_VALOR = 2450;

  const calcularIA = () => {
    if (!metragem || metragem <= 0) {
      alert("Por favor insira a metragem da obra em m².");
      return;
    }
    
    const totalEstimado = metragem * CUB_PR_VALOR;
    
    const dist = [
      { nome: "Fundação e Estrutura", pct: 0.22, itens: [{n:"Concreto Usinado (m³)", q: metragem*0.12}, {n:"Aço CA-50 (kg)", q: metragem*15}, {n:"Mão de obra Fundação", q: 1}] },
      { nome: "Alvenaria e Vedações", pct: 0.15, itens: [{n:"Bloco Estrutural (milheiro)", q: metragem*0.04}, {n:"Cimento (sacos)", q: metragem*0.8}, {n:"Equipe Pedreiros", q: 1}] },
      { nome: "Instalações Elétrica/Hidráulica", pct: 0.12, itens: [{n:"Tubulações e Fios (Lotes)", q: metragem/50}, {n:"Equipe Especializada", q: 1}] },
      { nome: "Acabamentos Finos e Fachada", pct: 0.35, itens: [{n:"Porcelanato (m²)", q: metragem*0.85}, {n:"Esquadrias", q: metragem*0.3}, {n:"Pintura e Massa", q: metragem*3}] },
      { nome: "Custos Indiretos (Projetos / Taxas)", pct: 0.16, itens: [{n:"Taxas Administrativas", q: 1}, {n:"Engenharia", q: 1}] }
    ];

    const novasEtapas = dist.map((etapa, id) => {
      const valEtapa = totalEstimado * etapa.pct;
      const valorPorItem = valEtapa / etapa.itens.length;
      return {
        id: Date.now() + id,
        nome: `${etapa.nome} (${(etapa.pct*100).toFixed(0)}%)`,
        itens: etapa.itens.map((item, index) => ({
          id: Date.now() + 100 + index,
          nome: item.n,
          qtd: item.q,
          preco: valorPorItem / item.q
        }))
      };
    });

    setEtapas(novasEtapas);
  };

  const addEtapa = () => {
    setEtapas([...etapas, { id: Date.now(), nome: "Nova Etapa", itens: [{ id: Date.now() + 1, nome: "", qtd: 1, preco: 0 }] }]);
  };

  const removerEtapa = (id: number) => {
    setEtapas(etapas.filter(e => e.id !== id));
  };

  const updateEtapaNome = (id: number, nome: string) => {
    setEtapas(etapas.map(e => e.id === id ? { ...e, nome } : e));
  };

  const addItem = (etapaId: number) => {
    setEtapas(etapas.map(e => {
      if (e.id === etapaId) {
        return { ...e, itens: [...e.itens, { id: Date.now(), nome: "", qtd: 1, preco: 0 }] };
      }
      return e;
    }));
  };

  const updateItem = (etapaId: number, itemId: number, field: keyof Item, value: any) => {
    setEtapas(etapas.map(e => {
      if (e.id === etapaId) {
        return {
          ...e,
          itens: e.itens.map(i => i.id === itemId ? { ...i, [field]: value } : i)
        };
      }
      return e;
    }));
  };

  const removerItem = (etapaId: number, itemId: number) => {
    setEtapas(etapas.map(e => {
      if (e.id === etapaId) {
        return { ...e, itens: e.itens.filter(i => i.id !== itemId) };
      }
      return e;
    }));
  };

  const formatarReal = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calcularTotalGeral = () => {
    return etapas.reduce((total, etapa) => {
      const subtotal = etapa.itens.reduce((sub: number, item: Item) => sub + (item.qtd * item.preco), 0);
      return total + subtotal;
    }, 0);
  };

  const totalGeral = calcularTotalGeral();

  return (
    <div className="flex flex-col h-full -mx-6 -mb-6 -mt-6">
      {/* Wizard Progress Header */}
      <div className="flex items-center justify-center h-20 px-10 bg-white border-b border-border">
        <div className="flex items-center w-full max-w-[800px] justify-between">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-text-main">
            <div className="w-8 h-8 rounded bg-brand-primary text-bg-dark border border-brand-primary flex items-center justify-center text-lg"><Check weight="bold" /></div>
            <span>DADOS GERAIS</span>
          </div>
          <div className="flex-1 h-[2px] bg-brand-primary mx-6"></div>
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-text-main">
            <div className="w-8 h-8 rounded bg-brand-primary text-bg-dark border border-brand-primary flex items-center justify-center text-lg"><Check weight="bold" /></div>
            <span>EQUIPE & CRONOGRAMA</span>
          </div>
          <div className="flex-1 h-[2px] bg-brand-primary mx-6"></div>
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-text-main">
            <div className="w-8 h-8 rounded bg-brand-primary text-bg-dark border border-brand-primary flex items-center justify-center text-sm">3</div>
            <span>ORÇAMENTO & METAS</span>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 p-10 bg-bg-light overflow-y-auto">
        
        <div>
          {/* AI Box */}
          <div className="bg-surface border border-[#06B6D4] rounded-lg mb-6 overflow-hidden shadow-sm">
            <div className="p-4 px-6 bg-[#F0FDFD] flex justify-between items-center">
              <div>
                <h4 className="text-[15px] font-bold text-text-main mb-1 flex items-center gap-2">
                  <Robot weight="fill" className="text-[#06B6D4]" size={24} /> Orçamento Preliminar (IA)
                </h4>
                <p className="text-[13px] text-text-muted">Insira a metragem do projeto para compor as etapas automaticamente via Inteligência Artificial baseada no CUB de R$ 2.450 / m².</p>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">METRAGEM DA OBRA:</span>
                  <div className="flex items-center gap-2">
                     <input type="number" value={metragem} onChange={(e) => setMetragem(Number(e.target.value))} className="w-[120px] font-bold text-center p-2 border border-[#BAE6FD] rounded bg-white outline-none" min="10" />
                     <span className="font-bold text-text-main">m²</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <button type="button" onClick={calcularIA} className="flex items-center gap-2 px-4 py-2 bg-[#06B6D4] text-white rounded font-semibold text-sm transition-colors hover:bg-[#0891b2] mt-5 shadow-sm">
                  <MagicWand size={20} /> GERAR COM A IA
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-text-main mb-1">Composição Dinâmica de Custos</h3>
                <p className="text-[12px] text-text-muted">Adicione manualmente as etapas ou use a IA acima.</p>
              </div>
              <button type="button" onClick={addEtapa} className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded text-[12px] font-bold transition-colors hover:bg-bg-light shadow-sm">
                <Plus size={16} /> NOVA ETAPA
              </button>
            </div>
            
            {/* Wrapper dinâmico das tabelas */}
            <div>
              {etapas.length === 0 ? (
                <div className="text-center p-10 text-[13px] text-text-muted italic border border-dashed border-border rounded-lg">
                  Nenhuma etapa adicionada.
                </div>
              ) : (
                etapas.map(etapa => {
                  const subtotal = etapa.itens.reduce((sub: number, item: Item) => sub + (item.qtd * item.preco), 0);
                  
                  return (
                    <div key={etapa.id} className="relative mb-8 p-6 bg-white border border-border rounded-lg shadow-sm">
                      <button onClick={() => removerEtapa(etapa.id)} className="absolute top-6 right-6 text-status-danger hover:text-red-700 transition-colors">
                        <Trash size={20} />
                      </button>
                      
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-2">NOME DA ETAPA</div>
                      <input 
                        type="text" 
                        value={etapa.nome} 
                        onChange={(e) => updateEtapaNome(etapa.id, e.target.value)}
                        className="text-lg font-bold text-text-main mb-4 border-none border-b border-border outline-none w-[80%] pb-2 bg-transparent focus:border-brand-primary" 
                      />
                      
                      <table className="w-full text-left border-collapse mb-4">
                        <thead>
                           <tr>
                             <th className="w-[40%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Item de Custo</th>
                             <th className="w-[15%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Qtd</th>
                             <th className="w-[20%] pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Preço Un.</th>
                             <th className="pb-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">Subtotal</th>
                             <th className="pb-3 border-b border-border"></th>
                           </tr>
                        </thead>
                        <tbody>
                          {etapa.itens.map((item: Item) => (
                            <tr key={item.id}>
                              <td className="py-2 pr-4 border-b border-border border-dashed">
                                <input type="text" placeholder="Nome do insumo/serviço..." value={item.nome} onChange={(e) => updateItem(etapa.id, item.id, 'nome', e.target.value)} className="w-full bg-transparent border-none outline-none text-sm" />
                              </td>
                              <td className="py-2 pr-4 border-b border-border border-dashed">
                                <input type="number" value={item.qtd} step="0.01" onChange={(e) => updateItem(etapa.id, item.id, 'qtd', Number(e.target.value))} className="w-full bg-transparent border border-transparent hover:border-border rounded px-2 py-1 outline-none text-sm" />
                              </td>
                              <td className="py-2 pr-4 border-b border-border border-dashed">
                                <input type="number" value={item.preco} step="0.01" onChange={(e) => updateItem(etapa.id, item.id, 'preco', Number(e.target.value))} className="w-full bg-transparent border border-transparent hover:border-border rounded px-2 py-1 outline-none text-sm" />
                              </td>
                              <td className="py-2 border-b border-border border-dashed text-right font-bold text-sm">
                                {formatarReal(item.qtd * item.preco)}
                              </td>
                              <td className="py-2 pl-4 border-b border-border border-dashed text-center">
                                <Trash size={16} className="cursor-pointer text-text-muted hover:text-status-danger transition-colors mx-auto" onClick={() => removerItem(etapa.id, item.id)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="flex justify-between items-center mt-4">
                         <button onClick={() => addItem(etapa.id)} className="px-4 py-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[12px] font-bold hover:bg-[#E2E8F0] transition-colors">
                           + ADICIONAR ITEM NESTA ETAPA
                         </button>
                         <div className="font-bold text-text-main text-base">Subtotal: <span className="ml-2">{formatarReal(subtotal)}</span></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-6 p-6 bg-bg-light border-t border-border rounded-lg flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wide">CUSTO TOTAL CALCULADO:</span>
                <strong className="text-[28px] font-bold text-text-main">{formatarReal(totalGeral)}</strong>
            </div>
          </div>
        </div>
        
        <div>
          {/* Summary Sidebar */}
          <div className="bg-bg-dark text-white rounded-lg p-8 shadow-sm">
            <div className="text-lg font-bold uppercase mb-2">Resumo Executivo da Obra</div>
            <p className="text-[12px] text-[#8C9CAB] mb-6">Análise instantânea do orçamento gerado.</p>
            
            <div className="flex justify-between text-[13px] text-[#8C9CAB] mb-3">
              <span>Etapas Definidas</span>
              <span className="text-white font-semibold">{etapas.length} Etapas</span>
            </div>
            
            <div className="h-px bg-white/10 my-6"></div>

            <div className="flex justify-between text-[13px] text-[#8C9CAB] mb-3">
              <span>LOCALIDADE</span>
              <span className="text-white font-semibold">Curitiba, PR</span>
            </div>
            <div className="flex justify-between text-[13px] text-[#8C9CAB] mb-3">
              <span>DURAÇÃO (EST.)</span>
              <span className="text-white font-semibold">14 Meses</span>
            </div>
            
            <div className="h-px bg-white/10 my-6"></div>

            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-wide mb-2">Muralha Orçamentária Total</div>
            <div className="text-4xl font-bold mb-6">{formatarReal(totalGeral)}</div>
          </div>
          
          <div className="mt-6 flex flex-col gap-4">
            <Link href="/obras" className="w-full flex items-center justify-center gap-2 py-4 bg-brand-primary text-bg-dark rounded-lg font-bold transition-colors hover:bg-brand-primaryHover">
              <Check weight="bold" size={20} /> CONCLUIR E CRIAR PROJETO
            </Link>
            <Link href="/obras/novo/etapa-2" className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-border rounded-lg font-bold transition-colors hover:bg-bg-light text-text-main text-sm">
              <ArrowLeft size={16} /> VOLTAR AO PASSO 2
            </Link>
          </div>

          <div className="mt-6 bg-[#F8FBEA] border border-[#E6F6D0] rounded-lg p-4 flex gap-3">
            <ShieldCheck weight="fill" className="text-[#4D7E05] shrink-0" size={24} />
            <div>
              <div className="text-[12px] font-bold text-[#4D7E05] uppercase mb-1">Composição Validada</div>
              <div className="text-[11px] text-[#4D7E05] leading-relaxed">Itens detalhados conferem com o orçamento teto global.</div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
