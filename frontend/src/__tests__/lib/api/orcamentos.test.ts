/**
 * Unit tests for the orcamentos API module.
 *
 * Strategy: mock `fetchWithAuth` from the API client so no real HTTP requests
 * are made. Each test verifies the correct URL, method, body, and error handling.
 */

// Mock the client module before importing the functions under test.
jest.mock("@/lib/api/client", () => ({
  fetchWithAuth: jest.fn(),
  API_URL: "http://localhost:8000",
}));

import { fetchWithAuth } from "@/lib/api/client";
import {
  getOrcamentos,
  getOrcamento,
  createOrcamento,
  updateOrcamento,
  deleteOrcamento,
} from "@/lib/api/orcamentos";

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob()),
  } as unknown as Response;
}

const sampleOrcamento = {
  id: "orc-1",
  nome: "Reforma Total",
  cliente: "Empresa XYZ",
  data: "2024-01-15",
  base_referencia: "SINAPI",
  tipo_composicao: "PRECO_MEDIO",
  estado: "sp",
  fonte: "SINAPI",
  bdi: 0,
  valor_total: 1000,
  status: "em_elaboracao",
};

// ---------------------------------------------------------------------------
// getOrcamentos
// ---------------------------------------------------------------------------
describe("getOrcamentos", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns list on success", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([sampleOrcamento]));

    const result = await getOrcamentos();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/orcamentos/");
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe("Reforma Total");
  });

  it("builds query string when filters are provided", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([]));

    await getOrcamentos("ativo", "Empresa");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("status=ativo");
    expect(calledUrl).toContain("cliente=Empresa");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 500));

    await expect(getOrcamentos()).rejects.toThrow("Erro ao buscar orçamentos");
  });
});

// ---------------------------------------------------------------------------
// getOrcamento
// ---------------------------------------------------------------------------
describe("getOrcamento", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns single orcamento on success", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(sampleOrcamento));

    const result = await getOrcamento("orc-1");

    expect(mockFetch).toHaveBeenCalledWith("/orcamentos/orc-1");
    expect(result.id).toBe("orc-1");
  });

  it("throws 'não encontrado' on 404", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 404));

    await expect(getOrcamento("missing")).rejects.toThrow("Orçamento não encontrado");
  });

  it("throws generic error on other non-ok status", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 500));

    await expect(getOrcamento("orc-1")).rejects.toThrow("Erro ao buscar orçamento");
  });
});

// ---------------------------------------------------------------------------
// createOrcamento
// ---------------------------------------------------------------------------
describe("createOrcamento", () => {
  afterEach(() => jest.clearAllMocks());

  it("calls POST /orcamentos/ with JSON body", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(sampleOrcamento));

    const payload = {
      nome: "Nova Obra",
      cliente: "Cliente A",
      data: "2024-06-01",
      base_referencia: "SINAPI",
      tipo_composicao: "PRECO_MEDIO",
      estado: "SP",
    };

    const result = await createOrcamento(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      "/orcamentos/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(result.id).toBe("orc-1");
  });

  it("throws with API detail message on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ detail: "Campo nome é obrigatório" }),
    } as unknown as Response);

    await expect(
      createOrcamento({
        nome: "",
        cliente: "C",
        data: "2024-01-01",
        base_referencia: "SINAPI",
        tipo_composicao: "PRECO_MEDIO",
        estado: "SP",
      }),
    ).rejects.toThrow("Campo nome é obrigatório");
  });
});

// ---------------------------------------------------------------------------
// updateOrcamento
// ---------------------------------------------------------------------------
describe("updateOrcamento", () => {
  afterEach(() => jest.clearAllMocks());

  it("calls PUT /orcamentos/:id", async () => {
    const updated = { ...sampleOrcamento, nome: "Obra Atualizada" };
    mockFetch.mockResolvedValueOnce(makeResponse(updated));

    const result = await updateOrcamento("orc-1", { nome: "Obra Atualizada" });

    expect(mockFetch).toHaveBeenCalledWith(
      "/orcamentos/orc-1",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(result.nome).toBe("Obra Atualizada");
  });
});

// ---------------------------------------------------------------------------
// deleteOrcamento
// ---------------------------------------------------------------------------
describe("deleteOrcamento", () => {
  afterEach(() => jest.clearAllMocks());

  it("calls DELETE /orcamentos/:id and returns void on success", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(null));

    await expect(deleteOrcamento("orc-1")).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      "/orcamentos/orc-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
