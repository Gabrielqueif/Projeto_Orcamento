"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function iniciaisDe(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** Nome e cargo exibidos no menu e no perfil, lidos do user_metadata do Supabase. */
export function useCurrentUser() {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        const meta = user?.user_metadata;
        setNome(meta?.full_name || meta?.username || user?.email || "Usuário");
        setCargo(meta?.role || meta?.cargo || "Gerente de obras");
      })
      .catch(() => setNome("Usuário"));
  }, []);

  return { nome, cargo, iniciais: iniciaisDe(nome) };
}
