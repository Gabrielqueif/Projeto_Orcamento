/**
 * Testes do cliente de API de medições e Curva S. `fetchWithAuth` é mockado: o que
 * se verifica é a URL, o método, o corpo e a mensagem de erro de cada chamada.
 */
jest.mock("@/lib/api/client", () => ({
  fetchWithAuth: jest.fn(),
  API_URL: "http://localhost:8000",
}));

import { fetchWithAuth } from "@/lib/api/client";
import { getCurvaS, getMedicoes, registrarMedicao, removerMedicao } from "@/lib/api/medicoes";

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

function resposta(corpo: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(corpo),
  } as unknown as Response;
}

beforeEach(() => mockFetch.mockReset());

describe("medições", () => {
  it("busca a Curva S da obra", async () => {
    mockFetch.mockResolvedValue(resposta({ situacao: "NO_PRAZO", pontos: [] }));
    await getCurvaS("obra-1");
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/curva-s");
  });

  it("lista todas as medições ou só as de uma etapa", async () => {
    mockFetch.mockResolvedValue(resposta([]));
    await getMedicoes("obra-1");
    await getMedicoes("obra-1", "etapa 1");
    expect(mockFetch).toHaveBeenNthCalledWith(1, "/obras/obra-1/medicoes");
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/obras/obra-1/medicoes?etapa_id=etapa%201");
  });

  it("registra a medição com POST e corpo JSON", async () => {
    const dados = { etapa_id: "e1", data: "2026-10-22", progresso: 40 };
    mockFetch.mockResolvedValue(resposta({ id: "m1" }, 201));
    await registrarMedicao("obra-1", dados);
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/medicoes", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  });

  it("exclui a medição com DELETE", async () => {
    mockFetch.mockResolvedValue(resposta({}));
    await removerMedicao("obra-1", "m1");
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/medicoes/m1", { method: "DELETE" });
  });
});

describe("erros", () => {
  it("repassa a mensagem do backend", async () => {
    mockFetch.mockResolvedValue(resposta({ detail: "A data da medição não pode ser futura" }, 400));
    await expect(
      registrarMedicao("obra-1", { etapa_id: "e1", data: "2999-01-01", progresso: 10 })
    ).rejects.toThrow("A data da medição não pode ser futura");
  });

  it("junta as mensagens de validação do FastAPI (422)", async () => {
    mockFetch.mockResolvedValue(resposta({ detail: [{ msg: "progresso inválido" }, { msg: "data inválida" }] }, 422));
    await expect(
      registrarMedicao("obra-1", { etapa_id: "e1", data: "x", progresso: 500 })
    ).rejects.toThrow("progresso inválido; data inválida");
  });

  it("usa a mensagem padrão quando o corpo não é JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("sem corpo")),
    } as unknown as Response);
    await expect(getCurvaS("obra-1")).rejects.toThrow("Erro ao carregar a Curva S");
  });
});
