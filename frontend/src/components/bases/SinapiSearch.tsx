'use client';

import { useState } from 'react';
import { buscarComposicoes, getEstadosComposicao, type ItemComposicao, type PrecosEstado } from '@/lib/api/composicoes';

export function SinapiSearch() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ItemComposicao[]>([]);
  const [loading, setLoading] = useState(false);

  const [precosAbertos, setPrecosAbertos] = useState<Record<string, PrecosEstado | null>>({});
  const [loadingPrecos, setLoadingPrecos] = useState<Record<string, boolean>>({});

  const formatarMoeda = (valor: number | string | null) => {
    if (valor === null || valor === undefined) return '-';
    const numero = Number(valor);
    if (isNaN(numero)) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
  };

  const buscarItens = async () => {
    if (!termo) return;
    setLoading(true);
    setResultados([]);
    try {
      const data = await buscarComposicoes(termo);
      setResultados(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const togglePreco = async (codigo: string) => {
    if (precosAbertos[codigo] !== undefined) {
      const novoEstado = { ...precosAbertos };
      delete novoEstado[codigo];
      setPrecosAbertos(novoEstado);
      return;
    }
    setLoadingPrecos((prev) => ({ ...prev, [codigo]: true }));
    try {
      const data = await getEstadosComposicao(codigo);
      if (data && data.length > 0) {
        setPrecosAbertos((prev) => ({ ...prev, [codigo]: data[0] }));
      } else {
        setPrecosAbertos((prev) => ({ ...prev, [codigo]: null }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPrecos((prev) => ({ ...prev, [codigo]: false }));
    }
  };

  return (
    <div className="w-full">
      {/* --- BUSCA --- */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ex: Cimento, Bloco, 94382..."
            className="flex-1 px-4 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarItens()}
          />
          <button
            onClick={buscarItens}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded transition"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* --- RESULTADOS --- */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {resultados.length === 0 && !loading && termo && (
          <p className="text-center text-slate-400 py-4">Nenhum resultado encontrado.</p>
        )}

        {resultados.map((item) => {
          const isOpen = precosAbertos[item.codigo_composicao] !== undefined;
          return (
            <div key={item.codigo_composicao} className={`bg-white border rounded-md overflow-hidden ${isOpen ? 'ring-1 ring-blue-300' : ''}`}>
              <div
                onClick={() => togglePreco(item.codigo_composicao)}
                className="p-3 cursor-pointer flex justify-between items-center hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-bold text-blue-700">CÓD: {item.codigo_composicao}</span>
                    <span className="bg-gray-100 text-gray-500 px-1 rounded">{item.unidade}</span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-700">{item.descricao}</h4>
                </div>
                <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div className="bg-slate-50 p-3 border-t grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {loadingPrecos[item.codigo_composicao] ? (
                    <p className="col-span-full text-center text-xs text-slate-400">Carregando...</p>
                  ) : (
                    Object.entries(precosAbertos[item.codigo_composicao] || {})
                      .filter(([k, v]) => k.length === 2 && v !== null)
                      .sort()
                      .map(([uf, val]) => (
                        <div key={uf} className="text-center border bg-white rounded p-1">
                          <div className="text-[10px] text-gray-400 font-bold">{uf}</div>
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