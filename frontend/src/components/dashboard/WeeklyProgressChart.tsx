// src/components/dashboard/WeeklyProgressChart.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { SerieSemanal } from '@/lib/api/dashboard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
      backgroundColor: CORES_SERIES[i % CORES_SERIES.length],
      borderRadius: 4,
    })),
  };

  return (
    <div className="h-[250px] relative w-full" role="img" aria-label="Avanço realizado por semana, por obra">
      <Bar data={data} options={options} />
    </div>
  );
}
