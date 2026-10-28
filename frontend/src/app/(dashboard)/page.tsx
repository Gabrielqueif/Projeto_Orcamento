'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CaretRight, Clock, Cube, Money, Plus } from '@phosphor-icons/react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import WeeklyProgressChart, { CORES_SERIES } from '../../components/dashboard/WeeklyProgressChart';
import BudgetGauge from '../../components/dashboard/BudgetGauge';
import { RiskItem } from '../../components/dashboard/RiskItem';
import { getDashboard, type Dashboard, type TipoRisco } from '../../lib/api/dashboard';
import { getObras, type Obra } from '@/lib/api/obras';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageHeader } from "@/components/layout/PageHeader";
import { Fab } from "@/components/layout/Fab";

const ICONES_RISCO: Record<TipoRisco, React.ReactNode> = {
  ATRASO: <Clock weight="bold" />,
  ORCAMENTO: <Money weight="bold" />,
  ESTOQUE: <Cube weight="bold" />,
  DIARIO: <BookOpen weight="bold" />,
};

// Situação da obra no carrossel do mobile (o painel sincroniza obras.status com a Curva S).
const SITUACAO_OBRA: Record<string, { rotulo: string; cor: string; ponto: string; barra: string; tile: string }> = {
  EM_ANDAMENTO: { rotulo: 'No prazo', cor: '#3F6604', ponto: '#65A30D', barra: '#00a3b1', tile: '#E6F6D0' },
  ATRASADO: { rotulo: 'Atrasada', cor: '#B91C1C', ponto: '#DC2626', barra: '#DC2626', tile: '#FEE2E2' },
};

const CIRCUNFERENCIA_ANEL = 2 * Math.PI * 40;

