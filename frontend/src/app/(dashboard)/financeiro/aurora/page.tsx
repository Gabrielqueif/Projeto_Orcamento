"use client";

import Link from "next/link";
import { ArrowLeft, CaretRight, CalendarBlank, DownloadSimple, Receipt, CompassTool, Users, Wrench, ClipboardText, ClockCounterClockwise, CaretDown, Warning } from "@phosphor-icons/react";

export default function FinanceiroAuroraPage() {
  return (
    <div className="flex flex-col h-full relative">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <Link href="/financeiro" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-[13px] font-semibold text-text-main shadow-sm mb-6 transition-all hover:bg-bg-light hover:-translate-x-0.5">
            <ArrowLeft size={16} className="text-text-muted" /> Voltar
          </Link>
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-muted uppercase tracking-wide mb-2">
             FINANCEIRO <CaretRight /> <span className="text-text-main">Residencial Aurora</span>
          </div>
          <h1 className="text-[28px] font-bold text-text-main mb-2">Detalhamento de Custos</h1>
          <div className="flex items-center gap-3 text-[13px] text-text-muted">
            <CalendarBlank size={16} /> Última atualização: 24 de Maio, 2024
            <span className="px-2 py-0.5 bg-[#E6F6D0] text-[#4D7E05] font-bold text-[11px] uppercase tracking-wide rounded">EM EXECUÇÃO</span>
          </div>
        </div>
        <div className="flex gap-3 h-11">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold transition-all hover:bg-bg-light text-text-main">
            <DownloadSimple size={20} /> Exportar Relatório
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-status-info text-white border border-transparent rounded-lg text-sm font-semibold transition-all hover:bg-[#0891b2]">
            <Receipt size={20} /> Adicionar Despesa
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-surface border border-border border-b-4 border-b-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-text-main">
              <CompassTool size={16} />
            </div>
            <div className="px-2 py-1 bg-bg-light text-text-muted text-[10px] font-bold uppercase tracking-wide rounded">MATERIAIS</div>
          </div>
          <div className="text-[11px] text-text-muted mb-1">Gasto Realizado</div>
          <div className="text-2xl font-bold text-text-main mb-4">R$ 452.300,00</div>
          <div className="w-full h-1.5 bg-bg-light rounded overflow-hidden mb-2">
            <div className="h-full bg-brand-primary rounded" style={{ width: '72%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
            <span className="text-text-muted">Orc: R$ 620.000</span>
            <span className="text-[#4D7E05]">-R$ 167.700 (28%)</span>
          </div>
        </div>
        
        <div className="bg-surface border border-border border-b-4 border-b-status-danger rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-text-main">
              <Users size={16} />
            </div>
            <div className="px-2 py-1 bg-bg-light text-text-muted text-[10px] font-bold uppercase tracking-wide rounded">MÃO DE OBRA</div>
          </div>
          <div className="text-[11px] text-text-muted mb-1">Gasto Realizado</div>
          <div className="text-2xl font-bold text-text-main mb-4">R$ 215.800,00</div>
          <div className="w-full h-1.5 bg-bg-light rounded overflow-hidden mb-2">
            <div className="h-full bg-status-danger rounded" style={{ width: '94%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
            <span className="text-text-muted">Orc: R$ 230.000</span>
            <span className="text-status-danger">Alerta Crítico: 94%</span>
          </div>
        </div>
        
        <div className="bg-surface border border-border border-b-4 border-b-status-info rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-text-main">
              <Wrench size={16} />
            </div>
            <div className="px-2 py-1 bg-bg-light text-text-muted text-[10px] font-bold uppercase tracking-wide rounded">EQUIPAMENTOS</div>
          </div>
          <div className="text-[11px] text-text-muted mb-1">Gasto Realizado</div>
          <div className="text-2xl font-bold text-text-main mb-4">R$ 88.450,00</div>
          <div className="w-full h-1.5 bg-bg-light rounded overflow-hidden mb-2">
            <div className="h-full bg-status-info rounded" style={{ width: '45%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
            <span className="text-text-muted">Orc: R$ 195.000</span>
            <span className="text-text-muted">OK: 45% do teto</span>
          </div>
        </div>
        
        <div className="bg-surface border border-border border-b-4 border-b-bg-dark rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-text-main">
              <ClipboardText size={16} />
            </div>
            <div className="px-2 py-1 bg-bg-light text-text-muted text-[10px] font-bold uppercase tracking-wide rounded">ADMINISTRATIVO</div>
          </div>
          <div className="text-[11px] text-text-muted mb-1">Gasto Realizado</div>
          <div className="text-2xl font-bold text-text-main mb-4">R$ 42.100,00</div>
          <div className="w-full h-1.5 bg-bg-light rounded overflow-hidden mb-2">
            <div className="h-full bg-bg-dark rounded" style={{ width: '84%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
            <span className="text-text-muted">Orc: R$ 50.000</span>
            <span className="text-[#D97706]">Limite: 84%</span>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-surface border border-border rounded-lg p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
           <div>
             <h3 className="text-lg font-bold text-text-main">Fluxo de Caixa Mensal</h3>
             <p className="text-[13px] text-text-muted">Comparativo de entradas vs. saídas acumuladas</p>
           </div>
           <div className="flex gap-4 text-[10px] font-bold text-text-main uppercase">
             <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-status-info rounded-full"></span> ENTRADAS</span>
             <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-status-danger rounded-full"></span> SAÍDAS</span>
           </div>
        </div>
        
        {/* Placeholder for chart */}
        <div className="h-[200px] border-b border-border mb-2 flex items-end gap-4 pb-2 px-4">
           {/* Bars mock */}
           <div className="flex flex-col justify-end gap-1 w-full max-w-[40px] h-[60%]"><div className="w-full h-full bg-status-info rounded-t-sm"></div></div>
           <div className="flex flex-col justify-end gap-1 w-full max-w-[40px] h-[30%]"><div className="w-full h-full bg-status-danger rounded-t-sm"></div></div>
           
           <div className="w-8"></div>
           
           <div className="flex flex-col justify-end gap-1 w-full max-w-[40px] h-[50%]"><div className="w-full h-full bg-status-info rounded-t-sm"></div></div>
           <div className="flex flex-col justify-end gap-1 w-full max-w-[40px] h-[45%]"><div className="w-full h-full bg-status-danger rounded-t-sm"></div></div>

           <div className="w-8"></div>
           
           <div className="flex flex-col justify-end gap-1 w-full max-w-[40px] h-[80%]"><div className="w-full h-full bg-status-info rounded-t-sm"></div></div>
           <div className="flex flex-col justify-end gap-1 w-full max-w-[40px] h-[90%]"><div className="w-full h-full bg-status-danger rounded-t-sm"></div></div>
        </div>
        <div className="flex justify-between text-[11px] font-bold text-text-muted uppercase px-4">
          <span>JAN</span><span>FEV</span><span className="text-text-main border-b-2 border-brand-primary pb-1">MAR</span><span>ABR</span><span>MAI</span><span>JUN*</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface border border-border rounded-lg pb-4">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ClockCounterClockwise className="text-status-info" size={24} /> Histórico de Transações
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-md text-sm font-semibold transition-all hover:bg-bg-light">
            Filtrar por Categoria <CaretDown size={16} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Data</th>
                <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Descrição do Item</th>
                <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Categoria</th>
                <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Fornecedor</th>
                <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border text-right">Valor Bruto</th>
                <th className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 px-6 border-b border-border font-bold">22 Mai,<br />2024</td>
                <td className="p-4 px-6 border-b border-border font-semibold">Cimento Portland CP-II<br /><span className="font-normal text-xs text-text-muted">(500 sacos)</span></td>
                <td className="p-4 px-6 border-b border-border"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-bg-dark text-white">MATERIAIS</span></td>
                <td className="p-4 px-6 border-b border-border text-text-muted">Votorantim S.A.</td>
                <td className="p-4 px-6 border-b border-border text-right font-bold text-text-main">R$ 18.500,00</td>
                <td className="p-4 px-6 border-b border-border"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-border text-text-muted before:content-[''] before:w-2 before:h-2 before:bg-brand-primary before:rounded-full">PAGO</span></td>
              </tr>
              <tr>
                <td className="p-4 px-6 border-b border-border font-bold">20 Mai,<br />2024</td>
                <td className="p-4 px-6 border-b border-border font-semibold">Folha de Pagamento -<br /><span className="font-normal text-xs text-text-muted">Sem. 20</span></td>
                <td className="p-4 px-6 border-b border-border"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#64748B] text-white">MÃO DE OBRA</span></td>
                <td className="p-4 px-6 border-b border-border text-text-muted">Equipe<br />Estrutura A</td>
                <td className="p-4 px-6 border-b border-border text-right font-bold text-text-main">R$ 12.400,00</td>
                <td className="p-4 px-6 border-b border-border"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-border text-text-muted before:content-[''] before:w-2 before:h-2 before:bg-brand-primary before:rounded-full">PAGO</span></td>
              </tr>
              <tr>
                <td className="p-4 px-6 border-b border-border font-bold">18 Mai,<br />2024</td>
                <td className="p-4 px-6 border-b border-border font-semibold">Locação Mini<br /><span className="font-normal text-xs text-text-muted">Carregadeira (15 dias)</span></td>
                <td className="p-4 px-6 border-b border-border"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-status-info text-white">EQUIPAMENTOS</span></td>
                <td className="p-4 px-6 border-b border-border text-text-muted">RentAll<br />Solutions</td>
                <td className="p-4 px-6 border-b border-border text-right font-bold text-text-main">R$ 4.200,00</td>
                <td className="p-4 px-6 border-b border-border"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-border text-text-muted before:content-[''] before:w-2 before:h-2 before:bg-[#F59E0B] before:rounded-full">PENDENTE</span></td>
              </tr>
              <tr>
                <td className="p-4 px-6 border-b border-border font-bold">15 Mai,<br />2024</td>
                <td className="p-4 px-6 border-b border-border font-semibold text-status-danger">Ferragem Armada (3/8)<br /><span className="font-normal text-xs text-text-muted">- Lote 04</span></td>
                <td className="p-4 px-6 border-b border-border"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-bg-dark text-white">MATERIAIS</span></td>
                <td className="p-4 px-6 border-b border-border text-text-muted">Gerdau<br />Transforma</td>
                <td className="p-4 px-6 border-b border-border text-right font-bold text-text-main">R$ 42.800,00</td>
                <td className="p-4 px-6 border-b border-border"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-border text-text-muted before:content-[''] before:w-2 before:h-2 before:bg-brand-primary before:rounded-full">PAGO</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="p-4 px-6 text-xs text-text-muted">
          Exibindo <strong>1-4</strong> de 142 transações
        </div>
      </div>

      {/* Floating Alert */}
      <div className="fixed bottom-8 right-8 bg-white border border-border rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] w-[380px] p-6 z-50">
        <div className="flex items-center gap-3 mb-3">
          <Warning weight="fill" className="text-status-danger" size={24} />
          <h4 className="text-xs font-bold uppercase tracking-wide">ALERTA DE ORÇAMENTO</h4>
        </div>
        <p className="text-xs text-text-muted leading-relaxed mb-6">
          A categoria <strong className="text-text-main">Mão de Obra</strong> atingiu <span className="text-status-danger font-bold">94%</span> do teto orçado. Recomenda-se revisão imediata dos próximos aditivos contratuais para evitar estouro financeiro.
        </p>
        <div className="flex justify-between items-center">
           <Link href="#" className="text-[11px] font-bold text-text-main uppercase hover:underline">ANALISAR DETALHES</Link>
           <button className="text-[11px] font-bold text-text-muted uppercase hover:text-text-main">DISPENSAR</button>
        </div>
      </div>

    </div>
  );
}
