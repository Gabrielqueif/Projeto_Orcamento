/**
 * Falha ao remover colaborador deve avisar por toast (e não por alert()).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const showToast = jest.fn();

jest.mock("@/components/common/toast", () => ({
  useToast: () => ({ showToast }),
}));

jest.mock("@/lib/api/orcamentos", () => ({
  getOrcamentos: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/api/membros_equipe", () => ({
  getMembrosEquipe: jest.fn(),
  deleteMembroEquipe: jest.fn(),
}));

import EquipePage from "@/app/(dashboard)/equipe/page";
import { deleteMembroEquipe, getMembrosEquipe } from "@/lib/api/membros_equipe";

const membro = {
  id: "m-1",
  nome: "Joao da Silva",
  cpf: "00000000000",
  cargo: "Pedreiro",
  data_inicio: "2026-01-01",
  remuneracao: 3000,
  status: "ATIVO",
  code: "COL-1",
};

describe("EquipePage - toast em vez de alert", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => undefined);
    jest.spyOn(window, "confirm").mockReturnValue(true);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    (getMembrosEquipe as jest.Mock).mockResolvedValue([membro]);
  });

  afterEach(() => jest.restoreAllMocks());

  it("exibe toast de erro quando a remoção falha", async () => {
    (deleteMembroEquipe as jest.Mock).mockRejectedValue(new Error("falha"));
    render(<EquipePage />);

    const botoes = await screen.findAllByTitle("Excluir Colaborador");
    fireEvent.click(botoes[0]);

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "Ocorreu um erro ao remover o colaborador da equipe.",
        undefined,
        "error",
      ),
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
