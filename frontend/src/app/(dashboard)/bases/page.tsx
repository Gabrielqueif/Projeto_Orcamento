// 1. Importamos o componente que criamos acima
import { SinapiSearch } from '@/components/SinapiSearch';

export default function BasesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Bases de Dados</h1>

      {/* Card Azul de Fundo (Estilo do Figma) */}
      <div className="bg-[#1F5F7A] p-8 rounded-xl shadow-lg min-h-[600px]">
        
        <div className="bg-white rounded-lg p-6 shadow-xl">
           <div className="mb-6 border-b pb-4">
             <h2 className="text-xl font-bold text-slate-700">Pesquisa SINAPI</h2>
             <p className="text-sm text-slate-500">Consulte preços de composições por estado</p>
           </div>
           
           {/* 2. Aqui renderizamos a busca */}
           <SinapiSearch /> 
        </div>

      </div>
    </div>
  );
}