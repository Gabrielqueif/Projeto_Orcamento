/**
 * Estados de carregamento com esqueleto nas telas principais: enquanto a API não
 * responde, a tela anuncia o carregamento com role="status" (texto acessível de
 * antes) e não mostra o conteúdo final nem a mensagem de "vazio"; ao responder,
 * o status some e o conteúdo aparece.
 */
import { act, render, screen, waitFor } from "@testing-library/react";

// ---- mocks (mesmos padrões dos demais testes de tela) ----

jest.mock("react-chartjs-2", () => ({
  Line: () => <div data-testid="grafico-linhas" />,
  Doughnut: () => <div data-testid="grafico-medidor" />,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
}));

jest.mock("@/components/common/toast", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ nome: "Felipe Daniel", cargo: "Gerente de obras", iniciais: "FD" }),
}));

jest.mock("@/hooks/use-user-role", () => ({
  useUserRole: () => ({ role: "user" }),
}));

jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: { updateUser: jest.fn() } }),
}));

jest.mock("@/lib/api/dashboard", () => ({ getDashboard: jest.fn() }));
jest.mock("@/lib/api/obras", () => ({ getObras: jest.fn(), excluirObra: jest.fn() }));
jest.mock("@/lib/api/orcamentos", () => ({
  getOrcamentos: jest.fn(),
  getOrcamentoStats: jest.fn(),
  deleteOrcamento: jest.fn(),
  getEtapas: jest.fn(),
  getSinapiBases: jest.fn(),
}));
jest.mock("@/lib/api/membros_equipe", () => ({
  getMembrosEquipe: jest.fn(),
  deleteMembroEquipe: jest.fn(),
}));
jest.mock("@/lib/api/notificacoes", () => ({
  getNotificacoes: jest.fn(),
  marcarNotificacoesLidas: jest.fn(),
}));
jest.mock("@/lib/api/perfil", () => ({ getPerfil: jest.fn(), atualizarPerfil: jest.fn() }));
jest.mock("@/lib/api/basesProprias", () => ({ listarBases: jest.fn(), criarBase: jest.fn() }));
jest.mock("@/lib/api/financeiro", () => ({ getPortfolioConsolidado: jest.fn() }));

import DashboardPage from "@/app/(dashboard)/page";
import OrcamentosPage from "@/app/(dashboard)/empreendimentos/page";
import EquipePage from "@/app/(dashboard)/equipe/page";
import NotificacoesPage from "@/app/(dashboard)/notificacoes/page";
import ConfiguracoesPage from "@/app/(dashboard)/configuracoes/page";
import BasesPage from "@/app/(dashboard)/bases/page";
import FinanceiroPage from "@/app/(dashboard)/financeiro/page";

import { getDashboard } from "@/lib/api/dashboard";
import { getObras } from "@/lib/api/obras";
import { getEtapas, getOrcamentoStats, getOrcamentos, getSinapiBases } from "@/lib/api/orcamentos";
import { getMembrosEquipe } from "@/lib/api/membros_equipe";
import { getNotificacoes } from "@/lib/api/notificacoes";
import { getPerfil } from "@/lib/api/perfil";
import { listarBases } from "@/lib/api/basesProprias";
import { getPortfolioConsolidado } from "@/lib/api/financeiro";

const mock = (fn: unknown) => fn as jest.Mock;

/** Promessa que o teste resolve quando quiser. */
function adiada<T>() {
  let resolver!: (valor: T) => void;
  const promessa = new Promise<T>((resolve) => {
    resolver = resolve;
  });
  return { promessa, resolver };
}

async function resolverCom<T>(resolver: (v: T) => void, valor: T) {
  await act(async () => {
    resolver(valor);
  });
}

/** Status de carregamento que contém o texto acessível informado. */
function statusCom(texto: string | RegExp) {
  return screen
    .queryAllByRole("status")
    .filter((el) => (typeof texto === "string" ? el.textContent?.includes(texto) : texto.test(el.textContent ?? "")));
}

beforeEach(() => {
  jest.resetAllMocks();
  // O cabeçalho (sino de notificações) consulta a API em todas as telas.
  mock(getNotificacoes).mockResolvedValue({ itens: [], nao_lidas: 0 });
});

