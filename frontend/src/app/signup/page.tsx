'use client'

import { signup } from '@/app/auth/actions'
import AuthShell from '@/components/auth/AuthShell'
import { ArrowRight, Envelope, Lock, User } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useActionState, useState } from 'react'

const labelClass = 'block text-[11px] font-bold text-text-muted uppercase mb-2'
const inputClass =
    'w-full py-4 pr-4 pl-11 border border-border rounded-lg bg-[#F8FAFC] text-sm outline-none transition-colors focus:border-[#CBD5E1] focus:bg-white text-text-main'
const iconClass = 'absolute left-4 top-4 text-text-muted'

export default function SignupPage() {
    const [state, formAction, pending] = useActionState(signup, {})
    const [accountType, setAccountType] = useState('individual')

    return (
        <AuthShell subtitle="Crie sua conta" maxWidth="max-w-2xl">
            {state.error && (
                <div role="alert" className="bg-status-danger/20 border border-status-danger text-status-danger px-4 py-3 rounded relative mb-4 text-center text-sm">
                    {state.error}
                </div>
            )}

            <form action={formAction} className="space-y-6">
                {/* Account Type - Sliding Toggle */}
                <div>
                    <label className={labelClass}>Tipo de Conta</label>
                    <div className="relative flex w-full p-1 bg-gray-100 rounded-lg h-12">
                        {/* Sliding Pill */}
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-brand-primary rounded-md transition-all duration-300 ease-out shadow-sm
                            ${accountType === 'individual' ? 'left-1' : 'left-[calc(50%+2px)]'}
                            `}
                        />

                        {/* Options */}
                        <button
                            type="button"
                            onClick={() => setAccountType('individual')}
                            className={`flex-1 relative z-10 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2
                            ${accountType === 'individual' ? 'text-bg-dark' : 'text-gray-500 hover:text-gray-700'}
                            `}
                        >
                            <span className="text-lg">👤</span> Pessoa Física
                        </button>
                        <button
                            type="button"
                            onClick={() => setAccountType('company')}
                            className={`flex-1 relative z-10 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2
                            ${accountType === 'company' ? 'text-bg-dark' : 'text-gray-500 hover:text-gray-700'}
                            `}
                        >
                            <span className="text-lg">🏢</span> Empresa
                        </button>

                        {/* Hidden Input for Server Action */}
                        <input type="hidden" name="account_type" value={accountType} />
                    </div>
                </div>

                {/* Username */}
                <div>
                    <label className={labelClass} htmlFor="username">Nome</label>
                    <div className="relative">
                        <User className={iconClass} size={18} />
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            minLength={3}
                            maxLength={60}
                            defaultValue={state.values?.username}
                            className={inputClass}
                            placeholder="Ex: João Silva"
                        />
                    </div>
                </div>

                {/* Email & Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass} htmlFor="email">E-mail</label>
                        <div className="relative">
                            <Envelope className={iconClass} size={18} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                defaultValue={state.values?.email}
                                className={inputClass}
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="confirm_email">Confirmar E-mail</label>
                        <div className="relative">
                            <Envelope className={iconClass} size={18} />
                            <input
                                id="confirm_email"
                                name="confirm_email"
                                type="email"
                                required
                                className={inputClass}
                                placeholder="Confirme o e-mail"
                            />
                        </div>
                    </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass} htmlFor="password">Senha</label>
                        <div className="relative">
                            <Lock className={iconClass} size={18} />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                className={inputClass}
                                placeholder="Mín. 8 caracteres"
                            />
                        </div>
                        <p className="text-[11px] text-text-muted mt-1">Use letras e números.</p>
                    </div>
                    <div>
                        <label className={labelClass} htmlFor="confirm_password">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className={iconClass} size={18} />
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                required
                                className={inputClass}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={pending}
                    className="w-full p-4 bg-brand-primary text-bg-dark font-bold text-sm rounded-lg cursor-pointer transition-colors hover:bg-brand-primaryHover flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {pending ? 'Cadastrando...' : <>Criar conta <ArrowRight weight="bold" /></>}
                </button>
            </form>

            <div className="text-center mt-6 text-sm text-text-muted">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-[#0284C7] font-semibold hover:underline">
                    Faça login
                </Link>
            </div>
        </AuthShell>
    )
}
