"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { obterBase, type BasePropria } from "@/lib/api/basesProprias";
import { InsumosTab } from "./InsumosTab";
import { ComposicoesTab } from "./ComposicoesTab";

type Aba = "insumos" | "composicoes";

export function BasePropriaView({ baseId }: { baseId: string }) {
  const [base, setBase] = useState<BasePropria | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("insumos");

  useEffect(() => {
    obterBase(baseId)
      .then(setBase)
      .catch(() => setErro("Base não encontrada."));
  }, [baseId]);

  const abaClasse = (a: Aba) =>
    `px-4 py-2 text-sm font-bold border-b-2 -mb-px ${
      aba === a ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <Link href="/bases" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Bases de dados
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">{base ? base.nome : "Base própria"}</h1>
        {base?.descricao && <p className="text-sm text-slate-500">{base.descricao}</p>}
      </div>

      {erro && <p className="text-red-600">{erro}</p>}

      {!erro && (
        <div className="bg-white rounded-lg shadow-md border border-slate-100 p-4 md:p-6">
          <div className="flex border-b border-slate-200 mb-6" role="tablist">
            <button role="tab" aria-selected={aba === "insumos"} className={abaClasse("insumos")} onClick={() => setAba("insumos")}>
              Insumos
            </button>
            <button
              role="tab"
              aria-selected={aba === "composicoes"}
              className={abaClasse("composicoes")}
              onClick={() => setAba("composicoes")}
            >
              Composições
            </button>
          </div>
          {aba === "insumos" ? (
            <InsumosTab baseId={baseId} />
          ) : (
            <ComposicoesTab baseId={baseId} ufPadrao={base?.uf ?? undefined} />
          )}
        </div>
      )}
    </div>
  );
}
