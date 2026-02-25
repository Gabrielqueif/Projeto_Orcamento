'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrcamentos, deleteOrcamento, type Orcamento } from "@/lib/api/orcamentos";
import { useRouter } from "next/navigation";
import { OrcamentoCard } from "@/components/orcamentos/OrcamentoCard";

export default function OrcamentosPage() {
  const router = useRouter();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarOrcamentos = async () => {
    try {
      setLoading(true);
      const data = await getOrcamentos();
      setOrcamentos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrcamentos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este orçamento?')) {
      return;
    }

    try {
      await deleteOrcamento(id);
      carregarOrcamentos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao deletar orçamento');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
          <Link href="/orcamentos/novo">
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition flex items-center gap-2">
              <span>+</span> Novo Orçamento
            </button>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
        <Link href="/orcamentos/novo">
          <button className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-navy transition flex items-center gap-2 font-medium">
            <span>+</span> Novo Orçamento
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Lista de Orçamentos (Cards) */}
      {orcamentos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          <p>Nenhum orçamento encontrado.</p>
          <Link href="/orcamentos/novo" className="text-brand-primary hover:underline mt-2 inline-block">
            Criar primeiro orçamento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orcamentos.map((orcamento) => (
            <OrcamentoCard
              key={orcamento.id}
              orcamento={orcamento}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
