'use client';

import React, { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { buscarComposicoes, buscarInsumos, getEstadosComposicao, type ItemComposicao, type ItemInsumo, type PrecosEstado } from '@/lib/api/composicoes';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const formatarMoeda = (valor: number | string | null) => {
  if (valor === null || valor === undefined) return '-';
  const numero = Number(valor);
  if (isNaN(numero)) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
};

const tabStyle = (on: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '0 16px', border: 0, background: 'transparent',
  fontSize: 15, cursor: 'pointer', color: on ? '#001b3d' : '#475569', fontWeight: on ? 800 : 600,
  boxShadow: on ? 'inset 0 -3px 0 #9fd300' : undefined,
});

const rowBtn = (on: boolean): React.CSSProperties => ({
  width: '100%', padding: '6px 8px', margin: '-6px -8px', border: 0, borderRadius: 8, textAlign: 'left', fontSize: 14, lineHeight: 1.4,
  cursor: 'pointer', color: '#001b3d', background: on ? '#F7FCE9' : 'transparent', fontWeight: on ? 800 : 600,
  boxShadow: on ? 'inset 3px 0 0 #9fd300' : undefined,
});

const comparar = (mapa: Record<string, number | string | null | undefined>) =>
  Object.entries(mapa)
    .filter(([k, v]) => k.length === 2 && v !== null && v !== undefined)
    .sort(([x], [y]) => x.localeCompare(y));

