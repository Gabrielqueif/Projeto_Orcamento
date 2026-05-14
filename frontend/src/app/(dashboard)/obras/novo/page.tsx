"use client";

import Link from "next/link";
import { FileText, MapPin, CalendarBlank, Info, ArrowRight, MapTrifold, X } from "@phosphor-icons/react";

import { useWizard } from "@/contexts/WizardContext";
import { getSinapiBases, SinapiBase } from "@/lib/api/orcamentos";
import { useState, useEffect } from "react";

export default function NovaObraPage() {
  const { data, updateData } = useWizard();
  const [bases, setBases] = useState<SinapiBase[]>([]);

  useEffect(() => {
    async function loadBases() {
      try {
        const fetchedBases = await getSinapiBases();
        setBases(fetchedBases);
        // Se não tiver base selecionada no contexto, pega a primeira disponível
        if (!data.baseReferencia && fetchedBases.length > 0) {
          updateData({ baseReferencia: fetchedBases[0].mes_referencia });
        }
      } catch (error) {
        console.error("Erro ao carregar bases:", error);
      }
    }
    loadBases();
  }, []);

  return (
    <div className="flex flex-col h-full -mx-6 -mb-6 -mt-6">
      {/* Wizard Progress Header */}
      <div className="flex items-center justify-center h-20 px-10 bg-white border-b border-border">
        <div className="flex items-center w-full max-w-[800px] justify-between">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-text-main">
            <div className="w-8 h-8 rounded bg-brand-primary text-bg-dark border border-brand-primary flex items-center justify-center text-sm">1</div>
            <span>DADOS GERAIS</span>
          </div>
          <div className="flex-1 h-[2px] bg-border mx-6"></div>
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            <div className="w-8 h-8 rounded bg-bg-light text-text-muted border border-border flex items-center justify-center text-sm">2</div>
            <span>EQUIPE & ACESSOS</span>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 p-10 bg-bg-light overflow-y-auto">
        <div>
          <div className="bg-surface border border-border rounded-lg p-8 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-bg-dark mb-6 flex items-center gap-3">
              <FileText size={24} className="text-text-muted" /> Identificação do Projeto
            </h2>
            
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Nome do Projeto</label>
              <input 
                type="text" 
                placeholder="Ex: Edifício Horizonte - Bloco A" 
                value={data.nome}
                onChange={(e) => updateData({ nome: e.target.value })}
                className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2 min-h-[48px] flex items-end">Cliente / Proprietário</label>
                <input 
                  type="text" 
                  placeholder="Nome da empresa ou pessoa" 
                  value={data.cliente}
                  onChange={(e) => updateData({ cliente: e.target.value })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2 min-h-[48px] flex items-end">Estado (UF)</label>
                <select 
                  value={data.estado}
                  onChange={(e) => updateData({ estado: e.target.value })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary"
                >
                  <option value="AC">AC - Acre</option>
                  <option value="AL">AL - Alagoas</option>
                  <option value="AP">AP - Amapá</option>
                  <option value="AM">AM - Amazonas</option>
                  <option value="BA">BA - Bahia</option>
                  <option value="CE">CE - Ceará</option>
                  <option value="DF">DF - Distrito Federal</option>
                  <option value="ES">ES - Espírito Santo</option>
                  <option value="GO">GO - Goiás</option>
                  <option value="MA">MA - Maranhão</option>
                  <option value="MT">MT - Mato Grosso</option>
                  <option value="MS">MS - Mato Grosso do Sul</option>
                  <option value="MG">MG - Minas Gerais</option>
                  <option value="PA">PA - Pará</option>
                  <option value="PB">PB - Paraíba</option>
                  <option value="PR">PR - Paraná</option>
                  <option value="PE">PE - Pernambuco</option>
                  <option value="PI">PI - Piauí</option>
                  <option value="RJ">RJ - Rio de Janeiro</option>
                  <option value="RN">RN - Rio Grande do Norte</option>
                  <option value="RS">RS - Rio Grande do Sul</option>
                  <option value="RO">RO - Rondônia</option>
                  <option value="RR">RR - Roraima</option>
                  <option value="SC">SC - Santa Catarina</option>
                  <option value="SP">SP - São Paulo</option>
                  <option value="SE">SE - Sergipe</option>
                  <option value="TO">TO - Tocantins</option>
                </select>
              </div>
              <div className="flex flex-col col-span-2">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Tipo de Construção</label>
                <div className="flex flex-wrap gap-2">
                  {["Residencial Vertical", "Residencial Horizontal", "Comercial", "Industrial", "Hospitalar", "Escolar"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const current = data.tipo || [];
                        if (current.includes(t)) {
                          updateData({ tipo: current.filter(x => x !== t) });
                        } else {
                          updateData({ tipo: [...current, t] });
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        data.tipo?.includes(t) 
                          ? "bg-brand-primary border-brand-primary text-bg-dark" 
                          : "bg-white border-border text-text-muted hover:border-brand-primary"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input 
                      type="text" 
                      placeholder="Outro..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !data.tipo?.includes(val)) {
                            updateData({ tipo: [...(data.tipo || []), val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="px-4 py-2 rounded-full text-xs border border-border outline-none focus:border-brand-primary w-32"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2 min-h-[48px] flex items-end">BDI (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={data.bdi}
                  onChange={(e) => updateData({ bdi: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" 
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2 min-h-[48px] flex items-end">Status Inicial</label>
                <select 
                  value={data.status}
                  onChange={(e) => updateData({ status: e.target.value })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary"
                >
                  <option value="em_elaboracao">Em Elaboração</option>
                  <option value="orcamento_concluido">Orçamento Concluído</option>
                  <option value="em_execucao">Em Execução</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2 min-h-[48px] flex flex-col justify-end">
                  <span>Base de Referência</span>
                  <span className="text-gray-300 text-[9px] block normal-case font-normal leading-tight mt-1">
                    (dentro do orcamento podera utilizar as demais bases disponiveis com o mesmo mes de Referencia)
                  </span>
                </label>
                <select 
                  value={data.baseReferencia}
                  onChange={(e) => updateData({ baseReferencia: e.target.value })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary"
                >
                  {bases.length === 0 ? (
                    <option value="">Carregando bases...</option>
                  ) : (
                    bases.map((base) => (
                      <option key={base.mes_referencia} value={base.mes_referencia}>
                        {base.mes_referencia} ({base.fonte})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2 min-h-[48px] flex flex-col justify-end">
                  <span>Desoneração (SINAPI)</span>
                  <span className="text-gray-300 text-[9px] block normal-case font-normal leading-tight mt-1">
                    (define se os preços terão os encargos sociais desonerados)
                  </span>
                </label>
                <select 
                  value={data.tipoComposicao}
                  onChange={(e) => updateData({ tipoComposicao: e.target.value })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary"
                >
                  <option value="Sem Desoneração">Sem Desoneração</option>
                  <option value="Com Desoneração">Com Desoneração</option>
                </select>
              </div>
            </div>

            
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Endereço Completo</label>
              <div className="relative">
                <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Rua, número, bairro e cidade" 
                  value={data.endereco}
                  onChange={(e) => updateData({ endereco: e.target.value })}
                  className="w-full py-3 pr-4 pl-12 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" 
                />
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">
            <h2 className="text-lg font-bold text-bg-dark mb-6 flex items-center gap-3">
              <CalendarBlank size={24} className="text-text-muted" /> Cronograma Estimado
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Data de Início</label>
                <input 
                  type="date" 
                  value={data.dataInicio}
                  onChange={(e) => updateData({ dataInicio: e.target.value })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Previsão de Término</label>
                <input 
                  type="date" 
                  value={data.dataTermino}
                  onChange={(e) => updateData({ dataTermino: e.target.value })}
                  className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-bg-dark text-white p-6 rounded-lg mb-6 shadow-sm">
            <Info size={24} weight="fill" className="text-brand-primary mb-4" />
            <h4 className="text-base font-semibold mb-2">Diretrizes Técnicas</h4>
            <p className="text-sm text-[#8C9CAB] leading-relaxed mb-4">
              Estes dados definem o cabeçalho de todos os seus relatórios e diários de obra. Certifique-se de que o endereço esteja correto para geolocalização automática.
            </p>
            <Link href="#" className="text-brand-primary text-xs font-bold uppercase tracking-wide flex items-center gap-1 hover:underline">
              GUIA DE PREENCHIMENTO <ArrowRight weight="bold" />
            </Link>
          </div>
          
          <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="h-[150px] bg-[#e2e8f0]"></div>
            <div className="p-6">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-3">Mapeamento Geográfico</div>
              <div className="border border-dashed border-border rounded-lg p-6 text-center text-text-muted flex flex-col items-center">
                <MapTrifold size={32} className="mb-2" />
                <p className="text-xs">O mapa será carregado após inserir um endereço válido.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-10 py-6 bg-white border-t border-border flex justify-between items-center mt-auto">
        <Link href="/obras" className="text-xs font-bold text-text-muted uppercase tracking-wide flex items-center gap-2 hover:text-text-main">
          <X weight="bold" /> Cancelar e Sair
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wide opacity-50 cursor-not-allowed">VOLTAR</span>
          <Link href="/obras/novo/etapa-2" className="flex items-center gap-2 px-6 py-3 bg-bg-dark text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#050a15]">
            PRÓXIMO PASSO <ArrowRight weight="bold" />
          </Link>
        </div>
      </div>

    </div>
  );
}
