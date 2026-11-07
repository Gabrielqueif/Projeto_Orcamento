import {
  House,
  HardHat,
  Database,
  Users,
  Coins,
  UploadSimple,
  Notebook,
  ChartBar,
  Folder,
  SquaresFour,
  Bell,
  Toolbox,
} from "@phosphor-icons/react";

export type NavLink = { href: string; icon: typeof House; label: string };

/** Grupos do menu lateral (desktop). */
export function gruposSidebar(isAdmin: boolean): { titulo: string; links: NavLink[] }[] {
  return [
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
        ...(isAdmin ? [{ href: "/admin/sinapi", icon: UploadSimple, label: "Importação" }] : []),
      ],
    },
  ];
}

/** Abas da barra inferior (mobile). */
export const ABAS_MOBILE: NavLink[] = [
  { href: "/", icon: House, label: "Início" },
  { href: "/orcamentos", icon: Coins, label: "Orçamentos" },
  { href: "/obras", icon: HardHat, label: "Obras" },
  { href: "/diario", icon: Notebook, label: "Diário" },
  { href: "/mais", icon: SquaresFour, label: "Mais" },
];

/** Abas do perfil "só membro" (mestre/supervisor): canteiro, notificações e mais. */
export const ABAS_MEMBRO: NavLink[] = [
  { href: "/canteiro", icon: Toolbox, label: "Canteiro" },
  { href: "/notificacoes", icon: Bell, label: "Avisos" },
  { href: "/mais", icon: SquaresFour, label: "Mais" },
];

export const GRUPOS_SIDEBAR_MEMBRO: { titulo: string; links: NavLink[] }[] = [
  { titulo: "Operação", links: [{ href: "/canteiro", icon: Toolbox, label: "Canteiro" }] },
];

/** Atalhos da seção "Gestão" da tela Mais. */
export function atalhosGestao(isAdmin: boolean): NavLink[] {
  return [
    { href: "/bases", icon: Database, label: "Bases de dados" },
    { href: "/financeiro", icon: ChartBar, label: "Financeiro" },
    { href: "/equipe", icon: Users, label: "Equipe" },
    { href: "/docs", icon: Folder, label: "Documentos" },
    ...(isAdmin ? [{ href: "/admin/sinapi", icon: UploadSimple, label: "Importação" }] : []),
  ];
}

export function linkAtivo(pathname: string | null, href: string): boolean {
  return pathname === href || (href !== "/" && !!pathname?.startsWith(href + "/"));
}

/** Aba da barra inferior que fica ativa: rotas fora das 4 abas principais caem em "Mais". */
export function abaAtiva(pathname: string | null, abas: NavLink[] = ABAS_MOBILE): string {
  // O editor de prazos é aberto a partir da obra.
  if (abas === ABAS_MOBILE && linkAtivo(pathname, "/prazo")) return "/obras";
  const principal = abas.slice(0, -1).find((a) => linkAtivo(pathname, a.href));
  return principal ? principal.href : "/mais";
}
