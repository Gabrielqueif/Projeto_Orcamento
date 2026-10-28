"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

/**
 * Campo de busca do cabeçalho do desktop. Mesma aparência do campo de TopHeader;
 * ao pressionar Enter leva para a tela /busca com o termo.
 */
export function BuscaCampo({
  placeholder = "Buscar orçamentos, obras, insumos…",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [termo, setTermo] = useState("");

  function onKeyDown(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    const limpo = termo.trim();
    if (!limpo) return;
    router.push(`/busca?q=${encodeURIComponent(limpo)}`);
  }

  return (
    <div role="search" className="gp-srch" style={{ flex: "1 1 320px", maxWidth: 520, borderColor: "#CBD5E1", background: "#F4F6FA" }}>
      <MagnifyingGlass size={18} color="#475569" weight="bold" aria-hidden="true" />
      <label htmlFor="busca-global" className="gp-sr">Buscar orçamentos, obras e insumos</label>
      <input
        id="busca-global"
        type="search"
        placeholder={placeholder}
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

/**
 * Botão-ícone de busca para o cabeçalho mobile: abre a tela /busca.
 */
export function BuscaBotao() {
  return (
    <Link href="/busca" className="gp-ib" aria-label="Buscar">
      <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
    </Link>
  );
}
