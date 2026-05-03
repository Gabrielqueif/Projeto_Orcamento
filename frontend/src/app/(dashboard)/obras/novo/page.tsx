"use client";

import Link from "next/link";
import { FileText, MapPin, CalendarBlank, Info, ArrowRight, MapTrifold, X } from "@phosphor-icons/react";

export default function NovaObraPage() {
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
          <div className="flex-1 h-[2px] bg-border mx-6"></div>
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            <div className="w-8 h-8 rounded bg-bg-light text-text-muted border border-border flex items-center justify-center text-sm">3</div>
            <span>ORÇAMENTO & METAS</span>
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
              <input type="text" placeholder="Ex: Edifício Horizonte - Bloco A" className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Cliente / Proprietário</label>
                <input type="text" placeholder="Nome da empresa ou pessoa" className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Tipo de Construção</label>
                <select className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary">
                  <option>Residencial Vertical</option>
                  <option>Residencial Horizontal</option>
                  <option>Comercial</option>
                  <option>Industrial</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Endereço Completo</label>
              <div className="relative">
                <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" placeholder="Rua, número, bairro e cidade" className="w-full py-3 pr-4 pl-12 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" />
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
                <input type="date" className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">Previsão de Término</label>
                <input type="date" className="w-full p-3 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" />
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
