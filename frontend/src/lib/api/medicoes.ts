import { fetchWithAuth } from "./client";

export type SituacaoCurva = "NO_PRAZO" | "ATRASADA" | "ADIANTADA" | "SEM_CRONOGRAMA";

export interface PontoCurva {
  data: string;
  planejado: number;
  realizado?: number | null;
}

export interface CurvaS {
  inicio?: string | null;
  fim?: string | null;
  hoje: string;
  planejado_hoje?: number | null;
  realizado_hoje?: number | null;
  desvio?: number | null;
  situacao: SituacaoCurva;
  etapas_sem_cronograma: number;
  pontos: PontoCurva[];
}

export interface Medicao {
  id: string;
  obra_id: string;
  etapa_id: string;
  etapa_nome?: string | null;
  data: string;
  progresso: number;
  origem: "MANUAL" | "DIARIO";
  diario_id?: string | null;
  observacao?: string | null;
  created_at?: string | null;
}

export interface MedicaoCreate {
  etapa_id: string;
  data: string;
  progresso: number;
  observacao?: string | null;
}

async function erro(response: Response, padrao: string): Promise<Error> {
  const corpo = await response.json().catch(() => ({}));
  const detalhe = corpo?.detail;
  const mensagem = Array.isArray(detalhe) ? detalhe.map((d: { msg?: string }) => d.msg).join("; ") : detalhe;
  return new Error(mensagem || padrao);
}

export async function getCurvaS(obraId: string): Promise<CurvaS> {
  const response = await fetchWithAuth(`/obras/${obraId}/curva-s`);
  if (!response.ok) throw await erro(response, "Erro ao carregar a Curva S");
  return response.json();
}

export async function getMedicoes(obraId: string, etapaId?: string): Promise<Medicao[]> {
  const query = etapaId ? `?etapa_id=${encodeURIComponent(etapaId)}` : "";
  const response = await fetchWithAuth(`/obras/${obraId}/medicoes${query}`);
  if (!response.ok) throw await erro(response, "Erro ao carregar as medições");
  return response.json();
}

export async function registrarMedicao(obraId: string, dados: MedicaoCreate): Promise<Medicao> {
  const response = await fetchWithAuth(`/obras/${obraId}/medicoes`, { method: "POST", body: JSON.stringify(dados) });
  if (!response.ok) throw await erro(response, "Erro ao registrar a medição");
  return response.json();
}

export async function removerMedicao(obraId: string, medicaoId: string): Promise<void> {
  const response = await fetchWithAuth(`/obras/${obraId}/medicoes/${medicaoId}`, { method: "DELETE" });
  if (!response.ok) throw await erro(response, "Erro ao excluir a medição");
}
