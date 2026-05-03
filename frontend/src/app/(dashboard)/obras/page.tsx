"use client";

import Link from "next/link";
import { Plus, Calendar, CaretDown, HardHat, CaretRight } from "@phosphor-icons/react";

export default function ObrasPage() {
  const mockObras = [
    { id: 1042, nome: "Horizon Tower", cliente: "Construtora Alpha", progresso: 75, status: "NO PRAZO" },
    { id: 1043, nome: "Riverside Hub", cliente: "Investimentos XYZ", progresso: 42, status: "ALERTA" },
    { id: 1045, nome: "Eco-Mall Plaza", cliente: "Grupo Varejo", progresso: 18, status: "CRÍTICO" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-text-muted uppercase mb-1">WORKSPACE / OPERAÇÕES</p>
          <h1 className="text-[28px] font-bold text-text-main">Gestão de Obras</h1>
        </div>
        <div>
          <Link href="/obras/novo" className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark text-white rounded-lg text-sm font-semibold transition-all hover:bg-bg-darker">
            <Plus weight="bold" /> Nova Obra
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex justify-between items-center p-4 bg-surface border border-border rounded-lg mb-6">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-text-muted uppercase">STATUS:</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-md text-[13px] font-semibold bg-bg-light border border-border text-text-main shadow-sm transition-all">Todos</button>
            <button className="px-4 py-2 rounded-md text-[13px] font-medium text-text-muted border border-transparent hover:bg-bg-light transition-all">No Prazo</button>
            <button className="px-4 py-2 rounded-md text-[13px] font-medium text-text-muted border border-transparent hover:bg-bg-light transition-all">Alerta</button>
            <button className="px-4 py-2 rounded-md text-[13px] font-medium text-text-muted border border-transparent hover:bg-bg-light transition-all">Crítico</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 mr-4">
            <span className="text-[11px] font-bold text-text-muted uppercase">PERÍODO:</span>
            <div className="px-4 py-2 border border-border rounded-md bg-white text-[13px] text-text-main flex items-center gap-2 cursor-pointer">
              <Calendar /> Últimos 30 dias <CaretDown />
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[11px] font-bold text-text-muted uppercase">EQUIPE:</span>
             <div className="flex ml-1">
               <div className="w-7 h-7 rounded-full bg-[#ccc] border-2 border-white -ml-2 z-[4]"></div>
               <div className="w-7 h-7 rounded-full bg-[#aaa] border-2 border-white -ml-2 z-[3]"></div>
               <div className="w-7 h-7 rounded-full bg-[#888] border-2 border-white -ml-2 z-[2]"></div>
               <div className="w-7 h-7 rounded-full bg-bg-light border-2 border-white -ml-2 z-[1] flex items-center justify-center text-[10px] font-bold text-text-muted">+4</div>
             </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden flex-1 flex flex-col">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Nome do Projeto</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Cliente</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Fase</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Progresso</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Status</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border"></th>
            </tr>
          </thead>
          <tbody>
            {mockObras.map((o) => (
              <tr key={o.id} className="hover:bg-bg-light transition-colors group cursor-pointer border-b border-border">
                <td className="p-4 px-6 align-middle">
                  <Link href={`/obras/${o.id}`} className="text-[15px] font-semibold text-text-main no-underline">{o.nome}</Link>
                  <div className="text-[12px] text-text-muted mt-1">#ID-{o.id.toString().padStart(4, '0')}</div>
                </td>
                <td className="p-4 px-6 align-middle text-sm text-text-muted">{o.cliente}</td>
                <td className="p-4 px-6 align-middle">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                    <HardHat weight="fill" /> EM EXECUÇÃO
                  </span>
                </td>
                <td className="p-4 px-6 align-middle">
                  <span className="text-xs font-semibold text-text-main">{o.progresso}%</span>
                  <div className="w-[120px] h-1.5 bg-bg-light rounded mt-1.5 overflow-hidden">
                    <div className="h-full bg-brand-primary rounded" style={{ width: `${o.progresso}%` }}></div>
                  </div>
                </td>
                <td className="p-4 px-6 align-middle">
                  {o.status === "NO PRAZO" && <span className="font-bold text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-[#E6F6D0] text-[#4D7E05]">NO PRAZO</span>}
                  {o.status === "ALERTA" && <span className="font-bold text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-[#FEF3C7] text-[#B45309]">ALERTA</span>}
                  {o.status === "CRÍTICO" && <span className="font-bold text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-[#FEE2E2] text-[#B91C1C]">CRÍTICO</span>}
                </td>
                <td className="p-4 px-6 align-middle text-right text-text-muted">
                  <CaretRight weight="bold" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-4 px-6 flex justify-between items-center text-xs font-semibold text-text-muted mt-auto border-t border-border">
          <span>MOSTRANDO {mockObras.length} OBRAS NA LISTAGEM</span>
          <div className="flex gap-2">
            <span className="w-7 h-7 flex items-center justify-center rounded cursor-pointer bg-bg-dark text-white">1</span>
            <span className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-bg-light">2</span>
            <span className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-bg-light">3</span>
            <span className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-bg-light">...</span>
            <span className="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-bg-light">7</span>
          </div>
        </div>
      </div>
    </div>
  );
}