function formatarDia(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function sigla(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

/** Último avanço medido da série semanal (a última semana é a atual). */
function ultimoValor(valores: (number | null)[]): number {
  for (let i = valores.length - 1; i >= 0; i--) {
    const v = valores[i];
    if (v !== null && v !== undefined) return Math.min(100, Math.max(0, Math.round(v)));
  }
  return 0;
}

export default function DashboardPage() {
  const [painel, setPainel] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Obras do usuário: ligam as séries do painel à página da obra (id do orçamento), ao cliente e à situação.
  const [obras, setObras] = useState<Obra[]>([]);
  const { nome, iniciais } = useCurrentUser();

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      setPainel(await getDashboard());
      // Depois do painel, que acabou de sincronizar o status das obras; se falhar, o carrossel fica sem situação.
      getObras().then(setObras).catch(() => setObras([]));
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

  const hojeLongo = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hoje = hojeLongo.charAt(0).toUpperCase() + hojeLongo.slice(1);

  const progresso = Math.min(100, Math.max(0, painel.progresso_medio));
  const utilizacao = `${painel.utilizacao_orcamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  // No mobile, o primeiro alerta de diário vira um aviso em destaque logo abaixo dos indicadores.
  const alertaDiario = painel.riscos.find((r) => r.tipo === 'DIARIO');
  const riscosSoNoDesktop = !!alertaDiario && painel.riscos.length === 1;
  const obraPorId = new Map(obras.map((o) => [o.id, o]));

  return (
    <>
      <PageHeader
        eyebrow={hoje}
        title="Visão geral"
        subtitle="Métricas de desempenho das suas obras em andamento."
        lift
        actions={
          <>
            <Link href="/orcamentos/novo" className="gp-btn gp-bs gp-only-d">Novo orçamento</Link>
            <Link href="/obras/novo" className="gp-btn gp-bd gp-only-d"><Plus size={18} weight="bold" aria-hidden="true" />Nova obra</Link>
          </>
        }
      >
        {/* Mobile: saudação e anel do progresso médio no lugar do título do desktop */}
        <div className="gp-only-m gp-4a-hero">
          {nome && (
            <Link href="/mais" className="gp-4a-perfil">
              <span className="gp-av" aria-hidden="true">{iniciais}</span>
              <span className="gp-4a-perfil-txt">
                <span>{saudacao()},</span>
                <strong>{nome}</strong>
              </span>
            </Link>
          )}
          <div className="gp-4a-anel">
            <svg width="104" height="104" viewBox="0 0 100 100" role="img" aria-label={`Progresso médio das obras ativas: ${progresso}%`}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              {progresso > 0 && (
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#9fd300" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CIRCUNFERENCIA_ANEL} strokeDashoffset={CIRCUNFERENCIA_ANEL * (1 - progresso / 100)}
                  transform="rotate(-90 50 50)"
                />
              )}
              <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="22" fontWeight="800">{progresso}%</text>
            </svg>
            <div>
              <span className="gp-ph-eb">Visão executiva</span>
              <h1 className="gp-h1">Progresso médio das obras ativas</h1>
            </div>
          </div>
        </div>
      </PageHeader>

      {/* Mobile: os três indicadores num cartão só, sobre o cabeçalho */}
      <dl className="gp-only-m gp-4a-kpis" aria-label="Indicadores principais">
        <div><dt>Obras ativas</dt><dd>{painel.obras_ativas.toString().padStart(2, '0')}</dd></div>
        <div><dt>Verba usada</dt><dd>{utilizacao}</dd></div>
        <div>
          <dt>Riscos críticos</dt>
          <dd style={painel.alertas_criticos > 0 ? { color: '#B91C1C' } : undefined}>
            {painel.alertas_criticos.toString().padStart(2, '0')}
          </dd>
        </div>
      </dl>

      {alertaDiario && (
        <div className="gp-only-m">
          <Link href={alertaDiario.href} className="gp-4a-alerta">
            <span className="gp-4a-alerta-ic" aria-hidden="true"><BookOpen size={20} weight="bold" /></span>
            <span className="gp-4a-alerta-txt">
              <strong>{alertaDiario.titulo}</strong>
              <span>{alertaDiario.descricao}</span>
            </span>
            <CaretRight size={20} weight="bold" color="#C2410C" aria-hidden="true" />
          </Link>
        </div>
      )}

      {painel.series.length > 0 && (
        <section aria-labelledby="h-andamento" className="gp-only-m">
          <div className="gp-4a-sec-tit">
            <h2 id="h-andamento" className="gp-h2">Obras em andamento</h2>
            <Link href="/obras">Ver todas</Link>
          </div>
          <ul className="gp-4a-carr">
            {painel.series.map((serie) => {
              const obra = obraPorId.get(serie.obra_id);
              const situacao = obra ? SITUACAO_OBRA[obra.status] : undefined;
              const pct = ultimoValor(serie.valores);
              return (
                <li key={serie.obra_id}>
                  <Link href={`/obras/${obra?.orcamento_id || serie.obra_id}`} className="gp-4a-carr-card">
                    <span className="gp-4a-carr-top">
                      <span aria-hidden="true" className="gp-4a-tile" style={{ background: situacao?.tile ?? '#EDF1F6', color: situacao?.cor ?? '#001b3d' }}>
                        {sigla(serie.nome)}
                      </span>
                      <span className="gp-4a-carr-nome">
                        <strong>{serie.nome}</strong>
                        {obra?.cliente && <span>{obra.cliente}</span>}
                      </span>
                    </span>
                    <span className="gp-4a-carr-pct">
                      <span style={{ color: situacao?.cor ?? '#475569' }}>
                        {situacao && <span className="gp-dot" aria-hidden="true" style={{ background: situacao.ponto }} />}
                        {situacao?.rotulo ?? 'Avanço realizado'}
                      </span>
                      <strong>{pct}%</strong>
                    </span>
                    <span className="gp-bar" role="progressbar" aria-label={`Avanço realizado de ${serie.nome}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${pct}%`, background: situacao?.barra ?? '#00a3b1' }} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-label="Indicadores" className="gp-grid gp-only-d">
        <MetricCard dark title="Obras Ativas" value={painel.obras_ativas.toString().padStart(2, '0')} />
        <MetricCard title="Progresso Médio" value={`${painel.progresso_medio}%`} />
        <MetricCard title="Orçamento Utilizado" value={utilizacao} />
        <MetricCard title="Riscos Críticos" value={painel.alertas_criticos.toString().padStart(2, '0')} />
      </section>

      <section aria-labelledby="h-atencao" className={riscosSoNoDesktop ? 'gp-only-d' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 id="h-atencao" className="gp-h2">Riscos prioritários</h2>
        {painel.riscos.length === 0 ? (
          <p className="gp-sub" style={{ margin: 0 }}>Nenhum risco identificado nas obras em andamento.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 12 }}>
            {painel.riscos.map((risco) => (
              <li key={`${risco.tipo}-${risco.href}`} className={risco === alertaDiario ? 'gp-only-d' : undefined}>
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

      <div className="gp-split gp-4a-split">
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
      {/* No fim para não ser o vizinho do cabeçalho (o `lift` sobe o elemento seguinte) */}
      <Fab href="/obras/novo" ariaLabel="Nova obra" />
    </>
  );
}
