// src/components/dashboard/BudgetGauge.tsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type BudgetGaugeProps = {
  /** Percentual da verba já gasto (pode passar de 100). */
  utilizacao: number;
  gastoRealizado: number;
  disponivel: number;
};

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export default function BudgetGauge({ utilizacao, gastoRealizado, disponivel }: BudgetGaugeProps) {
  const estourou = utilizacao > 100;
  const usado = Math.min(Math.max(utilizacao, 0), 100);

  const data = {
    labels: ['Utilizado', 'Disponível'],
    datasets: [
      {
        data: [usado, 100 - usado],
        backgroundColor: [estourou ? '#DC2626' : '#9fd300', '#EDF1F6'],
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
    <section className="gp-card gp-pad" aria-labelledby="h-verba" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 id="h-verba" className="gp-h2">Utilização de verba</h2>
        <p className="gp-ms" style={{ margin: '2px 0 0' }}>Consolidado financeiro geral</p>
      </div>
      <div
        className="relative w-full flex flex-col items-center justify-center mt-4 mb-2"
        role="img"
        aria-label={`${utilizacao.toLocaleString('pt-BR')}% da verba utilizada`}
      >
        <div className="w-full max-w-[280px] aspect-[2/1]">
          <Doughnut data={data} options={options} />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center">
          <span className="gp-mono" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1 }}>
            {utilizacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </span>
          <small style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 4 }}>
            {estourou ? 'Acima do orçado' : 'Utilizado'}
          </small>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
        <div style={{ flex: 1, background: '#F4F6FA', padding: 12, borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Gasto real</div>
          <div className="gp-mono" style={{ fontSize: 16, fontWeight: 600 }}>{moeda.format(gastoRealizado)}</div>
        </div>
        <div style={{ flex: 1, background: '#F4F6FA', padding: 12, borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Disponível</div>
          <div className="gp-mono" style={{ fontSize: 16, fontWeight: 600 }}>{moeda.format(disponivel)}</div>
        </div>
      </div>
    </section>
  );
}
