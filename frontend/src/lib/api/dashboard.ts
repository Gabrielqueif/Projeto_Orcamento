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

export type Granularidade = "diaria" | "semanal" | "mensal";

export interface Dashboard {
  obras_ativas: number;
  progresso_medio: number;
  orcamento_total: number;
  gasto_realizado: number;
  disponivel: number;
  utilizacao_orcamento: number;
  alertas_criticos: number;
  orcamentos_em_elaboracao: number;
  /** Previsto = orçamento total das obras ativas; planejado = o que o cronograma previa gastar até hoje. */
  gasto_previsto: number;
  gasto_planejado: number;
  granularidade: Granularidade;
  riscos: RiscoDashboard[];
  semanas: string[];
  series: SerieSemanal[];
  feed: FeedItem[];
}

export async function getDashboard(granularidade: Granularidade = "semanal"): Promise<Dashboard> {
  const response = await fetchWithAuth(granularidade === "semanal" ? "/dashboard" : `/dashboard?granularidade=${granularidade}`);
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(corpo?.detail || "Erro ao carregar o painel");
  }
  return response.json();
}
