import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemSearch } from "@/components/bases/ItemSearch";
import { fonteDoId } from "@/lib/bases";

export default async function PesquisaBasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = fonteDoId(id);
  if (!config) notFound();

  return (
    <>
      <div>
        <nav aria-label="Trilha" className="gp-crumb">
          <Link href="/bases">Bases de dados</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>{config.fonte}</span>
        </nav>
        <h1 className="gp-h1">{config.fonte}</h1>
        <p className="gp-sub">Pesquisa por composição e insumo, com preços por estado ({config.fonte}).</p>
      </div>
      <ItemSearch fonte={config.fonte} />
    </>
  );
}
