/**
 * Unit tests for the Button component.
 *
 * These are smoke/structural tests to verify the component renders correctly,
 * applies the right classes for each variant, and forwards props/events.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Clique</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Button disabled>Bloqueado</Button>);

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Bloqueado
      </Button>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole("button");
    // Verifica que a classe de bg-primary está presente (aplica variante default)
    expect(btn.className).toContain("bg-primary");
  });

  it("applies destructive variant class", () => {
    render(<Button variant="destructive">Deletar</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-destructive");
  });

  it("applies outline variant class", () => {
    render(<Button variant="outline">Cancelar</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border");
  });

  it("accepts and forwards custom className", () => {
    render(<Button className="minha-classe-custom">Custom</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("minha-classe-custom");
  });

  it("renders as child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/home">Link como botão</a>
      </Button>,
    );
    // Deve renderizar um <a>, não um <button>
    expect(screen.getByRole("link", { name: /link como botão/i })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
