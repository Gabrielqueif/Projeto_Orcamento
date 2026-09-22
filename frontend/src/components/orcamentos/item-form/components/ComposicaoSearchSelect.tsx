"use client";

import * as React from "react";
import { buscarComposicoes as apiBuscarComposicoes } from "@/lib/api/composicoes";
import type { ItemComposicao } from "../types";

interface ComposicaoSearchSelectProps {
  composicaoSelecionada: ItemComposicao | null;
  onSelectComposicao: (item: ItemComposicao) => void;
  onClearComposicao: () => void;
  baseBusca: string;
  onBaseBuscaChange: (base: string) => void;
  isEditing?: boolean;
}

export function ComposicaoSearchSelect({
  composicaoSelecionada,
  onSelectComposicao,
  onClearComposicao,
  baseBusca,
  onBaseBuscaChange,
  isEditing = false,
}: ComposicaoSearchSelectProps) {
  const [termo, setTermo] = React.useState("");
  const [resultados, setResultados] = React.useState<ItemComposicao[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiBuscarComposicoes(termo, baseBusca);
        setResultados(data || []);
      } catch (err) {
        console.error(err);
        setError("Erro ao buscar composições.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termo, baseBusca]);

  const handleSelect = (item: ItemComposicao) => {
    onSelectComposicao(item);
    setResultados([]);
    setTermo("");
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-bold" htmlFor="busca">
          Buscar Composição
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onBaseBuscaChange("SINAPI")}
            className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
              baseBusca === "SINAPI"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            SINAPI
          </button>
          <button
            type="button"
            onClick={() => onBaseBuscaChange("SEINFRA")}
            className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
              baseBusca === "SEINFRA"
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            SEINFRA
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      {composicaoSelecionada ? (
        <div className="border border-green-300 bg-green-50 p-3 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-800 flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    composicaoSelecionada.fonte === "SEINFRA"
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {composicaoSelecionada.fonte}
                </span>
                {composicaoSelecionada.codigo_composicao} - {composicaoSelecionada.descricao}
              </p>
              <p className="text-sm text-slate-600">
                Unidade: {composicaoSelecionada.unidade}
              </p>
            </div>
            {!isEditing ? (
              <button
                type="button"
                onClick={onClearComposicao}
                className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                title="Remover seleção"
              >
                ✕
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearComposicao}
                className="text-brand-primary hover:text-brand-navy text-sm underline ml-4 cursor-pointer"
              >
                Trocar Serviço
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <input
            type="text"
            id="busca"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Digite código ou descrição da composição"
            className="border border-gray-300 p-2 w-full rounded-md outline-none focus:ring-2 focus:ring-brand-primary"
          />
          {loading && (
            <p className="text-sm text-slate-500 mt-1">Buscando...</p>
          )}
          {resultados.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white shadow-sm">
              {resultados.map((item) => (
                <div
                  key={`${item.fonte}-${item.codigo_composicao}`}
                  onClick={() => handleSelect(item)}
                  className="p-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.fonte === "SEINFRA"
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {item.fonte}
                    </span>
                    {item.codigo_composicao} - {item.descricao}
                  </p>
                  <p className="text-sm text-slate-600">
                    Unidade: {item.unidade}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
