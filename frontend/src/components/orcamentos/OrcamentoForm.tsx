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

type OrcamentoFormProps = {
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

export function OrcamentoForm({ mode = "create", orcamentoId, initialData }: OrcamentoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [availableBases, setAvailableBases] = React.useState<any[]>([]);

  // Extrair meses únicos e tipos únicos das bases disponíveis
  const mesesDisponiveis = Array.from(new Set(availableBases.map(b => b.mes_referencia)));
  const tiposDisponiveis = [
    "Sem Desoneração",
    "Com Desoneração",
    "Empreitada"
  ];

  React.useEffect(() => {
    async function loadBases() {
      try {
        const { getSinapiBases } = await import("@/lib/api/orcamentos");
        const bases = await getSinapiBases();
        setAvailableBases(bases);
      } catch (err) {
        console.error("Erro ao carregar bases:", err);
      }
    }
    loadBases();
  }, []);

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
      tipo_composicao: formData.get("tipo_composicao") as string,
      bdi: parseFloat(formData.get("bdi") as string) || 0,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome do Orçamento */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="nome">Nome do Orçamento</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
              type="text"
              id="nome"
              name="nome"
              placeholder="Ex: Reforma Apartamento 202"
              defaultValue={initialData?.nome}
              required
            />
          </div>

          {/* Cliente */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="cliente">Cliente</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
              type="text"
              id="cliente"
              name="cliente"
              placeholder="Nome do cliente"
              defaultValue={initialData?.cliente}
              required
            />
          </div>

          {/* Data de Referência */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="data">Data de Referência</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
              type="date"
              id="data"
              name="data"
              defaultValue={initialData?.data}
              required
            />
          </div>

          {/* Mês/Ano Base (SINAPI) */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="base_referencia">Mês/Ano Base (SINAPI)</label>
            <select
              id="base_referencia"
              name="base_referencia"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
              defaultValue={initialData?.base_referencia}
              required
            >
              <option value="">Selecione o mês base</option>
              {mesesDisponiveis.map((mes) => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
              {!availableBases.length && <option value="" disabled>Carregando bases...</option>}
            </select>
          </div>

          {/* Tipo de Desoneração */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="tipo_composicao">Tipo de Desoneração</label>
            <select
              id="tipo_composicao"
              name="tipo_composicao"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
              defaultValue={initialData?.base_referencia ? availableBases.find(b => b.mes_referencia === initialData.base_referencia)?.tipo_composicao : ""}
              required
            >
              <option value="">Selecione o tipo</option>
              {tiposDisponiveis.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* BDI (%) */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="bdi">BDI (%)</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
              type="number"
              step="0.01"
              id="bdi"
              name="bdi"
              placeholder="Ex: 25.00"
              defaultValue={(initialData as any)?.bdi || 0}
              required
            />
          </div>

          {/* Estado (UF) */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor="estado">Estado (UF)</label>
            <select
              id="estado"
              name="estado"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
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
              O estado e a base selecionados garantem a precisão dos preços das composições.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-brand-primary hover:bg-brand-navy disabled:bg-brand-primary/50 text-white font-bold p-3 mt-4 w-full rounded-md transition-all shadow-sm"
        >
          {loading ? "Processando..." : mode === "create" ? "🚀 Criar Orçamento" : "✅ Atualizar Orçamento"}
        </button>
      </div>
    </form>
  );
}
