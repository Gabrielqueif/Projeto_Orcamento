"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ABAS_MOBILE, abaAtiva } from "./nav";

/** Barra de navegação inferior do mobile (escondida a partir de 1024px pelo CSS). */
export function BottomNav() {
  const ativa = abaAtiva(usePathname());

  return (
    <nav aria-label="Navegação principal" className="gp-bn">
      {ABAS_MOBILE.map((aba) => {
        const atual = aba.href === ativa;
        return (
          <Link key={aba.href} href={aba.href} aria-current={atual ? "page" : undefined}>
            <aba.icon size={22} weight={atual ? "fill" : "bold"} aria-hidden="true" />
            <span>{aba.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
