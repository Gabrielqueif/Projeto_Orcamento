import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AtualizarPrecosPropriaModal } from "@/components/orcamentos/AtualizarPrecosPropriaModal";
import type { AtualizacaoPrecosPropriaResponse } from "@/lib/api/orcamentos";

const previa: AtualizacaoPrecosPropriaResponse = {
  aplicado: false,
  total_itens: 3,
  itens_alterados: 1,
  diferenca_custo_direto: 50,
  itens: [
    {
      item_id: "i1",
      codigo_composicao: "C-100",
      descricao: "Reboco interno",
      base_propria_id: "b1",
      preco_atual: 10,
      preco_novo: 15,
      diferenca: 50,
      variacao_percentual: 50,
      alterado: true,
      aplicado: false,
    },
    {
      item_id: "i2",
      codigo_composicao: "C-200",
      descricao: "Piso sem mudança",
      base_propria_id: "b1",
      preco_atual: 20,
      preco_novo: 20,
      diferenca: 0,
      variacao_percentual: 0,
      alterado: false,
      aplicado: false,
    },
  ],
  ignorados: [{ item_id: "i3", codigo_composicao: "C-300", motivo: "Composição removida da base" }],
};

function renderModal(props: Partial<React.ComponentProps<typeof AtualizarPrecosPropriaModal>> = {}) {
  const onConfirmar = jest.fn();
  const onClose = jest.fn();
  render(
    <AtualizarPrecosPropriaModal
      isOpen
      onClose={onClose}
      previa={previa}
      onConfirmar={onConfirmar}
      {...props}
    />,
  );
  return { onConfirmar, onClose };
}

describe("AtualizarPrecosPropriaModal", () => {
  it("mostra apenas itens alterados e os ignorados com motivo", async () => {
    renderModal();
    expect(await screen.findByText("Reboco interno")).toBeInTheDocument();
    expect(screen.queryByText("Piso sem mudança")).not.toBeInTheDocument();
    expect(screen.getByText(/Composição removida da base/)).toBeInTheDocument();
    expect(screen.getByText("+50,00%")).toBeInTheDocument();
  });

  it("chama onConfirmar ao confirmar", async () => {
    const { onConfirmar } = renderModal();
    fireEvent.click(await screen.findByRole("button", { name: /confirmar atualização/i }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("desabilita a confirmação quando nada mudou", async () => {
    renderModal({ previa: { ...previa, itens_alterados: 0, diferenca_custo_direto: 0, itens: [] } });
    expect(await screen.findByText(/já estão atualizados/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar atualização/i })).toBeDisabled();
  });

  it("mostra estado de carregamento sem prévia", async () => {
    renderModal({ previa: null, loading: true });
    expect(await screen.findByText(/calculando prévia/i)).toBeInTheDocument();
  });
});
