"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Buildings,
  SquaresFour,
  HardHat,
  Money,
  Users,
  UserPlus,
  FileText,
  BookOpen,
  Plus,
  Gear,
  Question,
  SignOut,
  Coins,
} from "@phosphor-icons/react";
import clsx from "clsx";
import { logout } from "@/app/auth/actions";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: SquaresFour, label: "Dashboard" },
    { href: "/obras", icon: HardHat, label: "Obras" },
    { href: "/financeiro", icon: Money, label: "Custos" },
    { href: "/orcamentos", icon: Coins, label: "Orçamentos" },
    { href: "/equipe", icon: Users, label: "Equipe" },
    { href: "/docs", icon: FileText, label: "Docs" },
    { href: "/diario", icon: BookOpen, label: "Diário de Obra" },
  ];

  return (
    <aside className="w-[256px] bg-[#001b3d] text-white flex flex-col fixed h-screen left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex flex-col gap-0.5 py-6 px-6 border-b border-[rgba(255,255,255,0.06)]">
        <Link href="/" className="no-underline">
          <span className="font-['Manrope'] font-extrabold text-[22px] text-white tracking-[-0.5px]">
            GP<span className="text-[#9fd300]">Obras</span>
          </span>
        </Link>
        <span className="font-['JetBrains_Mono'] text-[#94a3b8] text-[10px] uppercase tracking-[1px]">
          Gestão de Obras
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 flex flex-col gap-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/" && pathname?.startsWith(link.href + "/"));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 py-[10px] px-4 no-underline rounded-[8px] font-['Manrope'] text-[14px] font-medium transition-all duration-150",
                isActive
                  ? "bg-[#9fd300] text-[#001b3d] font-bold shadow-[0_4px_12px_rgba(159,211,0,0.25)]"
                  : "text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.06)]"
              )}
            >
              <link.icon
                size={18}
                weight={isActive ? "fill" : "regular"}
                className={isActive ? "text-[#001b3d]" : "text-[#64748b]"}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Novo Membro / Nova Obra CTA */}
      {pathname?.startsWith("/equipe") ? (
        <Link
          href="/equipe/novo"
          className="mx-4 mb-4 py-[11px] px-4 bg-[#9fd300] text-[#001b3d] rounded-[8px] font-['Manrope'] font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90 no-underline"
        >
          <UserPlus size={18} weight="bold" />
          Novo Membro
        </Link>
      ) : (
        <Link
          href="/obras/novo"
          className="mx-4 mb-4 py-[11px] px-4 bg-[#9fd300] text-[#001b3d] rounded-[8px] font-['Manrope'] font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90 no-underline"
        >
          <Plus size={16} weight="bold" />
          Nova Obra
        </Link>
      )}

      {/* Bottom */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 py-[10px] px-4 text-[#64748b] no-underline rounded-[8px] font-['Manrope'] text-[13px] transition-all duration-150 hover:text-white hover:bg-[rgba(255,255,255,0.06)]"
        >
          <Gear size={16} />
          Configurações
        </Link>
        <a
          href="mailto:suporte@gpobras.com.br"
          className="flex items-center gap-3 py-[10px] px-4 text-[#64748b] no-underline rounded-[8px] font-['Manrope'] text-[13px] transition-all duration-150 hover:text-white hover:bg-[rgba(255,255,255,0.06)]"
        >
          <Question size={16} />
          Suporte
        </a>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 py-[10px] px-4 text-[rgba(239,68,68,0.7)] no-underline rounded-[8px] font-['Manrope'] text-[13px] transition-all duration-150 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] bg-transparent border-none cursor-pointer"
        >
          <SignOut size={16} />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
