/**
 * Campo de busca do cabeçalho: Enter leva para /busca com o termo codificado.
 */
import { fireEvent, render, screen } from "@testing-library/react";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { BuscaBotao, BuscaCampo } from "@/components/layout/BuscaCampo";

beforeEach(() => {
  jest.clearAllMocks();
});

it("navega para /busca com o termo codificado ao pressionar Enter", () => {
  render(<BuscaCampo />);
  const campo = screen.getByRole("searchbox");

  fireEvent.change(campo, { target: { value: "  ponte da serra & cia  " } });
  fireEvent.keyDown(campo, { key: "Enter" });

  expect(mockPush).toHaveBeenCalledWith("/busca?q=ponte%20da%20serra%20%26%20cia");
});

it("não navega ao pressionar Enter com o campo vazio", () => {
  render(<BuscaCampo />);

  fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });

  expect(mockPush).not.toHaveBeenCalled();
});

it("usa o placeholder recebido por prop", () => {
  render(<BuscaCampo placeholder="Buscar membros" />);

  expect(screen.getByPlaceholderText("Buscar membros")).toBeInTheDocument();
});

it("o botão mobile leva para /busca", () => {
  render(<BuscaBotao />);

  expect(screen.getByRole("link", { name: "Buscar" })).toHaveAttribute("href", "/busca");
});
