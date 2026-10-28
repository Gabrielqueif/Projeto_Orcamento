/**
 * Hook useCurrentUser: o cargo exibido vem do perfil da API; sem ele, cai para o padrão.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { getPerfil } from "@/lib/api/perfil";
import { useCurrentUser } from "@/hooks/use-current-user";

const mockGetUser = jest.fn();
jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: { getUser: () => mockGetUser() } }),
}));

jest.mock("@/lib/api/perfil", () => ({
  getPerfil: jest.fn(),
}));

const mockGetPerfil = getPerfil as jest.Mock;

const USUARIO_SUPABASE = {
  data: {
    user: {
      email: "maria@example.com",
      // role aqui é papel de permissão: nunca deve virar cargo.
      user_metadata: { full_name: "Nome do Metadata", role: "admin" },
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue(USUARIO_SUPABASE);
});

it("usa nome e cargo do perfil da API", async () => {
  mockGetPerfil.mockResolvedValue({
    id: "user-1",
    email: "maria@example.com",
    full_name: "Maria Silva",
    cargo: "Engenheira civil",
    username: null,
    role: "user",
  });

  const { result } = renderHook(() => useCurrentUser());

  await waitFor(() => expect(result.current.cargo).toBe("Engenheira civil"));
  expect(result.current.nome).toBe("Maria Silva");
  expect(result.current.iniciais).toBe("MS");
});

it("cai para o cargo padrão quando o perfil não tem cargo, sem usar role como cargo", async () => {
  mockGetPerfil.mockResolvedValue({
    id: "user-1",
    email: "maria@example.com",
    full_name: null,
    cargo: null,
    username: null,
    role: "admin",
  });

  const { result } = renderHook(() => useCurrentUser());

  await waitFor(() => expect(result.current.cargo).toBe("Gerente de obras"));
  expect(result.current.cargo).not.toBe("admin");
  expect(result.current.nome).toBe("Nome do Metadata");
});

it("cai para o padrão do user_metadata quando a API falha, sem erro visível", async () => {
  mockGetPerfil.mockRejectedValue(new Error("API indisponível"));

  const { result } = renderHook(() => useCurrentUser());

  await waitFor(() => expect(result.current.nome).toBe("Nome do Metadata"));
  expect(result.current.cargo).toBe("Gerente de obras");
  expect(result.current.cargo).not.toBe("admin");
});
