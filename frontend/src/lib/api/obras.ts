import { fetchWithAuth } from "./client";

export interface ObraTransitionCreate {
  data_inicio_real: string;
  prazo_estimado_dias: number;
  engenheiro_responsavel_id?: string | null;
  enviar_curva_abc_almoxarifado: boolean;
  bloquear_planilha_base: boolean;
}

export interface Obra {
  id: string;
  orcamento_id?: string | null;
  cliente: string;
  endereco?: any | null;
  escopo?: string | null;
  data_inicio_real: string;
  prazo_estimado_dias: number;
  engenheiro_responsavel_id?: string | null;
  enviar_curva_abc_almoxarifado: boolean;
  bloquear_planilha_base: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface LimiteRequisicao {
  id: string;
  obra_id: string;
  codigo_insumo: string;
  descricao: string;
  unidade: string;
  quantidade_limite: number;
  quantidade_requisitada: number;
  created_at?: string;
  updated_at?: string;
}

export async function gerarObra(
  orcamentoId: string,
  data: ObraTransitionCreate
): Promise<Obra> {
  const response = await fetchWithAuth(`/obras/transicao/${orcamentoId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao gerar obra a partir do orçamento");
  }

  return response.json();
}

export async function getObras(): Promise<Obra[]> {
  const response = await fetchWithAuth("/obras");

  if (!response.ok) {
    throw new Error("Erro ao buscar obras");
  }

  return response.json();
}

export async function getObra(obraId: string): Promise<Obra> {
  const response = await fetchWithAuth(`/obras/${obraId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Obra não encontrada");
    }
    throw new Error("Erro ao buscar detalhes da obra");
  }

  return response.json();
}

export async function getObraLimites(obraId: string): Promise<LimiteRequisicao[]> {
  const response = await fetchWithAuth(`/obras/${obraId}/limites`);

  if (!response.ok) {
    throw new Error("Erro ao buscar limites de requisição da obra");
  }

  return response.json();
}

export async function atualizarStatusObra(
  obraId: string,
  status: "EM_ANDAMENTO" | "CONCLUIDA"
): Promise<Obra> {
  const response = await fetchWithAuth(`/obras/${obraId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Erro ao atualizar status da obra");
  }

  return response.json();
}
