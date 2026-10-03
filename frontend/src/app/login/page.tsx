import { login } from '@/app/auth/actions'
import Link from 'next/link'
import { Envelope, Lock, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import AuthShell from '@/components/auth/AuthShell'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const params = await searchParams;
    return (
        <AuthShell subtitle="Painel de Gerenciamento Construtivo">
                {params?.message && (
                    <div className="bg-status-success/20 border border-status-success text-[#4D7E05] px-4 py-3 rounded relative mb-4 text-center text-sm">
                        {params.message}
                    </div>
                )}

                {params?.error && (
                    <div className="bg-status-danger/20 border border-status-danger text-status-danger px-4 py-3 rounded relative mb-4 text-center text-sm">
                        {params.error}
                    </div>
                )}

                <form className="space-y-6">
                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase mb-2" htmlFor="email">
                            E-mail
                        </label>
                        <div className="relative">
                            <Envelope className="absolute left-4 top-4 text-text-muted" size={18} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full py-4 pr-4 pl-11 border border-border rounded-lg bg-[#F8FAFC] text-sm outline-none transition-colors focus:border-[#CBD5E1] focus:bg-white text-text-main"
                                placeholder="ricardo.silva@exemplo.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-text-muted uppercase mb-2" htmlFor="password">
                            Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 text-text-muted" size={18} />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full py-4 pr-4 pl-11 border border-border rounded-lg bg-[#F8FAFC] text-sm outline-none transition-colors focus:border-[#CBD5E1] focus:bg-white text-text-main"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center text-xs font-semibold">
                        <label className="flex items-center gap-2 cursor-pointer text-text-main">
                            <input type="checkbox" defaultChecked className="accent-brand-primary w-4 h-4 rounded border-border" />
                            Lembrar-me
                        </label>
                    </div>

                    <button
                        formAction={login}
                        className="w-full p-4 bg-brand-primary text-bg-dark font-bold text-sm rounded-lg cursor-pointer transition-colors hover:bg-brand-primaryHover flex items-center justify-center gap-2"
                    >
                        Entrar no Sistema <ArrowRight weight="bold" />
                    </button>
                </form>

                <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-center gap-4 text-text-muted text-[10px] uppercase font-bold tracking-widest before:content-[''] before:flex-1 before:h-[1px] before:bg-border after:content-[''] after:flex-1 after:h-[1px] after:bg-border">
                        Ou
                    </div>
                    <Link
                        href="/signup"
                        className="w-full p-4 border border-border text-text-main font-bold text-sm rounded-lg cursor-pointer transition-colors hover:bg-[#F8FAFC] flex items-center justify-center gap-2 no-underline"
                    >
                        Criar nova conta
                    </Link>
                </div>

                <div className="text-center text-[10px] text-text-muted uppercase mt-6 tracking-wide">
                    SYSTEM VERSION 2.4.1
                </div>
        </AuthShell>
    )
}
