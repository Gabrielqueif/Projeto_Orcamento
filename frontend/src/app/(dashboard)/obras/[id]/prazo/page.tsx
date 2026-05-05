"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Info } from "@phosphor-icons/react";
import { getOrcamento, getEtapas, updateEtapa, type Orcamento, type Etapa } from "@/lib/api/orcamentos";

export default function PrazosPage() {
  const params = useParams();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orcData, etapasData] = await Promise.all([
        getOrcamento(id),
        getEtapas(id)
      ]);
      setOrcamento(orcData);
      setEtapas(etapasData.sort((a, b) => a.ordem - b.ordem));
    } catch (err) {
      console.error("Erro ao carregar prazos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleDateChange = async (etapaId: string, field: 'data_inicio' | 'data_fim', value: string) => {
    // Optimistic update
    setEtapas(prev => prev.map(e => e.id === etapaId ? { ...e, [field]: value } : e));
    
    try {
      await updateEtapa(id, etapaId, { [field]: value || null });
    } catch (err) {
      console.error("Erro ao salvar data", err);
      alert("Erro ao salvar data.");
      fetchData(); // revert
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Carregando cronograma...</div>;
  }

  if (!orcamento) {
    return <div className="p-8 text-center text-text-muted">Obra não encontrada.</div>;
  }

  // --- Lógica do Gráfico de Gantt ---
  // Encontrar data mínima e máxima para a escala
  const datasSalgas = etapas
    .flatMap(e => [e.data_inicio ? new Date(e.data_inicio).getTime() : null, e.data_fim ? new Date(e.data_fim).getTime() : null])
    .filter((d): d is number => d !== null);

  const tempoMinimo = datasSalgas.length > 0 ? Math.min(...datasSalgas) : new Date().getTime();
  const tempoMaximo = datasSalgas.length > 0 ? Math.max(...datasSalgas) : new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
  
  // Adiciona margem de 5 dias nas bordas do gráfico
  const marginMs = 5 * 24 * 60 * 60 * 1000;
  const escalaMinima = tempoMinimo - marginMs;
  const escalaMaxima = tempoMaximo + marginMs;
  const duracaoTotalMs = escalaMaxima - escalaMinima;

  // Gerar marcadores de mês para o cabeçalho
  const marcadores = [];
  const minDateObj = new Date(escalaMinima);
  const maxDateObj = new Date(escalaMaxima);
  let atual = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);
  while (atual <= maxDateObj) {
    marcadores.push(new Date(atual));
    atual.setMonth(atual.getMonth() + 1);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <Link href={`/obras/${id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-[13px] font-semibold text-text-main shadow-sm mb-6 transition-all hover:bg-bg-light hover:-translate-x-0.5">
            <ArrowLeft size={16} className="text-text-muted" /> Voltar para Obra
          </Link>
          <p className="text-[12px] font-semibold tracking-wide text-[#06B6D4] uppercase mb-1">PLANEJAMENTO / CRONOGRAMA</p>
          <h1 className="text-[28px] font-bold text-text-main">Prazos e Etapas</h1>
          <p className="text-[15px] text-text-muted mt-2">Defina as datas de início e fim das etapas de <strong>{orcamento.nome}</strong>.</p>
        </div>
      </div>

      <div className="bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] p-4 rounded-lg mb-6 flex items-start gap-3 text-sm">
        <Info size={20} className="shrink-0 mt-0.5" />
        <div>
          <strong>Gráfico de Gantt Dinâmico</strong>
          <p>Preencha as datas na tabela à esquerda. O gráfico à direita será montado automaticamente. O salvamento é automático ao sair do campo.</p>
        </div>
      </div>

      {etapas.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-lg border border-border text-text-muted shadow-sm">
          Nenhuma etapa encontrada. Vá até a <Link href={`/obras/${id}/planilha`} className="text-brand-primary underline">Planilha Orçamentária</Link> para criar as etapas do projeto.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-lg shadow-sm flex flex-col lg:flex-row overflow-hidden">
          
          {/* Tabela de Datas (Esquerda) */}
          <div className="w-full lg:w-[450px] border-r border-border flex flex-col">
            <div className="p-4 px-6 border-b border-border bg-bg-light flex items-center gap-2">
              <Calendar size={18} className="text-text-muted" />
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wide">Definição de Prazos</h2>
            </div>
            <div className="overflow-y-auto flex-1">
              {etapas.map(etapa => (
                <div key={etapa.id} className="p-4 px-6 border-b border-border hover:bg-bg-light transition-colors">
                  <h3 className="font-semibold text-text-main text-sm mb-3 truncate" title={etapa.nome}>{etapa.nome}</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Início</label>
                      <input 
                        type="date" 
                        value={etapa.data_inicio || ""} 
                        onChange={(e) => handleDateChange(etapa.id, 'data_inicio', e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded text-sm text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Fim</label>
                      <input 
                        type="date" 
                        value={etapa.data_fim || ""} 
                        onChange={(e) => handleDateChange(etapa.id, 'data_fim', e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded text-sm text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico Visual (Direita) */}
          <div className="flex-1 overflow-x-auto bg-bg-light relative">
             <div className="min-w-[600px] h-full flex flex-col">
               {/* Régua de Tempo */}
               <div className="h-[53px] border-b border-border bg-white sticky top-0 z-10 flex relative">
                  {/* Fundo listrado para guiar */}
                  <div className="absolute inset-0 pointer-events-none w-full" style={{
                    backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '10% 100%'
                  }}></div>
                  <div className="absolute inset-0 flex items-center justify-between px-4 text-[10px] font-bold text-text-muted uppercase">
                    <span>{new Date(escalaMinima).toLocaleDateString('pt-BR')}</span>
                    <span>{new Date(escalaMaxima).toLocaleDateString('pt-BR')}</span>
                  </div>
               </div>

               {/* Linhas do Gráfico */}
               <div className="flex-1 relative pb-8">
                 {/* Grades verticais */}
                  <div className="absolute inset-0 pointer-events-none w-full h-full" style={{
                    backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '10% 100%'
                  }}></div>

                 {etapas.map((etapa, idx) => {
                   if (!etapa.data_inicio || !etapa.data_fim) {
                     return (
                       <div key={etapa.id} className="h-[96px] border-b border-border border-dashed flex items-center px-6 relative text-[11px] text-text-muted italic">
                         Aguardando definição de datas
                       </div>
                     );
                   }

                   const inicioMs = new Date(etapa.data_inicio).getTime();
                   const fimMs = new Date(etapa.data_fim).getTime();
                   
                   const left = ((inicioMs - escalaMinima) / duracaoTotalMs) * 100;
                   const width = Math.max(((fimMs - inicioMs) / duracaoTotalMs) * 100, 1); // Pelo menos 1% para ser visível

                   return (
                     <div key={etapa.id} className="h-[96px] border-b border-border border-dashed relative group">
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md bg-brand-primary/90 shadow-sm border border-brand-primary flex items-center px-3 text-[10px] font-bold text-white uppercase truncate cursor-pointer hover:bg-brand-primary transition-colors"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${etapa.nome}: ${new Date(etapa.data_inicio).toLocaleDateString('pt-BR')} até ${new Date(etapa.data_fim).toLocaleDateString('pt-BR')}`}
                        >
                          <span className="truncate">{etapa.nome}</span>
                        </div>
                     </div>
                   );
                 })}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
