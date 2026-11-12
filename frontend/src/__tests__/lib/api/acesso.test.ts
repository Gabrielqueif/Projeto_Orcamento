jest.mock("@/lib/api/client", () => ({ fetchWithAuth: jest.fn(), API_URL: "http://localhost:8000" }));

import { fetchWithAuth } from "@/lib/api/client";
import { aceitarConvite, criarConvite, getObrasDoCanteiro, removerMembro } from "@/lib/api/acesso";

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;
const resposta = (corpo: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => corpo }) as unknown as Response;

beforeEach(() => mockFetch.mockReset());

it("cria convite com o papel escolhido", async () => {
  mockFetch.mockResolvedValue(resposta({ id: "c1", token: "t", papel: "SUPERVISOR", expira_em: "x" }, 201));
  await criarConvite("o1", "SUPERVISOR");
  expect(mockFetch).toHaveBeenCalledWith("/obras/o1/convites", { method: "POST", body: JSON.stringify({ papel: "SUPERVISOR" }) });
});

it("aceita convite enviando o token e propaga a mensagem de erro do servidor", async () => {
  mockFetch.mockResolvedValue(resposta({ detail: "Convite inválido ou expirado" }, 404));
  await expect(aceitarConvite("tok")).rejects.toThrow("Convite inválido ou expirado");
  expect(mockFetch).toHaveBeenCalledWith("/convites/aceitar", { method: "POST", body: JSON.stringify({ token: "tok" }) });
});

it("remove membro e lista obras do canteiro nas rotas certas", async () => {
  mockFetch.mockResolvedValue(resposta({}));
  await removerMembro("o1", "u1");
  expect(mockFetch).toHaveBeenCalledWith("/obras/o1/membros/u1", { method: "DELETE" });
  await getObrasDoCanteiro();
  expect(mockFetch).toHaveBeenLastCalledWith("/canteiro/obras");
});
