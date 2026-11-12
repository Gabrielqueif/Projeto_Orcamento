"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { RouteLoading } from "@/components/common/route-loading";
import { getObrasDoCanteiro } from "@/lib/api/acesso";
import { PendentesBanner } from "@/components/canteiro/PendentesBanner";
import { comCache } from "@/lib/offline/db";
import type { ResumoDiario, SituacaoDiario } from "@/lib/api/diario";

const SITUACAO: Record<SituacaoDiario, { rotulo: string; cor: string; fundo: string }> = {
  ENVIADO: { rotulo: "Enviado hoje", cor: "#3F6604", fundo: "#E6F6D0" },
  RASCUNHO: { rotulo: "Rascunho", cor: "#9A3412", fundo: "#FFEDD5" },
  PENDENTE: { rotulo: "Pendente", cor: "#475569", fundo: "#EDF1F6" },
  ALERTA: { rotulo: "Atrasado", cor: "#B91C1C", fundo: "#FEE2E2" },
};

export default function CanteiroPage() {
  const [dados, setDados] = useState<ResumoDiario | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    comCache("canteiro:obras", getObrasDoCanteiro)
      .then(setDados)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar as obras"));
  }, []);

  if (erro) return <p role="alert">{erro}</p>;
  if (!dados) return <RouteLoading titulo="Canteiro" />;

  return (
    <>
      <PageHeader title="Canteiro" crumb="Operação / Canteiro" subtitle="Escolha a obra para registrar o diário de hoje." />
      <PendentesBanner />
      {dados.obras.length === 0 ? (
        <p className="gp-hint">Você ainda não foi vinculado a nenhuma obra. Abra o link de convite enviado pelo responsável.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {dados.obras.map((obra) => {
            const s = SITUACAO[obra.situacao];
            return (
              <li key={obra.obra_id}>
                <Link href={`/canteiro/${obra.obra_id}`} className="gp-card"
                  style={{ display: "flex", flexDirection: "column", gap: 6, padding: 16, color: "#001b3d", textDecoration: "none" }}>
                  <strong style={{ fontSize: 17 }}>{obra.nome}</strong>
                  {obra.local && <span className="gp-hint">{obra.local}</span>}
                  <span style={{ alignSelf: "flex-start", padding: "4px 10px", borderRadius: 999, fontSize: 13, fontWeight: 800, color: s.cor, background: s.fundo }}>
                    {s.rotulo}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
