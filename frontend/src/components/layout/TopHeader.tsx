"use client";

import Link from "next/link";
import { Gear } from "@phosphor-icons/react";
import { BuscaCampo } from "./BuscaCampo";
import { NotificacoesSino } from "./NotificacoesSino";

export function TopHeader({
  searchPlaceholder = "Buscar orçamentos, obras, insumos…",
}: {
  searchPlaceholder?: string;
}) {
  return (
    <header className="gp-tb sticky top-0 z-40">
      <BuscaCampo placeholder={searchPlaceholder} />
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <NotificacoesSino />
        <Link href="/configuracoes" className="gp-ib" aria-label="Configurações">
          <Gear size={20} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
