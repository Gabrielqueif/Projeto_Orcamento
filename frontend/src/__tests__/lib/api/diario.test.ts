/**
 * Testes do cliente de API do diário de obra. `fetchWithAuth` é mockado: o que
 * se verifica é a URL, o método, o corpo e a mensagem de erro de cada chamada.
 */
jest.mock("@/lib/api/client", () => ({
  fetchWithAuth: jest.fn(),
  API_URL: "http://localhost:8000",
}));

import { fetchWithAuth } from "@/lib/api/client";
import {
  alterarStatusDiario,
  atualizarDiario,
  criarDiario,
  enviarFotoDiario,
  excluirDiario,
  getDiarios,
  getResumoDiario,
  removerFotoDiario,
} from "@/lib/api/diario";

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

function resposta(corpo: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(corpo),
  } as unknown as Response;
}

const novoDiario = {
  data: "2026-10-21",
  titulo: "Concretagem",
  atividades: "Laje L2",
  clima: "SOL" as const,
  equipe_presente: 8,
};

beforeEach(() => mockFetch.mockReset());

describe("leitura", () => {
  it("busca o resumo das obras", async () => {
    mockFetch.mockResolvedValue(resposta({ total_obras: 0, obras: [] }));
    await getResumoDiario();
    expect(mockFetch).toHaveBeenCalledWith("/diario/resumo");
  });

  it("lista os diários da obra com o limite informado", async () => {
    mockFetch.mockResolvedValue(resposta({ obra: {}, registros: [] }));
    await getDiarios("obra-1", 10);
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/diario?limite=10");
  });

  it("usa 30 registros por padrão", async () => {
    mockFetch.mockResolvedValue(resposta({ obra: {}, registros: [] }));
    await getDiarios("obra-1");
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/diario?limite=30");
  });
});

describe("escrita", () => {
  it("cria o diário com POST e corpo JSON", async () => {
    mockFetch.mockResolvedValue(resposta({ id: "d1" }, 201));
    await criarDiario("obra-1", novoDiario);
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/diario", {
      method: "POST",
      body: JSON.stringify(novoDiario),
    });
  });

  it("atualiza o diário com PUT", async () => {
    mockFetch.mockResolvedValue(resposta({ id: "d1" }));
    await atualizarDiario("obra-1", "d1", { titulo: "Novo" });
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/diario/d1", {
      method: "PUT",
      body: JSON.stringify({ titulo: "Novo" }),
    });
  });

  it("altera o status com PATCH", async () => {
    mockFetch.mockResolvedValue(resposta({ id: "d1" }));
    await alterarStatusDiario("obra-1", "d1", "ENVIADO");
    expect(mockFetch).toHaveBeenCalledWith("/obras/obra-1/diario/d1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "ENVIADO" }),
    });
  });

  it("exclui o diário e a foto com DELETE", async () => {
    mockFetch.mockResolvedValue(resposta({}));
    await excluirDiario("obra-1", "d1");
    await removerFotoDiario("obra-1", "d1", "f1");
    expect(mockFetch).toHaveBeenNthCalledWith(1, "/obras/obra-1/diario/d1", { method: "DELETE" });
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/obras/obra-1/diario/d1/fotos/f1", { method: "DELETE" });
  });

  it("envia a foto como multipart com a legenda", async () => {
    mockFetch.mockResolvedValue(resposta({ id: "f1" }, 201));
    const arquivo = new File(["x"], "obra.jpg", { type: "image/jpeg" });

    await enviarFotoDiario("obra-1", "d1", arquivo, "Fundação");

    const [url, opcoes] = mockFetch.mock.calls[0];
    expect(url).toBe("/obras/obra-1/diario/d1/fotos");
    expect(opcoes?.method).toBe("POST");
    const form = opcoes?.body as FormData;
    expect((form.get("file") as File).name).toBe("obra.jpg");
    expect(form.get("legenda")).toBe("Fundação");
  });

  it("não envia legenda vazia", async () => {
    mockFetch.mockResolvedValue(resposta({ id: "f1" }, 201));
    await enviarFotoDiario("obra-1", "d1", new File(["x"], "a.png", { type: "image/png" }));
    const form = mockFetch.mock.calls[0][1]?.body as FormData;
    expect(form.has("legenda")).toBe(false);
  });
});

describe("erros", () => {
  it("repassa a mensagem do backend", async () => {
    mockFetch.mockResolvedValue(resposta({ detail: "Já existe um diário para essa data nesta obra" }, 400));
    await expect(criarDiario("obra-1", novoDiario)).rejects.toThrow("Já existe um diário para essa data nesta obra");
  });

  it("junta as mensagens de validação do FastAPI (422)", async () => {
    mockFetch.mockResolvedValue(resposta({ detail: [{ msg: "campo A inválido" }, { msg: "campo B inválido" }] }, 422));
    await expect(criarDiario("obra-1", novoDiario)).rejects.toThrow("campo A inválido; campo B inválido");
  });

  it("usa a mensagem padrão quando o corpo não é JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("sem corpo")),
    } as unknown as Response);
    await expect(getResumoDiario()).rejects.toThrow("Erro ao carregar o resumo do diário");
  });

  it("falha com o nome do arquivo quando o upload é recusado", async () => {
    mockFetch.mockResolvedValue(resposta({}, 413));
    const arquivo = new File(["x"], "grande.jpg", { type: "image/jpeg" });
    await expect(enviarFotoDiario("obra-1", "d1", arquivo)).rejects.toThrow("Erro ao enviar a foto grande.jpg");
  });
});
