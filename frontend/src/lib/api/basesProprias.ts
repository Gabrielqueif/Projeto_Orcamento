import { fetchWithAuth } from "./client";

export type TipoInsumo = "MATERIAL" | "MAO_DE_OBRA" | "EQUIPAMENTO" | "SERVICO";
export type RefFonte = "PROPRIA" | "SINAPI" | "SEINFRA";
export type RefTipo = "INSUMO" | "COMPOSICAO";

export const TIPOS_INSUMO: { valor: TipoInsumo; rotulo: string }[] = [
  { valor: "MATERIAL", rotulo: "Material" },
  { valor: "MAO_DE_OBRA", rotulo: "Mão de obra" },
  { valor: "EQUIPAMENTO", rotulo: "Equipamento" },
  { valor: "SERVICO", rotulo: "Serviço" },
];

export interface BasePropria {
  id: string;
  nome: string;
  descricao?: string | null;
  uf?: string | null;
  data_referencia?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BasePropriaInput {
  nome: string;
  descricao?: string | null;
  uf?: string | null;
  data_referencia?: string | null;
}

export type BasePropriaUpdate = Partial<BasePropriaInput>;

export interface InsumoProprio {
  id: string;
  base_id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: TipoInsumo;
  preco: number;
}

export interface InsumoInput {
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: TipoInsumo;
  preco: number;
}

export type InsumoUpdate = Partial<Omit<InsumoInput, "codigo">>;

export interface ItemInput {
  ref_fonte: RefFonte;
  ref_tipo: RefTipo;
  ref_codigo: string;
  coeficiente: number;
}

export type ItemUpdate = Partial<ItemInput>;

export interface ItemComposicaoPropria extends ItemInput {
  id: string;
  composicao_id: string;
}

export interface ComposicaoPropria {
  id: string;
  base_id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  grupo?: string | null;
}

export interface ComposicaoDetalhe extends ComposicaoPropria {
  itens: ItemComposicaoPropria[];
}

export interface ComposicaoInput {
  codigo: string;
  descricao: string;
  unidade: string;
  grupo?: string | null;
  itens?: ItemInput[];
}

export type ComposicaoUpdate = Partial<Omit<ComposicaoInput, "codigo" | "itens">>;

export interface ItemPreco {
  ref_fonte: RefFonte;
  ref_tipo: RefTipo;
  ref_codigo: string;
  descricao?: string | null;
  unidade?: string | null;
  coeficiente: number;
  preco_unitario?: number | null;
  subtotal: number;
  encontrado: boolean;
}

export interface PrecoComposicao {
  composicao_id: string;
  codigo: string;
  uf: string;
  mes: string;
  tipo: string;
  preco_total: number;
  itens: ItemPreco[];
  itens_sem_preco: number;
}

export interface ImportacaoResultado {
  insumos_importados: number;
  composicoes_importadas: number;
  itens_importados: number;
}

export interface BuscaParams {
  q?: string;
  limite?: number;
  offset?: number;
}

const BASE = "/bases-proprias";

async function erroDe(response: Response, padrao: string): Promise<Error> {
  const corpo: { detail?: unknown } = await response.json().catch(() => ({}));
  const detail = corpo?.detail;
  if (typeof detail === "string" && detail) return new Error(detail);
  if (Array.isArray(detail) && typeof detail[0]?.msg === "string") return new Error(detail[0].msg);
  return new Error(padrao);
}

async function json<T>(response: Response, padrao: string): Promise<T> {
  if (!response.ok) throw await erroDe(response, padrao);
  return response.json() as Promise<T>;
}

async function vazio(response: Response, padrao: string): Promise<void> {
  if (!response.ok) throw await erroDe(response, padrao);
}

function enviar(metodo: "POST" | "PUT", corpo?: unknown): RequestInit {
  return { method: metodo, body: corpo === undefined ? undefined : JSON.stringify(corpo) };
}

function query(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// --- Bases ---------------------------------------------------------------

export async function listarBases(): Promise<BasePropria[]> {
  return json(await fetchWithAuth(BASE), "Erro ao listar as bases");
}

export async function criarBase(dados: BasePropriaInput): Promise<BasePropria> {
  return json(await fetchWithAuth(BASE, enviar("POST", dados)), "Erro ao criar a base");
}

export async function obterBase(baseId: string): Promise<BasePropria> {
  return json(await fetchWithAuth(`${BASE}/${baseId}`), "Erro ao carregar a base");
}

export async function atualizarBase(baseId: string, dados: BasePropriaUpdate): Promise<BasePropria> {
  return json(await fetchWithAuth(`${BASE}/${baseId}`, enviar("PUT", dados)), "Erro ao atualizar a base");
}

export async function excluirBase(baseId: string): Promise<void> {
  return vazio(await fetchWithAuth(`${BASE}/${baseId}`, { method: "DELETE" }), "Erro ao excluir a base");
}

export async function duplicarBase(baseId: string, nome?: string): Promise<BasePropria> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/duplicar`, enviar("POST", nome ? { nome } : undefined)),
    "Erro ao duplicar a base",
  );
}

// --- Insumos -------------------------------------------------------------

export async function listarInsumos(baseId: string, busca: BuscaParams = {}): Promise<InsumoProprio[]> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/insumos${query({ ...busca })}`),
    "Erro ao listar os insumos",
  );
}

