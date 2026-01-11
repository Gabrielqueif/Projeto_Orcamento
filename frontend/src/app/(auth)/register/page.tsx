import Link from 'next/link'
import { Button } from "@/components/button"

export default function RegisterPage() {
  return (
    // Fundo Escuro cobrindo a tela toda
    <div className="min-h-screen bg-[#1F1F1F] flex items-center justify-center p-4">
      {/* Card Centralizado (Parte Branca + Parte Logo) */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Lado Esquerdo: Formulário */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gray-50">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Cadastre-se</h2>

          <form className="space-y-5" action="/api/auth/register" method="post">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input name="email" type="email" required className="w-full p-3 rounded border border-gray-300 focus:border-blue-500 outline-none transition" placeholder="seu@email.com" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Email</label>
              <input name="confirmEmail" type="email" required className="w-full p-3 rounded border border-gray-300 focus:border-blue-500 outline-none transition" placeholder="Repita seu email" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
              <input name="password" type="password" required className="w-full p-3 rounded border border-gray-300 focus:border-blue-500 outline-none transition" placeholder="••••••••" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Senha</label>
              <input name="confirmPassword" type="password" required className="w-full p-3 rounded border border-gray-300 focus:border-blue-500 outline-none transition" placeholder="••••••••" />
            </div>

            <Button variant={"default"} type="submit">Register</Button>

            <button type="button" className="w-full bg-white border border-gray-300 text-gray-600 font-semibold py-3 rounded flex items-center justify-center gap-2 hover:bg-gray-100 transition">
              <span>G</span> Cadastrar com Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Já tem uma conta? <Link href="/login" className="text-[#26A69A] font-bold hover:underline">Entrar</Link>
          </p>
        </div>

        {/* Lado Direito: Imagem Ilustrativa */}
        <div className="hidden md:flex w-1/2 bg-[#2D2D2D] items-center justify-center p-12 flex-col text-center relative">
          <img
            src="/register-illustration.png"
            alt="Ilustração de Cadastro"
            className="w-3/4 object-contain"
          />
        </div>

      </div>
    </div>
  )
}