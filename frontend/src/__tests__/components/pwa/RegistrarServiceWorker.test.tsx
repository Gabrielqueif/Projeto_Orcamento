/**
 * Registro do service worker mínimo que torna o app instalável: só em produção
 * e só quando o navegador suporta service workers.
 */
import { render } from "@testing-library/react";

import { RegistrarServiceWorker } from "@/components/pwa/RegistrarServiceWorker";

const env = process.env as Record<string, string | undefined>;
const ambienteOriginal = env.NODE_ENV;

const register = jest.fn();

function suportarServiceWorker() {
  Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
}

beforeEach(() => {
  register.mockReset().mockResolvedValue({});
  suportarServiceWorker();
});

afterEach(() => {
  env.NODE_ENV = ambienteOriginal;
  Reflect.deleteProperty(navigator, "serviceWorker");
});

it("registra /sw.js em produção", () => {
  env.NODE_ENV = "production";
  render(<RegistrarServiceWorker />);
  expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
});

it("não registra fora de produção", () => {
  env.NODE_ENV = "development";
  render(<RegistrarServiceWorker />);
  expect(register).not.toHaveBeenCalled();
});

it("não quebra quando o navegador não suporta service worker", () => {
  env.NODE_ENV = "production";
  Reflect.deleteProperty(navigator, "serviceWorker");
  expect(() => render(<RegistrarServiceWorker />)).not.toThrow();
  expect(register).not.toHaveBeenCalled();
});

it("só avisa no console se o registro falhar", async () => {
  env.NODE_ENV = "production";
  const aviso = jest.spyOn(console, "warn").mockImplementation(() => {});
  register.mockRejectedValue(new Error("falhou"));
  render(<RegistrarServiceWorker />);
  await Promise.resolve();
  await Promise.resolve();
  expect(aviso).toHaveBeenCalled();
  aviso.mockRestore();
});
