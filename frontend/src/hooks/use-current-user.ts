"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getPerfil } from "@/lib/api/perfil";

export function iniciaisDe(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Nome e cargo exibidos no menu e no perfil. O perfil editável (API /perfil) tem prioridade;
 * sem ele, cai para o user_metadata do Supabase. `user_metadata.role` NÃO é cargo: é o papel de permissão.
 */
export function useCurrentUser() {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");

  useEffect(() => {
    let ativo = true;

    createClient()
      .auth.getUser()
      .then(async ({ data: { user } }) => {
        const meta = user?.user_metadata;
        const nomeMeta = meta?.full_name || meta?.username || user?.email || "Usuário";
        const cargoMeta = meta?.cargo || "Gerente de obras";

        let perfil = null;
        try {
          perfil = await getPerfil();
        } catch {
          // Sem o perfil da API, mantém o que já vinha do user_metadata, sem erro visível.
        }
        if (!ativo) return;

        setNome(perfil?.full_name || nomeMeta);
        setCargo(perfil?.cargo || cargoMeta);
      })
      .catch(() => {
        if (ativo) setNome("Usuário");
      });

    return () => {
      ativo = false;
    };
  }, []);

  return { nome, cargo, iniciais: iniciaisDe(nome) };
}
