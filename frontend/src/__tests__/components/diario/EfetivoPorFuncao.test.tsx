/**
 * Lista "Efetivo no canteiro" do formulário de diário: soma, botões + e − e limite inferior em zero.
 */
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EfetivoPorFuncao, totalDoEfetivo } from "@/components/diario/DiarioFormModal";
import type { Cargo } from "@/lib/api/cargos";

const cargo = (id: string, nome: string): Cargo => ({
  id,
  user_id: null,
  nome,
  campos_ocultos: [],
  campos_extras: [],
});

const CARGOS = [cargo("c1", "Pedreiro"), cargo("c2", "Servente")];

describe("totalDoEfetivo", () => {
  it("soma as quantidades dos cargos e as pessoas sem cargo", () => {
    expect(totalDoEfetivo(CARGOS, { c1: 2, c2: 3 }, 1)).toBe(6);
  });

  it("ignora quantidades de cargos que não estão na lista", () => {
    expect(totalDoEfetivo(CARGOS, { c1: 2, fantasma: 9 }, 0)).toBe(2);
  });
});

describe("EfetivoPorFuncao", () => {
  it("mostra o total de pessoas somando as linhas", () => {
    render(
      <EfetivoPorFuncao cargos={CARGOS} quantidades={{ c1: 2, c2: 3 }} outrasPessoas={0} onAjustar={jest.fn()} />
    );
    expect(screen.getByText("5 pessoas")).toBeInTheDocument();
  });

  it("inclui as pessoas sem cargo no total", () => {
    render(
      <EfetivoPorFuncao cargos={CARGOS} quantidades={{ c1: 2, c2: 3 }} outrasPessoas={2} onAjustar={jest.fn()} />
    );
    expect(screen.getByText("7 pessoas")).toBeInTheDocument();
  });

  it("usa o singular quando o total é uma pessoa", () => {
    render(<EfetivoPorFuncao cargos={CARGOS} quantidades={{ c1: 1 }} outrasPessoas={0} onAjustar={jest.fn()} />);
    expect(screen.getByText("1 pessoa")).toBeInTheDocument();
  });

  it("o botão + pede a quantidade seguinte do cargo", () => {
    const onAjustar = jest.fn();
    render(<EfetivoPorFuncao cargos={CARGOS} quantidades={{ c1: 2 }} outrasPessoas={0} onAjustar={onAjustar} />);

    fireEvent.click(screen.getByRole("button", { name: "Aumentar Pedreiro" }));

    expect(onAjustar).toHaveBeenCalledWith("c1", 3);
  });

  it("o botão − pede a quantidade anterior do cargo", () => {
    const onAjustar = jest.fn();
    render(<EfetivoPorFuncao cargos={CARGOS} quantidades={{ c1: 2 }} outrasPessoas={0} onAjustar={onAjustar} />);

    fireEvent.click(screen.getByRole("button", { name: "Diminuir Pedreiro" }));

    expect(onAjustar).toHaveBeenCalledWith("c1", 1);
  });

  it("não vai abaixo de zero: o − fica desabilitado e não envia nada", () => {
    const onAjustar = jest.fn();
    render(<EfetivoPorFuncao cargos={CARGOS} quantidades={{}} outrasPessoas={0} onAjustar={onAjustar} />);

    const menos = screen.getByRole("button", { name: "Diminuir Servente" });
    expect(menos).toBeDisabled();
    fireEvent.click(menos);

    expect(onAjustar).not.toHaveBeenCalled();
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("0");
  });

  it("não passa de 10000 pessoas em uma função", () => {
    const onAjustar = jest.fn();
    render(<EfetivoPorFuncao cargos={CARGOS} quantidades={{ c1: 10000 }} outrasPessoas={0} onAjustar={onAjustar} />);

    const mais = screen.getByRole("button", { name: "Aumentar Pedreiro" });
    expect(mais).toBeDisabled();
    fireEvent.click(mais);

    expect(onAjustar).not.toHaveBeenCalled();
  });

  it("os contadores e o total acompanham os cliques", () => {
    function Harness() {
      const [quantidades, setQuantidades] = useState<Record<string, number>>({});
      return (
        <EfetivoPorFuncao
          cargos={CARGOS}
          quantidades={quantidades}
          outrasPessoas={0}
          onAjustar={(id, q) => setQuantidades((atual) => ({ ...atual, [id]: q }))}
        />
      );
    }
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Aumentar Pedreiro" }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar Pedreiro" }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar Servente" }));
    expect(screen.getByText("3 pessoas")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Diminuir Pedreiro" }));
    expect(screen.getByText("2 pessoas")).toBeInTheDocument();
  });

  it("mostra o total antigo como apoio quando o registro ainda não tem efetivo", () => {
    render(
      <EfetivoPorFuncao
        cargos={CARGOS}
        quantidades={{}}
        outrasPessoas={0}
        equipeAnterior={8}
        onAjustar={jest.fn()}
      />
    );
    expect(screen.getByText(/Antes: 8 pessoas/)).toBeInTheDocument();
  });
});
