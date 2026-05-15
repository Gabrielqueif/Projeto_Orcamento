'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Calendar, DownloadSimple, CompassTool, TrendUp, Wallet, WarningCircle, Clock, Money, FilePdf, ChartBar, User } from '@phosphor-icons/react';
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    }).catch(err => {
      console.error("Supabase getUser() fetch failed (client):", err);
    });
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
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm border-b-4 border-b-brand-primary flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-border">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-bg-light flex items-center justify-center text-xl text-text-main">
              <CompassTool />
            </div>
            <span className="bg-[#E6F6D0] text-[#4D7E05] px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide">+2 NOVOS</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wide">Obras Ativas</div>
            <div className="text-[36px] font-bold text-text-main">06</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm border-b-4 border-b-[#06B6D4] flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-border">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-bg-light flex items-center justify-center text-xl text-text-main">
              <TrendUp />
            </div>
            <div className="w-12 h-1.5 bg-[#06B6D4] rounded"></div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wide">Progresso Médio</div>
            <div className="text-[36px] font-bold text-text-main">72%</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm border-b-4 border-b-bg-dark flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-border">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-bg-light flex items-center justify-center text-xl text-text-main">
              <Wallet />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wide">Orçamento Utilizado</div>
            <div className="text-[36px] font-bold text-text-main">45%</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm border-b-4 border-b-status-danger flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-border">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] flex items-center justify-center text-xl text-[#DC2626]">
              <WarningCircle weight="fill" />
            </div>
            <span className="border border-status-danger text-status-danger px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide">ALERTA</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-status-danger uppercase tracking-wide">Riscos Críticos</div>
            <div className="text-[36px] font-bold text-status-danger">02</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-border">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-bold text-text-main mb-1">VELOCIDADE DA OBRA</h3>
              <p className="text-[13px] text-text-muted">Indicadores de produtividade semanal</p>
            </div>
            <div className="flex gap-4 text-[11px] font-bold text-text-muted uppercase tracking-wide">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bg-dark"></span> HORIZON TOWER</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#06B6D4]"></span> RIVERSIDE HUB</span>
            </div>
          </div>
          <div className="h-[250px] relative">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-border flex flex-col">
          <div className="text-center mb-3">
            <h3 className="text-base font-bold text-text-main mb-1">UTILIZAÇÃO DE VERBA</h3>
            <p className="text-[13px] text-text-muted">Consolidado Financeiro Geral</p>
          </div>
          <div className="relative w-full flex flex-col items-center justify-center mt-8 mb-4">
            <div className="w-full max-w-[280px] aspect-[2/1]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
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
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risks */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-text-main">RISCOS PRIORITÁRIOS</h3>
            <a href="#" className="text-xs font-bold text-status-info no-underline uppercase tracking-wide">VER TODOS</a>
          </div>

          <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-surface mb-3 border-l-4 border-l-status-danger transition-all hover:-translate-y-0.5 hover:shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center text-2xl">
              <Money />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-text-main mb-1">Estouro de Orçamento: Horizon</h4>
              <p className="text-[13px] text-text-muted">Custos de fundação excederam em 18.4%.</p>
            </div>
            <span className="border border-status-danger bg-white text-status-danger px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide">CRÍTICO</span>
          </div>

          <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-surface mb-3 border-l-4 border-l-brand-primary transition-all hover:-translate-y-0.5 hover:shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-bg-light text-text-main flex items-center justify-center text-2xl">
              <Clock />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-text-main mb-1">Atraso de Entrega: Riverside</h4>
              <p className="text-[13px] text-text-muted">Concreto atrasado em 48h por logística.</p>
            </div>
            <span className="border border-text-main bg-white text-text-main px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide">MODERADO</span>
          </div>
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