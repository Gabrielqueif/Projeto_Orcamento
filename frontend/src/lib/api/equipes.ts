import { fetchWithAuth } from "./client";

export interface Equipe {
  id: string;
  user_id?: string;
  nome: string;
  descricao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EquipeCreate {
  nome: string;
  descricao?: string;
}

export interface EquipeUpdate {
  nome?: string;
  descricao?: string;
}

export async function getEquipes(nome?: string): Promise<Equipe[]> {
  const queryParams = new URLSearchParams();
  if (nome) queryParams.append("nome", nome);

  const url = `/equipes${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar equipes");
  }

  return response.json();
}

export async function getEquipe(id: string): Promise<Equipe> {
  const response = await fetchWithAuth(`/equipes/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Equipe não encontrada");
    }
    throw new Error("Erro ao buscar equipe");
  }

  return response.json();
}

export async function createEquipe(data: EquipeCreate): Promise<Equipe> {
  const response = await fetchWithAuth("/equipes/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao criar equipe");
  }

  return response.json();
}

export async function updateEquipe(id: string, data: EquipeUpdate): Promise<Equipe> {
  const response = await fetchWithAuth(`/equipes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao atualizar equipe");
  }

  return response.json();
}

export async function deleteEquipe(id: string): Promise<void> {
  const response = await fetchWithAuth(`/equipes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao deletar equipe");
  }
}
