import { fetchWithAuth } from "./client";

export interface CategoriaGasto {
  categoria: string;
  orcado: number;
  realizado: number;
  desvio: number;
  desvio_percentual: number;
}

export interface ConsolidadoFinanceiro {
  total_orcado: number;
  total_realizado: number;
  saldo_restante: number;
  desvio_percentual: number;
  gasto_por_categoria: CategoriaGasto[];
}

export interface ObraResumo {
  id: string;
  nome: string;
  gestor: string;
  previsto: number;
  realizado: number;
  percent: number;
  status: string;
  statusClass: string;
  barColor: string;
  href: string;
}

export interface PortfolioConsolidado {
  total_orcado: number;
  total_realizado: number;
  saldo_restante: number;
  desvio_percentual: number;
  projetos: ObraResumo[];
  gasto_por_categoria: CategoriaGasto[];
  alerta_critico?: {
    obra_nome: string;
    excesso_pct: number;
    obra_id: string;
  } | null;
}

export async function getPortfolioConsolidado(): Promise<PortfolioConsolidado> {
  const response = await fetchWithAuth("/financeiro/portfolio");
  if (!response.ok) {
    throw new Error("Erro ao carregar consolidados do portfólio financeiro");
  }
  return response.json();
}


export interface DespesaCreate {
  descricao: string;
  valor: number;
  categoria: "Materiais" | "Mão de Obra" | "Equipamentos" | "Administrativo" | "Outros";
  status?: "EM_ANALISE" | "APROVADO" | "PAGO" | "RECUSADO";
  data_competencia: string; // YYYY-MM-DD
  responsavel: string;
  documento_url?: string;
  origem?: string;
  insumo_id?: string;
  locacao_id?: string;
}

export interface Despesa {
  id: string;
  obra_id: string;
  descricao: string;
  valor: number;
  categoria: "Materiais" | "Mão de Obra" | "Equipamentos" | "Administrativo" | "Outros";
  status: "EM_ANALISE" | "APROVADO" | "PAGO" | "RECUSADO";
  data_competencia: string;
  responsavel: string;
  documento_url?: string;
  origem: string;
  insumo_id?: string;
  locacao_id?: string;
  created_at: string;
  updated_at: string;
}

export async function getConsolidadoFinanceiro(obraId: string): Promise<ConsolidadoFinanceiro> {
  const response = await fetchWithAuth(`/obras/${obraId}/financeiro/consolidado`);
  if (!response.ok) {
    throw new Error("Erro ao carregar consolidado financeiro");
  }
  return response.json();
}

export async function getDespesas(obraId: string, categoria?: string): Promise<Despesa[]> {
  const url = categoria 
    ? `/obras/${obraId}/financeiro/despesas?categoria=${categoria}`
    : `/obras/${obraId}/financeiro/despesas`;
  const response = await fetchWithAuth(url);
  if (!response.ok) {
    throw new Error("Erro ao carregar despesas financeiras");
  }
  return response.json();
}

export async function criarDespesa(obraId: string, dados: DespesaCreate): Promise<Despesa> {
  const response = await fetchWithAuth(`/obras/${obraId}/financeiro/despesas`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Erro ao registrar despesa");
  }
  return response.json();
}

export async function atualizarStatusDespesa(
  obraId: string,
  despesaId: string,
  novoStatus: "EM_ANALISE" | "APROVADO" | "PAGO" | "RECUSADO"
): Promise<Despesa> {
  const response = await fetchWithAuth(
    `/obras/${obraId}/financeiro/despesas/${despesaId}/status?novo_status=${novoStatus}`,
    {
      method: "PUT",
    }
  );
  if (!response.ok) {
    throw new Error("Erro ao atualizar status da despesa");
  }
  return response.json();
}

export async function deletarDespesa(obraId: string, despesaId: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/obras/${obraId}/financeiro/despesas/${despesaId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao excluir despesa");
  }
  return response.json();
}
