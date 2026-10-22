/**
 * O painel sem nenhuma obra deve aparecer zerado, com todos os cartões e blocos,
 * e não como um convite para criar obra.
 */
import { render, screen, waitFor } from "@testing-library/react";

// O jsdom não implementa canvas; os gráficos não fazem parte do que se testa aqui.
jest.mock("react-chartjs-2", () => ({
  Bar: () => <div data-testid="grafico-barras" />,
  Doughnut: () => <div data-testid="grafico-medidor" />,
}));

jest.mock("@/lib/api/dashboard", () => ({
  getDashboard: jest.fn(),
}));

import DashboardPage from "@/app/(dashboard)/page";
import { getDashboard, type Dashboard } from "@/lib/api/dashboard";

const mockGetDashboard = getDashboard as jest.MockedFunction<typeof getDashboard>;

const painelZerado: Dashboard = {
  obras_ativas: 0,
  progresso_medio: 0,
  orcamento_total: 0,
  gasto_realizado: 0,
  disponivel: 0,
  utilizacao_orcamento: 0,
  alertas_criticos: 0,
  riscos: [],
  semanas: ["01/10", "08/10", "15/10", "22/10"],
  series: [],
  feed: [],
};

beforeEach(() => mockGetDashboard.mockReset());

describe("painel sem obras", () => {
  it("mostra os cartões zerados", async () => {
    mockGetDashboard.mockResolvedValue(painelZerado);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Obras Ativas")).toBeInTheDocument());
    expect(screen.getByText("Progresso Médio")).toBeInTheDocument();
    expect(screen.getByText("Orçamento Utilizado")).toBeInTheDocument();
    expect(screen.getByText("Riscos Críticos")).toBeInTheDocument();
    // Obras ativas e riscos críticos (00) e os dois percentuais (0%)
    expect(screen.getAllByText("00")).toHaveLength(2);
    expect(screen.getAllByText("0%").length).toBeGreaterThanOrEqual(2);
  });

  it("não convida a criar obra", async () => {
    mockGetDashboard.mockResolvedValue(painelZerado);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Obras Ativas")).toBeInTheDocument());
    expect(screen.queryByText(/criar uma obra/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ainda não tem obras/i)).not.toBeInTheDocument();
  });

  it("mantém os blocos de gráfico, riscos e diário com mensagens vazias", async () => {
    mockGetDashboard.mockResolvedValue(painelZerado);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("PROGRESSO SEMANAL")).toBeInTheDocument());
    expect(screen.getByText("Nenhuma obra em andamento.")).toBeInTheDocument();
    expect(screen.getByTestId("grafico-medidor")).toBeInTheDocument();
    expect(screen.getByText(/nenhum risco identificado/i)).toBeInTheDocument();
    expect(screen.getByText(/nenhum registro de diário/i)).toBeInTheDocument();
  });
});

describe("falha ao carregar", () => {
  it("mostra o erro e permite tentar de novo", async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error("Erro ao carregar o painel"));
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Erro ao carregar o painel")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
