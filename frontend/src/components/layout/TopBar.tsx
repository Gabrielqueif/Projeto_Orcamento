'use client';

import Link from "next/link";
import Image from "next/image";
import { logout } from "@/app/auth/actions";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  return (
    <header className="h-16 bg-brand-navy text-white flex items-center justify-between px-4 md:px-6 shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Lado Esquerdo: Menu Mobile e Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Botão Hambúrguer Mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <div className="relative w-8 h-8 md:w-10 md:h-10">
          <Image
            src="/logo.png"
            alt="GPObras Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="text-lg md:text-xl font-bold tracking-wide">GPObras</span>
      </div>

      {/* Lado Direito: Ações */}
      <div className="flex items-center gap-4">
        <form action={logout}>
          <button
            type="submit"
            className="text-white/80 hover:text-white text-sm font-medium hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}