"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, CaretDown, HardHat, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { getOrcamentos, type Orcamento } from "@/lib/api/orcamentos";

export default function ObrasPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const carregarOrcamentos = async (nome?: string) => {
    try {
      setLoading(true);
      const data = await getOrcamentos(undefined, undefined, nome);
      setOrcamentos(data);
    } catch (err) {
      console.error("Erro ao carregar obras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarOrcamentos(searchTerm);
    }, 2000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
      <div className="flex justify-between items-center p-4 bg-surface border border-border rounded-lg mb-6 flex-wrap gap-4">
        {/* Pesquisa */}
        <div className="flex items-center gap-4 min-w-[300px]">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass className="text-text-muted" size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar obra pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-white text-[13px] text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-text-muted uppercase hidden lg:inline">STATUS:</span>
          <div className="flex gap-2 overflow-x-auto">
            <button className="px-4 py-2 rounded-md text-[13px] font-semibold bg-bg-light border border-border text-text-main shadow-sm transition-all whitespace-nowrap">Todos</button>
            <button className="px-4 py-2 rounded-md text-[13px] font-medium text-text-muted border border-transparent hover:bg-bg-light transition-all whitespace-nowrap">No Prazo</button>
            <button className="px-4 py-2 rounded-md text-[13px] font-medium text-text-muted border border-transparent hover:bg-bg-light transition-all whitespace-nowrap">Alerta</button>
            <button className="px-4 py-2 rounded-md text-[13px] font-medium text-text-muted border border-transparent hover:bg-bg-light transition-all whitespace-nowrap">Crítico</button>
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
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">Carregando obras...</td>
              </tr>
            ) : orcamentos.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">Nenhuma obra encontrada.</td>
              </tr>
            ) : (
              orcamentos.map((o) => (
                <tr key={o.id} className="hover:bg-bg-light transition-colors group cursor-pointer border-b border-border">
                  <td className="p-4 px-6 align-middle">
                    <Link href={`/obras/${o.id}`} className="text-[15px] font-semibold text-text-main no-underline">{o.nome}</Link>
                    <div className="text-[12px] text-text-muted mt-1">#ID-{o.id.substring(0, 8)}</div>
                  </td>
                  <td className="p-4 px-6 align-middle text-sm text-text-muted">{o.cliente}</td>
                  <td className="p-4 px-6 align-middle">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                      <HardHat weight="fill" /> EM EXECUÇÃO
                    </span>
                  </td>
                  <td className="p-4 px-6 align-middle">
                    <span className="text-xs font-semibold text-text-main">0%</span>
                    <div className="w-[120px] h-1.5 bg-bg-light rounded mt-1.5 overflow-hidden">
                      <div className="h-full bg-brand-primary rounded" style={{ width: `0%` }}></div>
                    </div>
                  </td>
                  <td className="p-4 px-6 align-middle">
                    {/* Status baseado no banco de dados */}
                    <span className="font-bold text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-[#E6F6D0] text-[#4D7E05]">
                      {o.status === "em_elaboracao" ? "EM ELABORAÇÃO" : o.status}
                    </span>
                  </td>
                  <td className="p-4 px-6 align-middle text-right text-text-muted">
                    <Link href={`/obras/${o.id}`}>
                      <CaretRight weight="bold" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-4 px-6 flex justify-between items-center text-xs font-semibold text-text-muted mt-auto border-t border-border">
          <span>MOSTRANDO {orcamentos.length} OBRAS NA LISTAGEM</span>
          <div className="flex gap-2">
            <span className="w-7 h-7 flex items-center justify-center rounded cursor-pointer bg-bg-dark text-white">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
