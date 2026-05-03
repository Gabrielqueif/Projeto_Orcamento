"use client";

import Link from "next/link";
import { Wallet, Bank, ChartBar, PiggyBank, ArrowRight, Warning, ArrowUpRight, MapPin, Plus, Calendar, Funnel } from "@phosphor-icons/react";

export default function FinanceiroVisaoPage() {
  const projetos = [
    { nome: "Residencial Skyline", gestor: "André Torres", previsto: "R$ 8.5M", realizado: "R$ 3.2M", percent: 38, color: "bg-brand-primary", status: "NO PRAZO", badgeClass: "bg-[#E6F6D0] text-[#4D7E05]" },
    { nome: "Centro Comercial Norte", gestor: "Marina Lins", previsto: "R$ 12.4M", realizado: "R$ 7.8M", percent: 63, color: "bg-[#F59E0B]", status: "ALERTA", badgeClass: "bg-[#FEF3C7] text-[#B45309]" },
    { nome: "Condomínio Ocean Blue", gestor: "Carlos Mendes", previsto: "R$ 4.5M", realizado: "R$ 4.1M", percent: 91, color: "bg-[#DC2626]", status: "CRÍTICO", badgeClass: "bg-[#FEE2E2] text-[#B91C1C]" },
    { nome: "Expansão Porto Velho", gestor: "André Torres", previsto: "R$ 2.1M", realizado: "R$ 0.1M", percent: 7, color: "bg-brand-primary", status: "NO PRAZO", badgeClass: "bg-[#E6F6D0] text-[#4D7E05]" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-text-muted uppercase mb-1">PORTFÓLIO &gt; FINANCEIRO</p>
          <h1 className="text-[28px] font-bold text-text-main">Visão Geral Financeira</h1>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold transition-all hover:bg-bg-light hover:border-[#cbd5e1] text-text-main">
            <Calendar size={20} /> Outubro 2023 - Setembro 2024
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold transition-all hover:bg-bg-light hover:border-[#cbd5e1] text-text-main">
            <Funnel size={20} /> Filtros
          </button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-lg bg-bg-dark text-brand-primary flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div className="text-[11px] font-bold text-[#4D7E05] uppercase tracking-wide">+12% VS ANO ANT.</div>
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">Orçamento Global Total</div>
          <div className="text-[28px] font-bold text-text-main">R$ 25.420.000</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-lg bg-bg-dark text-brand-primary flex items-center justify-center">
              <Bank size={24} />
            </div>
            <div className="bg-bg-light text-text-muted px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide">REALIZADO</div>
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">Gasto Acumulado Total</div>
          <div className="text-[28px] font-bold text-text-main">R$ 12.108.450</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-lg bg-bg-dark text-brand-primary flex items-center justify-center">
              <ChartBar size={24} />
            </div>
            <div className="w-[50px] h-1.5 bg-bg-light rounded flex items-center mt-3">
              <div className="h-full bg-brand-primary rounded" style={{ width: '47.6%' }}></div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">% Do Orçamento Utilizado</div>
          <div className="text-[28px] font-bold text-text-main">47.6%</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-lg bg-bg-dark text-brand-primary flex items-center justify-center">
              <PiggyBank size={24} />
            </div>
            <div className="bg-bg-light text-text-muted px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide">DISPONÍVEL</div>
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5px] mb-2">Saldo Restante</div>
          <div className="text-[28px] font-bold text-text-main">R$ 13.311.550</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Table Section */}
        <div className="bg-surface border border-border rounded-lg p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-lg font-bold text-text-main">Projetos Ativos</h3>
               <p className="text-[13px] text-text-muted mt-1">Desempenho financeiro detalhado por unidade</p>
             </div>
             <Link href="/obras" className="text-xs font-bold text-text-main uppercase flex items-center gap-1 hover:underline">
               VER TODOS <ArrowRight size={16} />
             </Link>
          </div>

          <div className="overflow-x-auto mb-8 flex-1">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Nome da Obra</th>
                  <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Previsto</th>
                  <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Realizado</th>
                  <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Utilização</th>
                  <th className="p-3 text-[11px] font-bold text-text-muted uppercase border-b border-border">Status</th>
                </tr>
              </thead>
              <tbody>
                {projetos.map((p, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-3 border-b border-border">
                      <Link href={p.nome.includes("Ocean Blue") ? "/financeiro/aurora" : "#"} className="text-sm font-bold text-text-main hover:underline">
                        {p.nome}
                      </Link>
                      <div className="text-[11px] text-text-muted mt-1">Gestor: {p.gestor}</div>
                    </td>
                    <td className="p-4 border-b border-border font-semibold text-text-main">{p.previsto}</td>
                    <td className="p-4 border-b border-border font-semibold text-text-main">{p.realizado}</td>
                    <td className="p-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-bg-light rounded overflow-hidden">
                          <div className={`h-full ${p.color} rounded`} style={{ width: `${p.percent}%` }}></div>
                        </div>
                        <span className="font-bold text-[12px] text-text-main">{p.percent}%</span>
                      </div>
                    </td>
                    <td className="p-4 border-b border-border">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide ${p.badgeClass}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-right text-[11px] font-bold text-text-muted uppercase mt-auto">
            ÚLTIMA ATUALIZAÇÃO: HOJE, 08:42 AM
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="bg-surface border border-border rounded-lg p-8 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wide mb-6 text-text-main">Execução Trimestral</h4>
            
            <div className="mb-6">
              <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                <span className="text-text-muted">TRIMESTRE 1</span>
                <span className="text-text-main">R$ 3.2M / R$ 2.9M</span>
              </div>
              <div className="h-4 flex bg-bg-light rounded overflow-hidden">
                <div className="h-full bg-[#334155]" style={{ width: '50%' }}></div>
                <div className="h-full bg-brand-primary rounded-r" style={{ width: '40%' }}></div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                <span className="text-text-muted">TRIMESTRE 2</span>
                <span className="text-text-main">R$ 4.5M / R$ 4.8M</span>
              </div>
              <div className="h-4 flex bg-bg-light rounded overflow-hidden">
                <div className="h-full bg-[#334155]" style={{ width: '45%' }}></div>
                <div className="h-full bg-[#F59E0B] rounded-r" style={{ width: '55%' }}></div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                <span className="text-text-muted">TRIMESTRE 3</span>
                <span className="text-text-main">R$ 5.1M / R$ 4.4M</span>
              </div>
              <div className="h-4 flex bg-bg-light rounded overflow-hidden">
                <div className="h-full bg-[#334155]" style={{ width: '50%' }}></div>
                <div className="h-full bg-brand-primary rounded-r" style={{ width: '40%' }}></div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 text-[10px] font-bold text-text-muted uppercase mt-8">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#334155] rounded-full"></span> PLANEJADO</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-brand-primary rounded-full"></span> REALIZADO</span>
            </div>
          </div>

          <div className="bg-bg-dark rounded-lg p-8 text-white relative overflow-hidden mb-6">
            <Warning weight="fill" className="absolute -right-5 -bottom-5 text-[150px] opacity-5 pointer-events-none" />
            <h4 className="text-xs font-bold text-brand-primary uppercase mb-4 tracking-wide relative z-10">ALERTA CRÍTICO</h4>
            <p className="text-[13px] text-[#CBD5E1] leading-relaxed mb-6 relative z-10">
              O projeto <strong className="text-white">Centro Comercial Norte</strong> excedeu o planejado para o trimestre em 8%. Recomenda-se revisão imediata da cadeia de suprimentos.
            </p>
            <button className="flex items-center gap-2 bg-transparent border border-white/20 text-white text-xs font-bold uppercase rounded py-2 px-4 hover:bg-white/10 transition-colors relative z-10">
              ANALISAR DETALHES <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="h-[180px] bg-[#e2e8f0] rounded-lg border border-border relative overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:20px_20px]">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-dark text-white text-[11px] font-bold px-4 py-2 rounded-full flex items-center gap-2">
               <MapPin weight="fill" className="text-brand-primary" size={16} /> 4 OBRAS ATIVAS
             </div>
             <button className="absolute bottom-4 right-4 w-12 h-12 bg-brand-primary text-bg-dark rounded-full flex items-center justify-center shadow-lg hover:bg-brand-primaryHover transition-colors">
               <Plus size={24} weight="bold" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
