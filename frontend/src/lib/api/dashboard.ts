import { fetchWithAuth } from "./client";

export type SeveridadeRisco = "critical" | "moderate" | "info";
export type TipoRisco = "ATRASO" | "ORCAMENTO" | "ESTOQUE" | "DIARIO";

export interface RiscoDashboard {
  tipo: TipoRisco;
  severidade: SeveridadeRisco;
  titulo: string;
  descricao: string;
  href: string;
}

export interface SerieSemanal {
  obra_id: string;
  nome: string;
  valores: (number | null)[];
}

export interface FeedItem {
  titulo: string;
  obra_nome: string;
  data: string;
  status: string;
  atualizado_em?: string | null;
  href: string;
}

export interface Dashboard {
  obras_ativas: number;
  progresso_medio: number;
  orcamento_total: number;
  gasto_realizado: number;
  disponivel: number;
  utilizacao_orcamento: number;
  alertas_criticos: number;
  riscos: RiscoDashboard[];
  semanas: string[];
  series: SerieSemanal[];
  feed: FeedItem[];
}

export async function getDashboard(): Promise<Dashboard> {
  const response = await fetchWithAuth("/dashboard");
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(corpo?.detail || "Erro ao carregar o painel");
  }
  return response.json();
}
