/**
 * Botão de excluir obra na listagem: pede confirmação, só exclui se confirmada,
 * recarrega a lista e avisa quando falha.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const showToast = jest.fn();

jest.mock("@/components/common/toast", () => ({
  useToast: () => ({ showToast }),
}));

jest.mock("@/lib/api/orcamentos", () => ({
  getOrcamentos: jest.fn(),
  getEtapas: jest.fn(),
}));

jest.mock("@/lib/api/obras", () => ({
  getObras: jest.fn(),
  excluirObra: jest.fn(),
}));

import ObrasPage from "@/app/(dashboard)/obras/page";
import { getEtapas, getOrcamentos } from "@/lib/api/orcamentos";
import { excluirObra, getObras } from "@/lib/api/obras";

const mockGetOrcamentos = getOrcamentos as jest.Mock;
const mockGetEtapas = getEtapas as jest.Mock;
const mockGetObras = getObras as jest.Mock;
const mockExcluirObra = excluirObra as jest.Mock;

const orcamento = { id: "orc-1", nome: "Residencial Aurora", cliente: "Cliente X", status: "em_elaboracao" };
const obra = { id: "obra-1", orcamento_id: "orc-1", status: "EM_ANDAMENTO" };

beforeEach(() => {
  jest.clearAllMocks();
  mockGetOrcamentos.mockResolvedValue([orcamento]);
  mockGetEtapas.mockResolvedValue([]);
  mockGetObras.mockResolvedValue([obra]);
  mockExcluirObra.mockResolvedValue(undefined);
});

async function abrirLista() {
  render(<ObrasPage />);
  // a busca da lista tem debounce de 500 ms
  return screen.findByRole("button", { name: /excluir obra residencial aurora/i }, { timeout: 3000 });
}

describe("excluir obra na listagem", () => {
  it("mostra um botão de excluir para cada obra", async () => {
    expect(await abrirLista()).toBeInTheDocument();
  });

  it("exclui a obra real (não o orçamento) depois de confirmar e recarrega a lista", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const botao = await abrirLista();

    mockGetObras.mockResolvedValue([]); // a lista recarregada já não traz a obra
    fireEvent.click(botao);

    await waitFor(() => expect(mockExcluirObra).toHaveBeenCalledWith("obra-1"));
    await waitFor(() => expect(screen.getByText("Nenhuma obra encontrada.")).toBeInTheDocument());
    expect(showToast).toHaveBeenCalledWith("Obra excluída", expect.stringContaining("Residencial Aurora"), "success");
  });

  it("explica o que será apagado e que o orçamento é mantido", async () => {
    const confirmar = jest.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(await abrirLista());

    const mensagem = confirmar.mock.calls[0][0] as string;
    expect(mensagem).toContain("Residencial Aurora");
    expect(mensagem).toMatch(/diário/i);
    expect(mensagem).toMatch(/orçamento é mantido/i);
  });

  it("não exclui quando o usuário cancela", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(await abrirLista());

    expect(mockExcluirObra).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("avisa quando a exclusão falha e mantém a obra na lista", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    mockExcluirObra.mockRejectedValue(new Error("Obra não encontrada"));
    fireEvent.click(await abrirLista());

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Não foi possível excluir a obra", "Obra não encontrada", "error")
    );
    expect(screen.getByText("Residencial Aurora")).toBeInTheDocument();
  });
});
