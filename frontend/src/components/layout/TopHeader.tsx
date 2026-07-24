"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, Bell, Gear, User } from "@phosphor-icons/react";
import { createClient } from "@/utils/supabase/client";

interface TopHeaderProps {
  searchPlaceholder?: string;
  userName?: string;
  userRole?: string;
}

export function TopHeader({
  searchPlaceholder = "Buscar dados do projeto...",
  userName: customUserName,
  userRole: customUserRole,
}: TopHeaderProps) {
  const [userName, setUserName] = useState<string>(customUserName || "Buscando...");
  const [userRole, setUserRole] = useState<string>(customUserRole || "Engenharia / Gestão");

  useEffect(() => {
    // Se o usuário passou props customizadas explícitas, utiliza elas
    if (customUserName) {
      setUserName(customUserName);
      if (customUserRole) setUserRole(customUserRole);
      return;
    }

    const loadUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.username ||
            "Engenheiro Responsável";
          
          const role =
            user.user_metadata?.role ||
            user.user_metadata?.cargo ||
            "Gerente de Obras";
          
          setUserName(fullName);
          setUserRole(role);
        } else {
          setUserName("Usuário Visitante");
          setUserRole("Engenheiro");
        }
      } catch (err) {
        console.error("Erro ao carregar dados do usuário no TopHeader:", err);
        setUserName("Engenheiro Responsável");
        setUserRole("Gerente de Obras");
      }
    };

    loadUser();
  }, [customUserName, customUserRole]);

  return (
    <header className="h-[64px] bg-white border-b border-[#f1f5f9] flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 flex items-center pr-[227px]">
        <div className="relative w-full max-w-[448px]">
          <div className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none">
            <MagnifyingGlass size={15} className="text-[#6b7280]" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full bg-[#f8fafc] rounded-[8px] pl-[40px] pr-4 pb-[9px] pt-[8px] font-['Manrope'] text-[14px] text-[#6b7280] placeholder:text-[#6b7280] border-none outline-none"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-6">
        {/* Icon buttons */}
        <div className="flex items-center gap-2">
          {/* Bell with lime badge */}
          <button className="relative flex flex-col items-center justify-center p-[8px] rounded-[8px] hover:bg-[#f8fafc] transition-colors">
            <Bell size={18} className="text-[#64748b]" />
            <span className="absolute top-[8px] right-[7px] w-[8px] h-[8px] rounded-full bg-[#9fd300] border-2 border-white" />
          </button>
          {/* Settings */}
          <button className="flex flex-col items-center justify-center p-[8px] rounded-[8px] hover:bg-[#f8fafc] transition-colors">
            <Gear size={18} className="text-[#64748b]" />
          </button>
        </div>

        {/* Vertical divider + user info */}
        <div className="flex items-center gap-3 border-l border-[#f1f5f9] pl-6">
          {/* Name + role */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-['Manrope'] font-bold text-[14px] text-[#001b3d] leading-[17.5px] capitalize">
              {userName}
            </span>
            <span className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] tracking-[0.5px] uppercase leading-[15px]">
              {userRole}
            </span>
          </div>
          {/* Avatar */}
          <div className="w-[36px] h-[36px] rounded-[8px] bg-[#e2e8f0] border border-[#e2e8f0] flex items-center justify-center overflow-hidden shrink-0">
            <User size={20} weight="fill" className="text-[#94a3b8]" />
          </div>
        </div>
      </div>
    </header>
  );
}
