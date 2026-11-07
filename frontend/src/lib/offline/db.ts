// IndexedDB mínimo: dois stores chave→valor. "fila" guarda envios pendentes; "cache" guarda a última
// resposta de cada tela do canteiro para abri-la sem sinal.
const STORES = ["fila", "cache"] as const;
type Store = (typeof STORES)[number];

let aberto: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  aberto ??= new Promise((resolve, reject) => {
    const req = indexedDB.open("gpobras-offline", 1);
    req.onupgradeneeded = () => STORES.forEach((s) => req.result.createObjectStore(s));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      aberto = null;
      reject(req.error);
    };
  });
  return aberto;
}

async function pedido<T>(store: Store, modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, modo).objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const kvGet = <T>(store: Store, chave: string) => pedido<T | undefined>(store, "readonly", (s) => s.get(chave));
export const kvSet = (store: Store, chave: string, valor: unknown) => pedido(store, "readwrite", (s) => s.put(valor, chave));
export const kvDel = (store: Store, chave: string) => pedido(store, "readwrite", (s) => s.delete(chave));
export const kvAll = <T>(store: Store) => pedido<T[]>(store, "readonly", (s) => s.getAll());

/** Última resposta boa de `buscar`; sem rede devolve a guardada. Erros que não são de rede continuam subindo. */
export async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  try {
    const valor = await buscar();
    kvSet("cache", chave, valor).catch(() => {});
    return valor;
  } catch (e) {
    if (e instanceof TypeError) {
      const guardado = await kvGet<T>("cache", chave).catch(() => undefined);
      if (guardado !== undefined) return guardado;
    }
    throw e;
  }
}
