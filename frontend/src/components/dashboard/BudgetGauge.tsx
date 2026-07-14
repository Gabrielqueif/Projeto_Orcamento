// src/components/dashboard/BudgetGauge.tsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function BudgetGauge() {
  const data = {
    labels: ['Alocado', 'Disponível'],
    datasets: [
      {
        data: [45, 55],
        backgroundColor: ['#AEE112', '#F4F6F8'],
        borderWidth: 0,
        cutout: '82%',
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-border flex flex-col">
      <div className="text-center mb-3">
        <h3 className="text-base font-bold text-text-main mb-1">UTILIZAÇÃO DE VERBA</h3>
        <p className="text-[13px] text-text-muted">Consolidado Financeiro Geral</p>
      </div>
      <div className="relative w-full flex flex-col items-center justify-center mt-8 mb-4">
        <div className="w-full max-w-[280px] aspect-[2/1]">
          <Doughnut data={data} options={options} />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center">
          <span className="text-3xl lg:text-[44px] font-bold text-text-main leading-none">45%</span>
          <small className="text-[10px] lg:text-[11px] font-bold text-text-muted uppercase tracking-[2px] mt-1">Alocado</small>
        </div>
      </div>
      <div className="flex gap-3 mt-auto">
        <div className="flex-1 bg-bg-light p-3 rounded-lg text-center">
          <div className="text-[10px] font-bold text-text-muted mb-1">GASTO REAL</div>
          <div className="text-base font-bold text-text-main">R$ 4.2M</div>
        </div>
        <div className="flex-1 bg-bg-light p-3 rounded-lg text-center">
          <div className="text-[10px] font-bold text-text-muted mb-1">DISPONÍVEL</div>
          <div className="text-base font-bold text-text-main">R$ 5.1M</div>
        </div>
      </div>
    </div>
  );
}
