"use client";

import Link from "next/link";
import { DownloadSimple, TrendUp, Money, Funnel, List, SquaresFour, Trash, Users, Info, FilePdf, FileText } from "@phosphor-icons/react";

export default function EquipePage() {
  const membros = [
    { id: 1, nome: "André Torres", cpf: "123.456.789-00", cargo: "Mestre de Obras", projeto: "Residencial Skyline", remuneracao: "R$ 4.500,00" },
    { id: 2, nome: "Marina Lins", cpf: "098.765.432-11", cargo: "Engenheira Civil", projeto: "Centro Comercial Norte", remuneracao: "R$ 8.200,00" },
    { id: 3, nome: "Carlos Mendes", cpf: "345.678.901-22", cargo: "Gerente de Projetos", projeto: "Condomínio Ocean Blue", remuneracao: "R$ 12.000,00" },
    { id: 4, nome: "Roberto Silva", cpf: "567.890.123-33", cargo: "Pedreiro", projeto: "Expansão Porto Velho", remuneracao: "R$ 2.800,00" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.5px] text-[#06B6D4] uppercase mb-1">GESTÃO / RECURSOS HUMANOS</p>
          <h1 className="text-[28px] font-bold text-text-main">Gestão de Equipe</h1>
          <p className="text-[14px] text-text-muted mt-2">Controle de profissionais, alocações e custos operacionais dos canteiros ativos.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#050a15]">
          <DownloadSimple size={20} /> Exportar Relatório
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface border border-border rounded-lg p-6 relative overflow-hidden">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Custo Mensal Total</div>
          <div className="text-[32px] font-bold text-text-main mb-2">R$ 142.850,00</div>
          <div className="text-[11px] font-bold text-status-danger flex items-center gap-1">
            <TrendUp weight="bold" /> +4.2% este mês
          </div>
          <Money weight="fill" className="absolute -right-2.5 -bottom-2.5 text-[80px] text-bg-light z-0 pointer-events-none" />
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-6 relative overflow-hidden">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Efetivo Ativo</div>
          <div className="text-[32px] font-bold text-text-main mb-2">48</div>
          <div className="flex ml-2">
            <div className="w-6 h-6 rounded-full bg-[#94A3B8] border-2 border-white -ml-2"></div>
            <div className="w-6 h-6 rounded-full bg-[#64748B] border-2 border-white -ml-2"></div>
            <div className="w-6 h-6 rounded-full bg-[#475569] border-2 border-white -ml-2"></div>
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-6 relative overflow-hidden">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Projetos Ativos</div>
          <div className="text-[32px] font-bold text-[#06B6D4] mb-2">12 <span className="text-[11px] font-bold text-text-muted uppercase tracking-wide">CANTEIROS</span></div>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-6 relative overflow-hidden">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Média Salarial</div>
          <div className="text-[32px] font-bold text-text-main mb-2">R$ 2.976</div>
          <div className="text-[11px] font-bold text-[#4D7E05] uppercase tracking-wide">DENTRO DO ORÇAMENTO</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[11px] font-bold text-text-muted uppercase tracking-wide">
            <Funnel size={16} /> FILTRAR POR:
          </span>
          <select className="px-4 py-2.5 border border-border rounded-md bg-white text-[13px] text-text-main outline-none cursor-pointer">
            <option>Todas as Obras</option>
          </select>
          <select className="px-4 py-2.5 border border-border rounded-md bg-white text-[13px] text-text-main outline-none cursor-pointer">
            <option>Todos os Cargos</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button className="w-9 h-9 border border-text-muted bg-bg-light text-text-main rounded-md flex items-center justify-center cursor-pointer">
            <List size={18} />
          </button>
          <button className="w-9 h-9 border border-border bg-white text-text-muted rounded-md flex items-center justify-center cursor-pointer hover:bg-bg-light">
            <SquaresFour size={18} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface border border-border rounded-t-lg overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Membro</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Cargo</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Projeto Alocado</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Remuneração</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border">Status</th>
              <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase border-b border-border text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {membros.map(m => (
              <tr key={m.id} className="hover:bg-bg-light transition-colors">
                <td className="p-4 px-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.nome)}&background=081225&color=AEE112`} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <div className="text-[15px] font-bold text-text-main mb-1">{m.nome}</div>
                      <div className="text-[12px] text-text-muted">CPF: {m.cpf}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 px-6 border-b border-border text-[11px] font-bold uppercase">{m.cargo}</td>
                <td className="p-4 px-6 border-b border-border">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                    {m.projeto}
                  </span>
                </td>
                <td className="p-4 px-6 border-b border-border font-bold">{m.remuneracao}</td>
                <td className="p-4 px-6 border-b border-border">
                  <span className="px-3 py-1 bg-[#F8FBEA] text-[#4D7E05] border border-[#E6F6D0] rounded-full text-[10px] font-bold uppercase tracking-wide">
                    ATIVO
                  </span>
                </td>
                <td className="p-4 px-6 border-b border-border text-right">
                  <button className="text-status-danger hover:text-red-700 transition-colors">
                    <Trash weight="bold" size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Bar */}
      <div className="p-4 px-6 bg-surface border border-t-0 border-border rounded-b-lg flex justify-between items-center text-[11px] font-bold text-text-muted uppercase mb-8">
        <span>EXIBINDO {membros.length} MEMBROS REGISTRADOS</span>
        <div className="flex gap-2">
           <span className="inline-flex w-7 h-7 items-center justify-center cursor-pointer hover:text-text-main">&lt;</span>
           <span className="inline-flex w-7 h-7 items-center justify-center bg-bg-dark text-white rounded cursor-pointer">1</span>
           <span className="inline-flex w-7 h-7 items-center justify-center cursor-pointer hover:text-text-main">2</span>
           <span className="inline-flex w-7 h-7 items-center justify-center cursor-pointer hover:text-text-main">3</span>
           <span className="inline-flex w-7 h-7 items-center justify-center">...</span>
           <span className="inline-flex w-7 h-7 items-center justify-center cursor-pointer hover:text-text-main">&gt;</span>
        </div>
      </div>

      {/* Bottom Insight Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-dark text-white rounded-lg p-8 relative overflow-hidden">
          <Users weight="fill" className="absolute -right-5 -bottom-5 text-[120px] text-white/5 z-0" />
          <h3 className="text-base font-bold mb-4 flex items-center gap-3 z-10 relative">
            <Info weight="fill" className="text-brand-primary" size={24} /> Insight de Alocação
          </h3>
          <p className="text-[14px] text-[#CBD5E1] leading-relaxed z-10 relative">
            A alocação atual na <strong className="text-brand-primary">Ponte Central</strong> está 15% acima da média operacional. Considere redistribuir membros auxiliares para otimizar custos no próximo ciclo.
          </p>
        </div>
        
        <div className="bg-surface border border-border rounded-lg p-8 flex justify-between items-center">
          <div>
            <h3 className="text-[20px] font-bold mb-3 text-text-main">Relatório de Folha Mensal</h3>
            <p className="text-[14px] text-text-muted mb-6">O demonstrativo detalhado de horas, encargos e benefícios por centro de custo está disponível para auditoria.</p>
            <button className="flex items-center gap-2 bg-transparent border border-border text-[11px] font-bold uppercase tracking-[0.5px] px-4 py-2 rounded hover:bg-bg-light transition-colors text-text-main">
              <FilePdf size={16} /> GERAR PDF COMPLETO
            </button>
          </div>
          <div className="w-[120px] h-[120px] shrink-0 bg-bg-light rounded-full flex items-center justify-center text-text-muted ml-6">
             <FileText weight="fill" size={48} />
          </div>
        </div>
      </div>

    </div>
  );
}
