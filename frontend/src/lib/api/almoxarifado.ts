import { fetchWithAuth } from "./client";

export interface InsumoAlmoxarifado {
  id: string;
  obra_id: string;
  codigo_insumo: string;
  descricao: string;
  categoria: string;
  quantidade_atual: number;
  quantidade_minima: number;
  unidade: string;
  preco_unitario: number;
  status: string; // 'Normal' ou 'Crítico'
  fonte?: string;
  created_at: string;
  updated_at: string;
}

export interface InsumoCreate {
  codigo_insumo: string;
  descricao: string;
  categoria: string;
  quantidade_atual?: number;
  quantidade_minima: number;
  unidade: string;
  preco_unitario: number;
}

export interface MovimentacaoCreate {
  tipo_movimentacao: "ENTRADA" | "SAIDA";
  quantidade: number;
  responsavel: string;
  observacoes?: string;
}

export interface Movimentacao {
  id: string;
  insumo_id: string;
  tipo_movimentacao: "ENTRADA" | "SAIDA";
  quantidade: number;
  responsavel: string;
  observacoes?: string;
  data_movimentacao: string;
  created_at: string;
}

export interface LocacaoCreate {
  nome_equipamento: string;
  locadora: string;
  status: "EM_USO" | "AGUARDANDO_RETIRADA" | "FINALIZADO";
  devolucao_prevista: string; // YYYY-MM-DD
  responsavel?: string;
}

export interface Locacao {
  id: string;
  obra_id: string;
  nome_equipamento: string;
  locadora: string;
  status: "EM_USO" | "AGUARDANDO_RETIRADA" | "FINALIZADO";
  devolucao_prevista: string;
  responsavel?: string;
  created_at: string;
}

// Funções de API
export async function getEstoqueInsumos(obraId: string): Promise<InsumoAlmoxarifado[]> {
  const response = await fetchWithAuth(`/obras/${obraId}/almoxarifado/insumos`);
  if (!response.ok) {
    throw new Error("Erro ao buscar estoque de insumos");
  }
  return response.json();
}

export async function criarInsumo(obraId: string, dados: InsumoCreate): Promise<InsumoAlmoxarifado> {
  const response = await fetchWithAuth(`/obras/${obraId}/almoxarifado/insumos`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Erro ao criar insumo no estoque");
  }
  return response.json();
}

export async function registrarMovimentacao(
  obraId: string,
  insumoId: string,
  dados: MovimentacaoCreate
): Promise<Movimentacao> {
  const response = await fetchWithAuth(`/obras/${obraId}/almoxarifado/insumos/${insumoId}/movimentacoes`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Erro ao registrar movimentação de estoque");
  }
  return response.json();
}

export async function getLocacoes(obraId: string): Promise<Locacao[]> {
  const response = await fetchWithAuth(`/obras/${obraId}/almoxarifado/locacoes`);
  if (!response.ok) {
    throw new Error("Erro ao buscar locações de equipamentos");
  }
  return response.json();
}

export async function registrarLocacao(obraId: string, dados: LocacaoCreate): Promise<Locacao> {
  const response = await fetchWithAuth(`/obras/${obraId}/almoxarifado/locacoes`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Erro ao registrar locação de equipamento");
  }
  return response.json();
}

export async function atualizarStatusLocacao(
  obraId: string,
  locacaoId: string,
  novoStatus: "EM_USO" | "AGUARDANDO_RETIRADA" | "FINALIZADO"
): Promise<Locacao> {
  const response = await fetchWithAuth(
    `/obras/${obraId}/almoxarifado/locacoes/${locacaoId}/status?novo_status=${novoStatus}`,
    {
      method: "PUT",
    }
  );
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Erro ao atualizar status da locação");
  }
  return response.json();
}

export async function deletarInsumo(obraId: string, insumoId: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/obras/${obraId}/almoxarifado/insumos/${insumoId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Erro ao deletar insumo do estoque");
  }
  return response.json();
}

export async function deletarLocacao(obraId: string, locacaoId: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`/obras/${obraId}/almoxarifado/locacoes/${locacaoId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Erro ao deletar locação de equipamento");
  }
  return response.json();
}
