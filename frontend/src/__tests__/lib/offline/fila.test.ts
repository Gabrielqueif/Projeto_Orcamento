// jsdom não traz structuredClone, que o fake-indexeddb usa; identidade basta aqui.
(globalThis as { structuredClone?: unknown }).structuredClone ??= (v: unknown) => v;
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("fake-indexeddb/auto");
import { enfileirar, listarPendentes, sincronizar, type EnvioPendente } from "@/lib/offline/fila";
import * as api from "@/lib/api/diario";

jest.mock("@/lib/api/diario");
const m = api as jest.Mocked<typeof api>;

const foto = (n: string) => new File(["x"], n, { type: "image/jpeg" });
const item = (over: Partial<EnvioPendente> = {}): EnvioPendente => ({
  obraId: "o1",
  dados: { data: "2026-11-07", titulo: "t", atividades: "a", clima: "SOL", equipe_presente: 1 },
  fotos: [foto("a.jpg"), foto("b.jpg")],
  enviar: true,
  ...over,
});

beforeEach(async () => {
  jest.resetAllMocks();
  for (const p of await listarPendentes()) {
    // limpa a fila entre testes
    await sincronizarVazio(p);
  }
});

async function sincronizarVazio(p: EnvioPendente) {
  const { kvDel } = await import("@/lib/offline/db");
  await kvDel("fila", `${p.obraId}:${p.dados.data}`);
}

it("cria o diário, sobe as fotos, envia e limpa a fila", async () => {
  m.getDiarios.mockResolvedValue({ registros: [] } as never);
  m.criarDiario.mockResolvedValue({ id: "d1" } as never);
  await enfileirar(item());
  expect(await sincronizar()).toBe(1);
  expect(m.criarDiario).toHaveBeenCalledTimes(1);
  expect(m.enviarFotoDiario).toHaveBeenCalledTimes(2);
  expect(m.alterarStatusDiario).toHaveBeenCalledWith("o1", "d1", "ENVIADO");
  expect(await listarPendentes()).toHaveLength(0);
});

it("atualiza em vez de duplicar quando a data já existe", async () => {
  m.getDiarios.mockResolvedValue({ registros: [{ id: "d9", data: "2026-11-07" }] } as never);
  m.atualizarDiario.mockResolvedValue({ id: "d9" } as never);
  await enfileirar(item({ fotos: [], enviar: false }));
  await sincronizar();
  expect(m.criarDiario).not.toHaveBeenCalled();
  expect(m.atualizarDiario).toHaveBeenCalledWith("o1", "d9", expect.anything());
  expect(m.alterarStatusDiario).not.toHaveBeenCalled();
});

it("sem rede mantém o item e as fotos que faltam", async () => {
  m.getDiarios.mockResolvedValue({ registros: [] } as never);
  m.criarDiario.mockResolvedValue({ id: "d1" } as never);
  m.enviarFotoDiario.mockResolvedValueOnce({} as never).mockRejectedValueOnce(new TypeError("Failed to fetch"));
  await enfileirar(item());
  expect(await sincronizar()).toBe(0);
  const [restante] = await listarPendentes();
  expect(restante.fotos.map((f) => f.name)).toEqual(["b.jpg"]);
  expect(m.alterarStatusDiario).not.toHaveBeenCalled();
});

it("erro da API fica registrado no item e a fila continua", async () => {
  m.getDiarios.mockResolvedValue({ registros: [] } as never);
  m.criarDiario.mockRejectedValueOnce(new Error("quantidade inválida")).mockResolvedValue({ id: "d2" } as never);
  await enfileirar(item({ fotos: [] }));
  await enfileirar(item({ obraId: "o2", fotos: [] }));
  expect(await sincronizar()).toBe(1);
  const [restante] = await listarPendentes();
  expect(restante).toMatchObject({ obraId: "o1", erro: "quantidade inválida" });
});
