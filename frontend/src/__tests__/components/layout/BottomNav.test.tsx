/**
 * Barra inferior do mobile: marca a aba da rota atual e manda as rotas
 * que não têm aba própria (bases, equipe, financeiro...) para "Mais".
 */
import { render, screen, waitFor } from "@testing-library/react";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: jest.fn() }),
}));

const mockCanteiro = jest.fn();
jest.mock("@/lib/api/acesso", () => ({ getObrasDoCanteiro: () => mockCanteiro() }));
const mockObras = jest.fn();
jest.mock("@/lib/api/obras", () => ({ getObras: () => mockObras() }));

import { BottomNav } from "@/components/layout/BottomNav";
import { CanteiroProvider } from "@/contexts/canteiro-context";
import { abaAtiva } from "@/components/layout/nav";

function abaAtual() {
  return screen.getByRole("link", { current: "page" });
}

it("mostra as cinco abas do app", () => {
  render(<BottomNav />);
  const nomes = screen.getAllByRole("link").map((l) => l.textContent);
  expect(nomes).toEqual(["Início", "Orçamentos", "Obras", "Diário", "Mais"]);
});

it.each([
  ["/", "Início"],
  ["/orcamentos/abc", "Orçamentos"],
  ["/obras/abc/almoxarifado", "Obras"],
  ["/diario/abc", "Diário"],
  ["/bases", "Mais"],
  ["/equipe/novo", "Mais"],
  ["/financeiro/abc", "Mais"],
  ["/mais", "Mais"],
])("em %s a aba ativa é %s", (rota, aba) => {
  mockPathname = rota;
  render(<BottomNav />);
  expect(abaAtual()).toHaveTextContent(aba);
});

it("o editor de prazos fica na aba Obras", () => {
  expect(abaAtiva("/prazo/abc")).toBe("/obras");
});

describe("perfil só membro", () => {
  beforeEach(() => {
    mockPathname = "/canteiro";
    mockCanteiro.mockResolvedValue({ total_obras: 1 });
    mockObras.mockResolvedValue([]);
  });

  it("mostra só Canteiro, Avisos e Mais", async () => {
    render(<CanteiroProvider><BottomNav /></CanteiroProvider>);
    await waitFor(() => expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Canteiro", "Avisos", "Mais"]));
  });

  it("quem tem obra própria continua com o menu completo", async () => {
    mockObras.mockResolvedValue([{ id: "o1" }]);
    render(<CanteiroProvider><BottomNav /></CanteiroProvider>);
    await waitFor(() => expect(mockObras).toHaveBeenCalled());
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("sem vínculo de membro nem consulta as obras próprias", async () => {
    mockCanteiro.mockResolvedValue({ total_obras: 0 });
    render(<CanteiroProvider><BottomNav /></CanteiroProvider>);
    await waitFor(() => expect(mockCanteiro).toHaveBeenCalled());
    expect(mockObras).not.toHaveBeenCalled();
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
