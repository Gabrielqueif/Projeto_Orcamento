"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { obterBase, type BasePropria } from "@/lib/api/basesProprias";
import { InsumosTab } from "./InsumosTab";
import { ComposicoesTab } from "./ComposicoesTab";
import { PageHeader } from "@/components/layout/PageHeader";

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
      <PageHeader
        back="/bases"
        backLabel="Voltar para bases de dados"
        crumb={<><Link href="/bases">Bases de dados</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>{nome}</span></>}
        eyebrow="Base própria"
        title={nome}
        badge={base && <span className="gp-bg gp-te">Própria</span>}
        subtitle={
          (base?.descricao || meta.length > 0) && (
            <>
              {base?.descricao}
              {base?.descricao && meta.length > 0 && <br />}
              {meta.join(" · ")}
            </>
          )
        }
      >
        {/* Mobile: abas em controle segmentado dentro do cabeçalho escuro */}
        {!erro && (
          <div className="gp-only-m">
            <div role="tablist" aria-label="Conteúdo da base" className="gp-4e-seg">
              {ABAS.map((a) => (
                <button
                  key={a.k}
                  type="button"
                  role="tab"
                  id={`tpm-${a.k}`}
                  aria-selected={aba === a.k}
                  aria-controls="pb"
                  onClick={() => setAba(a.k)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </PageHeader>

      {erro && <p style={{ margin: 0, color: "#B91C1C" }}>{erro}</p>}

      {!erro && (
        <section className="gp-card gp-m-flat" style={{ overflow: "hidden" }}>
          <div role="tablist" aria-label="Conteúdo da base" className="gp-4e-dtabs">
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
