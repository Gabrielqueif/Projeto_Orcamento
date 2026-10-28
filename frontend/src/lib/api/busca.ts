import { fetchWithAuth } from "./client";

export interface ItemBusca {
  id: string;
  titulo: string;
  subtitulo?: string | null;
  href: string;
}

export interface ResultadoBusca {
  obras: ItemBusca[];
  orcamentos: ItemBusca[];
  membros: ItemBusca[];
}

export async function buscar(q: string): Promise<ResultadoBusca> {
  const params = new URLSearchParams({ q });
  const response = await fetchWithAuth(`/busca?${params.toString()}`);
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(typeof corpo?.detail === "string" ? corpo.detail : "Erro ao buscar");
  }
  return response.json();
}
