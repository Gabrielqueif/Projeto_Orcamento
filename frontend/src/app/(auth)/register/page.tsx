'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    account_type: accountType,
                    username: username,
                },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Depending on Supabase settings, auto sign-in might happen or email verification needed.
            // Assuming auto sign-in or informing user to check email.
            alert('Cadastro realizado com sucesso! Verifique seu email se necessário.');
            router.push('/login');
        }
    };

    return (
        <div className="flex flex-1 w-full items-center justify-center bg-gray-50 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Cadastro</CardTitle>
                    <CardDescription className="text-center">
                        Crie sua conta para começar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Account Type Selector */}
                        <div className="space-y-2">
                            <Label>Tipo de Conta</Label>
                            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-md">
                                <button
                                    type="button"
                                    onClick={() => setAccountType('individual')}
                                    className={`py-2 px-4 rounded text-sm font-medium transition-all ${accountType === 'individual'
                                        ? 'bg-white text-[#1F5F7A] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Pessoa Física
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAccountType('company')}
                                    className={`py-2 px-4 rounded text-sm font-medium transition-all ${accountType === 'company'
                                        ? 'bg-white text-[#1F5F7A] shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Empresa
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Nome de Usuário</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Seu nome"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-600">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Entrar
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
