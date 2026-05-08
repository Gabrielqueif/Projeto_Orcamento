"use client";

import Link from "next/link";
import { Check, MagnifyingGlass, User, Lock, ListChecks, Camera, FileText, Trash, Info, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import { useWizard } from "@/contexts/WizardContext";

export default function NovaObraEtapa2Page() {
  const { data, updateData } = useWizard();
  const [selectedMember, setSelectedMember] = useState<string>("JP");


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
            <div className="w-8 h-8 rounded bg-brand-primary text-bg-dark border border-brand-primary flex items-center justify-center text-sm">2</div>
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 p-10 bg-bg-light overflow-y-auto">
        
        {/* Left Card: Add Members */}
        <div className="bg-surface border border-border rounded-lg p-8 self-start shadow-sm">
          <h2 className="text-lg font-bold text-bg-dark mb-2 uppercase">Adicionar Membros</h2>
          <p className="text-[13px] text-text-muted mb-4">Busque por nome ou cargo na sua rede de profissionais.</p>
          
          <div className="relative mb-6">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Buscar profissional..." className="w-full py-3 pr-4 pl-12 border border-border rounded-md text-sm text-text-main bg-white outline-none transition-colors focus:border-brand-primary" />
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 border border-transparent rounded-lg cursor-pointer hover:bg-bg-light transition-colors" onClick={() => setSelectedMember("RA")}>
              <div className="w-10 h-10 rounded-full bg-bg-dark text-white flex items-center justify-center overflow-hidden"><User weight="fill" size={20} /></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text-main mb-0.5">Ricardo Almeida</div>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Engenheiro Civil • Senior</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border border-transparent rounded-lg cursor-pointer hover:bg-bg-light transition-colors" onClick={() => setSelectedMember("MC")}>
              <div className="w-10 h-10 rounded-full bg-[#06B6D4] text-white flex items-center justify-center overflow-hidden"><User weight="fill" size={20} /></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text-main mb-0.5">Mariana Costa</div>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Arquiteta Urbanista</div>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedMember === "JP" ? "border-brand-primary bg-[#F8FBEA]" : "border-transparent hover:bg-bg-light"}`} onClick={() => setSelectedMember("JP")}>
              <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold text-sm flex items-center justify-center">JP</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text-main mb-0.5">João Pedro Silva</div>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Mestre de Obras</div>
              </div>
              {selectedMember === "JP" && <div className="w-5 h-5 rounded-full bg-brand-primary text-bg-dark flex items-center justify-center"><Check weight="bold" size={12} /></div>}
            </div>
            
            <div className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedMember === "FO" ? "border-brand-primary bg-[#F8FBEA]" : "border-transparent hover:bg-bg-light"}`} onClick={() => setSelectedMember("FO")}>
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] font-bold text-sm flex items-center justify-center">FO</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text-main mb-0.5">Fernanda Oliveira</div>
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Gestora de Projetos</div>
              </div>
              {selectedMember === "FO" && <div className="w-5 h-5 rounded-full bg-brand-primary text-bg-dark flex items-center justify-center"><Check weight="bold" size={12} /></div>}
            </div>
          </div>
        </div>
        
        {/* Right Card: Team Table */}
        <div className="bg-surface border border-border rounded-lg p-8 self-start shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-bg-dark m-0 uppercase">Equipe do Projeto</h2>
            <span className="px-3 py-1 bg-[#E6F6D0] text-[#4D7E05] text-[11px] font-bold uppercase tracking-wide rounded-full">3 MEMBROS SELECIONADOS</span>
          </div>
          <p className="text-[13px] text-text-muted mb-6">Defina funções e permissões para cada membro.</p>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Membro</th>
                <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Função</th>
                <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Permissões</th>
                <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 pl-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-dark text-white font-bold text-xs flex items-center justify-center">VP</div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-main">Você (Gestor)</div>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide">CRIADOR</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 border-b border-border">
                  <span className="px-2.5 py-1 bg-bg-dark text-white text-[10px] font-bold uppercase tracking-wide rounded">GERENTE</span>
                </td>
                <td className="p-4 border-b border-border text-[13px] font-semibold text-text-main">
                  Acesso Total
                </td>
                <td className="p-4 border-b border-border text-center text-border">
                  <Lock weight="fill" size={20} className="mx-auto" />
                </td>
              </tr>
              
              <tr>
                <td className="p-4 pl-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold text-xs flex items-center justify-center">JP</div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-main">João Pedro Silva</div>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Mestre de Obras</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 border-b border-border">
                  <select className="p-2 border border-border rounded text-[13px] text-text-main bg-white outline-none cursor-pointer">
                    <option>Mestre de Obras</option>
                  </select>
                </td>
                <td className="p-4 border-b border-border">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded border border-bg-dark bg-bg-dark text-white flex items-center justify-center"><ListChecks size={16} /></div>
                    <div className="w-7 h-7 rounded border border-border bg-bg-light text-text-main flex items-center justify-center"><Camera size={16} /></div>
                    <div className="w-7 h-7 rounded border border-bg-dark bg-bg-dark text-white flex items-center justify-center"><FileText size={16} /></div>
                  </div>
                </td>
                <td className="p-4 border-b border-border text-center text-text-muted">
                  <Trash size={20} className="mx-auto cursor-pointer hover:text-status-danger transition-colors" />
                </td>
              </tr>
              
              <tr>
                <td className="p-4 pl-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#06B6D4] text-white flex items-center justify-center"><User weight="fill" size={16} /></div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-main">Mariana Costa</div>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Arquitetura</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 border-b border-border">
                  <select className="p-2 border border-border rounded text-[13px] text-text-main bg-white outline-none cursor-pointer">
                    <option>Arquiteto</option>
                  </select>
                </td>
                <td className="p-4 border-b border-border">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded border border-border bg-bg-light text-text-main flex items-center justify-center"><ListChecks size={16} /></div>
                    <div className="w-7 h-7 rounded border border-bg-dark bg-bg-dark text-white flex items-center justify-center"><Camera size={16} /></div>
                    <div className="w-7 h-7 rounded border border-bg-dark bg-bg-dark text-white flex items-center justify-center"><FileText size={16} /></div>
                  </div>
                </td>
                <td className="p-4 border-b border-border text-center text-text-muted">
                  <Trash size={20} className="mx-auto cursor-pointer hover:text-status-danger transition-colors" />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 p-4 bg-[#F8FBEA] border border-[#E6F6D0] rounded-lg flex gap-4">
            <Info size={24} className="text-[#4D7E05] shrink-0" />
            <div>
              <h4 className="text-[12px] font-bold text-[#4D7E05] uppercase tracking-wide mb-1">Resumo de Responsabilidades</h4>
              <p className="text-[12px] text-[#4D7E05] leading-relaxed">Engenheiro e Arquiteto têm permissão para aprovar medições. O Mestre de Obras tem acesso restrito apenas ao Diário de Obra e visualização de plantas.</p>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-10 py-6 bg-white border-t border-border flex justify-between items-center mt-auto">
        <Link href="/obras/novo" className="text-xs font-bold text-text-main uppercase tracking-wide flex items-center gap-2 hover:underline">
          <ArrowLeft weight="bold" /> Anterior: Dados da Obra
        </Link>
        <div className="flex items-center gap-6">
          <button className="text-xs font-bold text-text-main uppercase tracking-wide hover:underline">SALVAR RASCUNHO</button>
          <Link href="/obras/novo/etapa-3" className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-bg-dark rounded-lg text-sm font-bold transition-all hover:bg-brand-primaryHover">
            PRÓXIMO: ORÇAMENTO E METAS <ArrowRight weight="bold" />
          </Link>
        </div>
      </div>

    </div>
  );
}
