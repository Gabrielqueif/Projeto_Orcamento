"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react";

/** Botão de ação flutuante do mobile, acima da barra inferior. Sem `label` vira só ícone. */
export function Fab({ href, label, ariaLabel }: { href: string; label?: string; ariaLabel?: string }) {
  return (
    <Link href={href} className="gp-fab" aria-label={label ? undefined : ariaLabel}>
      <Plus size={24} weight="bold" aria-hidden="true" />
      {label}
    </Link>
  );
}
