import { SinapiSearch } from "@/components/SinapiSearch";
// import { OrseSearch } from "@/components/OrseSearch"; // Exemplo de outro componente

const baseConfigs = {
  sinapi: {
    title: "Pesquisa Detalhada por composição (SINAPI)",
    description: "Consulte preços de composições por estado (SINAPI)",
    SearchComponent: SinapiSearch,
  },
  
  // Adicione outras bases aqui
};

export default function PesquisaBasePage({ params }: { params: { id: string } }) {
  const config = baseConfigs.sinapi; 

  const SearchComponent = config.SearchComponent;

  return (
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-slate-700">{config.title}</h2>
        <p className="text-sm text-slate-500">{config.description}</p>
      </div>
      <SearchComponent />
    </div>
  );
}