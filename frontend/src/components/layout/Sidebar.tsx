'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { SidebarOrcamentoInfo } from './SidebarOrcamentoInfo';
import { useUserRole } from '@/hooks/use-user-role';

const menuItems = [
  { name: 'Home', path: '/', icon: '🏠' },
  { name: 'Empreendimentos', path: '/empreendimentos', icon: '🏗️' },
  { name: 'Bases de dados', path: '/bases', icon: '📚' },
  { name: 'Orçamentos', path: '/orcamentos', icon: '💰' },
  { name: 'Admin / SINAPI', path: '/admin/sinapi', icon: '⚙️' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { role, loading } = useUserRole();

  // Verifica se estamos em uma rota de detalhe de orçamento
  const isOrcamentoDetail = pathname.startsWith('/orcamentos/') && params.id;

  const sidebarClasses = `
    w-64 h-full flex flex-col border-r border-slate-200 shadow-xl z-30 
    transition-transform duration-300 ease-in-out
    lg:relative lg:translate-x-0
    fixed top-0 left-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  if (isOrcamentoDetail) {
    return (
      <aside className={`${sidebarClasses} bg-brand-primary`}>
        <div className="h-16 lg:hidden"></div> {/* Espaço TopBar no Mobile */}
        <SidebarOrcamentoInfo orcamentoId={params.id as string} />
      </aside>
    );
  }

  return (
    <aside className={`${sidebarClasses} bg-white-100`}>
      {/* Cabeçalho do Sidebar no Mobile */}
      <div className="h-16 flex items-center justify-between px-4 lg:hidden">
        <span className="font-bold text-brand-navy">Menu</span>
        <button onClick={onClose} className="p-2 text-brand-navy">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="hidden lg:block h-20"></div>

      <nav className="flex-1 px-4 space-y-3 py-6">
        {menuItems.map((item) => {
          if (item.path.startsWith('/admin')) {
            if (loading || role !== 'admin') {
              return null;
            }
          }

          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose?.();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all shadow-sm
                ${isActive
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-secondary/10 text-brand-navy hover:bg-brand-secondary/20'
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