export async function criarInsumo(baseId: string, dados: InsumoInput): Promise<InsumoProprio> {
  return json(await fetchWithAuth(`${BASE}/${baseId}/insumos`, enviar("POST", dados)), "Erro ao criar o insumo");
}

export async function obterInsumo(baseId: string, insumoId: string): Promise<InsumoProprio> {
  return json(await fetchWithAuth(`${BASE}/${baseId}/insumos/${insumoId}`), "Erro ao carregar o insumo");
}

export async function atualizarInsumo(baseId: string, insumoId: string, dados: InsumoUpdate): Promise<InsumoProprio> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/insumos/${insumoId}`, enviar("PUT", dados)),
    "Erro ao atualizar o insumo",
  );
}

export async function excluirInsumo(baseId: string, insumoId: string): Promise<void> {
  return vazio(
    await fetchWithAuth(`${BASE}/${baseId}/insumos/${insumoId}`, { method: "DELETE" }),
    "Erro ao excluir o insumo",
  );
}

// --- Composições ---------------------------------------------------------

export async function listarComposicoes(baseId: string, busca: BuscaParams = {}): Promise<ComposicaoPropria[]> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes${query({ ...busca })}`),
    "Erro ao listar as composições",
  );
}

export async function criarComposicao(baseId: string, dados: ComposicaoInput): Promise<ComposicaoDetalhe> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes`, enviar("POST", dados)),
    "Erro ao criar a composição",
  );
}

export async function obterComposicao(baseId: string, composicaoId: string): Promise<ComposicaoDetalhe> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes/${composicaoId}`),
    "Erro ao carregar a composição",
  );
}

export async function atualizarComposicao(
  baseId: string,
  composicaoId: string,
  dados: ComposicaoUpdate,
): Promise<ComposicaoPropria> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes/${composicaoId}`, enviar("PUT", dados)),
    "Erro ao atualizar a composição",
  );
}

export async function excluirComposicao(baseId: string, composicaoId: string): Promise<void> {
  return vazio(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes/${composicaoId}`, { method: "DELETE" }),
    "Erro ao excluir a composição",
  );
}

export async function calcularPrecoComposicao(
  baseId: string,
  composicaoId: string,
  uf: string,
  mes: string,
  tipo?: string,
): Promise<PrecoComposicao> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes/${composicaoId}/preco${query({ uf, mes, tipo })}`),
    "Erro ao calcular o preço da composição",
  );
}

// --- Itens ---------------------------------------------------------------

export async function adicionarItem(
  baseId: string,
  composicaoId: string,
  dados: ItemInput,
): Promise<ItemComposicaoPropria> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes/${composicaoId}/itens`, enviar("POST", dados)),
    "Erro ao adicionar o item",
  );
}

export async function atualizarItem(
  baseId: string,
  composicaoId: string,
  itemId: string,
  dados: ItemUpdate,
): Promise<ItemComposicaoPropria> {
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes/${composicaoId}/itens/${itemId}`, enviar("PUT", dados)),
    "Erro ao atualizar o item",
  );
}

export async function removerItem(baseId: string, composicaoId: string, itemId: string): Promise<void> {
  return vazio(
    await fetchWithAuth(`${BASE}/${baseId}/composicoes/${composicaoId}/itens/${itemId}`, { method: "DELETE" }),
    "Erro ao remover o item",
  );
}

// --- Importação ----------------------------------------------------------

export async function importarPlanilha(baseId: string, arquivo: File): Promise<ImportacaoResultado> {
  const form = new FormData();
  form.append("file", arquivo);
  return json(
    await fetchWithAuth(`${BASE}/${baseId}/importar`, { method: "POST", body: form }),
    "Erro ao importar a planilha",
  );
}

export async function baixarModeloImportacao(): Promise<Blob> {
  const response = await fetchWithAuth(`${BASE}/modelo-importacao`);
  if (!response.ok) throw await erroDe(response, "Erro ao baixar o modelo");
  return response.blob();
}
