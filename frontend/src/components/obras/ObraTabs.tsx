import Link from "next/link";

type Aba = "prazo" | "planilha" | "almoxarifado" | "financeiro" | "diario";

// Abas de seção da obra (artefato: nav.gp-tabs "Seções da obra").
export function ObraTabs({ id, atual }: { id: string; atual: Aba }) {
  const abas: { key: Aba; label: string; href: string }[] = [
    { key: "prazo", label: "Prazo", href: `/obras/${id}` },
    { key: "planilha", label: "Planilha", href: `/obras/${id}/planilha` },
    { key: "almoxarifado", label: "Almoxarifado", href: `/obras/${id}/almoxarifado` },
    { key: "financeiro", label: "Financeiro", href: `/financeiro/${id}` },
    { key: "diario", label: "Diário", href: `/diario/${id}` },
  ];
  return (
    <nav className="gp-tabs" aria-label="Seções da obra">
      {abas.map((a) => (
        <Link key={a.key} href={a.href} className="gp-tab" aria-current={a.key === atual ? "page" : undefined}>
          {a.label}
        </Link>
      ))}
    </nav>
  );
}
