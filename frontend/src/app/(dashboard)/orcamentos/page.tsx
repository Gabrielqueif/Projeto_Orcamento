'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrcamentos, deleteOrcamento, type Orcamento } from "@/lib/api/orcamentos";
import { useRouter } from "next/navigation";

const formatarMoeda = (valor: number | null): string => {
  if (valor === null || valor === undefined) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const formatarData = (data: string): string => {
  try {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return data;
  }
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    em_elaboracao: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Em Elaboração' },
    aprovado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovado' },
    rejeitado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado' },
  };

  const statusConfig = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  
  return (
    <span className={`${statusConfig.bg} ${statusConfig.text} text-xs px-2 py-1 rounded-full font-bold`}>
      {statusConfig.label}
    </span>
  );
};

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
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition flex items-center gap-2">
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
          <Link href="/orcamentos/novo" className="text-blue-600 hover:underline mt-2 inline-block">
            Criar primeiro orçamento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orcamentos.map((orcamento) => (
            <div key={orcamento.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-slate-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={orcamento.nome}>{orcamento.nome}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1" title={orcamento.cliente}>{orcamento.cliente}</p>
                </div>
                {getStatusBadge(orcamento.status)}
              </div>
              
              <div className="space-y-3 mb-6 flex-grow">
                <div className="flex justify-between text-sm border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Data</span>
                  <span className="text-slate-700 font-medium">{formatarData(orcamento.data)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500">Valor Total</span>
                  <span className="text-slate-800 font-bold text-lg">{formatarMoeda(orcamento.valor_total)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Link
                  href={`/orcamentos/${orcamento.id}`}
                  className="flex-1 text-center bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Ver Detalhes
                </Link>
                <button
                  onClick={() => handleDelete(orcamento.id)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-100"
                  title="Deletar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}