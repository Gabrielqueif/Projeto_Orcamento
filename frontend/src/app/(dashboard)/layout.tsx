import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { ToastProvider } from "@/components/common/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#F4F6FA] font-['Manrope'] text-[#001b3d] overflow-x-hidden">
        <Sidebar />
        <div className="ml-[256px] flex-1 flex flex-col min-h-screen min-w-0">
          <TopHeader />
          <main className="gp-mn">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}