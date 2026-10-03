import type { ReactNode } from 'react'
import { Buildings } from '@phosphor-icons/react/dist/ssr'

export default function AuthShell({
    subtitle,
    maxWidth = 'max-w-[420px]',
    children,
}: {
    subtitle: string
    maxWidth?: string
    children: ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-bg-dark overflow-hidden relative py-8">
            {/* Background Pattern */}
            <div
                className="absolute w-full h-full z-0"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            ></div>

            <div className={`bg-white rounded-xl p-8 sm:p-12 w-full ${maxWidth} mx-4 relative z-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]`}>
                <div className="flex items-center justify-center gap-3 text-[32px] font-bold text-bg-dark mb-2">
                    <Buildings weight="fill" className="text-brand-primary" />
                    GP<span className="text-brand-primary">Obras</span>
                </div>
                <div className="text-center text-[13px] text-text-muted mb-8">
                    {subtitle}
                </div>

                {children}
            </div>
        </div>
    )
}
