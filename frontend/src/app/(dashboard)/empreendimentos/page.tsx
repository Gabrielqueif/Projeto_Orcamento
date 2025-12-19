export default function EmpreendimentosPage() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Meus Empreendimentos</h1>
        <button className="bg-[#1F5F7A] text-white px-4 py-2 rounded hover:bg-[#164e63] transition flex items-center gap-2">
          <span>+</span> Novo Empreendimento
        </button>
      </div>

      {/* Área Principal (Placeholder) */}
      <div className="bg-white p-6 rounded-lg shadow min-h-[500px]">
        
        {/* Filtros Fictícios */}
        <div className="flex gap-4 mb-6 border-b pb-4">
          <span className="text-blue-600 font-semibold border-b-2 border-blue-600 cursor-pointer">Em Andamento</span>
          <span className="text-gray-500 cursor-pointer hover:text-gray-700">Concluídos</span>
          <span className="text-gray-500 cursor-pointer hover:text-gray-700">Arquivados</span>
        </div>

        {/* Grid de Cards Vazios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-slate-50">
              <div className="h-32 bg-slate-200 rounded mb-4 flex items-center justify-center text-slate-400">
                Imagem do Projeto
              </div>
              <h3 className="font-bold text-slate-700">Nome do Empreendimento {item}</h3>
              <p className="text-sm text-slate-500 mt-1">Localização: SP</p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#26A69A] h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-right mt-1 text-slate-500">45% concluído</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}