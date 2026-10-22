/**
 * Testes do cliente REST das bases próprias. `fetchWithAuth` é mockado.
 */
jest.mock("@/lib/api/client", () => ({
  fetchWithAuth: jest.fn(),
  API_URL: "http://localhost:8000",
}));

import { fetchWithAuth } from "@/lib/api/client";
import {
  adicionarItem,
  atualizarBase,
  atualizarInsumo,
  atualizarItem,
  baixarModeloImportacao,
  calcularPrecoComposicao,
  criarBase,
  criarComposicao,
  criarInsumo,
  duplicarBase,
  excluirBase,
  excluirComposicao,
  excluirInsumo,
  importarPlanilha,
  listarBases,
  listarComposicoes,
  listarInsumos,
  obterBase,
  obterComposicao,
  removerItem,
} from "@/lib/api/basesProprias";

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

function ok(corpo: unknown = {}, status = 200): Response {
  return { ok: true, status, json: () => Promise.resolve(corpo), blob: () => Promise.resolve(new Blob(["x"])) } as unknown as Response;
}

function falha(status: number, corpo: unknown): Response {
  return { ok: false, status, json: () => Promise.resolve(corpo) } as unknown as Response;
}

beforeEach(() => mockFetch.mockReset());

describe("bases", () => {
  it("lista, obtém e cria", async () => {
    mockFetch.mockResolvedValue(ok([{ id: "b1", nome: "Minha" }]));
    await expect(listarBases()).resolves.toEqual([{ id: "b1", nome: "Minha" }]);
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias");

    mockFetch.mockResolvedValue(ok({ id: "b1" }));
    await obterBase("b1");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1");

    await criarBase({ nome: "Nova", uf: "CE" });
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias", {
      method: "POST",
      body: JSON.stringify({ nome: "Nova", uf: "CE" }),
    });
  });

  it("atualiza, duplica e exclui", async () => {
    mockFetch.mockResolvedValue(ok({ id: "b1" }));
    await atualizarBase("b1", { nome: "X" });
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1", { method: "PUT", body: JSON.stringify({ nome: "X" }) });

    await duplicarBase("b1", "Cópia");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/duplicar", {
      method: "POST",
      body: JSON.stringify({ nome: "Cópia" }),
    });
    await duplicarBase("b1");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/duplicar", { method: "POST", body: undefined });

    mockFetch.mockResolvedValue(ok(undefined, 204));
    await expect(excluirBase("b1")).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1", { method: "DELETE" });
  });

  it("repassa a mensagem de erro do backend (string e lista de validação)", async () => {
    mockFetch.mockResolvedValueOnce(falha(409, { detail: "Já existe uma base com esse nome" }));
    await expect(criarBase({ nome: "A" })).rejects.toThrow("Já existe uma base com esse nome");

    mockFetch.mockResolvedValueOnce(falha(422, { detail: [{ msg: "Campo obrigatório" }] }));
    await expect(criarBase({ nome: "" })).rejects.toThrow("Campo obrigatório");

    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.reject(new Error("x")) } as unknown as Response);
    await expect(listarBases()).rejects.toThrow("Erro ao listar as bases");
  });
});

describe("insumos", () => {
  it("lista com busca e paginação, omitindo parâmetros vazios", async () => {
    mockFetch.mockResolvedValue(ok([]));
    await listarInsumos("b1", { q: "cimento", limite: 50, offset: 10 });
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/insumos?q=cimento&limite=50&offset=10");
    await listarInsumos("b1");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/insumos");
  });

  it("cria, atualiza e exclui", async () => {
    const dados = { codigo: "I1", descricao: "Cimento", unidade: "KG", tipo: "MATERIAL" as const, preco: 1.5 };
    mockFetch.mockResolvedValue(ok({ id: "i1", base_id: "b1", ...dados }, 201));
    await criarInsumo("b1", dados);
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/insumos", { method: "POST", body: JSON.stringify(dados) });

    await atualizarInsumo("b1", "i1", { preco: 2 });
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/insumos/i1", { method: "PUT", body: JSON.stringify({ preco: 2 }) });

    mockFetch.mockResolvedValue(ok(undefined, 204));
    await excluirInsumo("b1", "i1");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/insumos/i1", { method: "DELETE" });
  });
});

describe("composições e itens", () => {
  it("lista, obtém, cria e exclui", async () => {
    mockFetch.mockResolvedValue(ok([]));
    await listarComposicoes("b1", { q: "reboco" });
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/composicoes?q=reboco");

    mockFetch.mockResolvedValue(ok({ id: "c1", itens: [] }));
    await obterComposicao("b1", "c1");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/composicoes/c1");

    await criarComposicao("b1", { codigo: "C1", descricao: "Reboco", unidade: "M2" });
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/composicoes", {
      method: "POST",
      body: JSON.stringify({ codigo: "C1", descricao: "Reboco", unidade: "M2" }),
    });

    mockFetch.mockResolvedValue(ok(undefined, 204));
    await excluirComposicao("b1", "c1");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/composicoes/c1", { method: "DELETE" });
  });

  it("gerencia itens", async () => {
    const item = { ref_fonte: "SINAPI" as const, ref_tipo: "INSUMO" as const, ref_codigo: "123", coeficiente: 2 };
    mockFetch.mockResolvedValue(ok({ id: "it1", composicao_id: "c1", ...item }, 201));
    await adicionarItem("b1", "c1", item);
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/composicoes/c1/itens", {
      method: "POST",
      body: JSON.stringify(item),
    });

    await atualizarItem("b1", "c1", "it1", { coeficiente: 3 });
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/composicoes/c1/itens/it1", {
      method: "PUT",
      body: JSON.stringify({ coeficiente: 3 }),
    });

    mockFetch.mockResolvedValue(ok(undefined, 204));
    await removerItem("b1", "c1", "it1");
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/b1/composicoes/c1/itens/it1", { method: "DELETE" });
  });

  it("calcula o preço para UF, mês e tipo (codificando a query)", async () => {
    const corpo = { composicao_id: "c1", preco_total: 10, itens: [], itens_sem_preco: 0 };
    mockFetch.mockResolvedValue(ok(corpo));
    await expect(calcularPrecoComposicao("b1", "c1", "CE", "01/2026", "Sem Desoneração")).resolves.toEqual(corpo);
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/bases-proprias/b1/composicoes/c1/preco?uf=CE&mes=01%2F2026&tipo=Sem+Desonera%C3%A7%C3%A3o",
    );
  });
});

describe("importação", () => {
  it("envia a planilha como multipart no campo file", async () => {
    mockFetch.mockResolvedValue(ok({ insumos_importados: 1, composicoes_importadas: 0, itens_importados: 0 }));
    const arquivo = new File(["x"], "base.xlsx");
    await importarPlanilha("b1", arquivo);

    const [url, opcoes] = mockFetch.mock.calls[0];
    expect(url).toBe("/bases-proprias/b1/importar");
    expect(opcoes?.method).toBe("POST");
    expect(opcoes?.body).toBeInstanceOf(FormData);
    expect((opcoes?.body as FormData).get("file")).toBe(arquivo);
  });

  it("baixa o modelo como blob e falha com a mensagem do backend", async () => {
    mockFetch.mockResolvedValueOnce(ok());
    await expect(baixarModeloImportacao()).resolves.toBeInstanceOf(Blob);
    expect(mockFetch).toHaveBeenLastCalledWith("/bases-proprias/modelo-importacao");

    mockFetch.mockResolvedValueOnce(falha(500, {}));
    await expect(baixarModeloImportacao()).rejects.toThrow("Erro ao baixar o modelo");
  });
});
