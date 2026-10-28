import { login } from '@/app/auth/actions'
import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'
import PasswordField from '@/components/auth/PasswordField'

const beneficios = [
    'SINAPI e SEINFRA-CE sempre atualizadas',
    'Do orçamento à obra sem redigitar nada',
    'Diário, medições e custos no mesmo lugar',
]

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const params = await searchParams;
    return (
        <AuthShell
            title="Entrar na sua conta"
            subtitle="Use o e-mail cadastrado na GPObras."
            tagline={<>Orçamento preciso.<br />Execução sob controle.</>}
            side={
                <>
                    <p style={{ margin: 0, fontSize: 44, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
                        Orçamento preciso. <span style={{ color: '#9fd300' }}>Execução sob controle.</span>
                    </p>
                    <ul style={{ listStyle: 'none', margin: '28px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 16, color: '#dbe4ef' }}>
                        {beneficios.map((b) => (
                            <li key={b} style={{ display: 'flex', gap: 12 }}>
                                <span aria-hidden="true" style={{ color: '#9fd300', fontWeight: 800 }}>✓</span>{b}
                            </li>
                        ))}
                    </ul>
                </>
            }
        >
            {params?.message && (
                <div role="status" style={{ padding: '12px 14px', borderRadius: 12, background: '#ECF8D0', color: '#3F6604', fontSize: 14, fontWeight: 700 }}>
                    {params.message}
                </div>
            )}
            {params?.error && (
                <div role="alert" style={{ padding: '12px 14px', borderRadius: 12, background: '#FEE2E2', color: '#B91C1C', fontSize: 14, fontWeight: 700 }}>
                    {params.error}
                </div>
            )}

            <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="gp-fld">
                    <label htmlFor="email" className="gp-lb">E-mail</label>
                    <input id="email" name="email" type="email" required className="gp-in" autoComplete="email" inputMode="email" placeholder="voce@empresa.com.br" />
                </div>
                <div className="gp-fld">
                    <label htmlFor="password" className="gp-lb">Senha</label>
                    <PasswordField />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: '#001b3d' }} />
                    <span>Manter conectado<span className="gp-only-d"> neste computador</span></span>
                </label>
                <button formAction={login} className="gp-btn gp-bp" style={{ minHeight: 54, fontSize: 16 }}>
                    Entrar
                </button>
                <p style={{ margin: 0, textAlign: 'center', fontSize: 15, color: '#475569' }}>
                    Ainda não tem conta? <Link href="/signup" style={{ fontWeight: 800, color: '#007a85' }}>Criar conta</Link>
                </p>
            </form>
        </AuthShell>
    )
}
