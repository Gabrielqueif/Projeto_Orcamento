import { fireEvent, render, screen } from "@testing-library/react";
import DashboardError from "@/app/(dashboard)/error";

describe("error.tsx do dashboard", () => {
  it("mostra mensagem amigável e chama reset ao tentar novamente", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const reset = jest.fn();
    render(<DashboardError error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Algo deu errado");
    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
