"use client";

import * as React from "react";
import type { Etapa } from "@/lib/api/orcamentos";

interface EtapaSelectProps {
  etapas: Etapa[];
  etapaId: string;
  onChangeEtapaId: (id: string) => void;
}

export function EtapaSelect({
  etapas,
  etapaId,
  onChangeEtapaId,
}: EtapaSelectProps) {
  if (etapas.length === 0) return null;

  const renderOptions = (parentId: string | null = null, level = 0): React.ReactNode => {
    return etapas
      .filter((etapa) => etapa.parent_id === parentId)
      .sort((a, b) => a.ordem - b.ordem)
      .map((etapa) => (
        <React.Fragment key={etapa.id}>
          <option value={etapa.id}>
            {"\u00A0".repeat(level * 4)}
            {level > 0 ? "↳ " : ""}
            {etapa.nome}
          </option>
          {renderOptions(etapa.id, level + 1)}
        </React.Fragment>
      ));
  };

  return (
    <div>
      <label className="block text-sm font-bold mb-2" htmlFor="etapa">
        Etapa
      </label>
      <select
        id="etapa"
        value={etapaId}
        onChange={(e) => onChangeEtapaId(e.target.value)}
        className="border border-gray-300 p-2 w-full rounded-md bg-white focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
      >
        <option value="">Sem etapa definida</option>
        {renderOptions()}
      </select>
    </div>
  );
}
