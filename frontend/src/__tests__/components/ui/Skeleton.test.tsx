import { render, screen } from "@testing-library/react";
import { Skeleton, SkeletonStatus, SkeletonText } from "@/components/ui/skeleton";
import { TableRowsSkeleton } from "@/components/common/skeletons";

describe("Skeleton", () => {
  it("é decorativo e usa a classe de shimmer", () => {
    const { container } = render(<Skeleton width={120} height={20} />);
    const bloco = container.firstElementChild as HTMLElement;
    expect(bloco).toHaveClass("gp-sk");
    expect(bloco).toHaveAttribute("aria-hidden", "true");
    expect(bloco.style.width).toBe("120px");
  });

  it("usa a variante escura quando pedido", () => {
    const { container } = render(<Skeleton escuro />);
    expect(container.firstElementChild).toHaveClass("gp-4e-skd");
  });

  it("renderiza o número de linhas pedido", () => {
    const { container } = render(<SkeletonText linhas={4} />);
    expect(container.querySelectorAll(".gp-sk")).toHaveLength(4);
  });
});

describe("SkeletonStatus", () => {
  it("anuncia o carregamento para leitores de tela", () => {
    render(
      <SkeletonStatus texto="Carregando obras…">
        <Skeleton />
      </SkeletonStatus>,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Carregando obras…")).toBeInTheDocument();
  });
});

describe("TableRowsSkeleton", () => {
  it("cria linhas e colunas dentro do tbody com texto acessível", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowsSkeleton colunas={3} linhas={2} texto="Carregando orçamentos..." />
        </tbody>
      </table>,
    );
    expect(container.querySelectorAll("tr")).toHaveLength(2);
    expect(container.querySelectorAll("td")).toHaveLength(6);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando orçamentos...");
    expect(container.querySelector("tr")).not.toHaveAttribute("role");
  });
});