describe("Painel", () => {
  const painel = {
    obras_ativas: 0,
    progresso_medio: 0,
    orcamento_total: 0,
    gasto_realizado: 0,
    disponivel: 0,
    utilizacao_orcamento: 0,
    alertas_criticos: 0,
    orcamentos_em_elaboracao: 0,
    gasto_previsto: 0,
    gasto_planejado: 0,
    granularidade: "semanal",
    riscos: [],
    semanas: ["01/10"],
    series: [],
    feed: [],
  };

  it("mostra o esqueleto acessível e esconde o conteúdo até a API responder", async () => {
    const { promessa, resolver } = adiada<typeof painel>();
    mock(getDashboard).mockReturnValue(promessa);
    mock(getObras).mockResolvedValue([]);

    render(<DashboardPage />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Carregando painel…");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Obras Ativas")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await resolverCom(resolver, painel);

    expect(await screen.findByText("Obras Ativas")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("Orçamentos (lista)", () => {
  const orcamento = {
    id: "orc-1",
    nome: "Galpão Norte",
    cliente: "Cliente Y",
    data: "2026-01-10",
    base_referencia: "SINAPI",
    tipo_composicao: "Sem Desoneração",
    estado: "CE",
    fonte: "SINAPI",
    bdi: 20,
    valor_total: 1000,
    status: "em_elaboracao",
  };

  beforeEach(() => {
    mock(getOrcamentoStats).mockResolvedValue({
      total_orcamentos: 1,
      valor_total: 1000,
      taxa_aprovacao: 0,
      ticket_medio: 1000,
      tempo_resposta_medio: 0,
    });
  });

  it("anuncia o carregamento e só mostra a lista depois da resposta", async () => {
    const lista = adiada<unknown[]>();
    mock(getOrcamentos).mockReturnValue(lista.promessa);

    render(<OrcamentosPage />);

    // a busca inicial tem debounce de 500 ms, mas o esqueleto já aparece de saída
    expect(statusCom("Carregando orçamentos...")).toHaveLength(1);
    expect(screen.queryByText("Nenhum orçamento encontrado.")).not.toBeInTheDocument();

    // espera o debounce disparar a chamada e então resolve
    await waitFor(() => expect(getOrcamentos).toHaveBeenCalled(), { timeout: 3000 });
    expect(statusCom("Carregando orçamentos...")).toHaveLength(1);
    await resolverCom(lista.resolver, [orcamento]);

    expect((await screen.findAllByText("Galpão Norte")).length).toBeGreaterThan(0);
    expect(statusCom("Carregando orçamentos...")).toHaveLength(0);
  });
});

describe("Equipe", () => {
  const membro = {
    id: "m-1",
    nome: "Joao da Silva",
    cargo: "Pedreiro",
    remuneracao: 3000,
    status: "ATIVO",
    code: "COL-1",
  };

  it("mostra o esqueleto (cartões e tabela) e esconde membros e vazio enquanto carrega", async () => {
    const membros = adiada<unknown[]>();
    mock(getMembrosEquipe).mockReturnValue(membros.promessa);
    mock(getOrcamentos).mockResolvedValue([]);

    render(<EquipePage />);

    // no jsdom as duas versões (mobile e desktop) existem; a tabela anuncia o status
    expect(screen.getAllByText(/Carregando membros da equipe/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Nenhum membro encontrado/)).not.toBeInTheDocument();
    expect(screen.queryByText("Joao da Silva")).not.toBeInTheDocument();

    await resolverCom(membros.resolver, [membro]);

    expect((await screen.findAllByText("Joao da Silva")).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("status")).toHaveLength(0);
    expect(screen.queryByText(/Carregando membros da equipe/)).not.toBeInTheDocument();
  });
});

describe("Notificações", () => {
  it("mostra o status de carregamento e não o estado vazio até a API responder", async () => {
    const resposta = adiada<{ itens: unknown[]; nao_lidas: number }>();
    mock(getNotificacoes).mockReturnValue(resposta.promessa);

    render(<NotificacoesPage />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Carregando notificações…");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Nenhuma notificação")).not.toBeInTheDocument();

    await resolverCom(resposta.resolver, { itens: [], nao_lidas: 0 });

    expect(await screen.findByText("Nenhuma notificação")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("troca o esqueleto pelo alerta de erro quando a API falha", async () => {
    mock(getNotificacoes).mockRejectedValue(new Error("offline"));

    render(<NotificacoesPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("Configurações", () => {
  const perfil = {
    id: "user-1",
    email: "maria@example.com",
    full_name: "Maria Silva",
    cargo: "Engenheira civil",
    username: "maria",
    role: "user",
  };

  it("não mostra o formulário enquanto o perfil carrega", async () => {
    const resposta = adiada<typeof perfil>();
    mock(getPerfil).mockReturnValue(resposta.promessa);

    render(<ConfiguracoesPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando perfil…");
    expect(screen.queryByLabelText("Cargo")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();

    await resolverCom(resposta.resolver, perfil);

    expect(await screen.findByDisplayValue("Maria Silva")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("Bases de dados", () => {
  it("anuncia o carregamento das referências oficiais e das bases próprias e depois mostra o conteúdo", async () => {
    const oficiais = adiada<unknown[]>();
    const proprias = adiada<unknown[]>();
    mock(getSinapiBases).mockReturnValue(oficiais.promessa);
    mock(listarBases).mockReturnValue(proprias.promessa);

    render(<BasesPage />);

    expect(statusCom("Carregando bases...")).toHaveLength(1);
    expect(statusCom("Carregando suas bases...")).toHaveLength(1);
    expect(screen.queryByTestId("bases-vazio")).not.toBeInTheDocument();
    expect(screen.queryByText("Base de dados SINAPI")).not.toBeInTheDocument();

    await resolverCom(oficiais.resolver, [
      { fonte: "SINAPI", mes_referencia: "12/2025", tipo_composicao: "Com Desoneração", total_composicoes: 120 },
    ]);

    expect(await screen.findByText("Base de dados SINAPI")).toBeInTheDocument();
    expect(statusCom("Carregando bases...")).toHaveLength(0);
    // as bases próprias ainda não responderam: o status delas continua
    expect(statusCom("Carregando suas bases...")).toHaveLength(1);

    await resolverCom(proprias.resolver, []);
    await waitFor(() => expect(screen.queryAllByRole("status")).toHaveLength(0));
  });
});

describe("Financeiro (visão geral)", () => {
  const portfolio = {
    total_orcado: 100000,
    total_realizado: 25000,
    saldo_restante: 75000,
    desvio_percentual: 0,
    projetos: [],
    gasto_por_categoria: [],
    alerta_critico: null,
  };

  it("mostra o status de carregamento e só depois os indicadores", async () => {
    const resposta = adiada<typeof portfolio>();
    mock(getPortfolioConsolidado).mockReturnValue(resposta.promessa);

    render(<FinanceiroPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando dados financeiros das obras...");
    expect(screen.queryByText("Verba das obras ativas")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await resolverCom(resposta.resolver, portfolio);

    expect(await screen.findByText("Verba das obras ativas")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
