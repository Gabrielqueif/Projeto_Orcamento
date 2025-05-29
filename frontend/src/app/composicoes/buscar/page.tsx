'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Composicao {
  id: number;
  grupo: string;
  codigo_composicao: number;
  tipo_item: string;
  codigo_item: number;
  descricao: string;
  unidade: string;
  coeficiente: number;
}

export default function BuscarComposicaoPage() {
  const [codigo, setCodigo] = useState('');
  const [composicoes, setComposicoes] = useState<Composicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDesc, setSearchDesc] = useState('');

  const fetchComposicoes = async () => {
    try {
      setLoading(true);
      setError(null);

      let allResults: Composicao[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
        });

        if (searchDesc) {
          searchParams.append('codigo_composicao__icontains', searchDesc);
        }

        console.log(`Fetching page ${currentPage} with params:`, searchParams.toString());
        const response = await fetch(`http://localhost:8000/api/composicoes/?${searchParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar composições');
        }

        const data = await response.json();
        console.log(`API Response for page ${currentPage}:`, data);
        
        if (data.results && Array.isArray(data.results)) {
          allResults = [...allResults, ...data.results];
          hasMorePages = data.next !== null;
          currentPage++;
        } else {
          console.error('Formato de resposta inesperado:', data);
          break;
        }
      }

      setComposicoes(allResults);
      setTotalPages(Math.ceil(allResults.length / 10));
    } catch (err) {
      console.error('Erro ao buscar composições:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar composições');
      setComposicoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchComposicoes();
  };

  // Função para filtrar composições localmente (caso a API não suporte o filtro)
  const filteredComposicoes = composicoes.filter(composicao => 
    !searchDesc || 
    composicao.codigo_composicao.toString().includes(searchDesc)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Buscar Composição</h1>
          <p className="mt-2 text-sm text-gray-700">
            Digite o código da composição para ver seus itens.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
          <Link
            href="/composicoes"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <label htmlFor="search" className="sr-only">
                Código da Composição
              </label>
              <input
                type="text"
                name="search"
                id="search"
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
                className="block w-full px-0 py-2 text-gray-900 placeholder-gray-500 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 sm:text-sm transition-colors duration-200"
                placeholder="Digite o código da composição..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Buscar
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Grupo
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Código da Composição
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Código do Item
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Tipo
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Descrição
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Unidade
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Coeficiente
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredComposicoes.map((item) => (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {item.grupo}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.codigo_composicao}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.codigo_item}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.tipo_item}</td>
                          <td className="px-3 py-4 text-sm text-gray-500 max-w-md break-words">
                            {item.descricao}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.unidade}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.coeficiente}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 