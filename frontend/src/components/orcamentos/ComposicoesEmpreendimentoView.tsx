"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";
import { ComposicoesTab } from "@/components/bases-proprias/ComposicoesTab";
import { listarBases, type BasePropria } from "@/lib/api/basesProprias";

/** Aba Composição do empreendimento: composições de uma base própria, com edição em janela lateral. */
export function ComposicoesEmpreendimentoView({ ufPadrao }: { ufPadrao?: string }) {
  const [bases, setBases] = useState<BasePropria[]>([]);
  const [baseId, setBaseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    listarBases()
      .then((lista) => {
        setBases(lista);
        setBaseId(lista[0]?.id ?? "");
      })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SkeletonStatus texto="Carregando bases próprias...">
        <Skeleton height={48} radius={16} />
      </SkeletonStatus>
    );
  }

  if (erro) {
    return <div role="alert" className="gp-card gp-pad" style={{ color: "#B91C1C" }}>Erro ao carregar as bases próprias.</div>;
  }

  if (bases.length === 0) {
    return (
      <div className="gp-card gp-pad" style={{ textAlign: "center", color: "#475569" }}>
        Nenhuma base própria cadastrada. Crie uma em <Link href="/bases">Bases de dados</Link> para montar composições.
      </div>
    );
  }

  const base = bases.find((b) => b.id === baseId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="gp-fld" style={{ maxWidth: 360 }}>
        <label htmlFor="comp-base" className="gp-lb">Base própria</label>
        <select id="comp-base" className="gp-in" value={baseId} onChange={(e) => setBaseId(e.target.value)}>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>{b.nome}</option>
          ))}
        </select>
      </div>
      <div className="gp-card">
        <ComposicoesTab key={baseId} baseId={baseId} ufPadrao={base?.uf ?? ufPadrao} editorEmDrawer />
      </div>
    </div>
  );
}
