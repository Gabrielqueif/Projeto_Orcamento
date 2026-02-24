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

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { role, loading } = useUserRole();
  // const role = 'admin'; // TEMPORARY DEBUG
  // const loading = false;

  // Verifica se estamos em uma rota de detalhe de orçamento
  // A rota é /orcamentos/[id]
  const isOrcamentoDetail = pathname.startsWith('/orcamentos/') && params.id;

  if (isOrcamentoDetail) {
    return (
      <aside className="w-64 bg-brand-primary h-screen flex flex-col fixed border-r border-slate-200 shadow-xl z-20">
        <div className="h-20"></div> {/* Espaço TopBar */}
        <SidebarOrcamentoInfo orcamentoId={params.id as string} />
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white-100 h-screen flex flex-col fixed border-r border-slate-200">
      {/* Espaço para alinhar com o Header se necessário, ou deixar vazio */}
      <div className="h-20"></div>

      <nav className="flex-1 px-4 space-y-3 py-6">
        {menuItems.map((item) => {
          // Hide admin items if user is not admin
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all shadow-sm
                ${isActive
                  ? 'bg-brand-primary text-white'  // Azul Pantone 3015 C
                  : 'bg-brand-secondary/10 text-brand-navy hover:bg-brand-secondary/20' // Sutil e moderno
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