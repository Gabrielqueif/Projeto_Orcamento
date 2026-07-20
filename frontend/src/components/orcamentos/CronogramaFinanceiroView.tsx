"use client";

import React, { useEffect, useState } from "react";
import { Clock, Spinner } from "@phosphor-icons/react";
import { getOrcamentoCronograma, type CronogramaResponse, type CronogramaMes } from "@/lib/api/orcamentos";

interface CronogramaFinanceiroViewProps {
  orcamentoId: string;
}

export function CronogramaFinanceiroView({ orcamentoId }: CronogramaFinanceiroViewProps) {
  const [data, setData] = useState<CronogramaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCronograma() {
      try {
        setLoading(true);
        const res = await getOrcamentoCronograma(orcamentoId);
        setData(res);
      } catch (err) {
        console.error("Erro ao carregar Cronograma:", err);
      } finally {
        setLoading(false);
      }
    }
    if (orcamentoId) {
      fetchCronograma();
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
          <span>Calculando Cronograma Financeiro...</span>
        </div>
      </div>
    );
  }

  if (!data || data.mensal.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 bg-white border border-[#c4c6cf] rounded-[12px] shadow-sm">
        <span className="font-['Inter'] text-[14px] text-[#64748b]">
          Nenhuma etapa com custos associados disponível para gerar o Cronograma Físico-Financeiro.
        </span>
      </div>
    );
  }

  const mensalData = data.mensal;

  // SVG Chart Dimensions
  const width = 800;
  const height = 280;
  const paddingLeft = 60;
  const paddingRight = 60;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartInnerWidth = width - paddingLeft - paddingRight;
  const chartInnerHeight = height - paddingTop - paddingBottom;

  // X coordinate calculation
  const getX = (index: number) => {
    if (mensalData.length <= 1) return paddingLeft + chartInnerWidth / 2;
    const step = chartInnerWidth / (mensalData.length - 1);
    return paddingLeft + index * step;
  };

  // Y coordinate for monthly disbursement bars
  const maxVal = Math.max(...mensalData.map((item) => item.valor), 1);
  const getBarY = (val: number) => {
    const ratio = val / maxVal;
    return height - paddingBottom - ratio * chartInnerHeight;
  };

  const getBarHeight = (val: number) => {
    const ratio = val / maxVal;
    return ratio * chartInnerHeight;
  };

  // Y coordinate for cumulative S-curve (0% to 100%)
  const getCurveY = (pct: number) => {
    const ratio = pct / 100;
    return height - paddingBottom - ratio * chartInnerHeight;
  };

  // Generate SVG path for S-curve
  const curvePath = mensalData.map((item, idx) => {
    const x = getX(idx);
    const y = getCurveY(item.acumulado_pct);
    return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  // Encontrar o mês de pico (maior desembolso)
  const picoIndex = mensalData.reduce(
    (maxIdx, item, idx, arr) => (item.valor > arr[maxIdx].valor ? idx : maxIdx),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Chart and Stats Row */}
      <div className="bg-white border border-[#c4c6cf] rounded-[12px] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4 mb-4">
          <div>
            <h3 className="font-['Inter'] font-semibold text-[18px] text-black">
              Desembolso Mensal e Curva S
            </h3>
            <p className="font-['Inter'] font-normal text-[12px] text-[#44474e] mt-0.5">
              Visualização da projeção de fluxo de caixa e progresso físico-financeiro acumulado.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="bg-[#001b3d] w-[12px] h-[12px] rounded-[2px]" />
              <span className="font-['Inter'] font-medium text-[11px] text-[#44474e]">
                Mensal (R$)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="bg-[#4b6700] w-[16px] h-[2px]" />
              <span className="font-['Inter'] font-medium text-[11px] text-[#44474e]">
                Curva S (% Acumulada)
              </span>
            </div>
          </div>
        </div>

        {/* Native SVG Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
              {/* Y Axis Grid Lines & Labels (Left: Value, Right: Percent) */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const y = getCurveY(pct);
                const valueLabel = formatCurrency((pct / 100) * maxVal);
                return (
                  <g key={pct}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#ebeef0"
                      strokeDasharray="3 3"
                    />
                    {/* Left Y Axis Label (Currency) */}
                    <text
                      x={paddingLeft - 10}
                      y={y + 3}
                      className="font-['Inter'] text-[9px] text-[#44474e]"
                      textAnchor="end"
                    >
                      {pct === 100 ? valueLabel : pct === 0 ? "R$ 0" : formatCurrency((pct / 100) * maxVal).split(",")[0]}
                    </text>
                    {/* Right Y Axis Label (Percentage) */}
                    <text
                      x={width - paddingRight + 10}
                      y={y + 3}
                      className="font-['Inter'] text-[9px] text-[#4b6700]"
                      textAnchor="start"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Monthly Disbursement Bars */}
              {mensalData.map((item, idx) => {
                const x = getX(idx);
                const barWidth = 36;
                const y = getBarY(item.valor);
                const barH = getBarHeight(item.valor);
                const isPico = idx === picoIndex;

                return (
                  <g key={idx} className="group cursor-pointer">
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barH}
                      fill={isPico ? "#b9f61d" : "#001b3d"}
                      rx="4"
                      className="transition-all duration-200 hover:opacity-90"
                    />
                    {/* Tooltip on Hover */}
                    <title>{`${item.mes}: ${formatCurrency(item.valor)}`}</title>
                  </g>
                );
              })}

              {/* S-Curve Path */}
              {curvePath && (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#4b6700"
                  strokeWidth="3"
                />
              )}

              {/* S-Curve Markers */}
              {mensalData.map((item, idx) => {
                const x = getX(idx);
                const y = getCurveY(item.acumulado_pct);
                return (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#ffffff"
                      stroke="#4b6700"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="2"
                      fill="#4b6700"
                    />
                    <title>{`Progresso: ${item.acumulado_pct}%`}</title>
                  </g>
                );
              })}

              {/* X Axis Month Labels */}
              {mensalData.map((item, idx) => {
                const x = getX(idx);
                const y = height - paddingBottom + 20;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    className="font-['Inter'] font-semibold text-[10px] text-[#44474e]"
                    textAnchor="middle"
                  >
                    {item.mes}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Detailed Chronogram Table */}
      <div className="bg-white border border-[#c4c6cf] rounded-[12px] p-6 shadow-sm">
        <h3 className="font-['Inter'] font-semibold text-[18px] text-black border-b border-[#f1f5f9] pb-4 mb-4">
          Detalhamento Cronológico
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#c4c6cf]">
                <th className="pb-3 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px] w-[100px]">
                  Mês
                </th>
                <th className="pb-3 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px]">
                  Serviços Previstos no Período
                </th>
                <th className="pb-3 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] uppercase tracking-[0.5px] text-right w-[150px]">
                  Desembolso Mensal
                </th>
                <th className="pb-3 font-['Hanken_Grotesk'] font-bold text-[10px] text-[#4b6700] uppercase tracking-[0.5px] text-right w-[100px]">
                  Acumulado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebeef0]">
              {mensalData.map((item, idx) => {
                const isPico = idx === picoIndex;
                return (
                  <tr key={item.mes} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-['Inter'] font-bold text-[13px] text-[#181c1e]">
                      {item.mes}
                    </td>
                    <td className="py-4 font-['Inter'] text-[13px] text-[#44474e]">
                      {item.servicos || "—"}
                    </td>
                    <td className="py-4 font-['Inter'] font-bold text-[13px] text-black text-right">
                      <span className={isPico ? "bg-[#b9f61d]/30 text-[#141f00] px-2 py-1 rounded" : ""}>
                        {formatCurrency(item.valor)}
                      </span>
                    </td>
                    <td className="py-4 font-['Inter'] font-semibold text-[13px] text-[#4b6700] text-right">
                      {item.acumulado_pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
