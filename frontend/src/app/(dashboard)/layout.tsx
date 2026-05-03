import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg-light overflow-x-hidden">
      <Sidebar />
      <main className="ml-[260px] flex-1 flex flex-col min-h-screen">
        <TopHeader />
        <div className="p-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}