import { fetchWithAuth } from './client';

export interface Orcamento {
  id: string;
  nome: string;
  cliente: string;
  data: string;
  base_referencia: string;
  tipo_composicao: string;
  estado: string;
  valor_total: number | null;
  status: string;
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
  status?: string;
}

export interface OrcamentoUpdate {
  nome?: string;
  cliente?: string;
  data?: string;
  base_referencia?: string;
  tipo_composicao?: string;
  estado?: string;
  status?: string;
  valor_total?: number;
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
  estado: string;
  etapa_id?: string;
  memoria_calculo?: string;
  variaveis?: any;
  created_at?: string;
}

export interface OrcamentoItemCreate {
  codigo_composicao: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  estado?: string; // Opcional, será pego do orçamento se não fornecido
  etapa_id?: string;
  memoria_calculo?: string;
  variaveis?: any;
}

export interface OrcamentoItemUpdate {
  codigo_composicao?: string;
  descricao?: string;
  quantidade?: number;
  unidade?: string;
  estado?: string;
  etapa_id?: string;
  memoria_calculo?: string;
  variaveis?: any;
}

// Interfaces para Etapas
export interface Etapa {
  id: string;
  orcamento_id: string;
  nome: string;
  ordem: number;
  created_at?: string;
}

export interface EtapaCreate {
  nome: string;
  ordem?: number;
}

// Funções para Orçamentos
export async function createOrcamento(data: OrcamentoCreate): Promise<Orcamento> {
  const response = await fetchWithAuth('/orcamentos/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao criar orçamento');
  }

  return response.json();
}

export async function getOrcamentos(status?: string, cliente?: string): Promise<Orcamento[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (cliente) params.append('cliente', cliente);

  const url = `/orcamentos/${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error('Erro ao buscar orçamentos');
  }

  return response.json();
}

export async function getOrcamento(id: string): Promise<Orcamento> {
  const response = await fetchWithAuth(`/orcamentos/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Orçamento não encontrado');
    }
    throw new Error('Erro ao buscar orçamento');
  }

  return response.json();
}

export async function updateOrcamento(id: string, data: OrcamentoUpdate): Promise<Orcamento> {
  const response = await fetchWithAuth(`/orcamentos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao atualizar orçamento');
  }

  return response.json();
}

export async function deleteOrcamento(id: string): Promise<void> {
  const response = await fetchWithAuth(`/orcamentos/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao deletar orçamento');
  }
}

export async function downloadOrcamentoPDF(id: string): Promise<Blob> {
  const response = await fetchWithAuth(`/orcamentos/${id}/pdf`);

  if (!response.ok) {
    throw new Error('Erro ao baixar PDF');
  }

  return response.blob();
}

// Funções para Itens do Orçamento
export async function addItem(orcamentoId: string, item: OrcamentoItemCreate): Promise<OrcamentoItem> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/itens`, {
    method: 'POST',
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao adicionar item');
  }

  return response.json();
}

export async function getItens(orcamentoId: string): Promise<OrcamentoItem[]> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/itens`);

  if (!response.ok) {
    throw new Error('Erro ao buscar itens do orçamento');
  }

  return response.json();
}

export async function updateItem(
  orcamentoId: string,
  itemId: string,
  item: OrcamentoItemUpdate
): Promise<OrcamentoItem> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/itens/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao atualizar item');
  }

  return response.json();
}

export async function deleteItem(orcamentoId: string, itemId: string): Promise<void> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/itens/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao remover item');
  }
}

// Funções para Etapas
export async function getEtapas(orcamentoId: string): Promise<Etapa[]> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/etapas`);
  if (!response.ok) throw new Error('Erro ao buscar etapas');
  return response.json();
}

export async function createEtapa(orcamentoId: string, data: EtapaCreate): Promise<Etapa> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/etapas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao criar etapa');
  }
  return response.json();
}

export async function deleteEtapa(orcamentoId: string, etapaId: string): Promise<void> {
  const response = await fetchWithAuth(`/orcamentos/${orcamentoId}/etapas/${etapaId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao deletar etapa');
  }
}

// SINAPI Bases
export interface SinapiBase {
  mes_referencia: string;
  tipo_composicao: string;
}

export async function getSinapiBases(): Promise<SinapiBase[]> {
  const response = await fetchWithAuth('/sinapi/bases');
  if (!response.ok) throw new Error('Erro ao buscar bases SINAPI');
  return response.json();
}
