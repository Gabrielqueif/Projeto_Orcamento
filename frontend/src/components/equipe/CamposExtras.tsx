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
        <div key={c.chave} className="flex flex-col gap-2">
          <label
            htmlFor={`extra-${c.chave}`}
            className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
          >
            {c.rotulo} {c.obrigatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            id={`extra-${c.chave}`}
            type={INPUT_TYPE[c.tipo]}
            required={c.obrigatorio}
            value={String(valores[c.chave] ?? "")}
            onChange={(e) => onChange(c.chave, e.target.value)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] outline-none transition-colors"
          />
        </div>
      ))}
    </>
  );
}
