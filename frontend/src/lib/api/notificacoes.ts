import { fetchWithAuth } from "./client";
import type { SeveridadeRisco, TipoRisco } from "./dashboard";

export interface Notificacao {
  chave: string;
  tipo: TipoRisco;
  severidade: SeveridadeRisco;
  titulo: string;
  descricao: string;
  href: string;
  lida: boolean;
}

export interface Notificacoes {
  itens: Notificacao[];
  nao_lidas: number;
}

export async function getNotificacoes(): Promise<Notificacoes> {
  const response = await fetchWithAuth("/notificacoes");
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(corpo?.detail || "Erro ao carregar as notificações");
  }
  return response.json();
}

/** Sem `chaves`, marca todas as notificações ativas como lidas. Devolve a nova contagem de não lidas. */
export async function marcarNotificacoesLidas(chaves?: string[]): Promise<{ nao_lidas: number }> {
  const response = await fetchWithAuth("/notificacoes/lidas", {
    method: "POST",
    body: JSON.stringify({ chaves: chaves ?? null }),
  });
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(corpo?.detail || "Erro ao marcar as notificações como lidas");
  }
  return response.json();
}
