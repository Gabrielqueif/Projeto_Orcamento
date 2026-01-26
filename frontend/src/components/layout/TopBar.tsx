'use client';

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function TopBar() {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 bg-[#1F5F7A] text-white flex items-center justify-between px-6 shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Lado Esquerdo: Logo e Nome */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1F5F7A] font-bold text-xs">
          Logo
        </div>
        <span className="text-xl font-bold tracking-wide">GPObras</span>
      </div>

      {/* Lado Direito: Ações */}
      {user ? (
        <div className="flex items-center gap-4">
          <button className="bg-transparent border border-white hover:bg-white hover:text-[#1F5F7A] text-white px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-semibold">
            <span>+</span> Criar Orçamento
          </button>
          <button
            onClick={() => signOut()}
            className="text-white/80 hover:text-white text-sm font-medium hover:underline"
          >
            Sair
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="bg-white text-[#1F5F7A] hover:bg-gray-100 px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-transparent border border-white hover:bg-white/10 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}