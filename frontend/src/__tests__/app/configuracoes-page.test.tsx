/**
 * Tela "Configurações": edição de nome e cargo (API /perfil) e troca de senha (Supabase Auth).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { atualizarPerfil, getPerfil } from "@/lib/api/perfil";

const mockShowToast = jest.fn();
jest.mock("@/components/common/toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock("@/lib/api/perfil", () => ({
  getPerfil: jest.fn(),
  atualizarPerfil: jest.fn(),
}));

const mockUpdateUser = jest.fn();
jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: { updateUser: (...args: unknown[]) => mockUpdateUser(...args) } }),
}));

import ConfiguracoesPage from "@/app/(dashboard)/configuracoes/page";

const mockGetPerfil = getPerfil as jest.Mock;
const mockAtualizarPerfil = atualizarPerfil as jest.Mock;

const PERFIL = {
  id: "user-1",
  email: "maria@example.com",
  full_name: "Maria Silva",
  cargo: "Engenheira civil",
  username: "maria",
  role: "user",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPerfil.mockResolvedValue(PERFIL);
  mockAtualizarPerfil.mockImplementation(async (dados) => ({ ...PERFIL, ...dados }));
  mockUpdateUser.mockResolvedValue({ data: {}, error: null });
});

it("preenche os campos com o perfil e mostra o e-mail como texto", async () => {
  render(<ConfiguracoesPage />);

  expect(await screen.findByDisplayValue("Maria Silva")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Engenheira civil")).toBeInTheDocument();
  expect(screen.getByText("maria@example.com")).toBeInTheDocument();
  expect(screen.queryByDisplayValue("maria@example.com")).not.toBeInTheDocument();
});

it("salva só o campo que mudou", async () => {
  render(<ConfiguracoesPage />);
  const cargo = await screen.findByLabelText("Cargo");
  const botaoSalvar = screen.getByRole("button", { name: "Salvar" });
  expect(botaoSalvar).toBeDisabled();

  await userEvent.clear(cargo);
  await userEvent.type(cargo, "Arquiteta");
  await userEvent.click(botaoSalvar);

  await waitFor(() => expect(mockAtualizarPerfil).toHaveBeenCalledTimes(1));
  expect(mockAtualizarPerfil).toHaveBeenCalledWith({ cargo: "Arquiteta" });
  expect(mockShowToast).toHaveBeenCalledWith("Perfil salvo", undefined, "success");
});

it("mostra toast de erro quando o perfil não é salvo", async () => {
  mockAtualizarPerfil.mockRejectedValueOnce(new Error("Erro ao salvar o perfil"));
  render(<ConfiguracoesPage />);
  const nome = await screen.findByLabelText("Nome completo");

  await userEvent.clear(nome);
  await userEvent.type(nome, "Maria Souza");
  await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith(
      "Não foi possível salvar o perfil",
      expect.any(String),
      "error"
    )
  );
});

it("mostra erro ao não conseguir carregar o perfil", async () => {
  mockGetPerfil.mockRejectedValueOnce(new Error("falhou"));
  render(<ConfiguracoesPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o seu perfil");
});

it("valida senha curta sem chamar o Supabase", async () => {
  render(<ConfiguracoesPage />);
  await screen.findByDisplayValue("Maria Silva");

  await userEvent.type(screen.getByLabelText("Nova senha"), "1234567");
  await userEvent.type(screen.getByLabelText("Confirmar nova senha"), "1234567");
  await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

  expect(await screen.findByText("A senha precisa ter pelo menos 8 caracteres.")).toHaveAttribute("role", "alert");
  expect(mockUpdateUser).not.toHaveBeenCalled();
});

it("valida confirmação diferente sem chamar o Supabase", async () => {
  render(<ConfiguracoesPage />);
  await screen.findByDisplayValue("Maria Silva");

  await userEvent.type(screen.getByLabelText("Nova senha"), "senha-forte-1");
  await userEvent.type(screen.getByLabelText("Confirmar nova senha"), "senha-forte-2");
  await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

  expect(await screen.findByText("As senhas não coincidem.")).toHaveAttribute("role", "alert");
  expect(mockUpdateUser).not.toHaveBeenCalled();
});

it("chama updateUser com a senha válida e confirma com toast", async () => {
  render(<ConfiguracoesPage />);
  await screen.findByDisplayValue("Maria Silva");

  await userEvent.type(screen.getByLabelText("Nova senha"), "senha-forte-1");
  await userEvent.type(screen.getByLabelText("Confirmar nova senha"), "senha-forte-1");
  await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

  await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ password: "senha-forte-1" }));
  expect(mockShowToast).toHaveBeenCalledWith("Senha alterada", undefined, "success");
});

it("mostra toast de erro quando o Supabase recusa a senha", async () => {
  mockUpdateUser.mockResolvedValueOnce({ data: {}, error: { message: "weak" } });
  render(<ConfiguracoesPage />);
  await screen.findByDisplayValue("Maria Silva");

  await userEvent.type(screen.getByLabelText("Nova senha"), "senha-forte-1");
  await userEvent.type(screen.getByLabelText("Confirmar nova senha"), "senha-forte-1");
  await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith("Não foi possível alterar a senha", expect.any(String), "error")
  );
});
