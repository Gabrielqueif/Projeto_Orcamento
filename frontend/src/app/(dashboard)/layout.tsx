import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white-100">
      <TopBar />

      <div className="flex pt-16"> {/* pt-16 para compensar o TopBar fixo */}
        <Sidebar />

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 p-8 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}