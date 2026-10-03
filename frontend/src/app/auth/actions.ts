'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-casting here for convenience
    // In a production application, you should validate the inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect(`/login?error=${encodeURIComponent('E-mail ou senha inválidos.')}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export type SignupState = {
    error?: string
    // Devolvidos junto com o erro porque o React limpa o formulário após a action.
    values?: { username: string; email: string; accountType: string }
}

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/
const ACCOUNT_TYPES = ['individual', 'company']
const PASSWORD_MIN_LENGTH = 8
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateSignup(formData: FormData): { error: string } | {
    email: string
    password: string
    username: string
    accountType: string
} {
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const confirmEmail = String(formData.get('confirm_email') ?? '').trim().toLowerCase()
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirm_password') ?? '')
    const username = String(formData.get('username') ?? '').trim()
    const accountType = String(formData.get('account_type') ?? '')

    if (!email || !confirmEmail || !password || !confirmPassword || !username || !accountType) {
        return { error: 'Preencha todos os campos.' }
    }
    if (!ACCOUNT_TYPES.includes(accountType)) {
        return { error: 'Tipo de conta inválido.' }
    }
    if (!USERNAME_REGEX.test(username)) {
        return { error: 'O nome de usuário deve ter de 3 a 30 caracteres, usando apenas letras, números, ponto, hífen ou sublinhado.' }
    }
    if (!EMAIL_REGEX.test(email)) {
        return { error: 'Informe um e-mail válido.' }
    }
    if (email !== confirmEmail) {
        return { error: 'Os e-mails não coincidem.' }
    }
    if (password.length < PASSWORD_MIN_LENGTH || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
        return { error: `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.` }
    }
    if (password !== confirmPassword) {
        return { error: 'As senhas não coincidem.' }
    }

    return { email, password, username, accountType }
}

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
    const parsed = validateSignup(formData)
    if ('error' in parsed) {
        const accountType = String(formData.get('account_type') ?? 'individual')
        return {
            error: parsed.error,
            values: {
                username: String(formData.get('username') ?? '').trim(),
                email: String(formData.get('email') ?? '').trim(),
                accountType: ACCOUNT_TYPES.includes(accountType) ? accountType : 'individual',
            },
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
            data: {
                username: parsed.username,
                account_type: parsed.accountType,
            }
        }
    })

    if (error) {
        console.error('Signup Error:', error)
        return {
            error: 'Não foi possível criar a conta. Verifique os dados e tente novamente.',
            values: { username: parsed.username, email: parsed.email, accountType: parsed.accountType },
        }
    }

    revalidatePath('/', 'layout')

    // Com a confirmação de e-mail desativada o Supabase já devolve a sessão.
    if (data.session) {
        redirect('/')
    }
    redirect(`/login?message=${encodeURIComponent('Conta criada. Faça login para continuar.')}`)
}

export async function logout() {
    const supabase = await createClient()

    // Sign out on the server - this clears the cookies securely
    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('Logout error:', error)
    }

    revalidatePath('/', 'layout')
    redirect('/login')
}
