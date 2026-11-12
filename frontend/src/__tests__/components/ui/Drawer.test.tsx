import { fireEvent, render, screen } from "@testing-library/react";
import { Drawer } from "@/components/ui/Drawer";

it("não renderiza nada fechado", () => {
  render(<Drawer isOpen={false} onClose={() => {}} title="Editar composição">conteúdo</Drawer>);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("mostra título e conteúdo quando aberto", () => {
  render(<Drawer isOpen onClose={() => {}} title="Editar composição">conteúdo</Drawer>);
  expect(screen.getByRole("dialog", { name: "Editar composição" })).toHaveTextContent("conteúdo");
});

it("fecha com Esc e pelo botão Fechar", () => {
  const onClose = jest.fn();
  render(<Drawer isOpen onClose={onClose} title="Editar composição">x</Drawer>);
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(onClose).toHaveBeenCalledTimes(2);
});
