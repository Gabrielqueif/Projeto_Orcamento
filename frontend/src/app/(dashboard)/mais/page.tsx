"use client";

import Link from "next/link";
import { CaretRight, Gear, Question, SignOut } from "@phosphor-icons/react";
import { logout } from "@/app/auth/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { atalhosGestao } from "@/components/layout/nav";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserRole } from "@/hooks/use-user-role";

// Fundo e cor do ícone de cada atalho, na ordem de atalhosGestao (artefato: Mais.dc.html).
const TONS = [
  { bg: "#e0f5f7", fg: "#00626b" },
  { bg: "#E6F6D0", fg: "#3F6604" },
  { bg: "#FFEDD5", fg: "#9A3412" },
  { bg: "#EDF1F6", fg: "#001b3d" },
  { bg: "#FEE2E2", fg: "#B91C1C" },
];

export default function MaisPage() {
  const { role } = useUserRole();
  const { nome, cargo, iniciais } = useCurrentUser();
  const atalhos = atalhosGestao(role === "admin");

  return (
    <>
      <PageHeader title="Mais" crumb="Menu" lift />

      <div className="gp-card" style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
        <span className="gp-av" aria-hidden="true" style={{ width: 56, height: 56, flex: "0 0 56px", borderRadius: 18, fontSize: 19 }}>
          {iniciais || "·"}
        </span>
        <span style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <strong style={{ fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</strong>
          <span style={{ fontSize: 14, color: "#475569" }}>{cargo}</span>
        </span>
      </div>

      <nav aria-labelledby="mais-gestao" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 id="mais-gestao" style={{ margin: 0, padding: "0 6px", fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#475569" }}>
          Gestão
        </h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 10 }}>
          {atalhos.map((a, i) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="gp-card"
                style={{ height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 18, color: "#001b3d", textDecoration: "none", fontSize: 14, fontWeight: 800 }}
              >
                <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background: TONS[i % TONS.length].bg, color: TONS[i % TONS.length].fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <a.icon size={20} weight="bold" />
                </span>
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-labelledby="mais-conta" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 id="mais-conta" style={{ margin: 0, padding: "0 6px", fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#475569" }}>
          Conta e ajuda
        </h2>
        <ul className="gp-card" style={{ margin: 0, padding: 6, listStyle: "none" }}>
          <li>
            <Link
              href="/configuracoes"
              style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 60, padding: "0 12px", borderRadius: 14, color: "#001b3d", textDecoration: "none", fontSize: 16, fontWeight: 700 }}
            >
              <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: "#F4F6FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gear size={20} weight="bold" />
              </span>
              <span style={{ flex: "1 1 auto" }}>Configurações</span>
              <CaretRight size={18} weight="bold" color="#64748b" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <a
              href="mailto:suporte@gpobras.com.br"
              style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 64, padding: "0 12px", borderRadius: 14, color: "#001b3d", textDecoration: "none", fontSize: 16, fontWeight: 700 }}
            >
              <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 11, background: "#F4F6FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Question size={20} weight="bold" />
              </span>
              <span style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: 2 }}>
                <span>Suporte</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>suporte@gpobras.com.br</span>
              </span>
              <CaretRight size={18} weight="bold" color="#64748b" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => logout()}
        className="gp-btn"
        style={{ minHeight: 54, borderRadius: 16, background: "#FEF2F2", color: "#B91C1C", fontSize: 16 }}
      >
        <SignOut size={20} weight="bold" aria-hidden="true" />
        Sair da conta
      </button>
    </>
  );
}
