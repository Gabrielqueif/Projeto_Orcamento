'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Home', path: '/', icon: '🏠' },
  { name: 'Empreendimentos', path: '/empreendimentos', icon: '🏗️' },
  { name: 'Bases de dados', path: '/bases', icon: '📚' },
  { name: 'Orçamentos', path: '/orcamentos', icon: '💰' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-100 min-h-screen flex flex-col border-r border-slate-200">
      {/* Espaço para alinhar com o Header se necessário, ou deixar vazio */}
      <div className="h-20"></div> 

      <nav className="flex-1 px-4 space-y-3 py-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all shadow-sm
                ${isActive 
                  ? 'bg-[#1F5F7A] text-white'  // Azul do Figma (ativo)
                  : 'bg-[#1F5F7A] text-white opacity-90 hover:opacity-100' // Azul do Figma (inativo mas colorido conforme imagem)
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}