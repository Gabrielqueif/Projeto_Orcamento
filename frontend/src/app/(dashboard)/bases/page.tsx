// 1. Importamos o componente que criamos acima
import  DatabaseCard  from '@/components/databaseCard';

export default function BasesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className='flex justify-between items-center gap-4'>
      <h1 className="text-2xl font-bold text-slate-800">Bases de Dados</h1>

      {/* futuramente colocaremos um botão para adicionar novas bases de dados que os clientes possam estar utilizando */}
      {/* <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">Adicionar Nova Base de Dados</button> */}
      </div>
      {/* Card Azul de Fundo (Estilo do Figma) */}
      <div className="bg-[#1F5F7A] p-8 rounded-xl shadow-lg h-[400px]">
        {/* 2. Aqui renderizamos o componente DatabaseCard */}
        <DatabaseCard 
        title='base de dados sinapi' 
        description='Descrição da base de dados sinapi'
        id='sinapi'
        />
      </div>
    </div>
  );
}

      
