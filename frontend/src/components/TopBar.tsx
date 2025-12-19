import Link from "next/link";

export function TopBar() {
  return (
    <header className="h-16 bg-[#1F5F7A] text-white flex items-center justify-between px-6 shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Lado Esquerdo: Logo e Nome */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1F5F7A] font-bold text-xs">
          Logo
        </div>
        <span className="text-xl font-bold tracking-wide">GPObras</span>
      </div>

      {/* Lado Direito: Botão de Ação */}
      <button className="bg-transparent border border-white hover:bg-white hover:text-[#1F5F7A] text-white px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-semibold">
        <span>+</span> Criar Orçamento
      </button>
    </header>
  );
}