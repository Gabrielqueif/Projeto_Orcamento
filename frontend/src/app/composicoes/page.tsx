'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
// Hooks
import { useDebounce } from '../hooks/useDebounce';
// Nossos componentes filhos
import { ComposicoesList } from './ComposicoesList';
import { ErrorBoundary } from 'react-error-boundary';

// Componente para o estado de Carregamento (Fallback do Suspense)
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Componente para o estado de Erro (Fallback do ErrorBoundary)
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="rounded-md bg-red-50 p-4 mb-4 text-red-700" role="alert">
      <p>Ocorreu um erro:</p>
      <p className="font-semibold">{error.message}</p>
    </div>
  );
}

export default function ComposicoesPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Atualiza o termo de busca quando os parâmetros da URL mudam
  useEffect(() => {
    const descricao = searchParams.get('descricao');
    if (descricao) {
      setSearchTerm(descricao);
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* --- CABEÇALHO --- */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Composições</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de composições disponíveis no sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/composicoes/buscar"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            Buscar Composições
          </Link>
        </div>
      </div>

      {/* --- CAMPO DE BUSCA --- */}
      <div className="mt-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Resetamos a página diretamente na interação do usuário
          }}
          className="block w-full px-0 py-2 text-gray-900 placeholder-gray-500 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-blue-500 sm:text-sm transition-colors duration-200"
          placeholder="Digite para buscar na descrição..."
        />
      </div>
      
      <div className="mt-8">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingSpinner />}>
            <ComposicoesList 
              currentPage={currentPage} 
              search={debouncedSearchTerm} 
              onPageChange={setCurrentPage} 
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}