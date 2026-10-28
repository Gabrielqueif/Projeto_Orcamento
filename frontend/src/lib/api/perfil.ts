import { fetchWithAuth } from "./client";

export interface Perfil {
  id: string;
  email: string | null;
  full_name: string | null;
  cargo: string | null;
  username: string | null;
  /** Papel de permissão (user/admin). Não é o cargo profissional e não é editável aqui. */
  role: string;
}

export interface AtualizarPerfilDados {
  full_name?: string;
  cargo?: string;
}

function mensagemDeErro(corpo: any, padrao: string): string {
  // Erros de validação (422) trazem `detail` como lista; só usamos texto simples.
  return typeof corpo?.detail === "string" ? corpo.detail : padrao;
}

export async function getPerfil(): Promise<Perfil> {
  const response = await fetchWithAuth("/perfil");
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(mensagemDeErro(corpo, "Erro ao carregar o perfil"));
  }
  return response.json();
}

export async function atualizarPerfil(dados: AtualizarPerfilDados): Promise<Perfil> {
  const response = await fetchWithAuth("/perfil", {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(mensagemDeErro(corpo, "Erro ao salvar o perfil"));
  }
  return response.json();
}
