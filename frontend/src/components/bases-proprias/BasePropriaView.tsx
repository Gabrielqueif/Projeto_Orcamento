"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { obterBase, type BasePropria } from "@/lib/api/basesProprias";
import { InsumosTab } from "./InsumosTab";
import { ComposicoesTab } from "./ComposicoesTab";

type Aba = "insumos" | "composicoes";

const ABAS: { k: Aba; label: string }[] = [
  { k: "insumos", label: "Insumos" },
  { k: "composicoes", label: "Composições" },
];

export function BasePropriaView({ baseId }: { baseId: string }) {
  const [base, setBase] = useState<BasePropria | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("insumos");

  useEffect(() => {
    obterBase(baseId)
      .then(setBase)
      .catch(() => setErro("Base não encontrada."));
  }, [baseId]);

  const nome = base ? base.nome : "Base própria";
  const meta = [
    base?.uf ? `UF ${base.uf}` : null,
    base?.updated_at ? `atualizada em ${new Date(base.updated_at).toLocaleDateString("pt-BR")}` : null,
  ].filter(Boolean);

  const tabStyle = (on: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    minHeight: 48,
    padding: "0 16px",
    border: 0,
    background: "transparent",
    fontSize: 15,
    cursor: "pointer",
    color: on ? "#001b3d" : "#475569",
    fontWeight: on ? 800 : 600,
    boxShadow: on ? "inset 0 -3px 0 #9fd300" : undefined,
  });

  return (
    <>
      <div>
        <nav aria-label="Trilha" className="gp-crumb">
          <Link href="/bases">Bases de dados</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>{nome}</span>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <h1 className="gp-h1" style={{ margin: 0 }}>{nome}</h1>
          {base && <span className="gp-bg gp-te">Própria</span>}
        </div>
        {base?.descricao && <p className="gp-sub">{base.descricao}</p>}
        {meta.length > 0 && <p className="gp-sub" style={{ marginTop: base?.descricao ? 2 : 4 }}>{meta.join(" · ")}</p>}
      </div>

      {erro && <p style={{ margin: 0, color: "#B91C1C" }}>{erro}</p>}

      {!erro && (
        <section className="gp-card" style={{ overflow: "hidden" }}>
          <div role="tablist" aria-label="Conteúdo da base" style={{ display: "flex", gap: 4, padding: "12px 16px 0", borderBottom: "1px solid #E6EBF2" }}>
            {ABAS.map((a) => (
              <button
                key={a.k}
                type="button"
                role="tab"
                id={`tp-${a.k}`}
                aria-selected={aba === a.k}
                aria-controls="pb"
                style={tabStyle(aba === a.k)}
                onClick={() => setAba(a.k)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div id="pb" role="tabpanel" aria-labelledby={`tp-${aba}`}>
            {aba === "insumos" ? (
              <InsumosTab baseId={baseId} />
            ) : (
              <ComposicoesTab baseId={baseId} ufPadrao={base?.uf ?? undefined} />
            )}
          </div>
        </section>
      )}
    </>
  );
}
