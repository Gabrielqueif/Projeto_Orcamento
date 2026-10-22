/**
 * Testes do cliente de API do painel executivo. `fetchWithAuth` é mockado.
 */
jest.mock("@/lib/api/client", () => ({
  fetchWithAuth: jest.fn(),
  API_URL: "http://localhost:8000",
}));

import { fetchWithAuth } from "@/lib/api/client";
import { getDashboard } from "@/lib/api/dashboard";

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

beforeEach(() => mockFetch.mockReset());

describe("getDashboard", () => {
  it("busca o painel e devolve o corpo da resposta", async () => {
    const corpo = { obras_ativas: 2, riscos: [], series: [], feed: [], semanas: [] };
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(corpo) } as unknown as Response);

    await expect(getDashboard()).resolves.toEqual(corpo);
    expect(mockFetch).toHaveBeenCalledWith("/dashboard");
  });

  it("repassa a mensagem de erro do backend", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: "Erro interno do servidor" }),
    } as unknown as Response);
    await expect(getDashboard()).rejects.toThrow("Erro interno do servidor");
  });

  it("usa a mensagem padrão quando o corpo não é JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("sem corpo")),
    } as unknown as Response);
    await expect(getDashboard()).rejects.toThrow("Erro ao carregar o painel");
  });
});
