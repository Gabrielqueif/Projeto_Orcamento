/**
 * Tela de busca global: resultados agrupados, estado sem resultado e
 * nenhuma consulta à API com menos de 2 caracteres (debounce de 300 ms).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
let mockQuery = "";

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(mockQuery),
}));

jest.mock("@/lib/api/busca", () => ({
  buscar: jest.fn(),
}));

import BuscaPage from "@/app/(dashboard)/busca/page";
import { buscar } from "@/lib/api/busca";

const mockBuscar = buscar as jest.MockedFunction<typeof buscar>;

function digitar(valor: string) {
  fireEvent.change(screen.getByLabelText("Buscar obras, orçamentos e equipe"), { target: { value: valor } });
}

function passarDebounce() {
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockQuery = "";
});

afterEach(() => {
  jest.useRealTimers();
});

it("mostra os resultados agrupados em Obras, Orçamentos e Equipe", async () => {
  mockBuscar.mockResolvedValue({
    obras: [{ id: "o1", titulo: "Reforma da ponte", subtitulo: "Ana Lima", href: "/obras/orc-1" }],
    orcamentos: [{ id: "b1", titulo: "Orçamento ponte", subtitulo: "Ana Lima", href: "/orcamentos/b1" }],
    membros: [{ id: "m1", titulo: "José da Ponte", subtitulo: "Pedreiro", href: "/equipe/editar/m1" }],
  });

  render(<BuscaPage />);
  digitar("ponte");
  passarDebounce();

  expect(await screen.findByRole("heading", { name: "Obras" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Orçamentos" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Equipe" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Reforma da ponte/ })).toHaveAttribute("href", "/obras/orc-1");
  expect(screen.getByRole("link", { name: /José da Ponte/ })).toHaveAttribute("href", "/equipe/editar/m1");
  expect(mockBuscar).toHaveBeenCalledWith("ponte");
  expect(mockReplace).toHaveBeenCalledWith("/busca?q=ponte");
});

it("mostra a mensagem de nada encontrado quando não há resultados", async () => {
  mockBuscar.mockResolvedValue({ obras: [], orcamentos: [], membros: [] });

  render(<BuscaPage />);
  digitar("xyz");
  passarDebounce();

  expect(await screen.findByText(/Nada encontrado para “xyz”/)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Obras" })).not.toBeInTheDocument();
});

it("mostra erro quando a API falha", async () => {
  mockBuscar.mockRejectedValue(new Error("falhou"));

  render(<BuscaPage />);
  digitar("ponte");
  passarDebounce();

  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível buscar agora");
});

it("não chama a API com menos de 2 caracteres", () => {
  render(<BuscaPage />);
  digitar("a");
  passarDebounce();

  expect(mockBuscar).not.toHaveBeenCalled();
  expect(screen.getByText(/Digite pelo menos 2 caracteres/)).toBeInTheDocument();
});

it("espera a pausa de 300 ms antes de consultar", () => {
  mockBuscar.mockResolvedValue({ obras: [], orcamentos: [], membros: [] });

  render(<BuscaPage />);
  digitar("pon");
  act(() => {
    jest.advanceTimersByTime(299);
  });
  expect(mockBuscar).not.toHaveBeenCalled();

  passarDebounce();
  expect(mockBuscar).toHaveBeenCalledTimes(1);
});
