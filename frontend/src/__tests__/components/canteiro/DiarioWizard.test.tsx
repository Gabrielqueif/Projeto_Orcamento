import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/common/toast", () => ({ useToast: () => ({ showToast: jest.fn() }) }));
jest.mock("@/lib/imagem", () => ({ comprimirImagem: async (f: File) => f }));
jest.mock("@/lib/api/diario", () => ({
  criarDiario: jest.fn(),
  atualizarDiario: jest.fn(),
  alterarStatusDiario: jest.fn(),
  enviarFotoDiario: jest.fn(),
  removerFotoDiario: jest.fn(),
}));

import { DiarioWizard } from "@/components/canteiro/DiarioWizard";
import { alterarStatusDiario, criarDiario } from "@/lib/api/diario";

const criar = criarDiario as jest.Mock;
const status = alterarStatusDiario as jest.Mock;
const cargos = [{ id: "c1", user_id: "dono", nome: "Pedreiro", campos_ocultos: [], campos_extras: [] }];

function montar(onConcluido = jest.fn()) {
  render(<DiarioWizard obraId="o1" obraNome="Casa X" registro={null} servicos={[]} cargos={cargos} onConcluido={onConcluido} />);
  return onConcluido;
}
const avancar = () => userEvent.click(screen.getByRole("button", { name: "Avançar" }));

beforeEach(() => {
  jest.clearAllMocks();
  criar.mockResolvedValue({ id: "d1", status: "RASCUNHO" });
});

it("não avança sem título", async () => {
  montar();
  await avancar();
  expect(screen.getByRole("alert")).toHaveTextContent("título");
  expect(screen.getByRole("heading", { name: "Dia" })).toBeInTheDocument();
});

it("percorre os passos, cria o diário com o efetivo e envia", async () => {
  const onConcluido = montar();
  await userEvent.type(screen.getByLabelText("Título do dia"), "Laje");
  await userEvent.click(screen.getByRole("radio", { name: /Chuva/ }));
  await avancar(); // efetivo
  await userEvent.click(screen.getByRole("button", { name: "Aumentar Pedreiro" }));
  await userEvent.click(screen.getByRole("button", { name: "Aumentar Pedreiro" }));
  await avancar(); // serviços
  await userEvent.type(screen.getByLabelText("Resumo do dia"), "Concretagem");
  await avancar(); // ocorrências
  await avancar(); // fotos
  await avancar(); // revisar
  expect(screen.getByText("2 pessoas")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Enviar ao responsável" }));

  await waitFor(() => expect(onConcluido).toHaveBeenCalled());
  expect(criar).toHaveBeenCalledWith(
    "o1",
    expect.objectContaining({
      titulo: "Laje",
      clima: "CHUVA",
      atividades: "Concretagem",
      equipe_presente: 2,
      efetivo: [{ cargo_id: "c1", funcao: "Pedreiro", quantidade: 2 }],
      ocorrencias: null,
    })
  );
  expect(status).toHaveBeenCalledWith("o1", "d1", "ENVIADO");
});

it("salvar rascunho não envia", async () => {
  const onConcluido = montar();
  await userEvent.type(screen.getByLabelText("Título do dia"), "Laje");
  await avancar();
  await avancar();
  await userEvent.type(screen.getByLabelText("Resumo do dia"), "x");
  await avancar();
  await avancar();
  await avancar();
  await userEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  await waitFor(() => expect(onConcluido).toHaveBeenCalled());
  expect(status).not.toHaveBeenCalled();
});

it("ocorrência ligada exige descrição", async () => {
  montar();
  await userEvent.type(screen.getByLabelText("Título do dia"), "Laje");
  await avancar();
  await avancar();
  await userEvent.type(screen.getByLabelText("Resumo do dia"), "x");
  await avancar();
  await userEvent.click(screen.getByRole("switch"));
  await avancar();
  expect(screen.getByRole("alert")).toHaveTextContent("ocorrência");
});
