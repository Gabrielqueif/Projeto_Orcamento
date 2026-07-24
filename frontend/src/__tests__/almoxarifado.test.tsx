import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AlmoxarifadoPage from "@/app/(dashboard)/obras/[id]/almoxarifado/page";
import "@testing-library/jest-dom";

// Mocks do NextJS router
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mocks do Phosphor Icons para evitar problemas em testes
jest.mock("@phosphor-icons/react", () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  MagnifyingGlass: () => <span data-testid="icon-search" />,
  Funnel: () => <span data-testid="icon-funnel" />,
  Download: () => <span data-testid="icon-download" />,
  ShoppingCart: () => <span data-testid="icon-cart" />,
  Cube: () => <span data-testid="icon-cube" />,
  Warning: () => <span data-testid="icon-warning" />,
  ArrowsHorizontal: () => <span data-testid="icon-arrows" />,
  DotsThreeVertical: () => <span data-testid="icon-dots" />,
  Warehouse: () => <span data-testid="icon-warehouse" />,
  Plus: () => <span data-testid="icon-plus" />,
  Minus: () => <span data-testid="icon-minus" />,
  QrCode: () => <span data-testid="icon-qrcode" />,
  Wrench: () => <span data-testid="icon-wrench" />,
  Coins: () => <span data-testid="icon-coins" />,
  TrendUp: () => <span data-testid="icon-trend-up" />,
  Trash: () => <span data-testid="icon-trash" />,
  X: () => <span data-testid="icon-x" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
}));

// Mocks da API de orçamento
jest.mock("@/lib/api/orcamentos", () => ({
  getOrcamento: jest.fn(() =>
    Promise.resolve({
      id: "1",
      nome: "Horizon Teste",
      cliente: "Residencial Horizon",
    })
  ),
  getItens: jest.fn(() =>
    Promise.resolve([
      {
        id: "item-1",
        orcamento_id: "1",
        codigo_composicao: "SINAPI-1245",
        descricao: "Cimento CP-II",
        quantidade: 100,
        unidade: "sacos",
        preco_unitario: 35.0,
        preco_total: 3500.0,
        estado: "PR",
        fonte: "SINAPI",
      },
    ])
  ),
}));

// Mocks da API do almoxarifado
jest.mock("@/lib/api/almoxarifado", () => ({
  getEstoqueInsumos: jest.fn(() =>
    Promise.resolve([
      {
        id: "insumo-1",
        obra_id: "1",
        codigo_insumo: "SINAPI-1245",
        descricao: "Cimento CP-II",
        categoria: "ESTRUTURA",
        quantidade_atual: 450,
        quantidade_minima: 100,
        unidade: "sacos",
        preco_unitario: 32.5,
        status: "Normal",
        fonte: "SINAPI",
        created_at: "2026-07-23T11:44:00Z",
        updated_at: "2026-07-23T11:44:00Z",
      },
    ])
  ),
  getLocacoes: jest.fn(() =>
    Promise.resolve([
      {
        id: "loc-1",
        obra_id: "1",
        nome_equipamento: "Betoneira 400L",
        locadora: "Rental Tech",
        status: "EM_USO",
        devolucao_prevista: "2024-05-28",
        created_at: "2026-07-23T11:44:00Z",
      },
    ])
  ),
  criarInsumo: jest.fn((obraId, dados) =>
    Promise.resolve({ id: "insumo-criado", ...dados, status: "Normal" })
  ),
  registrarLocacao: jest.fn((obraId, dados) =>
    Promise.resolve({ id: "loc-criada", ...dados })
  ),
  registrarMovimentacao: jest.fn(() => Promise.resolve({ id: "mov-1" })),
  atualizarStatusLocacao: jest.fn((obraId, locId, status) =>
    Promise.resolve({ id: locId, status })
  ),
  deletarInsumo: jest.fn(() => Promise.resolve({ message: "Material deletado com sucesso" })),
}));

describe("AlmoxarifadoPage", () => {
  it("deve renderizar o estado de carregamento e posteriormente a tela de almoxarifado carregada com sucesso", async () => {
    render(<AlmoxarifadoPage />);

    // Deve exibir o estado de loading inicialmente
    expect(screen.getByText(/Carregando informações/i)).toBeInTheDocument();

    // Aguarda o carregamento dos dados mockados
    await waitFor(() => {
      expect(screen.queryByText(/Carregando informações/i)).not.toBeInTheDocument();
    });

    // Verifica a renderização do cabeçalho
    expect(screen.getByText("Inventário & Almoxarifado")).toBeInTheDocument();
    expect(screen.getByText(/Projetos \/ Residencial Horizon \/ Horizon Teste/i)).toBeInTheDocument();

    // Verifica a renderização dos botões e KPIs
    expect(screen.getByText("Dar Baixa / Consumo")).toBeInTheDocument();
    expect(screen.getByText("Entrada de NF / Material")).toBeInTheDocument();
    expect(screen.getByText("VALOR TOTAL EM ESTOQUE")).toBeInTheDocument();
    expect(screen.getByText("MATERIAIS CADASTRADOS")).toBeInTheDocument();
    expect(screen.getByText("MATERIAIS EM NÍVEL CRÍTICO")).toBeInTheDocument();

    // Verifica a renderização dos insumos na tabela
    expect(screen.getAllByText("Cimento CP-II")[0]).toBeInTheDocument();
    expect(screen.getByText("Cód: SINAPI-1245 (SINAPI)")).toBeInTheDocument();
    expect(screen.getByText("ESTRUTURA")).toBeInTheDocument();
  });
});
