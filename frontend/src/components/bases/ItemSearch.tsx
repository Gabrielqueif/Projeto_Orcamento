'use client';

import React, { useState } from 'react';
import { buscarComposicoes, buscarInsumos, getEstadosComposicao, type ItemComposicao, type ItemInsumo, type PrecosEstado } from '@/lib/api/composicoes';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export function ItemSearch() {
  const [termo, setTermo] = useState('');
  const [fonte, setFonte] = useState('SINAPI');
  const [aba, setAba] = useState<'composicoes' | 'insumos'>('composicoes');
  const [resultados, setResultados] = useState<ItemComposicao[]>([]);
  const [insumos, setInsumos] = useState<ItemInsumo[]>([]);
  const [uf, setUf] = useState('CE');
  const [tipo, setTipo] = useState('Sem Desoneração');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [precosAbertos, setPrecosAbertos] = useState<Record<string, PrecosEstado | null>>({});
  const [loadingPrecos, setLoadingPrecos] = useState<Record<string, boolean>>({});

  const formatarMoeda = (valor: number | string | null) => {
    if (valor === null || valor === undefined) return '-';
    const numero = Number(valor);
    if (isNaN(numero)) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!termo.trim()) return;

    setLoading(true);
    setResultados([]);
    setInsumos([]);
    setError(null);
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

  const togglePreco = async (item: ItemComposicao) => {
    const { codigo_composicao, mes_referencia, fonte } = item;
    if (precosAbertos[codigo_composicao] !== undefined) {
      const novoEstado = { ...precosAbertos };
      delete novoEstado[codigo_composicao];
      setPrecosAbertos(novoEstado);
      return;
    }
    setLoadingPrecos((prev) => ({ ...prev, [codigo_composicao]: true }));
    try {
      const data = await getEstadosComposicao(codigo_composicao, mes_referencia, fonte);
      if (data && data.length > 0) {
        setPrecosAbertos((prev) => ({ ...prev, [codigo_composicao]: data[0] }));
      } else {
        setPrecosAbertos((prev) => ({ ...prev, [codigo_composicao]: null }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPrecos((prev) => ({ ...prev, [codigo_composicao]: false }));
    }
  };

  return (
    <div className="w-full">
      {/* --- BUSCA --- */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <div className="flex gap-2 mb-3">
          {(['composicoes', 'insumos'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAba(a);
                setResultados([]);
                setInsumos([]);
                setError(null);
              }}
              className={`text-xs px-3 py-1 rounded-full font-bold transition ${
                aba === a ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              {a === 'composicoes' ? 'Composições' : 'Insumos'}
            </button>
          ))}
          {aba === 'insumos' && (
            <>
              <select
                className="ml-auto px-2 py-1 rounded border border-slate-300 bg-white text-xs"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                aria-label="Estado"
              >
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <select
                className="px-2 py-1 rounded border border-slate-300 bg-white text-xs"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                aria-label="Tipo de preço"
              >
                <option value="Sem Desoneração">Sem desoneração</option>
                <option value="Com Desoneração">Com desoneração</option>
                <option value="Empreitada">Empreitada</option>
              </select>
            </>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <select
            className="px-4 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-sm"
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
          >
            <option value="SINAPI">SINAPI</option>
            <option value="SEINFRA">SEINFRA</option>
          </select>
          <input
            type="text"
            placeholder="Ex: Cimento, Bloco, 94382 ou I1234..."
            className="flex-1 px-4 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-primary hover:bg-brand-navy text-white font-bold px-6 py-2 rounded transition whitespace-nowrap text-sm"
          >
            {loading ? 'Buscando...' : 'Pesquisar'}
          </button>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* --- RESULTADOS --- */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {resultados.length === 0 && insumos.length === 0 && !loading && termo && !error && (
          <p className="text-center text-slate-400 py-4">Nenhum resultado encontrado.</p>
        )}

        {insumos.map((item) => (
          <div key={`${item.fonte}-${item.mes_referencia}-${item.codigo_insumo}`} className="bg-white border rounded-md p-3">
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="font-bold text-brand-primary uppercase">CÓD: {item.codigo_insumo}</span>
              <span className="bg-gray-100 text-gray-500 px-1 rounded uppercase">{item.unidade}</span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <h4 className="text-sm font-medium text-slate-700">{item.descricao}</h4>
              <span className="text-sm font-semibold text-green-700 whitespace-nowrap">
                {formatarMoeda(item.precos?.[uf.toLowerCase()] ?? null)}
              </span>
            </div>
          </div>
        ))}

        {resultados.map((item) => {
          const isOpen = precosAbertos[item.codigo_composicao] !== undefined;
          return (
            <div key={item.codigo_composicao} className={`bg-white border rounded-md overflow-hidden ${isOpen ? 'ring-1 ring-brand-primary/30' : ''}`}>
              <div
                onClick={() => togglePreco(item)}
                className="p-3 cursor-pointer flex justify-between items-center hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-bold text-brand-primary uppercase">CÓD: {item.codigo_composicao}</span>
                    <span className="bg-gray-100 text-gray-500 px-1 rounded uppercase">{item.unidade}</span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-700">{item.descricao}</h4>
                </div>
                <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div className="bg-slate-50 p-3 border-t grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {loadingPrecos[item.codigo_composicao] ? (
                    <p className="col-span-full text-center text-xs text-slate-400">Carregando...</p>
                  ) : (
                    Object.entries(precosAbertos[item.codigo_composicao] || {})
                      .filter(([k, v]) => k.length === 2 && v !== null)
                      .sort()
                      .map(([uf, val]) => (
                        <div key={uf} className="text-center border bg-white rounded p-1">
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{uf}</div>
                          <div className="text-xs font-semibold text-green-700">{formatarMoeda(val)}</div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}