"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  HardHat,
  Database,
  Users,
  Plus,
  Question,
  SignOut,
  Coins,
  UploadSimple,
  Notebook,
  ChartBar,
} from "@phosphor-icons/react";
import { logout } from "@/app/auth/actions";
import Image from "next/image";
import { useUserRole } from "@/hooks/use-user-role";
import { createClient } from "@/utils/supabase/client";

type NavLink = { href: string; icon: typeof House; label: string };

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useUserRole();
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

  const grupos: { titulo: string; links: NavLink[] }[] = [
    {
      titulo: "Comercial",
      links: [
        { href: "/", icon: House, label: "Visão geral" },
        { href: "/orcamentos", icon: Coins, label: "Orçamentos" },
        { href: "/bases", icon: Database, label: "Bases de dados" },
      ],
    },
    {
      titulo: "Operação",
      links: [
        { href: "/obras", icon: HardHat, label: "Obras" },
        { href: "/diario", icon: Notebook, label: "Diário de obra" },
        { href: "/equipe", icon: Users, label: "Equipe" },
      ],
    },
    {
      titulo: "Gestão",
      links: [
        { href: "/financeiro", icon: ChartBar, label: "Financeiro" },
        ...(role === "admin"
          ? [{ href: "/admin/sinapi", icon: UploadSimple, label: "Importação" }]
          : []),
      ],
    },
  ];

  const ativo = (href: string) =>
    pathname === href || (href !== "/" && !!pathname?.startsWith(href + "/"));
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <aside
      aria-label="Menu lateral"
      className="gp-sd fixed left-0 top-0 z-50 h-screen w-[256px] flex-none overflow-y-auto"
    >
      <Link href="/" className="gp-sd-brand">
        <span className="gp-sd-logo">
          <Image src="/logo.png" alt="" width={26} height={30} className="object-contain" />
        </span>
        <span>
          GP<span style={{ color: "#9fd300" }}>Obras</span>
        </span>
      </Link>

      <Link href="/obras/novo" className="gp-sd-cta">
        <Plus size={18} weight="bold" aria-hidden="true" />
        Nova obra
      </Link>

      <nav className="gp-sd-nav" aria-label="Navegação principal">
        {grupos.map((g) => (
          <div key={g.titulo} className="gp-sd-g">
            <span>{g.titulo}</span>
            {g.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="gp-sd-l"
                aria-current={ativo(l.href) ? "page" : undefined}
              >
                <l.icon size={20} weight="bold" aria-hidden="true" />
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="gp-sd-ft">
        <a href="mailto:suporte@gpobras.com.br" className="gp-sd-l" style={{ fontSize: 14 }}>
          <Question size={20} weight="bold" aria-hidden="true" />
          Suporte
        </a>
        <div className="gp-sd-user">
          <span className="gp-av" aria-hidden="true">{iniciais || "·"}</span>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#94A9C4" }}>{cargo}</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Sair da conta"
            className="gp-ib"
            style={{ width: 40, height: 40, background: "transparent", border: 0, color: "#FCA5A5" }}
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
