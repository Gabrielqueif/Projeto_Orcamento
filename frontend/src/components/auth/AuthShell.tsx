import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/ssr'
import logo from '@/../public/logo.png'

/**
 * Moldura das telas de acesso. No desktop: painel escuro com a marca à esquerda e o formulário à direita.
 * Abaixo de 1024px (classes gp-4a-auth* em globals.css): topo escuro com a marca e o formulário numa folha branca.
 */
export default function AuthShell({
    title,
    subtitle,
    side,
    tagline,
    back,
    backLabel = 'Voltar',
    wide = false,
    children,
}: {
    title: string
    subtitle: string
    side: ReactNode
    /** Frase curta sob a marca no mobile. */
    tagline: ReactNode
    /** No mobile, mostra o botão voltar e leva o título para o topo escuro (tela compacta, como o cadastro). */
    back?: string
    backLabel?: string
    wide?: boolean
    children: ReactNode
}) {
    const compacto = !!back
    return (
        <div className={`gp-4a-auth${compacto ? ' gp-4a-auth-c' : ''}`} style={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', background: '#fff', color: '#001b3d' }}>
            <section
                aria-label="GPObras"
                className="gp-4a-auth-lado"
                style={{
                    flex: '1 1 480px', boxSizing: 'border-box', padding: '48px 56px', backgroundColor: '#001b3d',
                    backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '22px 22px',
                    color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 40,
                }}
            >
                <div className="gp-only-d">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 52, height: 52, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Image src={logo} alt="" width={34} height={40} style={{ objectFit: 'contain' }} />
                        </span>
                        <span style={{ fontSize: 26, fontWeight: 800 }}>GP<span style={{ color: '#9fd300' }}>Obras</span></span>
                    </span>
                </div>
                <div className="gp-only-d" style={{ maxWidth: 480 }}>{side}</div>
                <div className="gp-only-d">
                    <p style={{ margin: 0, fontSize: 13, color: '#94A9C4' }}>© 2026 GPObras · Quixadá, CE</p>
                </div>

                {/* Mobile: marca grande (login) ou título compacto com voltar (cadastro) */}
                <div className={`gp-only-m gp-4a-auth-marca${compacto ? ' gp-4a-auth-compacto' : ''}`}>
                    {back && (
                        <Link href={back} className="gp-4a-auth-voltar" aria-label={backLabel}>
                            <ArrowLeft size={20} weight="bold" aria-hidden="true" />
                        </Link>
                    )}
                    <div className="gp-4a-auth-id">
                        <span className="gp-4a-auth-logo">
                            <Image src={logo} alt="" width={50} height={58} style={{ objectFit: 'contain' }} />
                        </span>
                        <div>
                            {compacto ? (
                                <h1>{title}</h1>
                            ) : (
                                <p className="gp-4a-auth-nome">GP<span>Obras</span></p>
                            )}
                            <p className="gp-4a-auth-frase">{tagline}</p>
                        </div>
                    </div>
                </div>
            </section>

            <main className="gp-4a-auth-folha" style={{ flex: wide ? '1.3 1 520px' : '1 1 480px', boxSizing: 'border-box', padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: wide ? 520 : 420, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className={compacto ? 'gp-only-d' : 'gp-4a-auth-tit'}>
                        {/* No modo compacto o h1 do mobile fica no topo escuro; este só aparece no desktop. */}
                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-.6px' }}>{title}</h1>
                        <p className="gp-sub">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
}
