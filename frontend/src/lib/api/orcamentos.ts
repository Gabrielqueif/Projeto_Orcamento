import { fetchWithAuth } from "./client";

export type TipoBDI = "ANALITICO" | "SINTETICO";
export type RegimeTributario = "LUCRO_PRESUMIDO_REAL" | "SIMPLES_NACIONAL";
export type TipoBDIItem = "PADRAO" | "DIFERENCIADO";

export interface BDIConfig {
  regime_tributario: RegimeTributario;
  ac: number;
  sg: number;
  r: number;
  df: number;
  lucro: number;
  pis: number;
  cofins: number;
  iss: number;
  cprb: number;
  aliquota_simples: number;
  bdi_diferenciado: number;
}

export interface BDICalculateResponse {
  bdi: number;
  bdi_diferenciado: number;
  impostos_total: number;
  detalhamento: {
    formula: string;
    faixas_referencia_edificios: Record<string, { min: number; medio: number; max: number }>;
    faixas_referencia_equipamentos: Record<string, { min: number; medio: number; max: number }>;
  };
}

export interface Orcamento {
  id: string;
  nome: string;
  cliente: string;
  data: string;
  base_referencia: string;
  tipo_composicao: string;
  estado: string;
  fonte: string;
  bdi: number;
  tipo_bdi?: TipoBDI;
  bdi_config?: BDIConfig | null;
  valor_total: number | null;
  status: string;
  variaveis_globais?: any[] | null;
  locais?: any[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrcamentoCreate {
  nome: string;
  cliente: string;
  data: string;
  base_referencia: string;
  tipo_composicao: string;
  estado: string;
  fonte?: string;
  bdi?: number;
  tipo_bdi?: TipoBDI;
  bdi_config?: BDIConfig;
  valor_total?: number;
  status?: string;
  variaveis_globais?: any[] | null;
  locais?: any[] | null;
}

export interface OrcamentoUpdate {
  nome?: string;
  cliente?: string;
  data?: string;
  base_referencia?: string;
  tipo_composicao?: string;
  estado?: string;
  fonte?: string;
  bdi?: number;
  tipo_bdi?: TipoBDI;
  bdi_config?: BDIConfig;
  status?: string;
  valor_total?: number;
  variaveis_globais?: any[] | null;
  locais?: any[] | null;
}

export interface VariableConfig {
  id: string;
  label: string;
  key: string;
}

export interface MemoriaCalculoElementoApi {
  id: string;
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  valores?: Record<string, number>;
  subtotal: number;
}

export interface MemoriaCalculoContainer {
  config: VariableConfig[];
  elementos: MemoriaCalculoElementoApi[];
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  codigo_composicao: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number | null;
  preco_total: number | null;
  tipo_bdi_item?: TipoBDIItem;
  bdi_aplicado?: number | null;
  preco_unitario_bdi?: number | null;
  preco_total_bdi?: number | null;
  estado: string;
  etapa_id?: string;
  memoria_calculo?: string;
  variaveis?: MemoriaCalculoContainer | any;
  fonte: string;
  created_at?: string;
}

export interface OrcamentoItemCreate {
  codigo_composicao: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  estado?: string;
  etapa_id?: string;
  memoria_calculo?: string;
  fonte?: string;
  variaveis?: MemoriaCalculoContainer | any;
  preco_unitario?: number;
  tipo_bdi_item?: TipoBDIItem;
  bdi_aplicado?: number;
}

export interface OrcamentoItemUpdate {
  codigo_composicao?: string;
  descricao?: string;
  quantidade?: number;
  unidade?: string;
  estado?: string;
  etapa_id?: string;
  memoria_calculo?: string;
  fonte?: string;
  variaveis?: MemoriaCalculoContainer | any;
  tipo_bdi_item?: TipoBDIItem;
  bdi_aplicado?: number;
}

// Interfaces para Etapas
export interface Etapa {
  id: string;
  orcamento_id: string;
  nome: string;
  ordem: number;
  parent_id: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  progresso?: number;
  created_at?: string;
}

export interface EtapaCreate {
  nome: string;
  ordem?: number;
  parent_id?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
}

export interface EtapaUpdate {
  nome?: string;
  ordem?: number;
  parent_id?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
}

// Funções para Orçamentos
export async function simularBdi(
  config: BDIConfig,
): Promise<BDICalculateResponse> {
  const response = await fetchWithAuth("/orcamentos/calcular-bdi", {
    method: "POST",
    body: JSON.stringify({ config }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao calcular BDI");
  }

  return response.json();
}

export async function createOrcamento(
  data: OrcamentoCreate,
): Promise<Orcamento> {
  const response = await fetchWithAuth("/orcamentos/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao criar orçamento");
  }

  return response.json();
}

export async function getOrcamentos(
  status?: string,
  cliente?: string,
  nome?: string,
): Promise<Orcamento[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (cliente) params.append("cliente", cliente);
  if (nome) params.append("nome", nome);

  const url = `/orcamentos/${params.toString() ? "?" + params.toString() : ""}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar orçamentos");
  }

  return response.json();
}

export async function getOrcamento(id: string): Promise<Orcamento> {
  const response = await fetchWithAuth(`/orcamentos/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Orçamento não encontrado");
    }
    throw new Error("Erro ao buscar orçamento");
  }

  return response.json();
}

export async function updateOrcamento(
  id: string,
  data: OrcamentoUpdate,
): Promise<Orcamento> {
  const response = await fetchWithAuth(`/orcamentos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao atualizar orçamento");
  }

  return response.json();
}

export async function deleteOrcamento(id: string): Promise<void> {
  const response = await fetchWithAuth(`/orcamentos/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao deletar orçamento");
  }
}

export async function downloadOrcamentoPDF(id: string): Promise<Blob> {
  const response = await fetchWithAuth(`/orcamentos/${id}/pdf`);

  if (!response.ok) {
    throw new Error("Erro ao baixar PDF");
  }

  return response.blob();
}

export async function downloadOrcamentoExcel(id: string): Promise<Blob> {
  const response = await fetchWithAuth(`/orcamentos/${id}/excel`);

  if (!response.ok) {
    throw new Error("Erro ao baixar planilha Excel");
  }

  return response.blob();
}

// Funções para Itens do Orçamento
export async function addItem(
  orcamentoId: string,
  item: OrcamentoItemCreate,
): Promise<OrcamentoItem> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/itens`, {
    method: "POST",
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao adicionar item");
  }

  return response.json();
}

export async function getItens(orcamentoId: string): Promise<OrcamentoItem[]> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/itens`);

  if (!response.ok) {
    throw new Error("Erro ao buscar itens do orçamento");
  }

  return response.json();
}

