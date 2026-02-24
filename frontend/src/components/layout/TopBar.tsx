'use client';

import Link from "next/link";
import Image from "next/image";
import { logout } from "@/app/auth/actions";
export function TopBar() {


  return (
    <header className="h-16 bg-brand-navy text-white flex items-center justify-between px-6 shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Lado Esquerdo: Logo e Nome */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <Image
            src="/logo.png"
            alt="GPObras Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="text-xl font-bold tracking-wide">GPObras</span>
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