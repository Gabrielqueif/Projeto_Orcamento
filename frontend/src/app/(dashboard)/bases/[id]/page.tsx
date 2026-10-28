import { notFound } from "next/navigation";
import { ItemSearch } from "@/components/bases/ItemSearch";
import { fonteDoId } from "@/lib/bases";

export default async function PesquisaBasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = fonteDoId(id);
  if (!config) notFound();

  // O cabeçalho fica no ItemSearch: no mobile ele carrega as abas e a busca.
  return <ItemSearch fonte={config.fonte} />;
}
