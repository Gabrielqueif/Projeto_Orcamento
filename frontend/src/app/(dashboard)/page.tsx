export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Olá GPObras</h1>

      {/* Container Azulão Principal */}
      <div className="bg-[#1F5F7A] p-6 rounded-lg shadow-lg min-h-[500px] flex flex-col gap-6">
        
        {/* Seção 1: Empreendimentos Favoritos */}
        <div>
          <div className="flex justify-between items-center text-white mb-4">
            <h2 className="text-xl font-semibold">Empreendimentos favoritos:</h2>
            <span className="text-xs underline cursor-pointer hover:text-gray-200">Ver Tudo</span>
          </div>
          
          {/* Grid de Cards Brancos (Placeholders) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white h-32 rounded shadow-sm hover:bg-gray-50 transition cursor-pointer">
                {/* Conteúdo do card vazio por enquanto */}
              </div>
            ))}
          </div>
        </div>

        {/* Seção 2: Parte de baixo (Dados e Bases) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-auto">
          
          {/* Card Esquerdo: Dados Empresa */}
          <div className="border border-white/30 rounded p-4 text-white h-48">
            <h3 className="font-semibold text-lg mb-2">Dados empresa e Logo:</h3>
            <div className="flex items-center justify-center h-full pb-8 text-white/50">
              Placeholder Info Empresa
            </div>
          </div>

          {/* Card Direito: Bases Disponíveis (Tabela simples) */}
          <div className="border border-white/30 rounded p-4 text-white h-48">
            <h3 className="font-semibold text-lg mb-2">Bases disponíveis:</h3>
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="bg-white/20">
                  <th className="p-2 rounded-tl"></th>
                  <th className="p-2">Mais Recente</th>
                  <th className="p-2 rounded-tr">Mais antigo</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-800 font-medium">
                <tr className="border-b border-gray-200">
                  <td className="p-2 font-bold text-slate-600">Sinapi</td>
                  <td>06/2025</td>
                  <td>01/2020</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-600">Seinfra</td>
                  <td>05/2025</td>
                  <td>01/2019</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}