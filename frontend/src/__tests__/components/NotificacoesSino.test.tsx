/**
 * Sino do cabeçalho: a bolinha aparece só com notificações não lidas e a falha da API não quebra o botão.
 */
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/notificacoes", () => ({
  getNotificacoes: jest.fn(),
}));

import { NotificacoesSino } from "@/components/layout/NotificacoesSino";
import { getNotificacoes } from "@/lib/api/notificacoes";

const mockGet = getNotificacoes as jest.MockedFunction<typeof getNotificacoes>;

beforeEach(() => {
  jest.clearAllMocks();
});

it("aponta para a página de notificações", async () => {
  mockGet.mockResolvedValue({ itens: [], nao_lidas: 0 });
  render(<NotificacoesSino />);

  expect(screen.getByRole("link", { name: "Notificações" })).toHaveAttribute("href", "/notificacoes");
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
});

it("mostra a bolinha e a contagem no nome quando há não lidas", async () => {
  mockGet.mockResolvedValue({ itens: [], nao_lidas: 3 });
  const { container } = render(<NotificacoesSino />);

  const link = await screen.findByRole("link", { name: "Notificações, 3 não lidas" });
  expect(link.querySelector(".gp-6b-bolinha")).toBeInTheDocument();
  expect(container.querySelectorAll(".gp-6b-bolinha")).toHaveLength(1);
});

it("não mostra a bolinha quando não há não lidas", async () => {
  mockGet.mockResolvedValue({ itens: [], nao_lidas: 0 });
  const { container } = render(<NotificacoesSino />);

  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("link", { name: "Notificações" })).toBeInTheDocument();
  expect(container.querySelector(".gp-6b-bolinha")).not.toBeInTheDocument();
});

it("continua aparecendo sem bolinha quando a API falha", async () => {
  mockGet.mockRejectedValue(new Error("offline"));
  const { container } = render(<NotificacoesSino />);

  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("link", { name: "Notificações" })).toBeInTheDocument();
  expect(container.querySelector(".gp-6b-bolinha")).not.toBeInTheDocument();
});

it("aceita className extra além de gp-ib", async () => {
  mockGet.mockResolvedValue({ itens: [], nao_lidas: 0 });
  render(<NotificacoesSino className="extra" />);

  const link = screen.getByRole("link", { name: "Notificações" });
  expect(link).toHaveClass("gp-ib", "extra");
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
});
