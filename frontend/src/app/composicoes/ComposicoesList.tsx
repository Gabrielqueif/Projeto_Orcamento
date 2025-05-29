import { getComposicoes } from '@/services/api';
import { memo, useEffect, useState } from 'react';

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

// Defina as props que este componente recebe
interface ComposicoesListProps {
  currentPage: number;
  search: string;
  onPageChange: (page: number) => void;
}

// Componente de item individual memoizado
const ComposicaoItem = memo(({ composicao }: { composicao: Composicao }) => (
  <div className="bg-white shadow rounded-lg p-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{composicao.descricao}</h3>
        <p className="text-sm text-gray-500">Grupo: {composicao.grupo}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium">Código Composição:</span> {composicao.codigo_composicao}
        </p>
        <p className="text-sm">
          <span className="font-medium">Tipo Item:</span> {composicao.tipo_item}
        </p>
        <p className="text-sm">
          <span className="font-medium">Código Item:</span> {composicao.codigo_item}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium">Unidade:</span> {composicao.unidade}
        </p>
        <p className="text-sm">
          <span className="font-medium">Coeficiente:</span> {composicao.coeficiente}
        </p>
      </div>
    </div>
  </div>
));

ComposicaoItem.displayName = 'ComposicaoItem';

// Componente de paginação memoizado
const Pagination = memo(({ 
  currentPage, 
  totalPages, 
  hasNext, 
  hasPrevious, 
  onPageChange 
}: { 
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}) => (
  <div className="mt-4 flex justify-between items-center">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={!hasPrevious}
      className="px-4 py-2 border rounded disabled:opacity-50"
    >
      Anterior
    </button>
    <span>
      Página {currentPage} de {totalPages}
    </span>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={!hasNext}
      className="px-4 py-2 border rounded disabled:opacity-50"
    >
      Próxima
    </button>
  </div>
));

Pagination.displayName = 'Pagination';

// Note que o componente é 'async'
export function ComposicoesList({ currentPage, search, onPageChange }: ComposicoesListProps) {
  const [data, setData] = useState<{
    results: Composicao[];
    count: number;
    next: string | null;
    previous: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getComposicoes(currentPage, search);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao carregar composições'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4 text-red-700" role="alert">
        <p>Ocorreu um erro:</p>
        <p className="font-semibold">{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const totalPages = Math.ceil(data.count / 10);

  return (
    <div>
      <div className="space-y-4">
        {data.results.map((composicao) => (
          <ComposicaoItem key={composicao.id} composicao={composicao} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={!!data.next}
        hasPrevious={!!data.previous}
        onPageChange={onPageChange}
      />
    </div>
  );
}