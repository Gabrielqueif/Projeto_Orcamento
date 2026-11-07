"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RouteLoading } from "@/components/common/route-loading";
import { DiarioWizard, hojeLocal } from "@/components/canteiro/DiarioWizard";
import { useToast } from "@/components/common/toast";
import { getCargosDaObra } from "@/lib/api/acesso";
import type { Cargo } from "@/lib/api/cargos";
import { alterarStatusDiario, getDiarios, type DiarioListagem } from "@/lib/api/diario";
import { comCache } from "@/lib/offline/db";
import { PendentesBanner } from "@/components/canteiro/PendentesBanner";

export default function CanteiroObraPage({ params }: { params: Promise<{ obraId: string }> }) {
  const { obraId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [dados, setDados] = useState<DiarioListagem | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [listagem, lista] = await comCache(`obra:${obraId}`, () =>
        Promise.all([
          getDiarios(obraId, 5),
          // Sem cargos o wizard usa o campo numérico de equipe.
          getCargosDaObra(obraId).catch((e) => {
            if (e instanceof TypeError) throw e;
            return [] as Cargo[];
          }),
        ])
      );
      setDados(listagem);
      setCargos(lista);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar a obra");
    }
  }, [obraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro) return <p role="alert">{erro}</p>;
  if (!dados) return <RouteLoading titulo="Canteiro" />;

  const hoje = dados.registros.find((r) => r.data === hojeLocal()) ?? null;
  const voltar = () => router.push("/canteiro");

  const devolver = async () => {
    if (!hoje) return;
    try {
      await alterarStatusDiario(obraId, hoje.id, "RASCUNHO");
      await carregar();
    } catch (e) {
      showToast("Não foi possível reabrir", e instanceof Error ? e.message : undefined, "error");
    }
  };

  return (
    <>
      <PageHeader title="Diário de hoje" back="/canteiro" backLabel="Canteiro" crumb={`Canteiro / ${dados.obra.nome}`} />
      <PendentesBanner />
      {hoje && hoje.status !== "RASCUNHO" ? (
        <div className="gp-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <strong>{hoje.status === "APROVADO" ? "Diário de hoje aprovado" : "Diário de hoje já enviado"}</strong>
          <span className="gp-hint">{hoje.titulo}</span>
          {hoje.status === "ENVIADO" && (
            <button type="button" className="gp-btn gp-bs" onClick={devolver}>Reabrir para editar</button>
          )}
          <button type="button" className="gp-btn gp-bp" onClick={voltar}>Voltar às obras</button>
        </div>
      ) : (
        <DiarioWizard
          key={hoje?.id ?? "novo"}
          obraId={obraId}
          obraNome={dados.obra.nome}
          registro={hoje}
          servicos={dados.obra.servicos}
          cargos={cargos}
          onConcluido={voltar}
        />
      )}
    </>
  );
}
