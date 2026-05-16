"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Buildings, 
  SquaresFour, 
  HardHat, 
  Money, 
  Users, 
  FileText, 
  BookOpen, 
  Plus, 
  Gear, 
  Question,
  SignOut
} from "@phosphor-icons/react";
import clsx from "clsx";
import { logout } from "@/app/auth/actions";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: SquaresFour, label: "Dashboard" },
    { href: "/obras", icon: HardHat, label: "Obras" },
    { href: "/financeiro", icon: Money, label: "Custos" },
    { href: "/equipe", icon: Users, label: "Equipe" },
    { href: "/docs", icon: FileText, label: "Docs" },
    { href: "/diario", icon: BookOpen, label: "Diário de Obra" },
  ];

  return (
    <aside className="w-[260px] bg-bg-dark text-white flex flex-col fixed h-screen left-0 top-0 z-50 transition-all duration-300">
      <Link href="/" className="flex items-center gap-3 py-8 px-6 text-2xl font-bold text-white no-underline">
        <Buildings weight="fill" />
        GP<span className="text-brand-primary">Obras</span>
      </Link>
      
      <nav className="flex-1 p-4 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={clsx(
                "flex items-center gap-4 py-3.5 px-5 no-underline rounded-lg font-medium transition-all duration-200",
                isActive 
                  ? "bg-brand-primary text-bg-dark shadow-[0_4px_12px_rgba(174,225,18,0.2)]" 
                  : "text-[#8C9CAB] hover:text-white hover:bg-white/5"
              )}
            >
              <link.icon size={20} weight={isActive ? "fill" : "regular"} className={isActive ? "text-bg-dark" : "text-[#8C9CAB]"} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <Link 
        href="/obras/novo" 
        className="mx-4 my-5 py-3.5 px-5 bg-brand-primary text-bg-dark rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 text-[15px] hover:bg-[#98C40F]"
      >
        <Plus weight="bold" /> Nova Obra
      </Link>
      
      <div className="p-4 border-t border-white/5 bg-bg-darker">
        <Link href="/configuracoes" className="flex items-center gap-4 py-3 px-5 text-[#8C9CAB] no-underline rounded-lg font-medium transition-all duration-200 hover:text-white hover:bg-white/5 text-sm">
          <Gear size={20} /> Configurações
        </Link>
        <a href="mailto:suporte@gpobras.com.br" className="flex items-center gap-4 py-3 px-5 text-[#8C9CAB] no-underline rounded-lg font-medium transition-all duration-200 hover:text-white hover:bg-white/5 text-sm">
          <Question size={20} /> Suporte
        </a>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-4 py-3 px-5 text-status-danger/80 no-underline rounded-lg font-medium transition-all duration-200 hover:text-status-danger hover:bg-status-danger/10 text-sm border-none bg-transparent cursor-pointer"
        >
          <SignOut size={20} /> Sair da conta
        </button>
      </div>
    </aside>
  );
}
