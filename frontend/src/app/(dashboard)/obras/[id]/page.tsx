"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, ShareNetwork, Funnel, CheckCircle, Circle, Hourglass, Cube, ShoppingCart, User } from "@phosphor-icons/react";
import { getOrcamento, getEtapas, getItens, type Orcamento, type Etapa, type OrcamentoItem } from "@/lib/api/orcamentos";

export default function ObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orcData, etapasData, itensData] = await Promise.all([
          getOrcamento(id),
          getEtapas(id),
          getItens(id)
        ]);
        setOrcamento(orcData);
        setEtapas(etapasData);
        setItens(itensData);
      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Carregando detalhes da obra...</div>;
  }

  if (!orcamento) {
    return <div className="p-8 text-center text-text-muted">Obra não encontrada.</div>;
  }

  // Cálculos dinâmicos
  // Considera o fuso horário para evitar bugs de voltar um dia ao formatar
  const dataInicioStr = orcamento.data ? `${orcamento.data}T12:00:00` : new Date().toISOString();
  const dataInicio = new Date(dataInicioStr);
  const hoje = new Date();
  const diffTime = hoje.getTime() - dataInicio.getTime();
  const diasDecorridos = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  // Top Insumos (Curva A - Itens mais caros)
  const topItens = [...itens].sort((a, b) => (b.preco_total || 0) - (a.preco_total || 0)).slice(0, 3);

  // Gantt Scale Calculations
  const datasSalvas = etapas
    .flatMap(e => [e.data_inicio ? new Date(e.data_inicio).getTime() : null, e.data_fim ? new Date(e.data_fim).getTime() : null])
    .filter((d): d is number => d !== null);

  const tempoMinimo = datasSalvas.length > 0 ? Math.min(...datasSalvas) : new Date().getTime();
  const tempoMaximo = datasSalvas.length > 0 ? Math.max(...datasSalvas) : new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
  
  const marginMs = 5 * 24 * 60 * 60 * 1000;
  const escalaMinima = tempoMinimo - marginMs;
  const escalaMaxima = tempoMaximo + marginMs;
  const duracaoTotalMs = escalaMaxima - escalaMinima;

  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <Link href="/obras" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-[13px] font-semibold text-text-main shadow-sm mb-6 transition-all hover:bg-bg-light hover:-translate-x-0.5">
            <ArrowLeft size={16} className="text-text-muted" /> Voltar
          </Link>
          <p className="text-[12px] font-semibold tracking-wide text-[#06B6D4] uppercase mb-1">PROJETOS / {orcamento.cliente || "CLIENTE NÃO INFORMADO"}</p>
          <h1 className="text-[28px] font-bold text-text-main">{orcamento.nome}</h1>
          <p className="text-[15px] text-text-muted mt-2">Status atual do projeto: {orcamento.status === "em_elaboracao" ? "Em elaboração" : orcamento.status}</p>
        </div>
        <div className="flex gap-3 h-11">
          <Link href={`/obras/${id}/planilha`} className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-bg-dark rounded-lg text-sm font-bold transition-all hover:bg-[#98C40F] no-underline shadow-sm">
            💰 Planilha Orçamentária
          </Link>
          <Link href={`/obras/${id}/prazo`} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold transition-all hover:bg-bg-light hover:border-[#cbd5e1] no-underline text-text-main">
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
            {diasDecorridos} <span className="text-[11px] font-semibold text-[#475569]">DIAS DESDE O INÍCIO</span>
          </div>
          <div className="mt-4 text-[11px] font-bold text-status-info uppercase">INICIADO EM: {dataInicio.toLocaleDateString('pt-BR')}</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2">Status do Projeto</div>
          <div className="text-[24px] font-bold text-text-main flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-primary"></span> {orcamento.status === "em_elaboracao" ? "Em Elaboração" : orcamento.status}
          </div>
          <div className="mt-4 text-[11px] font-bold text-text-muted uppercase">ESTABILIDADE: 98.4%</div>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="bg-surface border border-border rounded-lg mb-6 overflow-hidden">
        <div className="grid grid-cols-[280px_1fr] border-b border-border bg-white">
          <div className="p-4 px-6 text-[11px] font-bold text-text-muted uppercase tracking-wide border-r border-border flex justify-between items-center">
            Etapas do Projeto <Funnel size={16} />
          </div>
          <div className="relative h-[53px] flex items-center justify-between px-4 text-[10px] font-bold text-text-muted uppercase">
            <div className="absolute inset-0 pointer-events-none w-full" style={{
              backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px)',
              backgroundSize: '10% 100%'
            }}></div>
            <span className="relative z-10 bg-white px-1">{new Date(escalaMinima).toLocaleDateString('pt-BR')}</span>
            <span className="relative z-10 bg-white px-1">{new Date(escalaMaxima).toLocaleDateString('pt-BR')}</span>
            
            {/* Marcador de Hoje */}
            {(() => {
               const hojeMs = new Date().getTime();
               if (hojeMs >= escalaMinima && hojeMs <= escalaMaxima) {
                 const hojeLeft = ((hojeMs - escalaMinima) / duracaoTotalMs) * 100;
                 return (
                   <>
                     <div className="absolute top-[8px] -translate-x-1/2 text-[#DC2626] text-[9px] font-bold z-20 bg-white px-1" style={{ left: `${hojeLeft}%` }}>HOJE</div>
                     <div className="absolute top-0 bottom-[-500px] w-[2px] bg-[#DC2626]/50 z-10" style={{ left: `${hojeLeft}%` }}></div>
                   </>
                 );
               }
               return null;
            })()}
          </div>
        </div>

        {/* Rows */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none w-full h-full left-[280px]" style={{
            backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '10% 100%'
          }}></div>

          {etapas.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm border-b border-border relative z-10 bg-white">Nenhuma etapa cadastrada neste projeto.</div>
          ) : (
            etapas.map((etapa, index) => {
              let left = 0;
              let width = 0;
              let hasDates = false;

              if (etapa.data_inicio && etapa.data_fim) {
                 hasDates = true;
                 const inicioMs = new Date(etapa.data_inicio).getTime();
                 const fimMs = new Date(etapa.data_fim).getTime();
                 left = ((inicioMs - escalaMinima) / duracaoTotalMs) * 100;
                 width = Math.max(((fimMs - inicioMs) / duracaoTotalMs) * 100, 1);
              }

              return (
                <div key={etapa.id} className="grid grid-cols-[280px_1fr] border-b border-border hover:bg-bg-light transition-colors relative z-10">
                  <div className="p-4 px-6 flex justify-between items-center border-r border-border text-sm font-semibold text-text-main bg-white">
                    <span className="flex items-center gap-2">
                      <Circle className="text-border" size={20} /> 
                      <span className="truncate max-w-[180px]" title={etapa.nome}>{etapa.nome}</span>
                    </span>
                    <span className="bg-bg-light text-text-muted px-1.5 py-0.5 rounded text-[11px] font-bold border border-border">0%</span>
                  </div>
                  <div className="relative py-3">
                    {hasDates ? (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 h-8 bg-brand-primary text-bg-dark rounded-md flex items-center px-3 text-[10px] font-bold uppercase tracking-wide truncate shadow-sm border border-[#98C40F]"
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${new Date(etapa.data_inicio!).toLocaleDateString('pt-BR')} até ${new Date(etapa.data_fim!).toLocaleDateString('pt-BR')}`}
                      >
                      </div>
                    ) : (
                      <div className="flex h-full items-center px-4 text-[11px] text-text-muted italic opacity-60">
                        Aguardando Datas
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 px-6 flex justify-between items-center text-[11px] font-bold text-text-muted uppercase tracking-wide bg-white border-t border-border">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-brand-primary rounded-sm"></span> PLANEJADO</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-bg-dark rounded-sm"></span> EM ANDAMENTO</span>
          </div>
          <Link href={`/obras/${id}/prazo`} className="flex items-center gap-1 cursor-pointer hover:text-brand-primary text-text-main transition-colors"><CalendarPlus size={16} /> EDITAR PRAZOS</Link>
        </div>
      </div>

      {/* Bottom Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-text-main mb-6">Detalhamento: Curva A de Custos</h2>
          
          {topItens.length === 0 ? (
            <p className="text-sm text-text-muted mt-4">Nenhum insumo cadastrado com valor nesta obra.</p>
          ) : (
            topItens.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 border border-border rounded-lg mb-3 bg-bg-light hover:bg-white transition-colors">
                <div className="flex-1 pr-4 min-w-0">
                  <h4 className="text-sm font-semibold text-text-main mb-1 truncate block w-full" title={item.descricao}>{item.descricao}</h4>
                  <p className="text-[11px] text-text-muted uppercase tracking-wide flex gap-3">
                    <span>{item.quantidade} {item.unidade}</span>
                    {item.preco_unitario && <span>• Un: R$ {item.preco_unitario.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-brand-primary">R$ {(item.preco_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-[10px] text-text-muted uppercase mt-0.5 tracking-wide">Custo Total</div>
                </div>
              </div>
            ))
          )}
          
          {itens.length > 3 && (
            <div className="text-center mt-4">
              <Link href={`/obras/${id}/planilha`} className="text-sm font-semibold text-brand-primary hover:underline">
                Ver todos os {itens.length} insumos na Planilha Orçamentária
              </Link>
            </div>
          )}
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
