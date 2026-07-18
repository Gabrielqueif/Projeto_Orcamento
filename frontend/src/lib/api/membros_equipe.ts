import { fetchWithAuth } from "./client";

export interface MembroEquipe {
  id: string;
  user_id?: string;
  nome: string;
  cpf: string;
  cargo: string;
  data_inicio: string;
  descricao?: string;
  orcamento_id?: string | null;
  remuneracao: number;
  status: "ATIVO" | "INATIVO";
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface MembroEquipeCreate {
  nome: string;
  cpf: string;
  cargo: string;
  data_inicio: string;
  descricao?: string;
  orcamento_id?: string | null;
  remuneracao: number;
  status?: string;
}

export interface MembroEquipeUpdate {
  nome?: string;
  cpf?: string;
  cargo?: string;
  data_inicio?: string;
  descricao?: string;
  orcamento_id?: string | null;
  remuneracao?: number;
  status?: string;
}

export async function getMembrosEquipe(params?: {
  nome?: string;
  cargo?: string;
  status?: string;
  orcamento_id?: string | null;
}): Promise<MembroEquipe[]> {
  const queryParams = new URLSearchParams();
  if (params?.nome) queryParams.append("nome", params.nome);
  if (params?.cargo) queryParams.append("cargo", params.cargo);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.orcamento_id) queryParams.append("orcamento_id", params.orcamento_id);

  const url = `/membros-equipe/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar membros da equipe");
  }

  return response.json();
}

export async function getMembroEquipe(id: string): Promise<MembroEquipe> {
  const response = await fetchWithAuth(`/membros-equipe/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Membro da equipe não encontrado");
    }
    throw new Error("Erro ao buscar membro da equipe");
  }

  return response.json();
}

export async function createMembroEquipe(
  data: MembroEquipeCreate
): Promise<MembroEquipe> {
  const response = await fetchWithAuth("/membros-equipe/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao criar membro da equipe");
  }

  return response.json();
}

export async function updateMembroEquipe(
  id: string,
  data: MembroEquipeUpdate
): Promise<MembroEquipe> {
  const response = await fetchWithAuth(`/membros-equipe/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao atualizar membro da equipe");
  }

  return response.json();
}

export async function deleteMembroEquipe(id: string): Promise<void> {
  const response = await fetchWithAuth(`/membros-equipe/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao deletar membro da equipe");
  }
}

export async function alocarMembrosAoOrcamento(
  membroIds: string[],
  orcamentoId: string | null
): Promise<void> {
  const response = await fetchWithAuth("/membros-equipe/alocar", {
    method: "POST",
    body: JSON.stringify({
      membro_ids: membroIds,
      orcamento_id: orcamentoId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao alocar membros da equipe");
  }
}
