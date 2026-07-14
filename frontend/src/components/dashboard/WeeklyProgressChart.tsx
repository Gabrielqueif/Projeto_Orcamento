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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const lineData = {
  labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
  datasets: [
    {
      label: 'Horizon Tower',
      data: [65, 59, 80, 81],
      backgroundColor: '#081225',
      borderRadius: 4,
    },
    {
      label: 'Riverside Hub',
      data: [28, 48, 40, 19],
      backgroundColor: '#06B6D4',
      borderRadius: 4,
    },
  ],
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
};

export default function WeeklyProgressChart() {
  return (
    <div className="h-[250px] relative w-full">
      <Bar data={lineData} options={lineOptions} />
    </div>
  );
}
