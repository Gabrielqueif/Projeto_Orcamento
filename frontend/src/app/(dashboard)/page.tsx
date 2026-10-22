'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  CompassTool,
  Cube,
  Money,
  TrendUp,
  Wallet,
  WarningCircle,
} from '@phosphor-icons/react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import WeeklyProgressChart, { CORES_SERIES } from '../../components/dashboard/WeeklyProgressChart';
import BudgetGauge from '../../components/dashboard/BudgetGauge';
import { RiskItem } from '../../components/dashboard/RiskItem';
import { getDashboard, type Dashboard, type TipoRisco } from '../../lib/api/dashboard';

const ICONES_RISCO: Record<TipoRisco, React.ReactNode> = {
  ATRASO: <Clock />,
  ORCAMENTO: <Money />,
  ESTOQUE: <Cube />,
  DIARIO: <BookOpen />,
};

function formatarDia(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

export default function DashboardPage() {
  const [painel, setPainel] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      setPainel(await getDashboard());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar o painel');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return <p className="p-12 text-center text-[14px] text-text-muted">Carregando painel…</p>;
  }

  if (erro || !painel) {
    return (
      <div className="p-12 text-center">
        <p className="text-[14px] text-status-danger">{erro ?? 'Não foi possível carregar o painel.'}</p>
        <button onClick={carregar} className="mt-4 px-4 py-2 rounded-lg bg-bg-light text-sm font-semibold text-text-main">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-text-main mb-2">Visão Executiva</h1>
        <p className="text-[15px] text-text-muted">Métricas de desempenho das suas obras em andamento.</p>
      </div>

      {painel.obras_ativas === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-[15px] text-text-muted">Você ainda não tem obras em andamento.</p>
          <Link href="/obras/novo" className="inline-block mt-4 text-sm font-bold text-status-info hover:underline">
            Criar uma obra
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Obras Ativas"
              value={painel.obras_ativas.toString().padStart(2, '0')}
              icon={<CompassTool />}
              borderBottomClass="border-b-brand-primary"
            />
            <MetricCard
              title="Progresso Médio"
              value={`${painel.progresso_medio}%`}
              icon={<TrendUp />}
              borderBottomClass="border-b-[#06B6D4]"
            />
            <MetricCard
              title="Orçamento Utilizado"
              value={`${painel.utilizacao_orcamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
              icon={<Wallet />}
              borderBottomClass="border-b-bg-dark"
            />
            <MetricCard
              title="Riscos Críticos"
              value={painel.alertas_criticos.toString().padStart(2, '0')}
              icon={<WarningCircle weight="fill" />}
              borderBottomClass="border-b-status-danger"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-border">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <h3 className="text-base font-bold text-text-main">PROGRESSO SEMANAL</h3>
                <div className="flex flex-wrap gap-4 text-[11px] font-bold text-text-muted uppercase tracking-wide">
                  {painel.series.map((serie, i) => (
                    <span key={serie.obra_id} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES_SERIES[i % CORES_SERIES.length] }}></span>
                      {serie.nome}
                    </span>
                  ))}
                </div>
              </div>
              {painel.series.length === 0 ? (
                <p className="text-[14px] text-text-muted">
                  Defina as datas das etapas e registre medições para acompanhar o avanço semanal.
                </p>
              ) : (
                <WeeklyProgressChart semanas={painel.semanas} series={painel.series} />
              )}
            </div>
            <BudgetGauge
              utilizacao={painel.utilizacao_orcamento}
              gastoRealizado={painel.gasto_realizado}
              disponivel={painel.disponivel}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-bold text-text-main mb-4">RISCOS PRIORITÁRIOS</h3>
              {painel.riscos.length === 0 ? (
                <p className="text-[14px] text-text-muted">Nenhum risco identificado nas obras em andamento.</p>
              ) : (
                painel.riscos.map((risco) => (
                  <Link key={`${risco.tipo}-${risco.href}`} href={risco.href} className="block no-underline">
                    <RiskItem
                      icon={ICONES_RISCO[risco.tipo]}
                      title={risco.titulo}
                      description={risco.descricao}
                      severity={risco.severidade}
                    />
                  </Link>
                ))
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-text-main mb-4">DIÁRIO DE OBRA</h3>
              {painel.feed.length === 0 ? (
                <p className="text-[14px] text-text-muted">Nenhum registro de diário nos últimos 60 dias.</p>
              ) : (
                painel.feed.map((item) => (
                  <Link
                    key={`${item.href}-${item.data}`}
                    href={item.href}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg bg-surface mb-3 no-underline transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-full bg-bg-dark text-white flex items-center justify-center shrink-0">
                      <BookOpen weight="fill" />
                    </div>
                    <div>
                      <h4 className="text-sm text-text-main mb-1">
                        <strong className="font-semibold">{item.titulo}</strong>
                      </h4>
                      <p className="text-[11px] text-text-muted uppercase">
                        {item.obra_nome} • {formatarDia(item.data)} • {item.status}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
