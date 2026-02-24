'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getOrcamento, type Orcamento } from "@/lib/api/orcamentos";

import { EtapasManager } from "@/components/orcamentos/EtapasManager";
import { OrcamentoItemForm } from "@/components/orcamentos/OrcamentoItemForm";
import { OrcamentoItensList } from "@/components/orcamentos/OrcamentoItensList";

export default function OrcamentoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const carregarOrcamento = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await getOrcamento(id);
      setOrcamento(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamento');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      carregarOrcamento(true);
    }
  }, [id]);

  useEffect(() => {
    if (id && refreshKey > 0) {
      carregarOrcamento(false);
    }
  }, [refreshKey, id]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading && !orcamento) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/orcamentos" className="text-brand-primary hover:underline">
            ← Voltar para Orçamentos
          </Link>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-slate-500">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/orcamentos" className="text-brand-primary hover:underline">
            ← Voltar para Orçamentos
          </Link>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Orçamento não encontrado"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <Link href="/orcamentos" className="text-brand-primary hover:underline">
          ← Voltar para Orçamentos
        </Link>
      </div>

      {/* Gerenciar Etapas */}
      <EtapasManager
        orcamentoId={orcamento!.id}
        onEtapasChange={handleRefresh}
      />

      {/* Adicionar Item */}
      <OrcamentoItemForm
        refreshTrigger={refreshKey}
        orcamentoId={orcamento!.id}
        estadoOrcamento={orcamento!.estado}
        onItemAdded={handleRefresh}
      />

      {/* Lista de Itens */}
      <OrcamentoItensList
        refreshTrigger={refreshKey}
        orcamentoId={orcamento!.id}
        valorTotal={orcamento!.valor_total}
        onItemDeleted={handleRefresh}
      />
    </div>
  );
}

