import { TopBar } from '@/components/layout/TopBar';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <TopBar />
            <div className="pt-16 min-h-screen flex flex-col">
                {children}
            </div>
        </div>
    );
}
