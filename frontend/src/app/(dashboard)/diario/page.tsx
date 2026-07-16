"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Warning, 
  ArrowRight, 
  ListDashes, 
  MagnifyingGlass, 
  Buildings, 
  Crane, 
  OfficeChair, 
  Sun, 
  Cloud, 
  CloudRain, 
  Sparkle 
} from "@phosphor-icons/react";

export default function DiarioVisaoPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full font-manrope">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-extrabold text-[#001b3c] tracking-tight">Visão Geral</h1>
      </div>

      {/* Top Panels (Bento Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Performance Panel (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-[12px] p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          {/* Accent Glow */}
          <div 
            className="absolute bg-[rgba(159,211,0,0.15)] blur-[32px] right-[-48px] rounded-full w-[192px] h-[192px] top-[-48px] pointer-events-none" 
          />
          
          <div className="relative z-10">
            <span className="text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">
              Desempenho Geral
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[48px] font-extrabold text-[#001b3c] leading-none">85%</span>
              <span className="text-[20px] font-bold text-[#4c6700]">Completos</span>
            </div>
            <p className="mt-4 text-[15px] text-[#434935] max-w-[480px] leading-[24px]">
              Os diários de obra mantêm uma taxa de conformidade alta para este período. 12 obras em dia.
            </p>
          </div>

          <div className="mt-6 relative z-10">
            <button className="px-6 py-3 bg-gradient-to-r from-[#4c6700] to-[#9fd300] text-white rounded-[12px] text-sm font-bold shadow-[0px_10px_15px_-3px_rgba(76,103,0,0.2)] hover:opacity-95 transition-all cursor-pointer">
              Gerar Relatório Consolidado
            </button>
          </div>
        </div>
        
        {/* Alerts Panel (Spans 1 column) */}
        <div className="bg-[#ffdad6] rounded-[12px] p-8 flex flex-col justify-between min-h-[220px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[#93000a]">
          <div>
            <div className="w-[33px] h-[28.5px] mb-4">
              <Warning weight="fill" className="text-[#93000a] text-[28px]" />
            </div>
            <h3 className="text-[30px] font-extrabold tracking-tight leading-none">02 Alertas</h3>
            <p className="mt-2 text-[14px] text-[rgba(147,0,10,0.8)] leading-[20px]">
              Obras com atraso na entrega do diário de hoje.
            </p>
          </div>

          <Link 
            href="#" 
            className="flex items-center gap-2 text-[14px] font-bold text-[#93000a] hover:underline mt-6 group"
          >
            Ver detalhes 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Active Projects Header */}
      <div className="flex justify-between items-end mb-6 px-1">
        <div>
          <h2 className="text-[24px] font-extrabold text-[#001b3c] tracking-tight">Projetos Ativos</h2>
          <p className="text-[14px] text-[#434935] mt-1">Monitoramento em tempo real dos canteiros de obra.</p>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-[8px] bg-[#f0f3ff] text-[#001b3c] flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer">
            <ListDashes size={18} weight="bold" />
          </button>
          <button className="w-9 h-9 rounded-[8px] bg-[#f0f3ff] text-[#001b3c] flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer">
            <MagnifyingGlass size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f0f3ff]/40 border-b border-[#e2e8f0]">
              <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">Projeto</th>
              <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">Gestor</th>
              <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">Última Att</th>
              <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px] text-center">Clima</th>
              <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px] text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]/50">
            {/* Residencial Aurora */}
            <tr 
              className="hover:bg-slate-50 transition-colors cursor-pointer" 
              onClick={() => router.push('/diario/aurora')}
            >
              <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-[#e7eeff] text-[#001b3c] flex items-center justify-center shrink-0">
                    <Buildings weight="fill" size={20} />
                  </div>
                  <div>
                    <div className="text-[16px] font-bold text-[#001b3c]">Residencial Aurora</div>
                    <div className="text-[12px] text-[#434935] mt-0.5">Loteamento Norte, Bloco A</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-[14px] font-medium text-[#001b3c]">Eng. Marcos Silva</td>
              <td className="py-4 px-6 text-[14px] text-[#434935]">Hoje, 10:45</td>
              <td className="py-4 px-6 text-center">
                <div className="flex justify-center">
                  <Sun weight="fill" className="text-[#F59E0B] text-[24px]" />
                </div>
              </td>
              <td className="py-4 px-6 text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[rgba(159,211,0,0.2)] text-[#405700]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4c6700]"></span> ENVIADO
                </span>
              </td>
            </tr>

            {/* Complexo Logístico LogX */}
            <tr 
              className="hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => router.push('/diario/logx')}
            >
              <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-[#e7eeff] text-[#001b3c] flex items-center justify-center shrink-0">
                    <Crane weight="fill" size={20} />
                  </div>
                  <div>
                    <div className="text-[16px] font-bold text-[#001b3c]">Complexo Logístico LogX</div>
                    <div className="text-[12px] text-[#434935] mt-0.5">Distrito Industrial</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-[14px] font-medium text-[#001b3c]">Engª Ana Paula</td>
              <td className="py-4 px-6 text-[14px] text-[#434935]">Ontem, 17:00</td>
              <td className="py-4 px-6 text-center">
                <div className="flex justify-center">
                  <Cloud weight="fill" className="text-[#94a3b8] text-[24px]" />
                </div>
              </td>
              <td className="py-4 px-6 text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[rgba(161,196,255,0.3)] text-[#2a5085]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3a5f94]"></span> PENDENTE
                </span>
              </td>
            </tr>

            {/* Centro Executivo Global */}
            <tr 
              className="hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => router.push('/diario/global')}
            >
              <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[8px] bg-[#e7eeff] text-[#001b3c] flex items-center justify-center shrink-0">
                    <OfficeChair weight="fill" size={20} />
                  </div>
                  <div>
                    <div className="text-[16px] font-bold text-[#001b3c]">Centro Executivo Global</div>
                    <div className="text-[12px] text-[#434935] mt-0.5">Av. Paulista, 1200</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-[14px] font-medium text-[#001b3c]">Eng. Roberto Costa</td>
              <td className="py-4 px-6 text-[14px] text-[#434935]">Atrás de 48h</td>
              <td className="py-4 px-6 text-center">
                <div className="flex justify-center">
                  <CloudRain weight="fill" className="text-[#2a5085] text-[24px]" />
                </div>
              </td>
              <td className="py-4 px-6 text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[rgba(255,218,214,0.4)] text-[#93000a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span> ALERTA
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Stats / Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Update Rate Card */}
        <div className="bg-[#f0f3ff] border border-[#e2e8f0] rounded-[12px] p-6 flex items-center gap-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            {/* SVG circle logic for 85% */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#001b3c]"
                strokeWidth="3.5"
                strokeDasharray="85, 100"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[15px] font-bold text-[#001b3c]">85%</span>
          </div>
          <div>
            <h4 className="text-[16px] font-bold text-[#001b3c] mb-1">Taxa de Atualização</h4>
            <p className="text-[14px] text-[#434935] leading-snug">
              Melhora de 12% em relação à semana anterior.
            </p>
          </div>
        </div>
        
        {/* Predictive Analysis Card */}
        <div className="bg-gradient-to-b from-[#001b3c] to-[#003061] text-white rounded-[12px] p-6 flex items-center justify-between relative overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="z-10">
            <h4 className="text-[16px] font-bold mb-1">Análise Preditiva</h4>
            <p className="text-[14px] text-slate-300 leading-snug max-w-[90%]">
              Possível atraso detectado no Projeto LogX devido ao clima.
            </p>
          </div>
          <div className="text-[#9fd300] shrink-0 p-2 z-10">
            <Sparkle weight="fill" className="text-[28px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
