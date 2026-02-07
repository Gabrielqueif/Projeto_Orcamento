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
        redirect('/login?error=Invalid credentials')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const confirmEmail = formData.get('confirm_email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string
    const username = formData.get('username') as string
    const accountType = formData.get('account_type') as string

    // Basic Validation
    if (email !== confirmEmail) {
        redirect('/signup?error=Os emails não coincidem')
    }
    if (password !== confirmPassword) {
        redirect('/signup?error=As senhas não coincidem')
    }
    if (!username || !accountType) {
        redirect('/signup?error=Preencha todos os campos')
    }

    const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                account_type: accountType,
                role: 'user',
            }
        }
    })

    console.log('Signup Attempt:', { email, username, accountType });
    if (error) {
        console.error('Signup Error:', error);
        redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }
    // console.log('Signup Success:', authData); // Clean up logs

    revalidatePath('/', 'layout')
    redirect('/login?message=Cadastro realizado com sucesso! Verifique seu email para confirmar.')
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
