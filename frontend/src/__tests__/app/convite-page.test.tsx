import { render, screen, waitFor } from "@testing-library/react";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace }) }));
const mockGetUser = jest.fn();
jest.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: { getUser: mockGetUser } }) }));
jest.mock("@/lib/api/acesso", () => ({ aceitarConvite: jest.fn() }));
jest.mock("@/components/auth/AuthShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import ConvitePage from "@/app/convite/[token]/page";
import { aceitarConvite } from "@/lib/api/acesso";

const aceitar = aceitarConvite as jest.Mock;
const pagina = () => <ConvitePage params={Promise.resolve({ token: "tok123" })} />;

beforeEach(() => jest.clearAllMocks());

it("deslogado: oferece entrar e criar conta levando o convite junto", async () => {
  mockGetUser.mockResolvedValue({ data: { user: null } });
  render(pagina());
  const entrar = await screen.findByRole("link", { name: "Entrar" });
  expect(entrar).toHaveAttribute("href", "/login?next=%2Fconvite%2Ftok123");
  expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/signup?next=%2Fconvite%2Ftok123");
  expect(aceitar).not.toHaveBeenCalled();
});

it("logado: aceita o convite e vai para o canteiro", async () => {
  mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  aceitar.mockResolvedValue({ obra_id: "o1", papel: "MESTRE" });
  render(pagina());
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/canteiro"));
  expect(aceitar).toHaveBeenCalledWith("tok123");
});

it("convite recusado mostra o motivo", async () => {
  mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  aceitar.mockRejectedValue(new Error("Convite inválido ou expirado"));
  render(pagina());
  expect(await screen.findByRole("alert")).toHaveTextContent("Convite inválido ou expirado");
  expect(mockReplace).not.toHaveBeenCalled();
});
