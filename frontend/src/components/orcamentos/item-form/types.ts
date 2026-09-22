import type { OrcamentoItem } from "@/lib/api/orcamentos";

export interface ItemComposicao {
  codigo_composicao: string;
  descricao: string;
  unidade: string;
  preco?: number;
  fonte: string;
}

export interface VariableConfig {
  id: string;
  label: string;
  key: string;
}

export interface MemoriaCalculoElemento {
  id: string;
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  valores?: Record<string, number>;
  subtotal: number;
}

export interface ParsedMemoria {
  config: VariableConfig[];
  elementos: MemoriaCalculoElemento[];
}

export interface OrcamentoItemFormProps {
  orcamentoId: string;
  estadoOrcamento?: string;
  fonteOrcamento?: string;
  refreshTrigger?: number;
  onItemAdded?: () => void;
  itemToEdit?: OrcamentoItem;
  initialEtapaId?: string;
  onCancel?: () => void;
}

export const DEFAULT_VARIABLE_CONFIGS: Record<string, VariableConfig[]> = {
  PRESET_1: [{ id: "qtd", label: "QTD / REP.", key: "quantidade" }],
  PRESET_2: [
    { id: "qtd", label: "QTD / REP.", key: "quantidade" },
    { id: "dim1", label: "COMPR. / LARGURA (M)", key: "largura" },
  ],
  PRESET_3: [
    { id: "qtd", label: "QTD / REP.", key: "quantidade" },
    { id: "dim1", label: "LARGURA (M)", key: "largura" },
    { id: "dim2", label: "ALTURA / COMPR. (M)", key: "altura" },
  ],
};

export const ESTADOS = [
  { value: "ac", label: "AC - Acre" },
  { value: "al", label: "AL - Alagoas" },
  { value: "ap", label: "AP - Amapá" },
  { value: "am", label: "AM - Amazonas" },
  { value: "ba", label: "BA - Bahia" },
  { value: "ce", label: "CE - Ceará" },
  { value: "df", label: "DF - Distrito Federal" },
  { value: "es", label: "ES - Espírito Santo" },
  { value: "go", label: "GO - Goiás" },
  { value: "ma", label: "MA - Maranhão" },
  { value: "mt", label: "MT - Mato Grosso" },
  { value: "ms", label: "MS - Mato Grosso do Sul" },
  { value: "mg", label: "MG - Minas Gerais" },
  { value: "pa", label: "PA - Pará" },
  { value: "pb", label: "PB - Paraíba" },
  { value: "pr", label: "PR - Paraná" },
  { value: "pe", label: "PE - Pernambuco" },
  { value: "pi", label: "PI - Piauí" },
  { value: "rj", label: "RJ - Rio de Janeiro" },
  { value: "rn", label: "RN - Rio Grande do Norte" },
  { value: "rs", label: "RS - Rio Grande do Sul" },
  { value: "ro", label: "RO - Rondônia" },
  { value: "rr", label: "RR - Roraima" },
  { value: "sc", label: "SC - Santa Catarina" },
  { value: "sp", label: "SP - São Paulo" },
  { value: "se", label: "SE - Sergipe" },
  { value: "to", label: "TO - Tocantins" },
];
