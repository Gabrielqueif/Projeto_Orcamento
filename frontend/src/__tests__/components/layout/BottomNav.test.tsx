/**
 * Barra inferior do mobile: marca a aba da rota atual e manda as rotas
 * que não têm aba própria (bases, equipe, financeiro...) para "Mais".
 */
import { render, screen } from "@testing-library/react";

let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import { BottomNav } from "@/components/layout/BottomNav";
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
