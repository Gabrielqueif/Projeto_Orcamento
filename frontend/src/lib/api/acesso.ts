import { fetchWithAuth } from "./client";
import type { Cargo } from "./cargos";
import type { ResumoDiario } from "./diario";

export type PapelCanteiro = "MESTRE" | "SUPERVISOR";

export interface Convite {
  id: string;
  papel: PapelCanteiro;
  expira_em: string;
  usado_em?: string | null;
}

/** Só a resposta de criação traz o token em claro; o servidor guarda apenas o hash. */
export interface ConviteCriado extends Convite {
  token: string;
}

export interface Membro {
  user_id: string;
  papel: PapelCanteiro;
  nome?: string | null;
  email?: string | null;
  created_at: string;
}

async function erro(response: Response, padrao: string): Promise<Error> {
  const corpo = await response.json().catch(() => ({}));
  return new Error(typeof corpo?.detail === "string" ? corpo.detail : padrao);
}

export function linkDoConvite(token: string): string {
  return `${window.location.origin}/convite/${token}`;
}

export async function criarConvite(obraId: string, papel: PapelCanteiro): Promise<ConviteCriado> {
  const response = await fetchWithAuth(`/obras/${obraId}/convites`, { method: "POST", body: JSON.stringify({ papel }) });
  if (!response.ok) throw await erro(response, "Erro ao gerar o convite");
  return response.json();
}

export async function getConvites(obraId: string): Promise<Convite[]> {
  const response = await fetchWithAuth(`/obras/${obraId}/convites`);
  if (!response.ok) throw await erro(response, "Erro ao carregar os convites");
  return response.json();
}

export async function revogarConvite(obraId: string, conviteId: string): Promise<void> {
  const response = await fetchWithAuth(`/obras/${obraId}/convites/${conviteId}`, { method: "DELETE" });
  if (!response.ok) throw await erro(response, "Erro ao revogar o convite");
}

export async function getMembros(obraId: string): Promise<Membro[]> {
  const response = await fetchWithAuth(`/obras/${obraId}/membros`);
  if (!response.ok) throw await erro(response, "Erro ao carregar a equipe do canteiro");
  return response.json();
}

export async function removerMembro(obraId: string, userId: string): Promise<void> {
  const response = await fetchWithAuth(`/obras/${obraId}/membros/${userId}`, { method: "DELETE" });
  if (!response.ok) throw await erro(response, "Erro ao remover o membro");
}

export async function aceitarConvite(token: string): Promise<{ obra_id: string; papel: PapelCanteiro }> {
  const response = await fetchWithAuth("/convites/aceitar", { method: "POST", body: JSON.stringify({ token }) });
  if (!response.ok) throw await erro(response, "Convite inválido ou expirado");
  return response.json();
}

/** Obras em que o usuário é mestre/supervisor, com a situação do diário do dia. */
export async function getObrasDoCanteiro(): Promise<ResumoDiario> {
  const response = await fetchWithAuth("/canteiro/obras");
  if (!response.ok) throw await erro(response, "Erro ao carregar as obras do canteiro");
  return response.json();
}

/** Cargos do dono da obra (o membro não tem os seus), para o efetivo do diário. */
export async function getCargosDaObra(obraId: string): Promise<Cargo[]> {
  const response = await fetchWithAuth(`/obras/${obraId}/canteiro/cargos`);
  if (!response.ok) throw await erro(response, "Erro ao carregar os cargos");
  return response.json();
}
