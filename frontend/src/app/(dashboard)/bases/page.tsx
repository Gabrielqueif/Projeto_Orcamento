// 1. Importamos o componente que criamos acima
import DatabaseCard from '@/components/bases/databaseCard';

export default function BasesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className='flex justify-between items-center gap-4'>
        <h1 className="text-2xl font-bold text-slate-800">Bases de Dados</h1>

        {/* futuramente colocaremos um botão para adicionar novas bases de dados que os clientes possam estar utilizando */}
        {/* <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">Adicionar Nova Base de Dados</button> */}
      </div>
      {/* Card Azul de Fundo (Estilo do Figma) */}
      <div className="bg-brand-navy p-6 md:p-8 rounded-xl shadow-lg h-auto min-h-[400px]">
        {/* 2. Aqui renderizamos o componente DatabaseCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DatabaseCard
            title='Base de dados SINAPI'
            description='Acesse os dados oficiais do SINAPI (Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil).'
            id='sinapi'
          />
        </div>
      </div>
    </div>
  );
}
