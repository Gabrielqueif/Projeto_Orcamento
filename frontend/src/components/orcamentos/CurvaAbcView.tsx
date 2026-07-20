"use client";

import React, { useEffect, useState } from "react";
import { 
  TrendUp, 
  Warning, 
  Circle, 
  ChartPieSlice,
  Spinner
} from "@phosphor-icons/react";
import { getOrcamentoCurvaABC, type CurvaABCResponse, type CurvaABCInsumo } from "@/lib/api/orcamentos";

interface CurvaAbcViewProps {
  orcamentoId: string;
}

export function CurvaAbcView({ orcamentoId }: CurvaAbcViewProps) {
  const [data, setData] = useState<CurvaABCResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchABC() {
      try {
        setLoading(true);
        const res = await getOrcamentoCurvaABC(orcamentoId);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar Curva ABC:", err);
      } finally {
        setLoading(false);
      }
    }
    if (orcamentoId) {
      fetchABC();
    }
  }, [orcamentoId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-2 font-['Inter'] text-[14px] text-[#64748b]">
          <Spinner size={16} className="animate-spin text-[#4b6700]" />
          <span>Calculando Curva ABC...</span>
        </div>
      </div>
    );
  }

  if (!data || data.insumos.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 bg-white border border-[#c4c6cf] rounded-[12px] shadow-sm">
        <span className="font-['Inter'] text-[14px] text-[#64748b]">
          Nenhum insumo disponível para gerar a Curva ABC. Adicione composições à planilha orçamentária.
        </span>
      </div>
    );
  }

  // Obter insumos Classe A para tabela de detalhes
  const insumosClasseA = data.insumos.filter((ins) => ins.classe === "A");
  
  // Dados para o Gráfico (Mostrar no máximo as 6 principais categorias/insumos)
  const chartInsumos = data.insumos.slice(0, 6);
  const categories = chartInsumos.map(ins => ins.descricao.substring(0, 15) + (ins.descricao.length > 15 ? "..." : ""));
  const costs = chartInsumos.map(ins => ins.total);
  const cumulative = chartInsumos.map(ins => ins.acumulado);

  // SVG Pareto Chart Dimensions
  const chartHeight = 220;
  const chartWidth = 520;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartInnerWidth = chartWidth - paddingLeft - paddingRight;
  const chartInnerHeight = chartHeight - paddingTop - paddingBottom;

  // X coords for columns
  const getX = (index: number) => {
    if (categories.length <= 1) return paddingLeft + chartInnerWidth / 2;
    const spacing = chartInnerWidth / (categories.length - 1);
    return paddingLeft + index * spacing;
  };

  // Y coords for cost bars (max cost = max of the displayed costs)
  const maxCost = Math.max(...costs, 1);
  const getBarY = (value: number) => {
    const ratio = value / maxCost;
    return chartHeight - paddingBottom - ratio * chartInnerHeight;
  };

  const getBarHeight = (value: number) => {
    const ratio = value / maxCost;
    return ratio * chartInnerHeight;
  };

  // Y coords for cumulative percentage line (0 to 100%)
  const getLineY = (percentage: number) => {
    const ratio = percentage / 100;
    return chartHeight - paddingBottom - ratio * chartInnerHeight;
  };

  // Generate SVG path for cumulative line
  const linePath = cumulative.length > 0 
    ? cumulative.map((pct, idx) => {
        const x = getX(idx);
        const y = getLineY(pct);
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      }).join(" ")
    : "";

  const totalClasseA = data.resumo_classes["A"] || 0.0;
  const pctClasseA = data.valor_total > 0 ? (totalClasseA / data.valor_total) * 100.0 : 0.0;

  return (
    <div className="flex flex-col gap-6">
      {/* ABC Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: ORÇAMENTO TOTAL */}
        <div className="bg-white border border-[#c4c6cf] border-l-4 border-l-black rounded-[12px] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
              CUSTO DIRETO TOTAL (ABC)
            </span>
            <h2 className="font-['Inter'] font-bold text-[28px] text-[#181c1e] mt-2">
              {formatCurrency(data.valor_total)}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="bg-[#e8f5e9] text-[#2e7d32] font-['Inter'] font-bold text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
              {data.insumos.length} Insumos
            </span>
            <span className="font-['Inter'] font-normal text-[12px] text-[#44474e]">
              analisados no total
            </span>
          </div>
        </div>

        {/* Card 2: ITENS CLASSE A */}
        <div className="bg-white border border-[#c4c6cf] border-l-4 border-l-[#4b6700] rounded-[12px] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
                ITENS CLASSE A
              </span>
              <span className="bg-[#b9f61d] text-[#506e00] font-['Inter'] font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                CRÍTICO
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-['Inter'] font-bold text-[28px] text-[#181c1e]">
                {insumosClasseA.length}
              </span>
              <span className="font-['Inter'] font-normal text-[13px] text-[#44474e]">
                de {data.insumos.length} insumos
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="bg-[#e5e9eb] h-[8px] rounded-[9999px] w-full overflow-hidden mb-1.5">
              <div className="bg-[#4b6700] h-full" style={{ width: `${Math.min(100, pctClasseA)}%` }} />
            </div>
            <p className="font-['Inter'] font-normal text-[11px] text-[#44474e]">
              Representam {pctClasseA.toFixed(1)}% do custo total da planilha.
            </p>
          </div>
        </div>

        {/* Card 3: RESUMO DE CLASSES */}
        <div className="bg-white border border-[#c4c6cf] border-l-4 border-l-[#44d8f1] rounded-[12px] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="w-full">
              <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
                DESDOBRAMENTO DE CURVA
              </span>
              <div className="flex flex-col gap-1 mt-2.5 text-xs">
                <div className="flex justify-between items-center text-[#1e293b]">
                  <span className="font-bold">Classe A:</span>
                  <span>{formatCurrency(totalClasseA)} ({pctClasseA.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between items-center text-[#475569]">
                  <span>Classe B:</span>
                  <span>{formatCurrency(data.resumo_classes["B"] || 0.0)} ({((data.resumo_classes["B"] || 0) / data.valor_total * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between items-center text-[#475569]">
                  <span>Classe C:</span>
                  <span>{formatCurrency(data.resumo_classes["C"] || 0.0)} ({((data.resumo_classes["C"] || 0) / data.valor_total * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pareto Diagram & Detailed List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pareto Diagram Box */}
        <div className="lg:col-span-2 bg-white border border-[#c4c6cf] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4 mb-4">
            <h3 className="font-['Inter'] font-semibold text-[18px] text-black">
              Diagrama de Pareto (Top Insumos)
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="bg-[#001b3d] w-[12px] h-[12px] rounded-[2px]" />
                <span className="font-['Inter'] font-medium text-[11px] text-[#44474e]">
                  Custo Unitário Acumulado
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="bg-[#4b6700] w-[16px] h-[2px]" />
                <span className="font-['Inter'] font-medium text-[11px] text-[#44474e]">
                  % Acumulado
                </span>
              </div>
            </div>
          </div>

          {/* Native SVG Chart */}
          <div className="w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              {/* Grid Lines */}
              {[0, 20, 40, 60, 80, 100].map((tick) => {
                const y = getLineY(tick);
                return (
                  <g key={tick}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={chartWidth - paddingRight} 
                      y2={y} 
                      stroke="#ebeef0" 
                      strokeDasharray="3 3"
                    />
                    {/* Left Y Axis Label */}
                    <text 
                      x={paddingLeft - 10} 
                      y={y + 3} 
                      className="font-['Inter'] text-[9px] text-[#44474e] text-right" 
                      textAnchor="end"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {costs.map((val, idx) => {
                const x = getX(idx);
                const barWidth = 24;
                const y = getBarY(val);
                const height = getBarHeight(val);
                return (
                  <rect
                    key={idx}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={height}
                    fill="#001b3d"
                    rx="2"
                  />
                );
              })}

              {/* Cumulative Line Path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#4b6700"
                  strokeWidth="2"
                />
              )}

              {/* Cumulative Dots */}
              {cumulative.map((pct, idx) => {
                const x = getX(idx);
                const y = getLineY(pct);
                return (
                  <g key={idx}>
                    <circle
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#b9f61d"
                      stroke="#4b6700"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {categories.map((cat, idx) => {
                const x = getX(idx);
                const y = chartHeight - paddingBottom + 18;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    className="font-['Inter'] font-semibold text-[8px] text-[#64748b]"
                    textAnchor="middle"
                  >
                    {cat}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Detailed List Table */}
        <div className="bg-white border border-[#c4c6cf] rounded-[12px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="h-full flex flex-col">
            <h3 className="font-['Inter'] font-semibold text-[18px] text-black border-b border-[#f1f5f9] pb-4 mb-4">
              Detalhamento Classe A
            </h3>
            <div className="overflow-y-auto max-h-[300px] flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#c4c6cf]">
                    <th className="pb-3 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
                      Código
                    </th>
                    <th className="pb-3 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
                      Descrição Insumo
                    </th>
                    <th className="pb-3 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px] text-right">
                      Part. (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef0]">
                  {insumosClasseA.map((item) => (
                    <tr key={item.codigo_insumo} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-['Inter'] text-[12px] text-[#64748b]">
                        {item.codigo_insumo}
                      </td>
                      <td className="py-2.5 font-['Inter'] font-semibold text-[12px] text-black truncate max-w-[120px]" title={item.descricao}>
                        {item.descricao}
                      </td>
                      <td className="py-2.5 font-['Inter'] font-bold text-[12px] text-[#4b6700] text-right">
                        {item.porcentagem.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
