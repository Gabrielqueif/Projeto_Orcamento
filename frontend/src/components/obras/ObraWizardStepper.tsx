"use client";

import React from "react";
import Link from "next/link";

export interface StepItem {
  num: number;
  label: string;
}

interface ObraWizardStepperProps {
  currentStep: number;
}

const STEPS: StepItem[] = [
  { num: 1, label: "Dados" },
  { num: 2, label: "Equipe" },
  { num: 3, label: "Financeiro" },
];

/** Cabeçalho do wizard de nova obra: trilha, título e indicador de etapas. */
export function ObraWizardStepper({ currentStep }: ObraWizardStepperProps) {
  const total = STEPS.length;
  const atual = STEPS.find((s) => s.num === currentStep);
  return (
    <>
      <div>
        <nav aria-label="Trilha" className="gp-crumb">
          <Link href="/obras">Obras</Link> /{" "}
          <span aria-current="page" style={{ color: "#001b3d" }}>Nova obra</span>
        </nav>
        <h1 className="gp-h1">Nova obra</h1>
      </div>

      <ol
        aria-label="Etapas"
        style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
      >
        {STEPS.map((s) => {
          const cur = s.num === currentStep;
          const done = s.num < currentStep;
          return (
            <li
              key={s.num}
              aria-current={cur ? "step" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16,
                ...(cur ? { background: "#fff", boxShadow: "inset 0 0 0 2px #001b3d" } : done ? { background: "#E6F6D0" } : { background: "#EDF1F6" }),
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 34, height: 34, flex: "0 0 34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
                  ...(cur ? { background: "#001b3d", color: "#fff" } : done ? { background: "#65A30D", color: "#fff" } : { background: "#fff", color: "#334155" }),
                }}
              >
                {done ? "✓" : s.num}
              </span>
              <span>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                  Etapa {s.num} de {total}
                </span>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{s.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="gp-sr" aria-live="polite">
        Etapa {currentStep} de {total}: {atual?.label}
      </p>
    </>
  );
}

/** Painel lateral escuro com o resumo do que já foi preenchido. */
export function ObraWizardResumo({ itens }: { itens: { label: string; valor: string }[] }) {
  return (
    <aside className="gp-side gp-card gp-pad gp-dark" aria-labelledby="h-r" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 id="h-r" className="gp-h2" style={{ color: "#fff" }}>Resumo</h2>
      <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
        {itens.map((i) => (
          <div key={i.label} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <dt style={{ color: "#cbd5e1" }}>{i.label}</dt>
            <dd style={{ margin: 0, fontWeight: 700, textAlign: "right" }}>{i.valor}</dd>
          </div>
        ))}
      </dl>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#cbd5e1" }}>
        Esses dados preenchem o cabeçalho dos relatórios, do diário e dos boletins.
      </p>
    </aside>
  );
}

const dm = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "—");

/** Linhas fixas do resumo (obra e período) a partir dos dados do wizard. */
export function resumoBase(d: { nome: string; dataInicio: string; dataTermino: string }) {
  return [
    { label: "Obra", valor: d.nome || "—" },
    { label: "Período", valor: `${dm(d.dataInicio)} a ${dm(d.dataTermino)}` },
  ];
}
