"use client";

import React from "react";
import type { CampoExtra } from "@/lib/api/cargos";

interface Props {
  campos: CampoExtra[];
  valores: Record<string, unknown>;
  onChange: (chave: string, valor: string) => void;
}

const INPUT_TYPE = { texto: "text", numero: "number", data: "date" } as const;

export function CamposExtras({ campos, valores, onChange }: Props) {
  return (
    <>
      {campos.map((c) => (
        <div key={c.chave} className="gp-fld">
          <label
            htmlFor={`extra-${c.chave}`}
            className="gp-lb"
          >
            {c.rotulo} {c.obrigatorio && <span className="gp-req">(obrigatório)</span>}
          </label>
          <input
            id={`extra-${c.chave}`}
            type={INPUT_TYPE[c.tipo]}
            required={c.obrigatorio}
            value={String(valores[c.chave] ?? "")}
            onChange={(e) => onChange(c.chave, e.target.value)}
            className="gp-in"
          />
        </div>
      ))}
    </>
  );
}
