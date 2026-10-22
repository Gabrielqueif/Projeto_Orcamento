/**
 * /bases: cards por fonte vindos do endpoint, com mês, desoneração e contagem;
 * estado vazio com link de importação só para admin.
 */
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/orcamentos", () => ({
  getSinapiBases: jest.fn(),
}));

const mockRole = { role: "admin" as string | null };
jest.mock("@/hooks/use-user-role", () => ({
  useUserRole: () => mockRole,
}));

import BasesPage from "@/app/(dashboard)/bases/page";
import { getSinapiBases } from "@/lib/api/orcamentos";

const mockGetBases = getSinapiBases as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRole.role = "admin";
});

it("agrupa os cards por fonte com mês, desoneração e contagem", async () => {
  mockGetBases.mockResolvedValue([
    { fonte: "SINAPI", mes_referencia: "12/2025", tipo_composicao: "Com Desoneração", total_composicoes: 120 },
    { fonte: "SEINFRA", mes_referencia: "01/2026", tipo_composicao: "Sem Desoneração", total_composicoes: 45 },
  ]);

  render(<BasesPage />);

  expect(await screen.findByText("Base de dados SINAPI")).toBeInTheDocument();
  expect(screen.getByText("Base de dados SEINFRA-CE")).toBeInTheDocument();
  expect(screen.getByText(/12\/2025 · Com Desoneração · 120 composições/)).toBeInTheDocument();
  expect(screen.getByText(/01\/2026 · Sem Desoneração · 45 composições/)).toBeInTheDocument();

  const links = screen.getAllByRole("link", { name: "ver detalhes" });
  expect(links.map((l) => l.getAttribute("href"))).toEqual(["/bases/sinapi", "/bases/seinfra"]);
});

it("estado vazio mostra link de importação para admin", async () => {
  mockGetBases.mockResolvedValue([]);

  render(<BasesPage />);

  await waitFor(() => expect(screen.getByTestId("bases-vazio")).toBeInTheDocument());
  expect(screen.getByRole("link", { name: /importar bases/i })).toHaveAttribute("href", "/admin/sinapi");
});

it("estado vazio não mostra o link para usuário comum", async () => {
  mockRole.role = "user";
  mockGetBases.mockResolvedValue([]);

  render(<BasesPage />);

  await waitFor(() => expect(screen.getByTestId("bases-vazio")).toBeInTheDocument());
  expect(screen.queryByRole("link", { name: /importar bases/i })).toBeNull();
});
