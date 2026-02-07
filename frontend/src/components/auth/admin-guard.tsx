'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/use-user-role';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { role, loading } = useUserRole();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (role !== 'admin') {
                router.push('/'); // Redirect to dashboard if not admin
            }
        }
    }, [role, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (role !== 'admin') {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
