import { fetchWithAuth } from "./client";

export type Clima = "SOL" | "NUBLADO" | "CHUVA";
export type StatusDiario = "RASCUNHO" | "ENVIADO" | "APROVADO";
export type SituacaoDiario = "ENVIADO" | "RASCUNHO" | "PENDENTE" | "ALERTA";

export interface FotoDiario {
  id: string;
  diario_id: string;
  legenda?: string | null;
  url?: string | null;
  created_at?: string | null;
}

export interface ServicoDiario {
  item_id: string;
  codigo?: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  percentual: number;
}

export interface ServicoObra {
  id: string;
  codigo?: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  executado: number;
  etapa_nome?: string | null;
}

export interface ServicoInput {
  item_id: string;
  quantidade: number;
}

/** Pessoas de uma função no canteiro. cargo_id ausente quando a função foi digitada livremente. */
export interface EfetivoItem {
  cargo_id?: string | null;
  funcao: string;
  quantidade: number;
}

export interface Diario {
  id: string;
  obra_id: string;
  data: string;
  titulo: string;
  atividades: string;
  ocorrencias?: string | null;
  tem_ocorrencia: boolean;
  clima: Clima;
  temperatura?: number | null;
  equipe_presente: number;
  responsavel?: string | null;
  status: StatusDiario;
  fotos: FotoDiario[];
  servicos: ServicoDiario[];
  efetivo?: EfetivoItem[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DiarioCreate {
  data: string;
  titulo: string;
  atividades: string;
  ocorrencias?: string | null;
  clima: Clima;
  temperatura?: number | null;
  equipe_presente: number;
  responsavel?: string | null;
  servicos?: ServicoInput[];
  efetivo?: EfetivoItem[];
}

export type DiarioUpdate = Partial<DiarioCreate>;

export interface ObraDiarioInfo {
  obra_id: string;
  nome: string;
  local?: string | null;
  responsavel?: string | null;
  data_inicio?: string | null;
  prazo_dias?: number | null;
  progresso: number;
  servicos: ServicoObra[];
  ultima_atualizacao?: string | null;
}

export interface DiarioListagem {
  obra: ObraDiarioInfo;
  registros: Diario[];
}

export interface ResumoObraDiario {
  obra_id: string;
  orcamento_id?: string | null;
  nome: string;
  local?: string | null;
  responsavel?: string | null;
  situacao: SituacaoDiario;
  ultimo_registro?: string | null;
  ultimo_clima?: Clima | null;
}

export interface ResumoDiario {
  total_obras: number;
  enviados_hoje: number;
  alertas: number;
  taxa_preenchimento_7d: number;
  obras: ResumoObraDiario[];
}

async function erro(response: Response, padrao: string): Promise<Error> {
  const corpo = await response.json().catch(() => ({}));
  const detalhe = corpo?.detail;
  // 422 do FastAPI devolve uma lista de erros de validação.
  const mensagem = Array.isArray(detalhe) ? detalhe.map((d: { msg?: string }) => d.msg).join("; ") : detalhe;
  return new Error(mensagem || padrao);
}

export async function getResumoDiario(): Promise<ResumoDiario> {
  const response = await fetchWithAuth("/diario/resumo");
  if (!response.ok) throw await erro(response, "Erro ao carregar o resumo do diário");
  return response.json();
}

export async function getDiarios(obraId: string, limite = 30): Promise<DiarioListagem> {
  const response = await fetchWithAuth(`/obras/${obraId}/diario?limite=${limite}`);
  if (!response.ok) throw await erro(response, "Erro ao carregar o diário da obra");
  return response.json();
}

export async function criarDiario(obraId: string, dados: DiarioCreate): Promise<Diario> {
  const response = await fetchWithAuth(`/obras/${obraId}/diario`, { method: "POST", body: JSON.stringify(dados) });
  if (!response.ok) throw await erro(response, "Erro ao criar o diário");
  return response.json();
}

export async function atualizarDiario(obraId: string, diarioId: string, dados: DiarioUpdate): Promise<Diario> {
  const response = await fetchWithAuth(`/obras/${obraId}/diario/${diarioId}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  if (!response.ok) throw await erro(response, "Erro ao atualizar o diário");
  return response.json();
}

export async function alterarStatusDiario(obraId: string, diarioId: string, status: StatusDiario): Promise<Diario> {
  const response = await fetchWithAuth(`/obras/${obraId}/diario/${diarioId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw await erro(response, "Erro ao alterar o status do diário");
  return response.json();
}

export async function excluirDiario(obraId: string, diarioId: string): Promise<void> {
  const response = await fetchWithAuth(`/obras/${obraId}/diario/${diarioId}`, { method: "DELETE" });
  if (!response.ok) throw await erro(response, "Erro ao excluir o diário");
}

export async function enviarFotoDiario(
  obraId: string,
  diarioId: string,
  arquivo: File,
  legenda?: string
): Promise<FotoDiario> {
  const form = new FormData();
  form.append("file", arquivo);
  if (legenda) form.append("legenda", legenda);
  const response = await fetchWithAuth(`/obras/${obraId}/diario/${diarioId}/fotos`, { method: "POST", body: form });
  if (!response.ok) throw await erro(response, `Erro ao enviar a foto ${arquivo.name}`);
  return response.json();
}

export async function removerFotoDiario(obraId: string, diarioId: string, fotoId: string): Promise<void> {
  const response = await fetchWithAuth(`/obras/${obraId}/diario/${diarioId}/fotos/${fotoId}`, { method: "DELETE" });
  if (!response.ok) throw await erro(response, "Erro ao remover a foto");
}
