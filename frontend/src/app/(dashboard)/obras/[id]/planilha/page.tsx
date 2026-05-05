"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DownloadSimple, Coins, Buildings, ChartLineUp, MapPinLine } from "@phosphor-icons/react";
import { getOrcamento, type Orcamento } from "@/lib/api/orcamentos";

import { PlanilhaView } from "@/components/orcamentos/PlanilhaView";

export default function PlanilhaOrcamentariaPage() {
  const params = useParams();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrcamento = async () => {
    try {
      const orcData = await getOrcamento(id);
      setOrcamento(orcData);
    } catch (err) {
      console.error("Erro ao carregar orçamento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchOrcamento();
  }, [id]);

  if (loading && !orcamento) {
    return <div className="p-8 text-center text-text-muted">Carregando planilha orçamentária...</div>;
  }

  if (!orcamento) {
    return <div className="p-8 text-center text-text-muted">Orçamento não encontrado.</div>;
  }

  // Formatador de Moeda
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <Link href={`/obras/${id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-[13px] font-semibold text-text-main shadow-sm mb-6 transition-all hover:bg-bg-light hover:-translate-x-0.5">
            <ArrowLeft size={16} className="text-text-muted" /> Voltar para Obra
          </Link>
          <p className="text-[12px] font-semibold tracking-wide text-[#06B6D4] uppercase mb-1">FINANCEIRO / ORÇAMENTO</p>
          <h1 className="text-[28px] font-bold text-text-main">Planilha Orçamentária</h1>
          <p className="text-[15px] text-text-muted mt-2">Detalhamento financeiro, composições e insumos vinculados ao projeto <strong>{orcamento.nome}</strong>.</p>
        </div>
        <div className="flex gap-3 h-11">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#050a15] shadow-sm">
            <DownloadSimple size={20} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2 flex items-center gap-1.5"><Coins size={14} className="text-brand-primary" /> Valor Total</div>
          <div className="text-[28px] font-bold text-text-main mt-1">
            {formatCurrency(orcamento.valor_total)}
          </div>
          <div className="mt-3 text-[11px] font-semibold text-[#4D7E05] bg-[#E6F6D0] w-fit px-2 py-0.5 rounded uppercase">CUSTO DIRETO + BDI</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2 flex items-center gap-1.5"><ChartLineUp size={14} className="text-[#06B6D4]" /> BDI Aplicado</div>
          <div className="text-[28px] font-bold text-text-main mt-1">
            {orcamento.bdi ? `${orcamento.bdi.toFixed(2)}%` : "0.00%"}
          </div>
          <div className="mt-3 text-[11px] font-semibold text-text-muted uppercase">TAXA DE LUCRO E DESPESAS</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2 flex items-center gap-1.5"><Buildings size={14} className="text-[#F59E0B]" /> Base de Referência</div>
          <div className="text-[20px] font-bold text-text-main mt-1 truncate">
            {orcamento.base_referencia || "Não definida"}
          </div>
          <div className="mt-3 text-[11px] font-semibold text-text-muted uppercase">FONTE: {orcamento.fonte || "-"}</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1px] mb-2 flex items-center gap-1.5"><MapPinLine size={14} className="text-text-muted" /> Localidade</div>
          <div className="text-[20px] font-bold text-text-main mt-1">
            {orcamento.estado?.toUpperCase() || "Nacional"}
          </div>
          <div className="mt-3 text-[11px] font-semibold text-text-muted uppercase">TIPO: {orcamento.tipo_composicao || "Não definido"}</div>
        </div>
      </div>

      {/* Planilha Dinâmica (Cartões) */}
      <PlanilhaView 
        orcamentoId={id} 
        estadoOrcamento={orcamento.estado}
        fonteOrcamento={orcamento.fonte}
        onTotalChanged={fetchOrcamento}
      />
      
    </div>
  );
}
