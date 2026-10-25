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
            <div role="status" aria-label="Carregando" style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <div className="animate-spin" style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #E6EBF2', borderTopColor: '#9fd300' }} />
            </div>
        );
    }

    if (role !== 'admin') {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
