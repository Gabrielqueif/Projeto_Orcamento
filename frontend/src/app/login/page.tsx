import { login } from '@/app/auth/actions'
import Link from 'next/link'
import { Buildings, Envelope, Lock, ArrowRight } from '@phosphor-icons/react/dist/ssr'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const params = await searchParams;
    return (
        <div className="flex min-h-screen items-center justify-center bg-bg-dark overflow-hidden relative">
            {/* Background Pattern */}
            <div 
              className="absolute w-full h-full z-0" 
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            ></div>

            <div className="bg-white rounded-xl p-12 w-full max-w-[420px] relative z-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-center gap-3 text-[32px] font-bold text-bg-dark mb-2">
                    <Buildings weight="fill" className="text-brand-primary" />
                    GP<span className="text-brand-primary">Obras</span>
                </div>
                <div className="text-center text-[13px] text-text-muted mb-8">
                    Painel de Gerenciamento Construtivo
                </div>

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
                            E-mail ou Usuário
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

                    <div className="flex justify-between items-center text-xs font-semibold">
                        <label className="flex items-center gap-2 cursor-pointer text-text-main">
                            <input type="checkbox" defaultChecked className="accent-brand-primary w-4 h-4 rounded border-border" />
                            Lembrar-me
                        </label>
                        <Link href="#" className="text-[#0284C7] no-underline hover:underline">
                            Esqueceu a senha?
                        </Link>
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
            </div>
        </div>
    )
}
