"use client";

import { MagnifyingGlass, Bell, Question, User } from "@phosphor-icons/react";

export function TopHeader() {
  return (
    <header className="h-[80px] bg-white/85 backdrop-blur-[12px] border-b border-gray-200/60 flex items-center justify-between px-10 sticky top-0 z-40">
      <div className="flex items-center bg-bg-light rounded-lg px-4 py-2.5 w-[400px] border border-border">
        <MagnifyingGlass className="text-text-muted mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Buscar obras, arquivos ou tarefas..." 
          className="border-none bg-transparent outline-none w-full text-sm text-text-main"
        />
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-text-muted text-[22px] cursor-pointer relative transition-colors duration-200 hover:text-text-main">
          <Bell />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-status-danger rounded-full"></span>
        </div>
        <div className="text-text-muted text-[22px] cursor-pointer relative transition-colors duration-200 hover:text-text-main">
          <Question />
        </div>
        
        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="text-right">
            <div className="font-semibold text-sm text-text-main">Carlos Mendes</div>
            <div className="text-[11px] text-text-muted uppercase tracking-wide mt-0.5">Gestor de Obras</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center overflow-hidden">
            <User weight="fill" className="text-[#AEE112]" size={24} />
          </div>
        </div>
      </div>
    </header>
  );
}
