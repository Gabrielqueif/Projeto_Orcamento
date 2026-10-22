/**
 * Almoxarifado sem estoque: não semeia dados fictícios; oferece importar os insumos
 * do orçamento com quantidade atual e mínima zeradas.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@phosphor-icons/react", () => new Proxy({}, { get: () => () => <span /> }));

jest.mock("@/lib/api/orcamentos", () => ({
  getOrcamento: jest.fn(() => Promise.resolve({ id: "1", nome: "Obra X", cliente: "Cliente" })),
  getItens: jest.fn(() =>
    Promise.resolve([
      { id: "i1", codigo_composicao: "C1", descricao: "Alvenaria", quantidade: 50, unidade: "m2", preco_unitario: 10 },
      { id: "i2", codigo_composicao: "C2", descricao: "Reboco", quantidade: 20, unidade: "m2", preco_unitario: 5 },
    ])
  ),
}));

jest.mock("@/lib/api/almoxarifado", () => ({
  getEstoqueInsumos: jest.fn(() => Promise.resolve([])),
  getLocacoes: jest.fn(() => Promise.resolve([])),
  criarInsumo: jest.fn((obraId, dados) => Promise.resolve({ id: `novo-${dados.codigo_insumo}`, ...dados, status: "Normal" })),
  registrarLocacao: jest.fn(),
  registrarMovimentacao: jest.fn(),
  atualizarStatusLocacao: jest.fn(),
  deletarInsumo: jest.fn(),
  deletarLocacao: jest.fn(),
}));

import AlmoxarifadoPage from "@/app/(dashboard)/obras/[id]/almoxarifado/page";
import { criarInsumo, registrarLocacao } from "@/lib/api/almoxarifado";

it("não cria dados fictícios e importa os insumos do orçamento zerados", async () => {
  render(<AlmoxarifadoPage />);

  expect(await screen.findByText("O estoque desta obra está vazio.")).toBeInTheDocument();
  expect(criarInsumo).not.toHaveBeenCalled();
  expect(registrarLocacao).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Importar insumos do orçamento" }));

  await waitFor(() => expect(criarInsumo).toHaveBeenCalledTimes(2));
  expect(criarInsumo).toHaveBeenCalledWith(
    "1",
    expect.objectContaining({ codigo_insumo: "C1", quantidade_atual: 0, quantidade_minima: 0 })
  );
  expect(registrarLocacao).not.toHaveBeenCalled();
  expect((await screen.findAllByText("Alvenaria")).length).toBeGreaterThan(0);
});
