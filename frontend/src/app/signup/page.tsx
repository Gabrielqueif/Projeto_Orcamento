'use client'

import { signup } from '@/app/auth/actions'
import AuthShell from '@/components/auth/AuthShell'
import Link from 'next/link'
import { useActionState, useState } from 'react'

const tipos = [
    { value: 'individual', label: 'Pessoa física' },
    { value: 'company', label: 'Empresa' },
]
const passos = ['Crie a conta', 'Monte o primeiro orçamento com SINAPI', 'Transforme em obra quando o cliente aprovar']

export default function SignupPage() {
    const [state, formAction, pending] = useActionState(signup, {})
    const [accountType, setAccountType] = useState('individual')
    const [senha, setSenha] = useState('')
    const regras = [
        { ok: senha.length >= 8, texto: 'Mínimo de 8 caracteres' },
        { ok: /[A-Za-z]/.test(senha) && /\d/.test(senha), texto: 'Letras e números' },
    ]
    const empresa = accountType === 'company'

    return (
        <AuthShell
            wide
            title="Criar conta"
            subtitle="Leva menos de 2 minutos."
            side={
                <>
                    <p style={{ margin: 0, fontSize: 40, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
                        Comece a orçar <span style={{ color: '#9fd300' }}>em minutos.</span>
                    </p>
                    <ol style={{ margin: '28px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 16, color: '#dbe4ef' }}>
                        {passos.map((p, i) => (
                            <li key={p} style={{ display: 'flex', gap: 12 }}>
                                <span className="gp-mono" style={{ color: '#9fd300', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>{p}
                            </li>
                        ))}
                    </ol>
                </>
            }
        >
            {state.error && (
                <div role="alert" style={{ padding: '12px 14px', borderRadius: 12, background: '#FEE2E2', color: '#B91C1C', fontSize: 14, fontWeight: 700 }}>
                    {state.error}
                </div>
            )}

            <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="gp-fld">
                    <span className="gp-lb" id="tc">Tipo de conta</span>
                    <div role="radiogroup" aria-labelledby="tc" className="gp-seg">
                        {tipos.map((t) => (
                            <button key={t.value} type="button" role="radio" aria-checked={accountType === t.value} onClick={() => setAccountType(t.value)}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="account_type" value={accountType} />
                </div>

                <div className="gp-fld">
                    <label htmlFor="username" className="gp-lb">
                        {empresa ? 'Nome da empresa' : 'Nome completo'} <span className="gp-req">(obrigatório)</span>
                    </label>
                    <input
                        id="username" name="username" type="text" required minLength={3} maxLength={60}
                        defaultValue={state.values?.username} className="gp-in" aria-required="true"
                        autoComplete={empresa ? 'organization' : 'name'} placeholder={empresa ? 'Ex: Construtora Silva Ltda' : 'Ex: João Silva'}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="gp-fld">
                        <label htmlFor="email" className="gp-lb">E-mail</label>
                        <input id="email" name="email" type="email" required defaultValue={state.values?.email} className="gp-in" autoComplete="email" />
                    </div>
                    <div className="gp-fld">
                        <label htmlFor="confirm_email" className="gp-lb">Confirmar e-mail</label>
                        <input id="confirm_email" name="confirm_email" type="email" required className="gp-in" autoComplete="email" />
                    </div>
                    <div className="gp-fld">
                        <label htmlFor="password" className="gp-lb">Senha</label>
                        <input
                            id="password" name="password" type="password" required minLength={8} className="gp-in"
                            autoComplete="new-password" aria-describedby="req" value={senha} onChange={(e) => setSenha(e.target.value)}
                        />
                    </div>
                    <div className="gp-fld">
                        <label htmlFor="confirm_password" className="gp-lb">Confirmar senha</label>
                        <input id="confirm_password" name="confirm_password" type="password" required className="gp-in" autoComplete="new-password" />
                    </div>
                </div>

                <ul id="req" aria-live="polite" style={{ listStyle: 'none', margin: 0, padding: '12px 14px', borderRadius: 12, background: '#F4F6FA', display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 14 }}>
                    {regras.map((r) => (
                        <li key={r.texto} style={{ display: 'flex', alignItems: 'center', gap: 6, color: r.ok ? '#3F6604' : '#475569', fontWeight: r.ok ? 700 : 400 }}>
                            <span aria-hidden="true">{r.ok ? '✓' : '○'}</span>{r.texto}
                        </li>
                    ))}
                </ul>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.5, cursor: 'pointer' }}>
                    <input type="checkbox" required style={{ width: 20, height: 20, marginTop: 2, accentColor: '#001b3d' }} />
                    <span>Li e aceito os <a href="#" style={{ color: '#007a85' }}>Termos de uso</a> e a <a href="#" style={{ color: '#007a85' }}>Política de privacidade</a>.</span>
                </label>

                <button type="submit" disabled={pending} className="gp-btn gp-bp" style={{ minHeight: 54, fontSize: 16, opacity: pending ? 0.6 : 1 }}>
                    {pending ? 'Cadastrando...' : 'Criar conta'}
                </button>
                <p style={{ margin: 0, textAlign: 'center', fontSize: 15, color: '#475569' }}>
                    Já tem uma conta? <Link href="/login" style={{ fontWeight: 800, color: '#007a85' }}>Fazer login</Link>
                </p>
            </form>
        </AuthShell>
    )
}
