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
  buscarComposicoesProprias,
  atualizarPrecosPropria,
  addItem,
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

// ---------------------------------------------------------------------------
// Bases próprias
// ---------------------------------------------------------------------------
describe("buscarComposicoesProprias", () => {
  afterEach(() => jest.clearAllMocks());

  it("busca com termo e limite na query string", async () => {
    const lista = [
      { base_propria_id: "b1", base_propria_nome: "Minha Base", codigo: "C1", descricao: "Reboco", unidade: "M2", grupo: null, preco_unitario: 12.5 },
    ];
    mockFetch.mockResolvedValueOnce(makeResponse(lista));

    const result = await buscarComposicoesProprias("orc-1", "rebo co", 20);

    expect(mockFetch).toHaveBeenCalledWith(
      "/orcamentos/orc-1/buscar-composicoes-proprias?termo=rebo+co&limite=20",
    );
    expect(result).toEqual(lista);
  });

  it("lança o detalhe do erro quando a resposta falha", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ detail: "Sem acesso" }, 403));
    await expect(buscarComposicoesProprias("orc-1", "x")).rejects.toThrow("Sem acesso");
  });
});

describe("atualizarPrecosPropria", () => {
  afterEach(() => jest.clearAllMocks());

  it("chama POST com aplicar=false para a prévia", async () => {
    const previa = { aplicado: false, total_itens: 1, itens_alterados: 0, diferenca_custo_direto: 0, itens: [], ignorados: [] };
    mockFetch.mockResolvedValueOnce(makeResponse(previa));

    const result = await atualizarPrecosPropria("orc-1", false);

    expect(mockFetch).toHaveBeenCalledWith(
      "/orcamentos/orc-1/itens/atualizar-precos-propria?aplicar=false",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.aplicado).toBe(false);
  });

  it("chama POST com aplicar=true para confirmar", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ aplicado: true, total_itens: 1, itens_alterados: 1, diferenca_custo_direto: 5, itens: [], ignorados: [] }));
    const result = await atualizarPrecosPropria("orc-1", true);
    expect(mockFetch).toHaveBeenCalledWith(
      "/orcamentos/orc-1/itens/atualizar-precos-propria?aplicar=true",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.itens_alterados).toBe(1);
  });

  it("lança erro padrão quando a resposta falha sem corpo", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.reject(new Error("x")) } as unknown as Response);
    await expect(atualizarPrecosPropria("orc-1", false)).rejects.toThrow("Erro ao atualizar preços da base própria");
  });
});

describe("addItem com fonte PROPRIA", () => {
  afterEach(() => jest.clearAllMocks());

  it("envia fonte e base_propria_id no corpo", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ id: "i1" }));

    await addItem("orc-1", {
      codigo_composicao: "C1",
      descricao: "Reboco",
      quantidade: 2,
      unidade: "M2",
      fonte: "PROPRIA",
      base_propria_id: "b1",
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/orcamentos/orc-1/itens");
    const corpo = JSON.parse((init as RequestInit).body as string);
    expect(corpo).toMatchObject({ fonte: "PROPRIA", base_propria_id: "b1", codigo_composicao: "C1" });
  });
});
