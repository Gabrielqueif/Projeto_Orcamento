// src/components/dashboard/WeeklyProgressChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { SerieSemanal } from '@/lib/api/dashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/** Cores das séries; a legenda do painel usa a mesma lista. */
export const CORES_SERIES = ['#001b3d', '#00a3b1', '#9fd300', '#F97316'];

type WeeklyProgressChartProps = {
  semanas: string[];
  series: SerieSemanal[];
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v: string | number) => `${v}%` } } },
};

export default function WeeklyProgressChart({ semanas, series }: WeeklyProgressChartProps) {
  const data = {
    labels: semanas,
    datasets: series.map((serie, i) => ({
      label: serie.nome,
      data: serie.valores,
      borderColor: CORES_SERIES[i % CORES_SERIES.length],
      backgroundColor: CORES_SERIES[i % CORES_SERIES.length],
      tension: 0.3,
      spanGaps: true,
      pointRadius: 3,
    })),
  };

  return (
    <div className="h-[250px] relative w-full" role="img" aria-label="Avanço realizado ao longo do tempo, por obra">
      <Line data={data} options={options} />
    </div>
  );
}
