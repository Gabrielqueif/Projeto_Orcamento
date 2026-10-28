/**
 * Tela "Mais" do mobile: atalhos de gestão, Importação só para admin,
 * suporte e saída da conta.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRole = { role: "user" as string | null };
jest.mock("@/hooks/use-user-role", () => ({
  useUserRole: () => mockRole,
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ nome: "Felipe Daniel", cargo: "Gerente de obras", iniciais: "FD" }),
}));

const mockLogout = jest.fn();
jest.mock("@/app/auth/actions", () => ({
  logout: () => mockLogout(),
}));

import MaisPage from "@/app/(dashboard)/mais/page";

beforeEach(() => {
  jest.clearAllMocks();
  mockRole.role = "user";
});

it("mostra o perfil e os atalhos de gestão", () => {
  render(<MaisPage />);
  expect(screen.getByText("Felipe Daniel")).toBeInTheDocument();
  expect(screen.getByText("Gerente de obras")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /bases de dados/i })).toHaveAttribute("href", "/bases");
  expect(screen.getByRole("link", { name: /financeiro/i })).toHaveAttribute("href", "/financeiro");
  expect(screen.getByRole("link", { name: /equipe/i })).toHaveAttribute("href", "/equipe");
  expect(screen.getByRole("link", { name: /documentos/i })).toHaveAttribute("href", "/docs");
  expect(screen.getByRole("link", { name: /suporte/i })).toHaveAttribute("href", "mailto:suporte@gpobras.com.br");
});

it("esconde a importação de quem não é admin", () => {
  render(<MaisPage />);
  expect(screen.queryByRole("link", { name: /importação/i })).not.toBeInTheDocument();
});

it("mostra a importação para admin", () => {
  mockRole.role = "admin";
  render(<MaisPage />);
  expect(screen.getByRole("link", { name: /importação/i })).toHaveAttribute("href", "/admin/sinapi");
});

it("sai da conta", async () => {
  render(<MaisPage />);
  await userEvent.click(screen.getByRole("button", { name: /sair da conta/i }));
  expect(mockLogout).toHaveBeenCalled();
});
