"use client";

import Link from "next/link";
import { ArrowLeft, CalendarPlus, ShareNetwork, Funnel, CheckCircle, Circle, Hourglass, Cube, ShoppingCart, User } from "@phosphor-icons/react";

export default function ObraDetalhePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <Link href="/obras" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-[13px] font-semibold text-text-main shadow-sm mb-6 transition-all hover:bg-bg-light hover:-translate-x-0.5">
            <ArrowLeft size={16} className="text-text-muted" /> Voltar
          </Link>
          <p className="text-[12px] font-semibold tracking-wide text-[#06B6D4] uppercase mb-1">PROJETOS / EDIFÍCIO HORIZON</p>
          <h1 className="text-[28px] font-bold text-text-main">Cronograma de Obra</h1>
          <p className="text-[15px] text-text-muted mt-2">Controle de cronograma e alocação de recursos para o complexo residencial de alto padrão. Fase: Estrutural.</p>
        </div>
        <div className="flex gap-3 h-11">
          <Link href="/obras/1/prazo" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold transition-all hover:bg-bg-light hover:border-[#cbd5e1] no-underline text-text-main">
            <CalendarPlus size={20} /> Editar Prazos
          </Link>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#050a15]">
            <ShareNetwork size={20} /> Exportar Cronograma
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Progresso Total</div>
          <div className="text-[32px] font-bold text-text-main flex items-baseline gap-2">
            <span className="text-brand-primary">64%</span>
            <span className="text-[11px] font-semibold text-[#4D7E05]">+4% esta semana</span>
          </div>
          <div className="w-full h-2 bg-bg-light rounded mt-4">
            <div className="w-[64%] h-full bg-brand-primary rounded"></div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Tarefas Críticas</div>
          <div className="text-[32px] font-bold text-text-main flex items-baseline gap-2">
            02 <span className="text-[11px] font-semibold text-[#475569]">EM APROVAÇÃO</span>
          </div>
          <div className="flex mt-4">
            <div className="w-6 h-6 rounded-full bg-bg-dark text-white flex items-center justify-center text-xs">
              <User weight="fill" />
            </div>
            <div className="w-6 h-6 rounded-full bg-bg-dark text-white flex items-center justify-center text-xs border-2 border-white -ml-2">
              <User weight="fill" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Dias Decorridos</div>
          <div className="text-[32px] font-bold text-text-main flex items-baseline gap-2">
            142 <span className="text-[11px] font-semibold text-[#475569]">DE 360 DIAS</span>
          </div>
          <div className="mt-4 text-[11px] font-bold text-status-info uppercase">META: 12 DEZ, 2024</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Status do Projeto</div>
          <div className="text-[24px] font-bold text-text-main flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-primary"></span> No Prazo
          </div>
          <div className="mt-4 text-[11px] font-bold text-text-muted uppercase">ESTABILIDADE: 98.4%</div>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="bg-surface border border-border rounded-lg mb-6 overflow-hidden">
        <div className="grid grid-cols-[280px_1fr] border-b border-border">
          <div className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-r border-border flex justify-between items-center">
            Etapas do Projeto <Funnel size={16} />
          </div>
          <div className="grid grid-cols-8 py-4 text-[10px] font-bold text-text-muted uppercase text-center relative">
            <div>AGO S1</div>
            <div>AGO S2</div>
            <div>AGO S3</div>
            <div>AGO S4</div>
            <div>SET S1</div>
            <div>SET S2</div>
            <div>SET S3</div>
            <div>SET S4</div>
            <div className="absolute top-[-18px] left-[25%] -translate-x-1/2 text-[#DC2626] text-[9px] font-bold">HOJE</div>
            <div className="absolute top-0 bottom-[-300px] left-[25%] w-px bg-[#DC2626] z-10"></div>
          </div>
        </div>

        {/* Rows */}
        <div className="grid grid-cols-[280px_1fr] border-b border-border">
          <div className="p-4 px-6 flex justify-between items-center border-r border-border text-sm font-semibold text-text-main">
            <span className="flex items-center gap-2"><CheckCircle weight="fill" className="text-brand-primary" size={20} /> Fundação</span>
            <span className="bg-[#E6F6D0] text-[#4D7E05] px-1.5 py-0.5 rounded text-[11px] font-bold">100%</span>
          </div>
          <div className="relative py-3">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[40%] bg-brand-primary text-bg-dark rounded-md flex items-center px-3 text-[10px] font-bold uppercase tracking-wide">FINALIZADO</div>
          </div>
        </div>

        <div className="grid grid-cols-[280px_1fr] border-b border-border">
          <div className="p-4 px-6 flex justify-between items-center border-r border-border text-sm font-semibold text-text-main">
            <span className="flex items-center gap-2"><Circle className="text-border" size={20} /> Estrutura</span>
            <span className="bg-bg-light text-text-muted px-1.5 py-0.5 rounded text-[11px] font-bold">85%</span>
          </div>
          <div className="relative py-3">
            <div className="absolute left-[20%] top-1/2 -translate-y-1/2 h-8 w-[50%] bg-bg-dark text-white rounded-md flex items-center px-3 text-[10px] font-bold uppercase tracking-wide after:content-[''] after:absolute after:-right-[30px] after:top-0 after:h-full after:w-[30px] after:bg-[#E2E8F0] after:rounded-r-md">MONTAGEM DE LAJES (PISO 12)</div>
          </div>
        </div>

        <div className="grid grid-cols-[280px_1fr] border-b border-border">
          <div className="p-4 px-6 flex justify-between items-center border-r border-border text-sm font-semibold text-text-main">
            <span className="flex items-center gap-2"><Circle className="text-border" size={20} /> Alvenaria</span>
            <span className="bg-bg-light text-text-muted px-1.5 py-0.5 rounded text-[11px] font-bold">20%</span>
          </div>
          <div className="relative py-3">
            <div className="absolute left-[55%] top-1/2 -translate-y-1/2 h-8 w-[35%] bg-[#64748B] text-white rounded-md flex items-center px-3 text-[10px] font-bold uppercase tracking-wide after:content-[''] after:absolute after:-right-[50px] after:top-0 after:h-full after:w-[50px] after:bg-[#E2E8F0] after:rounded-r-md">INICIADO EM 15/08</div>
          </div>
        </div>

        <div className="p-3 px-6 flex justify-between text-[11px] font-bold text-text-muted uppercase tracking-wide">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-brand-primary rounded-sm"></span> CONCLUÍDO</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-bg-dark rounded-sm"></span> EM ANDAMENTO</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 border border-dashed border-border rounded-sm"></span> PLANEJADO</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-text-main"><CheckCircle weight="fill" size={16} /> MARCAR COMO CONCLUÍDO</div>
        </div>
      </div>

      {/* Bottom Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-text-main mb-6">Detalhamento: Estrutura</h2>
          
          <div className="flex justify-between items-center p-4 border border-border rounded-lg mb-3 bg-bg-light">
            <div>
              <h4 className="text-sm font-semibold text-text-main mb-1">Armação de Ferragens</h4>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">RESPONSÁVEL: ENG. MARCOS SILVA</p>
            </div>
            <CheckCircle weight="fill" className="text-brand-primary" size={24} />
          </div>
          
          <div className="flex justify-between items-center p-4 border border-border rounded-lg mb-3 bg-bg-light">
            <div>
              <h4 className="text-sm font-semibold text-text-main mb-1">Concretagem 11° Pavimento</h4>
              <p className="text-[11px] text-text-muted uppercase tracking-wide">DATA: 10/08/2024</p>
            </div>
            <CheckCircle weight="fill" className="text-brand-primary" size={24} />
          </div>
          
          <div className="flex justify-between items-center p-4 border border-border rounded-lg mb-3">
            <div>
              <h4 className="text-sm font-semibold text-text-main mb-1">Cura e Desforma</h4>
              <p className="text-[11px] text-status-info uppercase tracking-wide">AGUARDANDO PERÍODO TÉCNICO</p>
            </div>
            <Hourglass weight="fill" className="text-status-info" size={24} />
          </div>
        </div>
        
        <div className="bg-bg-dark text-white rounded-lg p-6 flex flex-col">
          <div className="flex items-center gap-2 text-lg font-semibold mb-8">
            <Cube size={24} /> Recursos
          </div>
          
          <div className="mb-6">
            <div className="text-[10px] font-bold text-[#8C9CAB] uppercase tracking-[1px] mb-2">Mão de Obra</div>
            <div className="text-[32px] font-bold mb-1">34</div>
            <div className="text-xs text-[#8C9CAB]">COLABORADORES ATIVOS</div>
          </div>
          
          <div className="mb-6">
            <div className="text-[10px] font-bold text-[#8C9CAB] uppercase tracking-[1px] mb-2">Materiais (Concretagem)</div>
            <div className="text-[32px] font-bold text-brand-primary mb-1">120</div>
            <div className="text-xs text-[#8C9CAB]">M³ DE CONCRETO</div>
          </div>
          
          <div className="mt-auto pt-4">
            <Link href="/suprimentos/solicitar" className="w-full flex items-center justify-center gap-2 py-4 bg-brand-primary text-bg-dark rounded-lg font-bold transition-colors hover:bg-[#98C40F]">
              <ShoppingCart size={20} /> Solicitar Suprimentos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
