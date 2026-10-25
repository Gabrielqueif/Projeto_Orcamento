import type { ReactNode } from 'react'
import Image from 'next/image'
import logo from '@/../public/logo.png'

export default function AuthShell({
    title,
    subtitle,
    side,
    wide = false,
    children,
}: {
    title: string
    subtitle: string
    side: ReactNode
    wide?: boolean
    children: ReactNode
}) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', background: '#fff', color: '#001b3d' }}>
            <section
                aria-label="GPObras"
                style={{
                    flex: '1 1 480px', boxSizing: 'border-box', padding: '48px 56px', backgroundColor: '#001b3d',
                    backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '22px 22px',
                    color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 40,
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 52, height: 52, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Image src={logo} alt="" width={34} height={40} style={{ objectFit: 'contain' }} />
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 800 }}>GP<span style={{ color: '#9fd300' }}>Obras</span></span>
                </span>
                <div style={{ maxWidth: 480 }}>{side}</div>
                <p style={{ margin: 0, fontSize: 13, color: '#94A9C4' }}>© 2026 GPObras · Quixadá, CE</p>
            </section>

            <main style={{ flex: wide ? '1.3 1 520px' : '1 1 480px', boxSizing: 'border-box', padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: wide ? 520 : 420, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-.6px' }}>{title}</h1>
                        <p className="gp-sub">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
}
