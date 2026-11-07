"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { createClient } from "@/utils/supabase/client";
import { aceitarConvite } from "@/lib/api/acesso";

type Estado = "verificando" | "deslogado" | "aceitando" | "erro";

/** Entrada do mestre/supervisor pelo link do dono: entra ou cria conta (o token vai junto) e vira membro da obra. */
export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [mensagem, setMensagem] = useState("");
  const destino = `/convite/${token}`;

  useEffect(() => {
    let ativo = true;
    createClient()
      .auth.getUser()
      .then(async ({ data }) => {
        if (!ativo) return;
        if (!data?.user) return setEstado("deslogado");
        setEstado("aceitando");
        try {
          await aceitarConvite(token);
          if (ativo) router.replace("/canteiro");
        } catch (e) {
          if (!ativo) return;
          setMensagem(e instanceof Error ? e.message : "Convite inválido ou expirado");
          setEstado("erro");
        }
      })
      .catch(() => ativo && setEstado("deslogado"));
    return () => {
      ativo = false;
    };
  }, [token, router]);

  return (
    <AuthShell
      title="Convite para o canteiro"
      subtitle="Você foi convidado para registrar o diário de uma obra."
      tagline={<>Diário de obra<br />direto do canteiro.</>}
      side={<p style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>Registre o dia da obra e envie ao responsável.</p>}
    >
      {(estado === "verificando" || estado === "aceitando") && (
        <p role="status">{estado === "aceitando" ? "Vinculando você à obra…" : "Verificando convite…"}</p>
      )}
      {estado === "deslogado" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href={`/login?next=${encodeURIComponent(destino)}`} className="gp-btn gp-bp" style={{ minHeight: 54 }}>
            Entrar
          </Link>
          <Link href={`/signup?next=${encodeURIComponent(destino)}`} className="gp-btn gp-bs" style={{ minHeight: 54 }}>
            Criar conta
          </Link>
        </div>
      )}
      {estado === "erro" && (
        <div role="alert" style={{ padding: "12px 14px", borderRadius: 12, background: "#FEE2E2", color: "#B91C1C", fontSize: 14, fontWeight: 700 }}>
          {mensagem}. Peça um novo link ao responsável pela obra.
        </div>
      )}
    </AuthShell>
  );
}
