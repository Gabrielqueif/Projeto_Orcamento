'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DatabaseCard from '@/components/bases/databaseCard';
import { agruparPorFonte, FONTES } from '@/lib/bases';
import { getSinapiBases, type SinapiBase } from '@/lib/api/orcamentos';
import { MinhasBases } from '@/components/bases-proprias/MinhasBases';
import { useUserRole } from '@/hooks/use-user-role';

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
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Bases de Dados</h1>
      <div className="bg-brand-navy p-6 md:p-8 rounded-xl shadow-lg h-auto min-h-[400px]">
        {loading && <p className="text-white/80">Carregando bases...</p>}
        {error && <p className="text-red-300">{error}</p>}

        {!loading && !error && fontesComDados.length === 0 && (
          <div className="bg-white rounded-lg p-6 text-center" data-testid="bases-vazio">
            <p className="text-slate-700 font-medium">Nenhuma base de dados importada ainda.</p>
            {role === 'admin' ? (
              <Link href="/admin/sinapi" className="inline-block mt-3 text-brand-primary font-bold underline">
                Importar bases
              </Link>
            ) : (
              <p className="text-sm text-slate-500 mt-1">Peça a um administrador para importar as bases.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fontesComDados.map((f) => (
            <DatabaseCard key={f.id} id={f.id} title={f.title} description={f.description}>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
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
      </div>

      <MinhasBases />
    </div>
  );
}
