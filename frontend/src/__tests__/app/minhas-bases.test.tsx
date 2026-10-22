/**
 * Seção "Minhas bases" em /bases: listagem, link para a base e criação via modal.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/lib/api/basesProprias", () => ({
  listarBases: jest.fn(),
  criarBase: jest.fn(),
}));

const mockShowToast = jest.fn();
jest.mock("@/components/common/toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { MinhasBases } from "@/components/bases-proprias/MinhasBases";
import { criarBase, listarBases } from "@/lib/api/basesProprias";

const mockListar = listarBases as jest.Mock;
const mockCriar = criarBase as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("lista as bases do usuário com link para a página da base", async () => {
  mockListar.mockResolvedValue([
    { id: "b1", nome: "Base Fortaleza", descricao: "Preços locais", uf: "CE" },
    { id: "b2", nome: "Base Sem UF" },
  ]);

  render(<MinhasBases />);

  const link = await screen.findByRole("link", { name: /Base Fortaleza/ });
  expect(link).toHaveAttribute("href", "/bases/propria/b1");
  expect(screen.getByText("CE")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Base Sem UF/ })).toHaveAttribute("href", "/bases/propria/b2");
});

it("mostra o estado vazio", async () => {
  mockListar.mockResolvedValue([]);
  render(<MinhasBases />);
  expect(await screen.findByTestId("minhas-bases-vazio")).toBeInTheDocument();
});

it("mostra mensagem quando a listagem falha", async () => {
  mockListar.mockRejectedValue(new Error("falhou"));
  render(<MinhasBases />);
  expect(await screen.findByText("Não foi possível carregar suas bases.")).toBeInTheDocument();
});

it("cria uma base pelo modal e a inclui na lista", async () => {
  mockListar.mockResolvedValue([]);
  mockCriar.mockResolvedValue({ id: "b9", nome: "Nova Base", uf: "SP", descricao: "desc" });
  const user = userEvent.setup();

  render(<MinhasBases />);
  await screen.findByTestId("minhas-bases-vazio");

  await user.click(screen.getByRole("button", { name: /nova base/i }));
  await user.type(screen.getByLabelText("Nome"), "  Nova Base ");
  await user.type(screen.getByLabelText("Descrição"), "desc");
  await user.selectOptions(screen.getByLabelText("UF"), "SP");
  await user.click(screen.getByRole("button", { name: "Criar base" }));

  await waitFor(() =>
    expect(mockCriar).toHaveBeenCalledWith({ nome: "Nova Base", descricao: "desc", uf: "SP" }),
  );
  expect(await screen.findByRole("link", { name: /Nova Base/ })).toHaveAttribute("href", "/bases/propria/b9");
  expect(mockShowToast).toHaveBeenCalledWith("Base criada", "Nova Base", "success");
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("avisa por toast quando a criação falha e mantém o modal aberto", async () => {
  mockListar.mockResolvedValue([]);
  mockCriar.mockRejectedValue(new Error("Já existe uma base com esse nome"));
  const user = userEvent.setup();

  render(<MinhasBases />);
  await screen.findByTestId("minhas-bases-vazio");
  await user.click(screen.getByRole("button", { name: /nova base/i }));
  await user.type(screen.getByLabelText("Nome"), "Repetida");
  await user.click(screen.getByRole("button", { name: "Criar base" }));

  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith("Erro ao criar a base", "Já existe uma base com esse nome", "error"),
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

it("não permite enviar sem nome", async () => {
  mockListar.mockResolvedValue([]);
  const user = userEvent.setup();
  render(<MinhasBases />);
  await screen.findByTestId("minhas-bases-vazio");
  await user.click(screen.getByRole("button", { name: /nova base/i }));
  expect(screen.getByRole("button", { name: "Criar base" })).toBeDisabled();
});
