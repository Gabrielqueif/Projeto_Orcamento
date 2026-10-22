import type { RefFonte, RefTipo, TipoInsumo } from "@/lib/api/basesProprias";
import { TIPOS_INSUMO } from "@/lib/api/basesProprias";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const TIPOS_PRECO = ["Sem Desoneração", "Com Desoneração"];

export const FONTES_REF: { valor: RefFonte; rotulo: string }[] = [
  { valor: "PROPRIA", rotulo: "Própria" },
  { valor: "SINAPI", rotulo: "SINAPI" },
  { valor: "SEINFRA", rotulo: "SEINFRA" },
];

export const TIPOS_REF: { valor: RefTipo; rotulo: string }[] = [
  { valor: "INSUMO", rotulo: "Insumo" },
  { valor: "COMPOSICAO", rotulo: "Composição" },
];

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function rotuloTipoInsumo(tipo: TipoInsumo): string {
  return TIPOS_INSUMO.find((t) => t.valor === tipo)?.rotulo ?? tipo;
}

export function chaveRef(ref: { ref_fonte: RefFonte; ref_tipo: RefTipo; ref_codigo: string }): string {
  return `${ref.ref_fonte}|${ref.ref_tipo}|${ref.ref_codigo}`;
}

/** Converte "1.234,56" ou "12,5" em número; devolve NaN se inválido. */
export function lerNumero(texto: string): number {
  const t = texto.trim();
  const limpo = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return limpo === "" ? NaN : Number(limpo);
}
