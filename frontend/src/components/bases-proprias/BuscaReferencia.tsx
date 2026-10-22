"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { listarComposicoes, listarInsumos, type RefFonte, type RefTipo } from "@/lib/api/basesProprias";
import { buscarComposicoes, buscarInsumos } from "@/lib/api/composicoes";
import { FONTES_REF, TIPOS_REF } from "@/lib/basesPropriasUtils";

export interface ReferenciaEscolhida {
  ref_fonte: RefFonte;
  ref_tipo: RefTipo;
  ref_codigo: string;
  descricao: string;
  unidade: string;
}

const campo = "border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 bg-white";

/** Busca insumos/composições na base própria, SINAPI ou SEINFRA e devolve a referência escolhida. */
export function BuscaReferencia({
  baseId,
  composicaoId,
  onEscolher,
}: {
  baseId: string;
  composicaoId?: string;
  onEscolher: (ref: ReferenciaEscolhida) => void;
}) {
  const [fonte, setFonte] = useState<RefFonte>("PROPRIA");
  const [tipo, setTipo] = useState<RefTipo>("INSUMO");
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ReferenciaEscolhida[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    const q = termo.trim();
    if (q.length < 2) return;
    setBuscando(true);
    setErro(null);
    try {
      let lista: ReferenciaEscolhida[];
      if (fonte === "PROPRIA" && tipo === "INSUMO") {
        const r = await listarInsumos(baseId, { q, limite: 20 });
        lista = r.map((i) => ({
          ref_fonte: fonte,
          ref_tipo: tipo,
          ref_codigo: i.codigo,
          descricao: i.descricao,
          unidade: i.unidade,
        }));
      } else if (fonte === "PROPRIA") {
        const r = await listarComposicoes(baseId, { q, limite: 20 });
        lista = r
          .filter((c) => c.id !== composicaoId)
          .map((c) => ({
            ref_fonte: fonte,
            ref_tipo: tipo,
            ref_codigo: c.codigo,
            descricao: c.descricao,
            unidade: c.unidade,
          }));
      } else if (tipo === "INSUMO") {
        const r = await buscarInsumos(q, fonte);
        lista = r.slice(0, 20).map((i) => ({
          ref_fonte: fonte,
          ref_tipo: tipo,
          ref_codigo: i.codigo_insumo,
          descricao: i.descricao,
          unidade: i.unidade,
        }));
      } else {
        const r = await buscarComposicoes(q, fonte);
        lista = r.slice(0, 20).map((c) => ({
          ref_fonte: fonte,
          ref_tipo: tipo,
          ref_codigo: c.codigo_composicao,
          descricao: c.descricao,
          unidade: c.unidade,
        }));
      }
      setResultados(lista);
      setBuscou(true);
    } catch {
      setErro("Não foi possível buscar. Tente novamente.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={buscar} className="flex flex-wrap gap-2">
        <select aria-label="Fonte" value={fonte} onChange={(e) => setFonte(e.target.value as RefFonte)} className={campo}>
          {FONTES_REF.map((f) => (
            <option key={f.valor} value={f.valor}>{f.rotulo}</option>
          ))}
        </select>
        <select aria-label="Tipo de referência" value={tipo} onChange={(e) => setTipo(e.target.value as RefTipo)} className={campo}>
          {TIPOS_REF.map((t) => (
            <option key={t.valor} value={t.valor}>{t.rotulo}</option>
          ))}
        </select>
        <input
          aria-label="Buscar referência"
          placeholder="Código ou descrição (mín. 2 letras)"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          className={`${campo} flex-1 min-w-[180px]`}
        />
        <button
          type="submit"
          disabled={buscando || termo.trim().length < 2}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
        >
          <MagnifyingGlass size={16} /> {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {buscou && resultados.length === 0 && !erro && (
        <p className="text-sm text-slate-500">Nada encontrado.</p>
      )}
      {resultados.length > 0 && (
        <ul className="max-h-48 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
          {resultados.map((r) => (
            <li key={`${r.ref_fonte}-${r.ref_tipo}-${r.ref_codigo}`}>
              <button
                type="button"
                onClick={() => {
                  onEscolher(r);
                  setResultados([]);
                  setTermo("");
                  setBuscou(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-mono text-xs text-slate-500 mr-2">{r.ref_codigo}</span>
                {r.descricao}
                <span className="text-slate-400"> · {r.unidade}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
