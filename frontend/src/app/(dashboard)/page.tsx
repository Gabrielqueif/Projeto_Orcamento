'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Cube, Money, Plus } from '@phosphor-icons/react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import WeeklyProgressChart, { CORES_SERIES } from '../../components/dashboard/WeeklyProgressChart';
import BudgetGauge from '../../components/dashboard/BudgetGauge';
import { RiskItem } from '../../components/dashboard/RiskItem';
import { getDashboard, type Dashboard, type TipoRisco } from '../../lib/api/dashboard';

const ICONES_RISCO: Record<TipoRisco, React.ReactNode> = {
  ATRASO: <Clock weight="bold" />,
  ORCAMENTO: <Money weight="bold" />,
  ESTOQUE: <Cube weight="bold" />,
  DIARIO: <BookOpen weight="bold" />,
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
    return <p role="status" className="gp-sub" style={{ padding: 48, textAlign: 'center' }}>Carregando painel…</p>;
  }

  if (erro || !painel) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p role="alert" style={{ margin: 0, fontSize: 14, color: '#B91C1C' }}>{erro ?? 'Não foi possível carregar o painel.'}</p>
        <button onClick={carregar} className="gp-btn gp-bs gp-sm" style={{ marginTop: 16 }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p className="gp-crumb" style={{ margin: 0, textTransform: 'capitalize' }}>{hoje}</p>
          <h1 className="gp-h1">Visão geral</h1>
          <p className="gp-sub">Métricas de desempenho das suas obras em andamento.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/orcamentos/novo" className="gp-btn gp-bs">Novo orçamento</Link>
          <Link href="/obras/novo" className="gp-btn gp-bd"><Plus size={18} weight="bold" aria-hidden="true" />Nova obra</Link>
        </div>
      </div>

      <section aria-label="Indicadores" className="gp-grid">
        <MetricCard dark title="Obras Ativas" value={painel.obras_ativas.toString().padStart(2, '0')} />
        <MetricCard title="Progresso Médio" value={`${painel.progresso_medio}%`} />
        <MetricCard
          title="Orçamento Utilizado"
          value={`${painel.utilizacao_orcamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
        />
        <MetricCard title="Riscos Críticos" value={painel.alertas_criticos.toString().padStart(2, '0')} />
      </section>

      <section aria-labelledby="h-atencao" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 id="h-atencao" className="gp-h2">Riscos prioritários</h2>
        {painel.riscos.length === 0 ? (
          <p className="gp-sub" style={{ margin: 0 }}>Nenhum risco identificado nas obras em andamento.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {painel.riscos.map((risco) => (
              <li key={`${risco.tipo}-${risco.href}`}>
                <Link href={risco.href} style={{ display: 'block', textDecoration: 'none' }}>
                  <RiskItem
                    icon={ICONES_RISCO[risco.tipo]}
                    title={risco.titulo}
                    description={risco.descricao}
                    severity={risco.severidade}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="gp-split">
        <section className="gp-card gp-pad gp-main" aria-labelledby="h-prog" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h2 id="h-prog" className="gp-h2">Progresso semanal</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, fontWeight: 700, color: '#475569' }}>
              {painel.series.map((serie, i) => (
                <span key={serie.obra_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="gp-dot" style={{ background: CORES_SERIES[i % CORES_SERIES.length] }} aria-hidden="true"></span>
                  {serie.nome}
                </span>
              ))}
            </div>
          </div>
          {painel.series.length === 0 ? (
            <p className="gp-sub" style={{ margin: 0 }}>
              {painel.obras_ativas === 0
                ? 'Nenhuma obra em andamento.'
                : 'Defina as datas das etapas e registre medições para acompanhar o avanço semanal.'}
            </p>
          ) : (
            <WeeklyProgressChart semanas={painel.semanas} series={painel.series} />
          )}
        </section>
        <div className="gp-side">
          <BudgetGauge
            utilizacao={painel.utilizacao_orcamento}
            gastoRealizado={painel.gasto_realizado}
            disponivel={painel.disponivel}
          />
        </div>
      </div>

      <section className="gp-card gp-pad" aria-labelledby="h-diario" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 id="h-diario" className="gp-h2">Diário de obra</h2>
        {painel.feed.length === 0 ? (
          <p className="gp-sub" style={{ margin: 0 }}>Nenhum registro de diário nos últimos 60 dias.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {painel.feed.map((item) => (
              <li key={`${item.href}-${item.data}`}>
                <Link
                  href={item.href}
                  className="gp-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 10px', borderTop: '1px solid #E6EBF2', borderRadius: 12, textDecoration: 'none', color: '#001b3d' }}
                >
                  <span aria-hidden="true" style={{ width: 36, height: 36, flex: '0 0 36px', borderRadius: 10, background: '#e0f5f7', color: '#00626b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen weight="bold" size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 15, fontWeight: 800 }}>{item.titulo}</strong>
                    <span style={{ fontSize: 13, color: '#475569' }}>
                      {item.obra_nome} · {formatarDia(item.data)} · {item.status}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
