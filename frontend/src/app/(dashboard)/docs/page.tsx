"use client";

import Link from "next/link";
import { FolderPlus, Folder, ArrowRight, FilePdf, FileText, DownloadSimple } from "@phosphor-icons/react";

export default function DocsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Top Header Section */}
      <div className="flex justify-between items-end mb-8">
         <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-1">GESTÃO DOCUMENTAL</p>
            <h1 className="text-[28px] font-bold text-text-main">Repositório de Projetos</h1>
            <p className="text-[14px] text-text-muted mt-2">Acompanhamento de conformidade técnica e legal das obras ativas.</p>
         </div>
         <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#050a15]">
           <FolderPlus size={20} /> Novo Repositório
         </button>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface border border-border border-b-4 border-b-border rounded-lg p-6">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">TOTAL DE ARQUIVOS</div>
          <div className="text-[36px] font-bold text-text-main">2,842</div>
        </div>
        <div className="bg-surface border border-border border-b-4 border-b-border rounded-lg p-6">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">EM CONFORMIDADE</div>
          <div className="text-[36px] font-bold text-text-main">18 <span className="text-[14px] font-normal text-text-muted ml-1">obras</span></div>
        </div>
        <div className="bg-surface border border-border border-b-4 border-b-[#991B1B] rounded-lg p-6">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">PENDÊNCIAS CRÍTICAS</div>
          <div className="text-[36px] font-bold text-[#811111]">04</div>
        </div>
        <div className="bg-surface border border-border border-b-4 border-b-[#B91C1C] rounded-lg p-6">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">VENCIDOS</div>
          <div className="text-[36px] font-bold text-[#811111]">07</div>
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        
        {/* Project Folder 1 */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-6">
             <Folder weight="fill" className="text-[28px] text-bg-dark" />
             <div className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#E6F6D0] text-[#4D7E05]">EM CONFORMIDADE</div>
           </div>
           <h3 className="text-base font-bold text-text-main mb-1">Residencial Aurora Sky</h3>
           <p className="text-xs text-text-muted mb-8">Cliente: Construtora Horizonte Sul</p>
           
           <div className="flex justify-between text-[11px] font-bold mb-2 text-text-muted">
             <span>Documentos Técnicos</span><span className="text-text-main">142/142</span>
           </div>
           <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden mb-8">
              <div className="h-full bg-brand-primary w-full"></div>
           </div>
           
           <div className="flex justify-between items-center border-t border-border pt-4 mt-auto">
             <span className="text-[11px] font-bold text-text-muted">1.2GB Armazenados</span>
             <Link href="/docs/aurora" className="text-[11px] font-bold text-text-main uppercase flex items-center gap-1 hover:underline">
               Acessar Pasta <ArrowRight weight="bold" />
             </Link>
           </div>
        </div>

        {/* Project Folder 2 */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-6">
             <Folder weight="fill" className="text-[28px] text-[#D97706]" />
             <div className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309]">DOCUMENTOS VENCIDOS</div>
           </div>
           <h3 className="text-base font-bold text-text-main mb-1">Complexo Logístico Viracopos</h3>
           <p className="text-xs text-text-muted mb-8">Cliente: LogisTrans S.A.</p>
           
           <div className="flex justify-between text-[11px] font-bold mb-2 text-text-muted">
             <span>Alvarás e Licenças</span><span className="text-[#D97706]">12/15</span>
           </div>
           <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden mb-8">
              <div className="h-full bg-[#D97706] w-[80%]"></div>
           </div>
           
           <div className="flex justify-between items-center border-t border-border pt-4 mt-auto">
             <span className="text-[11px] font-bold text-text-muted">845MB Armazenados</span>
             <Link href="/docs/aurora" className="text-[11px] font-bold text-text-main uppercase flex items-center gap-1 hover:underline">
               Acessar Pasta <ArrowRight weight="bold" />
             </Link>
           </div>
        </div>

        {/* Project Folder 3 */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-6">
             <Folder weight="fill" className="text-[28px] text-status-danger" />
             <div className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#FEE2E2] text-status-danger">PENDÊNCIAS CRÍTICAS</div>
           </div>
           <h3 className="text-base font-bold text-text-main mb-1">Retrofit Edifício Central</h3>
           <p className="text-xs text-text-muted mb-8">Cliente: Investimentos Imob.</p>
           
           <div className="flex justify-between text-[11px] font-bold mb-2 text-text-muted">
             <span>Segurança do Trabalho</span><span className="text-status-danger">08/24</span>
           </div>
           <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden mb-8">
              <div className="h-full bg-status-danger w-[33%]"></div>
           </div>
           
           <div className="flex justify-between items-center border-t border-border pt-4 mt-auto">
             <span className="text-[11px] font-bold text-text-muted">2.1GB Armazenados</span>
             <Link href="/docs/aurora" className="text-[11px] font-bold text-text-main uppercase flex items-center gap-1 hover:underline">
               Acessar Pasta <ArrowRight weight="bold" />
             </Link>
           </div>
        </div>

        {/* Project Folder 4 */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-6">
             <Folder weight="fill" className="text-[28px] text-bg-dark" />
             <div className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#E6F6D0] text-[#4D7E05]">EM CONFORMIDADE</div>
           </div>
           <h3 className="text-base font-bold text-text-main mb-1">Urbanização Parque das Flores</h3>
           <p className="text-xs text-text-muted mb-8">Cliente: Prefeitura Municipal</p>
           
           <div className="flex justify-between text-[11px] font-bold mb-2 text-text-muted">
             <span>Projetos Executivos</span><span className="text-text-main">89/89</span>
           </div>
           <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden mb-8">
              <div className="h-full bg-brand-primary w-full"></div>
           </div>
           
           <div className="flex justify-between items-center border-t border-border pt-4 mt-auto">
             <span className="text-[11px] font-bold text-text-muted">456MB Armazenados</span>
             <Link href="/docs/aurora" className="text-[11px] font-bold text-text-main uppercase flex items-center gap-1 hover:underline">
               Acessar Pasta <ArrowRight weight="bold" />
             </Link>
           </div>
        </div>

        {/* New Folder Action */}
        <div className="bg-[#F8FAFC] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-10 cursor-pointer transition-colors hover:bg-bg-light hover:border-[#CBD5E1]">
           <FolderPlus className="text-[32px] text-[#94A3B8] mb-4" />
           <h4 className="text-sm font-bold text-text-main mb-1">Novo Projeto</h4>
           <p className="text-[10px] font-bold tracking-[0.5px] uppercase text-text-muted">INICIAR REPOSITÓRIO</p>
        </div>

      </div>

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
         
         {/* Recent Documents Table */}
         <div className="bg-white border-t border-border pt-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-text-main">Documentos Recentes</h3>
               <Link href="#" className="text-[11px] font-bold uppercase text-text-main hover:underline">VER TODOS</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 text-[10px] font-bold text-text-muted uppercase border-b border-border">Documento</th>
                    <th className="py-3 text-[10px] font-bold text-text-muted uppercase border-b border-border">Projeto</th>
                    <th className="py-3 text-[10px] font-bold text-text-muted uppercase border-b border-border">Data</th>
                    <th className="py-3 text-right text-[10px] font-bold text-text-muted uppercase border-b border-border">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-bg-light transition-colors">
                    <td className="py-4 border-b border-border">
                      <div className="flex items-center gap-3 text-[13px] font-semibold text-text-main">
                        <FilePdf size={24} className="text-text-main" /> Planta_Baixa_Pav01.pdf
                      </div>
                    </td>
                    <td className="py-4 border-b border-border text-xs text-text-muted">Residencial Aurora Sky</td>
                    <td className="py-4 border-b border-border text-xs text-text-muted">Hoje,<br/>10:45</td>
                    <td className="py-4 border-b border-border text-right">
                      <DownloadSimple size={18} className="cursor-pointer hover:text-brand-primary transition-colors ml-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-bg-light transition-colors">
                    <td className="py-4 border-b border-border">
                      <div className="flex items-center gap-3 text-[13px] font-semibold text-text-main">
                        <FileText size={24} className="text-[#c2410c]" /> Memorial_Descritivo_Rev04.docx
                      </div>
                    </td>
                    <td className="py-4 border-b border-border text-xs text-text-muted">Complexo Logístico</td>
                    <td className="py-4 border-b border-border text-xs text-text-muted">Ontem,<br/>16:20</td>
                    <td className="py-4 border-b border-border text-right">
                      <DownloadSimple size={18} className="cursor-pointer hover:text-brand-primary transition-colors ml-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
         </div>

         {/* Storage Stats Card */}
         <div className="bg-white border border-border rounded-lg p-8 shadow-sm">
            <h3 className="text-base font-bold mb-8 max-w-[150px] leading-[1.4] text-text-main">Estatísticas de Armazenamento</h3>
            
            <div className="w-[140px] h-[140px] rounded-full border-[12px] border-bg-dark border-b-[#E2E8F0] border-r-[#E2E8F0] mx-auto mb-10 relative flex items-center justify-center rotate-45">
               <div className="text-center -rotate-45">
                  <strong className="block text-2xl font-bold text-text-main">74%</strong>
                  <span className="text-[10px] tracking-[0.5px] uppercase text-text-muted font-bold">CAPACIDADE</span>
               </div>
            </div>
            
            <div className="flex justify-between text-xs font-semibold mb-4">
              <span className="text-text-muted flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-bg-dark mr-2"></span> Arquivos de Desenho
              </span>
              <span className="text-text-main">12.4 GB</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-text-muted flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-primary mr-2"></span> Relatórios & Docs
              </span>
              <span className="text-text-main">4.2 GB</span>
            </div>
         </div>

      </div>

    </div>
  );
}
