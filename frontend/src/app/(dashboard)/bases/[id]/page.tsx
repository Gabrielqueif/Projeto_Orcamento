import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemSearch } from "@/components/bases/ItemSearch";
import { fonteDoId } from "@/lib/bases";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function PesquisaBasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = fonteDoId(id);
  if (!config) notFound();

  return (
    <>
      <PageHeader
        back="/bases"
        backLabel="Voltar para bases de dados"
        crumb={<><Link href="/bases">Bases de dados</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>{config.fonte}</span></>}
        eyebrow="Base de referência"
        title={config.fonte}
        subtitle={`Pesquisa por composição e insumo, com preços por estado (${config.fonte}).`}
      />
      <ItemSearch fonte={config.fonte} />
    </>
  );
}
