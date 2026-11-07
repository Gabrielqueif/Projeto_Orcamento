"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getObrasDoCanteiro } from "@/lib/api/acesso";
import { getObras } from "@/lib/api/obras";

// Sem o provider (testes, telas fora do layout) ninguém é tratado como "só membro".
const Contexto = createContext(false);

/** true quando o usuário é mestre/supervisor de alguma obra e não tem obras próprias. */
export function useSomenteMembro(): boolean {
  return useContext(Contexto);
}

// Telas que o perfil "só membro" pode abrir; o resto volta para o canteiro.
const ROTAS_DO_MEMBRO = ["/canteiro", "/notificacoes", "/mais", "/configuracoes", "/diario"];

export function CanteiroProvider({ children }: { children: ReactNode }) {
  const [somenteMembro, setSomenteMembro] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let ativo = true;
    // Quem tem obra própria é dono; só consulta as obras próprias se houver vínculo de membro.
    getObrasDoCanteiro()
      .then(async (canteiro) => {
        if (canteiro.total_obras === 0) return false;
        return (await getObras()).length === 0;
      })
      .catch(() => false)
      .then((valor) => ativo && setSomenteMembro(valor));
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!somenteMembro || !pathname) return;
    if (!ROTAS_DO_MEMBRO.some((r) => pathname === r || pathname.startsWith(r + "/"))) router.replace("/canteiro");
  }, [somenteMembro, pathname, router]);

  return <Contexto.Provider value={somenteMembro}>{children}</Contexto.Provider>;
}
