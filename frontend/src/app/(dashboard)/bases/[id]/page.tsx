import { notFound } from "next/navigation";
import { ItemSearch } from "@/components/bases/ItemSearch";
import { fonteDoId } from "@/lib/bases";

export default async function PesquisaBasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = fonteDoId(id);
  if (!config) notFound();

  return (
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-slate-700">Pesquisa Detalhada por composição ({config.fonte})</h2>
        <p className="text-sm text-slate-500">Consulte preços de composições por estado ({config.fonte})</p>
      </div>
      <ItemSearch fonte={config.fonte} />
    </div>
  );
}