export function ItemSearch({ fonte: fonteInicial = 'SINAPI' }: { fonte?: string }) {
  const [termo, setTermo] = useState('');
  const [fonte, setFonte] = useState(fonteInicial);
  const [aba, setAba] = useState<'composicoes' | 'insumos'>('composicoes');
  const [resultados, setResultados] = useState<ItemComposicao[]>([]);
  const [insumos, setInsumos] = useState<ItemInsumo[]>([]);
  const [uf, setUf] = useState('CE');
  const [tipo, setTipo] = useState('Sem Desoneração');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const [precosAbertos, setPrecosAbertos] = useState<Record<string, PrecosEstado | null>>({});
  const [loadingPrecos, setLoadingPrecos] = useState<Record<string, boolean>>({});

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!termo.trim()) return;

    setLoading(true);
    setResultados([]);
    setInsumos([]);
    setError(null);
    setSelecionado(null);
    try {
      if (aba === 'insumos') {
        setInsumos((await buscarInsumos(termo, fonte, tipo)) || []);
      } else {
        setResultados((await buscarComposicoes(termo, fonte)) || []);
      }
    } catch (err) {
      console.error(err);
      setError(aba === 'insumos' ? "Erro ao buscar insumos" : "Erro ao buscar composições");
    } finally {
      setLoading(false);
    }
  };

  // Seleciona a composição (painel lateral) e carrega os preços por estado uma única vez.
  const selecionar = async (item: ItemComposicao) => {
    const { codigo_composicao, mes_referencia, fonte } = item;
    setSelecionado(codigo_composicao);
    if (precosAbertos[codigo_composicao] !== undefined) return;
    setLoadingPrecos((prev) => ({ ...prev, [codigo_composicao]: true }));
    try {
      const data = await getEstadosComposicao(codigo_composicao, mes_referencia, fonte);
      setPrecosAbertos((prev) => ({ ...prev, [codigo_composicao]: data && data.length > 0 ? data[0] : null }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPrecos((prev) => ({ ...prev, [codigo_composicao]: false }));
    }
  };

  const selComp = aba === 'composicoes' ? resultados.find((r) => r.codigo_composicao === selecionado) ?? null : null;
  const selIns = aba === 'insumos' ? insumos.find((i) => i.codigo_insumo === selecionado) ?? null : null;
  const total = aba === 'insumos' ? insumos.length : resultados.length;
  const mapaSel = selComp ? precosAbertos[selComp.codigo_composicao] : selIns?.precos;

  return (
    <>
      <form onSubmit={handleSearch} className="gp-card gp-pad" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
        <div className="gp-fld" style={{ flex: '1 1 160px' }}>
          <label htmlFor="bs-fonte" className="gp-lb">Fonte</label>
          <select id="bs-fonte" className="gp-in" value={fonte} onChange={(e) => setFonte(e.target.value)}>
            <option value="SINAPI">SINAPI</option>
            <option value="SEINFRA">SEINFRA</option>
          </select>
        </div>
        <div className="gp-fld" style={{ flex: '2 1 300px' }}>
          <label htmlFor="bs-termo" className="gp-lb">Código ou descrição</label>
          <div className="gp-srch" style={{ height: 48 }}>
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" color="#475569" />
            <input id="bs-termo" type="search" placeholder="Ex: Cimento, Bloco, 94382 ou I1234..." value={termo} onChange={(e) => setTermo(e.target.value)} />
          </div>
        </div>
        {aba === 'insumos' && (
          <>
            <div className="gp-fld" style={{ flex: '1 1 110px' }}>
              <label htmlFor="bs-uf" className="gp-lb">Estado (UF)</label>
              <select id="bs-uf" className="gp-in" value={uf} onChange={(e) => setUf(e.target.value)}>
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="gp-fld" style={{ flex: '1 1 200px' }}>
              <label htmlFor="bs-tipo" className="gp-lb">Variante</label>
              <select id="bs-tipo" className="gp-in" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="Sem Desoneração">Sem desoneração</option>
                <option value="Com Desoneração">Com desoneração</option>
                <option value="Empreitada">Empreitada</option>
              </select>
            </div>
          </>
        )}
        <button type="submit" disabled={loading} className="gp-btn gp-bd" style={{ minHeight: 48 }}>
          {loading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>
      {error && <p role="alert" style={{ margin: 0, color: '#B91C1C', fontSize: 14 }}>{error}</p>}

      <div className="gp-split">
        <section className="gp-card gp-main" aria-label="Resultados" style={{ overflow: 'hidden' }}>
          <div role="tablist" aria-label="Tipo" style={{ display: 'flex', gap: 4, padding: '12px 16px 0', borderBottom: '1px solid #E6EBF2' }}>
            {(['composicoes', 'insumos'] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="tab"
                id={`tb-${a}`}
                aria-selected={aba === a}
                aria-controls="res"
                style={tabStyle(aba === a)}
                onClick={() => {
                  setAba(a);
                  setResultados([]);
                  setInsumos([]);
                  setError(null);
                  setSelecionado(null);
                }}
              >
                {a === 'composicoes' ? 'Composições' : 'Insumos'}
                {aba === a && !loading && total > 0 && <span className="gp-cnt">{total}</span>}
              </button>
            ))}
          </div>
          <div id="res" role="tabpanel" aria-labelledby={`tb-${aba}`} style={{ overflowX: 'auto' }}>
            {total === 0 ? (
              <p style={{ textAlign: 'center', color: '#475569', padding: 24, margin: 0 }}>
                {loading ? 'Buscando...' : termo && !error ? 'Nenhum resultado encontrado.' : 'Digite um código ou descrição e pesquise.'}
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <caption className="gp-sr">Resultados da busca</caption>
                <thead>
                  <tr>
                    <th scope="col" className="gp-th" style={{ paddingLeft: 22, width: 100 }}>Código</th>
                    <th scope="col" className="gp-th">Descrição</th>
                    <th scope="col" className="gp-th" style={{ width: 60 }}>Un.</th>
                    <th scope="col" className="gp-th" style={{ textAlign: 'right', paddingRight: 22, width: 130 }}>
                      {aba === 'insumos' ? `Preço ${uf}` : 'Preço'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aba === 'insumos'
                    ? insumos.map((item) => {
                        const on = selecionado === item.codigo_insumo;
                        return (
                          <tr key={`${item.fonte}-${item.mes_referencia}-${item.codigo_insumo}`}>
                            <td className="gp-td gp-mono" style={{ paddingLeft: 22, fontWeight: 600, color: '#3F6604' }}>{item.codigo_insumo}</td>
                            <th scope="row" className="gp-td" style={{ textAlign: 'left', fontWeight: 400 }}>
                              <button type="button" aria-pressed={on} onClick={() => setSelecionado(item.codigo_insumo)} style={rowBtn(on)}>
                                {item.descricao}
                              </button>
                            </th>
                            <td className="gp-td" style={{ color: '#475569' }}>{item.unidade}</td>
                            <td className="gp-td gp-mono" style={{ textAlign: 'right', paddingRight: 22, fontWeight: 600 }}>
                              {formatarMoeda(item.precos?.[uf.toLowerCase()] ?? null)}
                            </td>
                          </tr>
                        );
                      })
                    : resultados.map((item) => {
                        const on = selecionado === item.codigo_composicao;
                        return (
                          <tr key={item.codigo_composicao}>
                            <td className="gp-td gp-mono" style={{ paddingLeft: 22, fontWeight: 600, color: '#3F6604' }}>{item.codigo_composicao}</td>
                            <th scope="row" className="gp-td" style={{ textAlign: 'left', fontWeight: 400 }}>
                              <button type="button" aria-pressed={on} onClick={() => selecionar(item)} style={rowBtn(on)}>
                                {item.descricao}
                              </button>
                            </th>
                            <td className="gp-td" style={{ color: '#475569' }}>{item.unidade}</td>
                            <td className="gp-td gp-mono" style={{ textAlign: 'right', paddingRight: 22, fontWeight: 600 }}>
                              {item.preco ? formatarMoeda(item.preco) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside className="gp-card gp-pad gp-side" aria-labelledby="h-det" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selComp || selIns ? (
            <>
              <span className="gp-mono" style={{ alignSelf: 'flex-start', padding: '3px 8px', borderRadius: 8, background: '#E6F6D0', color: '#3F6604', fontSize: 13, fontWeight: 600 }}>
                {selComp ? selComp.codigo_composicao : selIns?.codigo_insumo}
              </span>
              <h2 id="h-det" className="gp-h2" style={{ lineHeight: 1.35 }}>{selComp ? selComp.descricao : selIns?.descricao}</h2>
              <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 8, padding: '12px 14px', borderRadius: 12, background: '#F4F6FA' }}>
                <span className="gp-ml">{selComp ? `Referência ${selComp.mes_referencia}` : `Preço em ${uf}`}</span>
                <strong className="gp-mono">
                  {selComp ? formatarMoeda(selComp.preco ?? null) : formatarMoeda(selIns?.precos?.[uf.toLowerCase()] ?? null)} / {selComp ? selComp.unidade : selIns?.unidade}
                </strong>
              </p>
              <p className="gp-ml" style={{ margin: '4px 0 0' }}>Comparar estados</p>
              {selComp && loadingPrecos[selComp.codigo_composicao] ? (
                <p className="gp-hint" style={{ margin: 0 }}>Carregando...</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {comparar(mapaSel || {}).map(([k, v]) => (
                    <li key={k} className="gp-li" style={{ padding: '8px 0' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{k.toUpperCase()}</span>
                      <span className="gp-mono" style={{ fontSize: 14 }}>{formatarMoeda(v ?? null)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <h2 id="h-det" className="gp-h2">Detalhes</h2>
              <p className="gp-hint" style={{ margin: 0 }}>Selecione um item da lista para ver o preço em cada estado.</p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
