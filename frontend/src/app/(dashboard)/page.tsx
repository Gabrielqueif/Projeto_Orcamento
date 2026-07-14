'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Calendar, DownloadSimple, CompassTool, TrendUp, Wallet, WarningCircle, Clock, Money, FilePdf, ChartBar, User } from '@phosphor-icons/react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import WeeklyProgressChart from '../../components/dashboard/WeeklyProgressChart';
import BudgetGauge from '../../components/dashboard/BudgetGauge';
import { RiskItem } from '../../components/dashboard/RiskItem';
import { getActiveProjects, getAverageProgress, getBudgetUtilization, getCriticalAlertsCount } from '../../lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const lineData = {
  labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
  datasets: [
    {
      label: 'Horizon Tower',
      data: [65, 59, 80, 81],
      borderColor: '#081225',
      backgroundColor: '#081225',
      tension: 0.4,
    },
    {
      label: 'Riverside Hub',
      data: [28, 48, 40, 19],
      borderColor: '#06B6D4',
      backgroundColor: '#06B6D4',
      tension: 0.4,
    },
  ],
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } }
};

const doughnutData = {
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

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [activeProjects, setActiveProjects] = useState<number>(0);
  const [averageProgress, setAverageProgress] = useState<number>(0);
  const [budgetUtilization, setBudgetUtilization] = useState<number>(0);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    }).catch(err => {
      console.error("Supabase getUser() fetch failed (client):", err);
    });
    // Load placeholder dashboard data
    getActiveProjects().then(setActiveProjects);
    getAverageProgress().then(setAverageProgress);
    getBudgetUtilization().then(setBudgetUtilization);
    getCriticalAlertsCount().then(setCriticalAlertsCount);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Top Actions */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-text-main mb-2">Visão Executiva</h1>
          <p className="text-[15px] text-text-muted">Métricas de desempenho em tempo real de todos os canteiros ativos.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold transition-all hover:bg-bg-light hover:border-[#cbd5e1]">
            <Calendar size={20} /> 24 Out - 30 Out, 2023
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#050a15]">
            <DownloadSimple size={20} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Obras Ativas"
          value={activeProjects.toString().padStart(2, '0')}
          icon={<CompassTool />}
          badge="+2 NOVOS"
          borderBottomClass="border-b-brand-primary"
        />
        <MetricCard
          title="Progresso Médio"
          value={`${averageProgress}%`}
          icon={<TrendUp />}
          borderBottomClass="border-b-[#06B6D4]"
        />
        <MetricCard
          title="Orçamento Utilizado"
          value={`${budgetUtilization}%`}
          icon={<Wallet />}
          borderBottomClass="border-b-bg-dark"
        />
        <MetricCard
          title="Riscos Críticos"
          value={criticalAlertsCount.toString().padStart(2, '0')}
          icon={<WarningCircle weight="fill" />}
          borderBottomClass="border-b-status-danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-text-main">PROGRESSO SEMANAL</h3>
            <div className="flex gap-4 text-[11px] font-bold text-text-muted uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bg-dark"></span> HORIZON TOWER</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#06B6D4]"></span> RIVERSIDE HUB</span>
            </div>
          </div>
          <WeeklyProgressChart />
        </div>
        <BudgetGauge />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risks */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-text-main">RISCOS PRIORITÁRIOS</h3>
            <a href="#" className="text-xs font-bold text-status-info no-underline uppercase tracking-wide">VER TODOS</a>
          </div>

          <RiskItem icon={<Money/>} title="Estouro de Orçamento: Horizon" description="Custos de fundação excederam em 18.4%." severity="critical" />
          <RiskItem icon={<Clock/>} title="Atraso de Entrega: Riverside" description="Concreto atrasado em 48h por logística." severity="moderate" />
        </div>

        {/* Feed */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-text-main">FEED DA OBRA</h3>
            <a href="#" className="text-xs font-bold text-status-info no-underline uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-info"></span> TEMPO REAL
            </a>
          </div>

          <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface mb-3 transition-all hover:-translate-y-0.5 hover:shadow-sm">
            <div className="w-9 h-9 rounded-full bg-bg-dark text-white flex items-center justify-center shrink-0">
              <User weight="fill" />
            </div>
            <div>
              <h4 className="text-sm text-text-main mb-1"><strong className="font-semibold">Marcos Silva</strong> enviou <strong className="font-semibold">Relatório Diário</strong></h4>
              <p className="text-[11px] text-text-muted uppercase">ECO-MALL • 22 MIN ATRÁS</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-semibold text-text-main">
                <FilePdf size={16} /> RDO_25OUT.PDF
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface mb-3 transition-all hover:-translate-y-0.5 hover:shadow-sm">
            <div className="w-9 h-9 rounded-full bg-bg-dark text-white flex items-center justify-center shrink-0">
              <ChartBar />
            </div>
            <div>
              <h4 className="text-sm text-text-main mb-1"><strong className="font-semibold">Sistema</strong> gerou <strong className="font-semibold">Auditoria Semanal</strong></h4>
              <p className="text-[11px] text-text-muted uppercase">PORTFÓLIO GLOBAL • 1 HORA ATRÁS</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}