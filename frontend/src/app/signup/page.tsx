'use client'

import { signup } from '@/app/auth/actions'
import Link from 'next/link'
import { useState } from 'react'

export default function SignupPage() {
    const [accountType, setAccountType] = useState('individual')

    return (
        <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-[#1F5F7A] mb-2 text-center">GPObras</h1>
                <p className="text-gray-500 text-center mb-6">Crie sua conta</p>

                <form className="space-y-4">
                    {/* Account Type - Sliding Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                        <div className="relative flex w-full p-1 bg-gray-100 rounded-lg h-12 mt-1">
                            {/* Sliding Pill */}
                            <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#1F5F7A] rounded-md transition-all duration-300 ease-out shadow-sm
                                ${accountType === 'individual' ? 'left-1' : 'left-[calc(50%+2px)]'}
                                `}
                            />

                            {/* Options */}
                            <button
                                type="button"
                                onClick={() => setAccountType('individual')}
                                className={`flex-1 relative z-10 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2
                                ${accountType === 'individual' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}
                                `}
                            >
                                <span className="text-lg">👤</span> Pessoa Física
                            </button>
                            <button
                                type="button"
                                onClick={() => setAccountType('company')}
                                className={`flex-1 relative z-10 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2
                                ${accountType === 'company' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Nome de Usuário</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1F5F7A]/50"
                            placeholder="Ex: joaosilva"
                        />
                    </div>

                    {/* Email & Confirm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirm_email">Confirmar Email</label>
                            <input
                                id="confirm_email"
                                name="confirm_email"
                                type="email"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1F5F7A]/50"
                                placeholder="Confirme o email"
                            />
                        </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirm_password">Confirmar Senha</label>
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1F5F7A]/50"
                                placeholder="********"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            formAction={signup}
                            className="w-full bg-[#1F5F7A] text-white py-2 rounded font-medium hover:bg-[#164e63] transition-colors"
                        >
                            Cadastrar
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <span className="text-sm text-gray-600">Já tem uma conta? </span>
                        <Link href="/login" className="text-sm text-[#1F5F7A] hover:underline font-medium">
                            Faça login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
