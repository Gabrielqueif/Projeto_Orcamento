export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Sistema de Orçamentos para Engenheiros
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Uma solução moderna e eficiente para gerenciar seus Orçamentos
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Controle Total</h3>
              <p className="text-gray-600">Gerencie todos os seus insumos em um só lugar</p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Eficiência</h3>
              <p className="text-gray-600">Processos otimizados para maior produtividade</p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl mb-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatórios</h3>
              <p className="text-gray-600">Acompanhe métricas importantes do seu negócio</p>
            </div>
          </div>

          <div className="mt-12">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Começar Agora
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
