'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DatabaseCard from '@/components/bases/databaseCard';
import { agruparPorFonte, FONTES } from '@/lib/bases';
import { getSinapiBases, type SinapiBase } from '@/lib/api/orcamentos';
import { MinhasBases } from '@/components/bases-proprias/MinhasBases';
import { useUserRole } from '@/hooks/use-user-role';
import { PageHeader } from "@/components/layout/PageHeader";

export default function BasesPage() {
  const { role } = useUserRole();
  const [bases, setBases] = useState<SinapiBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSinapiBases()
      .then(setBases)
      .catch(() => setError('Não foi possível carregar as bases disponíveis.'))
      .finally(() => setLoading(false));
  }, []);

  const porFonte = agruparPorFonte(bases);
  const fontesComDados = FONTES.filter((f) => porFonte[f.fonte]?.length);

  return (
    <>
      <PageHeader
        crumb={<>Comercial / <span aria-current="page" style={{ color: "#001b3d" }}>Bases de dados</span></>}
        eyebrow="Comercial"
        back="/mais"
        title="Bases de dados"
        subtitle="Referências oficiais e as suas bases com preços próprios."
        actions={
          role === "admin" && (
            <Link href="/admin/sinapi" className="gp-btn gp-bs">
              Importar referência (admin)
            </Link>
          )
        }
      />

      <section aria-labelledby="h-of" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="h-of" className="gp-h2">Referências oficiais</h2>
        {loading && <p className="gp-sub">Carregando bases...</p>}
        {error && <p style={{ color: "#B91C1C" }}>{error}</p>}

        {!loading && !error && fontesComDados.length === 0 && (
          <div className="gp-card gp-pad" style={{ textAlign: "center" }} data-testid="bases-vazio">
            <p style={{ margin: 0, fontWeight: 700 }}>Nenhuma base de dados importada ainda.</p>
            {role === "admin" ? (
              <Link href="/admin/sinapi" className="gp-btn gp-bp" style={{ marginTop: 12 }}>
                Importar bases
              </Link>
            ) : (
              <p className="gp-hint" style={{ margin: "4px 0 0" }}>Peça a um administrador para importar as bases.</p>
            )}
          </div>
        )}

        <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
          {fontesComDados.map((f) => (
            <DatabaseCard key={f.id} id={f.id} fonte={f.fonte} title={f.title} description={f.description}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: "#334155" }}>
                {porFonte[f.fonte].map((b) => (
                  <li key={`${b.mes_referencia}-${b.tipo_composicao}`}>
                    {b.mes_referencia} · {b.tipo_composicao}
                    {b.total_composicoes !== undefined && ` · ${b.total_composicoes} composições`}
                  </li>
                ))}
              </ul>
            </DatabaseCard>
          ))}
        </div>
      </section>

      <MinhasBases />
    </>
  );
}
