'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/use-user-role';
import { DetailHeaderSkeleton, PanelSkeleton } from '@/components/common/skeletons';

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
            <div role="status" aria-label="Carregando" aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <span className="gp-sr">Carregando…</span>
                <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <DetailHeaderSkeleton />
                    <PanelSkeleton linhas={5} />
                </div>
            </div>
        );
    }

    if (role !== 'admin') {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
