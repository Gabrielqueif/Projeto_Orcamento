/**
 * Página de notificações: riscos agrupados por severidade, estado vazio e "marcar todas como lidas".
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/lib/api/notificacoes", () => ({
  getNotificacoes: jest.fn(),
  marcarNotificacoesLidas: jest.fn(),
}));

import NotificacoesPage from "@/app/(dashboard)/notificacoes/page";
import { getNotificacoes, marcarNotificacoesLidas, type Notificacao } from "@/lib/api/notificacoes";

const mockGet = getNotificacoes as jest.MockedFunction<typeof getNotificacoes>;
const mockMarcar = marcarNotificacoesLidas as jest.MockedFunction<typeof marcarNotificacoesLidas>;

const estouro: Notificacao = {
  chave: "ORCAMENTO:o1",
  tipo: "ORCAMENTO",
  severidade: "critical",
  titulo: "Estouro de orçamento: Residencial Aurora",
  descricao: "Os gastos estão 18,4% acima do orçado.",
  href: "/financeiro/orc-o1",
  lida: false,
};

const estoque: Notificacao = {
  chave: "ESTOQUE:o1",
  tipo: "ESTOQUE",
  severidade: "moderate",
  titulo: "Estoque crítico: Residencial Aurora",
  descricao: "3 insumo(s) no mínimo ou abaixo dele.",
  href: "/obras/orc-o1/almoxarifado",
  lida: true,
};

const diario: Notificacao = {
  chave: "DIARIO:o2",
  tipo: "DIARIO",
  severidade: "info",
  titulo: "Diário sem registro: Galpão Norte",
  descricao: "Há dois dias ou mais sem diário de obra.",
  href: "/diario/o2",
  lida: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("agrupa os riscos por severidade, na ordem crítica, moderada e informativa", async () => {
  mockGet.mockResolvedValue({ itens: [diario, estoque, estouro], nao_lidas: 2 });
  render(<NotificacoesPage />);

  const titulos = await screen.findAllByRole("heading", { level: 2 });
  expect(titulos.map((t) => t.textContent)).toEqual(["Críticas", "Moderadas", "Informativas"]);

  const criticas = screen.getByRole("region", { name: "Críticas" });
  expect(within(criticas).getByText(estouro.titulo)).toBeInTheDocument();
  expect(within(criticas).getByText(estouro.descricao)).toBeInTheDocument();
  expect(within(criticas).getByRole("link", { name: /Estouro de orçamento/ })).toHaveAttribute("href", estouro.href);
});

it("destaca só os itens não lidos", async () => {
  mockGet.mockResolvedValue({ itens: [estouro, estoque], nao_lidas: 1 });
  render(<NotificacoesPage />);

  const naoLida = await screen.findByRole("link", { name: /Estouro de orçamento/ });
  expect(naoLida).toHaveClass("gp-6b-nao-lida");
  expect(screen.getByRole("link", { name: /Estoque crítico/ })).not.toHaveClass("gp-6b-nao-lida");
});

it("mostra o estado vazio quando não há notificações", async () => {
  mockGet.mockResolvedValue({ itens: [], nao_lidas: 0 });
  render(<NotificacoesPage />);

  expect(await screen.findByText("Nenhuma notificação")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Marcar todas como lidas" })).not.toBeInTheDocument();
});

it("mostra o erro com opção de tentar de novo", async () => {
  mockGet.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ itens: [], nao_lidas: 0 });
  render(<NotificacoesPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
  await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

  expect(await screen.findByText("Nenhuma notificação")).toBeInTheDocument();
  expect(mockGet).toHaveBeenCalledTimes(2);
});

it("marcar todas chama a API e atualiza a lista", async () => {
  mockGet.mockResolvedValue({ itens: [estouro, diario], nao_lidas: 2 });
  mockMarcar.mockResolvedValue({ nao_lidas: 0 });
  render(<NotificacoesPage />);

  await userEvent.click(await screen.findByRole("button", { name: "Marcar todas como lidas" }));

  expect(mockMarcar).toHaveBeenCalledWith();
  await waitFor(() => expect(screen.queryByRole("button", { name: "Marcar todas como lidas" })).not.toBeInTheDocument());
  expect(screen.queryByText("não lida")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Estouro de orçamento/ })).not.toHaveClass("gp-6b-nao-lida");
});

it("não mostra o botão de marcar todas quando não há não lidas", async () => {
  mockGet.mockResolvedValue({ itens: [estoque], nao_lidas: 0 });
  render(<NotificacoesPage />);

  await screen.findByRole("link", { name: /Estoque crítico/ });
  expect(screen.queryByRole("button", { name: "Marcar todas como lidas" })).not.toBeInTheDocument();
});
