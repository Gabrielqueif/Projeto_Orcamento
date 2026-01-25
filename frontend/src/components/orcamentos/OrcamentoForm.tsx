'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { createOrcamento, updateOrcamento, type OrcamentoCreate, type OrcamentoUpdate } from "@/lib/api/orcamentos";

const ESTADOS = [
  { value: 'ac', label: 'AC - Acre' },
  { value: 'al', label: 'AL - Alagoas' },
  { value: 'ap', label: 'AP - Amapá' },
  { value: 'am', label: 'AM - Amazonas' },
  { value: 'ba', label: 'BA - Bahia' },
  { value: 'ce', label: 'CE - Ceará' },
  { value: 'df', label: 'DF - Distrito Federal' },
  { value: 'es', label: 'ES - Espírito Santo' },
  { value: 'go', label: 'GO - Goiás' },
  { value: 'ma', label: 'MA - Maranhão' },
  { value: 'mt', label: 'MT - Mato Grosso' },
  { value: 'ms', label: 'MS - Mato Grosso do Sul' },
  { value: 'mg', label: 'MG - Minas Gerais' },
  { value: 'pa', label: 'PA - Pará' },
  { value: 'pb', label: 'PB - Paraíba' },
  { value: 'pr', label: 'PR - Paraná' },
  { value: 'pe', label: 'PE - Pernambuco' },
  { value: 'pi', label: 'PI - Piauí' },
  { value: 'rj', label: 'RJ - Rio de Janeiro' },
  { value: 'rn', label: 'RN - Rio Grande do Norte' },
  { value: 'rs', label: 'RS - Rio Grande do Sul' },
  { value: 'ro', label: 'RO - Rondônia' },
  { value: 'rr', label: 'RR - Roraima' },
  { value: 'sc', label: 'SC - Santa Catarina' },
  { value: 'sp', label: 'SP - São Paulo' },
  { value: 'se', label: 'SE - Sergipe' },
  { value: 'to', label: 'TO - Tocantins' },
];

type OrçamentoFormProps = {
  mode?: "create" | "edit";
  orcamentoId?: string;
  initialData?: {
    nome?: string;
    cliente?: string;
    data?: string;
    base_referencia?: string;
    estado?: string;
    status?: string;
  };
}

export function OrçamentoForm({ mode = "create", orcamentoId, initialData }: OrçamentoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      cliente: formData.get("cliente") as string,
      data: formData.get("data") as string,
      base_referencia: formData.get("base_referencia") as string,
      estado: formData.get("estado") as string,
    };

    try {
      if (mode === "create") {
        await createOrcamento(data);
        router.push("/orcamentos");
        router.refresh();
      } else if (mode === "edit" && orcamentoId) {
        await updateOrcamento(orcamentoId, data);
        router.push(`/orcamentos/${orcamentoId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar orçamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="nome">Nome do Orçamento</label>
          <input
            className="border border-gray-300 p-2 w-full rounded-md"
            type="text"
            id="nome"
            name="nome"
            placeholder="Digite o nome do orçamento"
            defaultValue={initialData?.nome}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="cliente">Cliente</label>
          <input
            className="border border-gray-300 p-2 w-full rounded-md"
            type="text"
            id="cliente"
            name="cliente"
            placeholder="Digite o nome do cliente"
            defaultValue={initialData?.cliente}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="data">Data</label>
          <input
            className="border border-gray-300 p-2 w-full rounded-md"
            type="date"
            id="data"
            name="data"
            defaultValue={initialData?.data}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="base_referencia">Base de Referência</label>
          <input
            className="border border-gray-300 p-2 w-full rounded-md"
            type="text"
            id="base_referencia"
            name="base_referencia"
            placeholder="Digite a base de referência"
            defaultValue={initialData?.base_referencia}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="estado">Estado</label>
          <select
            id="estado"
            name="estado"
            className="border border-gray-300 p-2 w-full rounded-md"
            defaultValue={initialData?.estado}
            required
          >
            <option value="">Selecione um estado</option>
            {ESTADOS.map((est) => (
              <option key={est.value} value={est.value}>
                {est.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            O estado selecionado será usado para buscar os preços de todas as composições deste orçamento.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white p-2 mt-4 w-full rounded-md transition-colors"
        >
          {loading ? "Salvando..." : mode === "create" ? "Criar Orçamento" : "Atualizar Orçamento"}
        </button>
      </div>
    </form>
  );
}