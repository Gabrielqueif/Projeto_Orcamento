"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Coins } from "@phosphor-icons/react";
import { getOrcamento, type Orcamento } from "@/lib/api/orcamentos";
import { PageHeader } from "@/components/layout/PageHeader";
import { CronogramaPrazosView } from "@/components/orcamentos/CronogramaPrazosView";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";
import { DetailHeaderSkeleton } from "@/components/common/skeletons";

export default function PrazosPage() {
  const params = useParams();
  const id = params.id as string;
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOrcamento(id)
      .then(setOrcamento)
      .catch((err) => console.error("Erro ao carregar empreendimento:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SkeletonStatus texto="Carregando cronograma…">
        <DetailHeaderSkeleton />
        <Skeleton height={48} radius={16} />
      </SkeletonStatus>
    );
  }

  if (!orcamento) {
    return <div className="gp-card gp-pad" role="alert" style={{ textAlign: "center", color: "#475569" }}>Empreendimento não encontrado.</div>;
  }

  return (
    <>
      <PageHeader
        back={`/empreendimentos/${id}`}
        backLabel="Voltar para o empreendimento"
        crumb={
          <>
            <Link href="/empreendimentos">Empreendimentos</Link> / <Link href={`/empreendimentos/${id}`}>{orcamento.nome}</Link> /{" "}
            <span aria-current="page" style={{ color: "#001b3d" }}>Prazos</span>
          </>
        }
        eyebrow={orcamento.nome}
        title="Prazos e etapas"
        subtitle={<>Defina as datas de início e fim das etapas de <strong>{orcamento.nome}</strong>.</>}
        actions={<Link href={`/empreendimentos/${id}`} className="gp-btn gp-bs"><Coins size={16} weight="bold" aria-hidden="true" />Ver planilha</Link>}
      />
      <CronogramaPrazosView orcamentoId={id} />
    </>
  );
}
