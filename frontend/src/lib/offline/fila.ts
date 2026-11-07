import {
  alterarStatusDiario,
  atualizarDiario,
  criarDiario,
  enviarFotoDiario,
  getDiarios,
  type DiarioCreate,
} from "@/lib/api/diario";
import { kvAll, kvDel, kvGet, kvSet } from "./db";

export interface EnvioPendente {
  obraId: string;
  dados: DiarioCreate;
  /** Fotos já reduzidas que ainda não subiram; saem da lista conforme sobem. */
  fotos: File[];
  enviar: boolean;
  erro?: string;
}

/** fetch sem rede lança TypeError; erros da API (4xx/5xx) vêm como Error comum. */
export const ehErroDeRede = (e: unknown) => e instanceof TypeError;

const chaveDe = (obraId: string, data: string) => `${obraId}:${data}`;

export async function enfileirar(item: EnvioPendente): Promise<void> {
  await kvSet("fila", chaveDe(item.obraId, item.dados.data), { ...item, erro: undefined });
}

export const listarPendentes = () => kvAll<EnvioPendente>("fila");

export const pendenteDaObra = (obraId: string, data: string) => kvGet<EnvioPendente>("fila", chaveDe(obraId, data));

let sincronizando: Promise<number> | null = null;

/**
 * Envia a fila em ordem. Devolve quantos itens terminaram. Para na primeira falha de rede;
 * erro da API fica no item (`erro`) e a fila segue. O diário é achado pela data (UNIQUE obra+data),
 * então repetir um envio interrompido atualiza em vez de duplicar.
 */
export function sincronizar(): Promise<number> {
  sincronizando ??= processar().finally(() => (sincronizando = null));
  return sincronizando;
}

async function processar(): Promise<number> {
  let feitos = 0;
  for (const item of await listarPendentes()) {
    const chave = chaveDe(item.obraId, item.dados.data);
    try {
      const existente = (await getDiarios(item.obraId, 5)).registros.find((r) => r.data === item.dados.data);
      const diario = existente
        ? await atualizarDiario(item.obraId, existente.id, item.dados)
        : await criarDiario(item.obraId, item.dados);
      while (item.fotos.length > 0) {
        await enviarFotoDiario(item.obraId, diario.id, item.fotos[0]);
        item.fotos.shift();
        await kvSet("fila", chave, item);
      }
      if (item.enviar) await alterarStatusDiario(item.obraId, diario.id, "ENVIADO");
      await kvDel("fila", chave);
      feitos++;
    } catch (e) {
      if (ehErroDeRede(e)) break;
      await kvSet("fila", chave, { ...item, erro: e instanceof Error ? e.message : "Erro ao enviar" });
    }
  }
  return feitos;
}
