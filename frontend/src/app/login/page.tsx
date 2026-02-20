
import { login } from '@/app/auth/actions'
import Link from 'next/link'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    const params = await searchParams;
    return (
        <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-[#1F5F7A] mb-2 text-center">GPObras</h1>
                <p className="text-gray-500 text-center mb-6">Entre com suas credenciais</p>

                {params?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center text-sm">
                        {params.message}
                    </div>
                )}

                {params?.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center text-sm">
                        {params.error}
                    </div>
                )}

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1F5F7A]/50"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Senha</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1F5F7A]/50"
                            placeholder="********"
                        />
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                        <button
                            formAction={login}
                            className="w-full bg-[#1F5F7A] text-white py-2 rounded font-medium hover:bg-[#164e63] transition-colors"
                        >
                            Entrar
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <span className="text-sm text-gray-600">Não tem uma conta? </span>
                        <Link href="/signup" className="text-sm text-[#1F5F7A] hover:underline font-medium">
                            Cadastre-se
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
