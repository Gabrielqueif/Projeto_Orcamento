import { fetchWithAuth } from "./client";

export type CampoBase = "cpf" | "data_inicio" | "descricao" | "remuneracao";

export const CAMPOS_BASE: { chave: CampoBase; rotulo: string }[] = [
  { chave: "cpf", rotulo: "CPF / Documento" },
  { chave: "data_inicio", rotulo: "Data de Início" },
  { chave: "remuneracao", rotulo: "Remuneração" },
  { chave: "descricao", rotulo: "Descrição das Atividades" },
];

export interface CampoExtra {
  chave: string;
  rotulo: string;
  tipo: "texto" | "numero" | "data";
  obrigatorio: boolean;
}

export interface Cargo {
  id: string;
  user_id: string | null; // null = pré-montado
  nome: string;
  campos_ocultos: CampoBase[];
  campos_extras: CampoExtra[];
}

export type CargoInput = Pick<Cargo, "nome" | "campos_ocultos" | "campos_extras">;

async function erro(response: Response, padrao: string): Promise<never> {
  const body = await response.json().catch(() => ({}));
  throw new Error(body.detail || padrao);
}

export async function getCargos(): Promise<Cargo[]> {
  const response = await fetchWithAuth("/cargos/");
  if (!response.ok) return erro(response, "Erro ao buscar cargos");
  return response.json();
}

export async function createCargo(data: CargoInput): Promise<Cargo> {
  const response = await fetchWithAuth("/cargos/", { method: "POST", body: JSON.stringify(data) });
  if (!response.ok) return erro(response, "Erro ao criar cargo");
  return response.json();
}

export async function updateCargo(id: string, data: Partial<CargoInput>): Promise<Cargo> {
  const response = await fetchWithAuth(`/cargos/${id}`, { method: "PUT", body: JSON.stringify(data) });
  if (!response.ok) return erro(response, "Erro ao atualizar cargo");
  return response.json();
}

export async function deleteCargo(id: string): Promise<void> {
  const response = await fetchWithAuth(`/cargos/${id}`, { method: "DELETE" });
  if (!response.ok) return erro(response, "Erro ao deletar cargo");
}