export async function updateItem(
  orcamentoId: string,
  itemId: string,
  item: OrcamentoItemUpdate,
): Promise<OrcamentoItem> {
  const response = await fetchWithAuth(
    `/orcamentos/${orcamentoId}/itens/${itemId}`,
    {
      method: "PUT",
      body: JSON.stringify(item),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao atualizar item");
  }

  return response.json();
}

export async function deleteItem(
  orcamentoId: string,
  itemId: string,
): Promise<void> {
  const response = await fetchWithAuth(
    `/orcamentos/${orcamentoId}/itens/${itemId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao remover item");
  }
}

// Funções para Etapas
export async function getEtapas(orcamentoId: string): Promise<Etapa[]> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/etapas`);
  if (!response.ok) throw new Error("Erro ao buscar etapas");
  return response.json();
}

export async function createEtapa(
  orcamentoId: string,
  data: EtapaCreate,
): Promise<Etapa> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/etapas`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao criar etapa");
  }
  return response.json();
}

export async function deleteEtapa(
  orcamentoId: string,
  etapaId: string,
): Promise<void> {
  const response = await fetchWithAuth(
    `/orcamentos/${orcamentoId}/etapas/${etapaId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao deletar etapa");
  }
}

export async function updateEtapa(
  orcamentoId: string,
  etapaId: string,
  data: EtapaUpdate,
): Promise<Etapa> {
  const response = await fetchWithAuth(
    `/orcamentos/${orcamentoId}/etapas/${etapaId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erro ao atualizar etapa");
  }
  return response.json();
}

export async function atualizarProgressoEtapa(
  orcamentoId: string,
  etapaId: string,
  progresso: number,
): Promise<Etapa> {
  const response = await fetchWithAuth(
    `/orcamentos/${orcamentoId}/etapas/${etapaId}/progresso`,
    {
      method: "PATCH",
      body: JSON.stringify({ progresso }),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Erro ao atualizar progresso da etapa");
  }
  return response.json();
}

// SINAPI Bases
export interface SinapiBase {
  mes_referencia: string;
  tipo_composicao: string;
  fonte: string;
}

export async function getSinapiBases(): Promise<SinapiBase[]> {
  const response = await fetchWithAuth("/importacao/bases");
  if (!response.ok) throw new Error("Erro ao buscar bases SINAPI");
  return response.json();
}

// Insumos (explosão analítica)
export interface OrcamentoItemInsumo {
  id: string;
  orcamento_item_id: string;
  codigo_insumo: string;
  descricao: string;
  unidade: string | null;
  quantidade_unitaria: number;
  preco_unitario_base: number | null;
  preco_unitario_custom: number | null;
  total: number | null;
  tipo_item: string;
  created_at?: string;
}

export async function getInsumos(
  orcamentoId: string,
  itemId: string,
): Promise<OrcamentoItemInsumo[]> {
  const response = await fetchWithAuth(
    `/orcamentos/${orcamentoId}/itens/${itemId}/insumos`
  );
  if (!response.ok) throw new Error("Erro ao buscar insumos do item");
  return response.json();
}

export async function updateInsumo(
  orcamentoId: string,
  itemId: string,
  insumoId: string,
  data: Partial<OrcamentoItemInsumo>
): Promise<OrcamentoItemInsumo> {
  const response = await fetchWithAuth(
    `/orcamentos/${orcamentoId}/itens/${itemId}/insumos/${insumoId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw new Error("Erro ao atualizar insumo");
  return response.json();
}

export interface OrcamentoStats {
  total_orcamentos: number;
  valor_total: number;
  taxa_aprovacao: number;
  ticket_medio: number;
  tempo_resposta_medio: number;
}

export interface CurvaABCInsumo {
  codigo_insumo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  total: number;
  porcentagem: number;
  acumulado: number;
  classe: string;
}

export interface CurvaABCResponse {
  valor_total: number;
  insumos: CurvaABCInsumo[];
  resumo_classes: Record<string, number>;
}

export interface CronogramaMes {
  mes: string;
  servicos: string;
  valor: number;
  acumulado_pct: number;
}

export interface CronogramaResponse {
  valor_total: number;
  mensal: CronogramaMes[];
}

export async function getOrcamentoStats(): Promise<OrcamentoStats> {
  const response = await fetchWithAuth("/orcamentos/stats");
  if (!response.ok) throw new Error("Erro ao buscar estatísticas de orçamentos");
  return response.json();
}

export async function getOrcamentoCurvaABC(orcamentoId: string): Promise<CurvaABCResponse> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/curva-abc`);
  if (!response.ok) throw new Error("Erro ao buscar curva ABC do orçamento");
  return response.json();
}

export async function getOrcamentoCronograma(orcamentoId: string): Promise<CronogramaResponse> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/cronograma`);
  if (!response.ok) throw new Error("Erro ao buscar cronograma do orçamento");
  return response.json();
}
