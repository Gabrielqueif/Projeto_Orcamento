import Link from 'next/link';

export default function LoginPage() {
  return (
    // Fundo Escuro cobrindo a tela toda
    <div className="min-h-screen bg-[#1F1F1F] flex items-center justify-center p-4">
      
      {/* Card Centralizado (Parte Branca + Parte Logo) */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gray-50">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Login</h2>
          
          <form className="space-y-5" action="/api/auth/login" method="post">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input name="email" type="email" required className="w-full p-3 rounded border border-gray-300 focus:border-blue-500 outline-none transition" placeholder="seu@email.com" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Senha</label>
                <a href="#" className="text-xs text-blue-500 hover:underline">Esqueceu a senha?</a>
              </div>
              <input name="password" type="password" required className="w-full p-3 rounded border border-gray-300 focus:border-blue-500 outline-none transition" placeholder="••••••••" />
            </div>

            <button type="submit" className="w-full bg-[#26A69A] hover:bg-[#208f85] text-white font-bold py-3 rounded transition shadow-md mt-4">
              ENTRAR
            </button>
            
            <button type="button" className="w-full bg-white border border-gray-300 text-gray-600 font-semibold py-3 rounded flex items-center justify-center gap-2 hover:bg-gray-100 transition">
              <span>G</span> Entrar com Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Não tem uma conta? <Link href="/register" className="text-[#26A69A] font-bold hover:underline">Cadastre-se</Link>
          </p>
        </div>

        {/* Lado Direito: Imagem Ilustrativa */}
        <div className="hidden md:flex w-1/2 bg-[#2D2D2D] items-center justify-center p-12 flex-col text-center relative">
          <img
            src="/login-illustration.png"
            alt="Ilustração de Login"
            className="w-3/4 object-contain"
          />
        </div>

      </div>
    </div>
  );
}