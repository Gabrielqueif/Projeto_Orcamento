"use client";

import { MagnifyingGlass, Bell, Gear } from "@phosphor-icons/react";

export function TopHeader({
  searchPlaceholder = "Buscar orçamentos, obras, insumos…",
}: {
  searchPlaceholder?: string;
}) {
  return (
    <header className="gp-tb sticky top-0 z-40">
      <div role="search" className="gp-srch" style={{ flex: "1 1 320px", maxWidth: 520, borderColor: "#CBD5E1", background: "#F4F6FA" }}>
        <MagnifyingGlass size={18} color="#475569" weight="bold" aria-hidden="true" />
        <label htmlFor="busca-global" className="gp-sr">Buscar orçamentos, obras e insumos</label>
        <input id="busca-global" type="search" placeholder={searchPlaceholder} />
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button type="button" className="gp-ib" aria-label="Notificações">
          <Bell size={20} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="gp-ib" aria-label="Configurações">
          <Gear size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
