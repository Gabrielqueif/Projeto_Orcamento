"use client";

import Link from "next/link";
import { Warning, ArrowRight, ListDashes, MagnifyingGlass, Buildings, Crane, OfficeChair, Sun, Cloud, CloudRain, Sparkle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export default function DiarioVisaoPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[20px] font-bold text-text-main">Visão Geral</h1>
      </div>

      {/* Top Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-8">
        {/* Performance Panel */}
        <div className="bg-gradient-to-br from-white to-[#F8FBEA] border border-border rounded-lg p-10 relative overflow-hidden">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-4">DESEMPENHO GERAL</div>
          <div className="text-[48px] font-bold text-text-main mb-4 flex items-baseline gap-2">
            85% <span className="text-[20px] text-[#4D7E05]">Completos</span>
          </div>
          <p className="text-[14px] text-text-muted max-w-[400px] leading-[1.6] mb-8 relative z-10">
            Os diários de obra mantêm uma taxa de conformidade alta para este período. 12 obras em dia.
          </p>
          <button className="px-6 py-3 bg-brand-primary text-bg-dark rounded-lg text-sm font-bold transition-all hover:bg-brand-primaryHover relative z-10">
            Gerar Relatório Consolidado
          </button>
          
          <div className="absolute -right-12 -top-12 w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(174,225,18,0.2) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }}></div>
        </div>
        
        {/* Alerts Panel */}
        <div className="bg-[#FEE2E2] rounded-lg p-10 relative flex flex-col justify-center">
          <Warning weight="fill" className="text-[#DC2626] text-[24px] mb-6" />
          <h3 className="text-[28px] font-bold text-[#991B1B] mb-4">02 Alertas</h3>
          <p className="text-[13px] text-[#7F1D1D] leading-[1.5] mb-6">
            Obras com atraso na entrega do diário de hoje.
          </p>
          <Link href="#" className="text-[12px] font-bold text-[#991B1B] hover:underline flex items-center gap-2 mt-auto">
            Ver detalhes <ArrowRight />
          </Link>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-[20px] font-bold text-text-main mb-1">Projetos Ativos</h3>
          <p className="text-[13px] text-text-muted">Monitoramento em tempo real dos canteiros de obra.</p>
        </div>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full bg-[#F1F5F9] text-text-main flex items-center justify-center hover:bg-[#E2E8F0] transition-colors">
            <ListDashes size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-[#F1F5F9] text-text-main flex items-center justify-center hover:bg-[#E2E8F0] transition-colors">
            <MagnifyingGlass size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Projeto</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Gestor</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Última Att</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Clima</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => router.push('/diario/aurora')}>
              <td className="p-5 px-6 border-b border-border">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-[#E6F6D0] text-[#4D7E05] flex items-center justify-center shrink-0">
                     <Buildings weight="fill" size={20} />
                   </div>
                   <div>
                     <div className="text-[14px] font-bold text-text-main mb-1">Residencial Aurora</div>
                     <div className="text-[11px] text-text-muted">Loteamento Norte, Bloco A</div>
                   </div>
                </div>
              </td>
              <td className="p-5 px-6 border-b border-border font-bold text-[13px] text-text-main">Eng. Marcos Silva</td>
              <td className="p-5 px-6 border-b border-border text-[13px] text-text-muted">Hoje, 10:45</td>
              <td className="p-5 px-6 border-b border-border text-center">
                <Sun weight="fill" className="text-[#F59E0B] text-[24px]" />
              </td>
              <td className="p-5 px-6 border-b border-border">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#E6F6D0] text-[#4D7E05]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4D7E05]"></span> ENVIADO
                </span>
              </td>
            </tr>
            
            <tr className="hover:bg-[#F8FAFC] transition-colors">
              <td className="p-5 px-6 border-b border-border">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-text-muted flex items-center justify-center shrink-0">
                     <Crane weight="fill" size={20} />
                   </div>
                   <div>
                     <div className="text-[14px] font-bold text-text-main mb-1">Complexo Logístico LogX</div>
                     <div className="text-[11px] text-text-muted">Distrito Industrial</div>
                   </div>
                </div>
              </td>
              <td className="p-5 px-6 border-b border-border font-bold text-[13px] text-text-main">Engª Ana Paula</td>
              <td className="p-5 px-6 border-b border-border text-[13px] text-text-muted">Ontem, 17:00</td>
              <td className="p-5 px-6 border-b border-border text-center">
                <Cloud weight="fill" className="text-text-muted text-[24px]" />
              </td>
              <td className="p-5 px-6 border-b border-border">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#E0F2FE] text-[#0369A1]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0369A1]"></span> PENDENTE
                </span>
              </td>
            </tr>
            
            <tr className="hover:bg-[#F8FAFC] transition-colors">
              <td className="p-5 px-6 border-b border-border">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-text-muted flex items-center justify-center shrink-0">
                     <OfficeChair weight="fill" size={20} />
                   </div>
                   <div>
                     <div className="text-[14px] font-bold text-text-main mb-1">Centro Executivo Global</div>
                     <div className="text-[11px] text-text-muted">Av. Paulista, 1200</div>
                   </div>
                </div>
              </td>
              <td className="p-5 px-6 border-b border-border font-bold text-[13px] text-text-main">Eng. Roberto Costa</td>
              <td className="p-5 px-6 border-b border-border text-[13px] text-text-muted">Atrás de 48h</td>
              <td className="p-5 px-6 border-b border-border text-center">
                <CloudRain weight="fill" className="text-[#0284C7] text-[24px]" />
              </td>
              <td className="p-5 px-6 border-b border-border">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FEE2E2] text-[#DC2626]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span> ALERTA
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-[#F8FAFC] border border-border rounded-lg p-8 flex items-center gap-6">
          <div className="w-20 h-20 shrink-0 rounded-full border-8 border-brand-primary border-r-[#CBD5E1] flex items-center justify-center text-base font-bold text-text-main">
            85%
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-text-main mb-2">Taxa de Atualização</h4>
            <p className="text-[12px] text-text-muted leading-relaxed">Melhora de 12% em relação à semana anterior.</p>
          </div>
        </div>
        
        <div className="bg-bg-dark text-white rounded-lg p-8 relative overflow-hidden">
          <Sparkle weight="fill" className="absolute right-8 top-8 text-brand-primary text-[24px]" />
          <h4 className="text-[14px] font-bold mb-2">Análise Preditiva</h4>
          <p className="text-[12px] text-[#94A3B8] leading-relaxed max-w-[85%]">
            Possível atraso detectado no Projeto LogX devido ao clima.
          </p>
        </div>
      </div>

    </div>
  );
}
