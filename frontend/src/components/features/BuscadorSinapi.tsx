// src/components/features/BuscadorSinapi.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ISearchResult, IComposicaoAnalitica } from '@/types/sinapi';
import { useDebounce } from '@/hooks/useDebounce';
import { ComposicaoDetails} from "./ComposicaoDetails";


// Define as props que o componente espera receber da página pai.
// Neste caso, uma função para adicionar um item ao orçamento.
interface BuscadorSinapiProps {
    onAddItem: (item: ISearchResult) => void;
}

export function BuscadorSinapi({ onAddItem }: BuscadorSinapiProps) {
    // Estados para a funcionalidade de busca
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ISearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Estados para a funcionalidade de detalhes da composição
    const [selectedComposicao, setSelectedComposicao] = useState<IComposicaoAnalitica | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    // Hook customizado para evitar chamadas excessivas à API durante a digitação
    const debouncedQuery = useDebounce(query, 500);

    // Função para buscar a lista de resultados com base na query
    const fetchSearchResults = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/sinapi/search?q=${searchQuery}`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Falha ao buscar itens SINAPI:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Efeito que dispara a busca quando a query "debounced" muda
    useEffect(() => {
        fetchSearchResults(debouncedQuery);
    }, [debouncedQuery, fetchSearchResults]);

    // Função para buscar os detalhes analíticos de uma composição selecionada
    const handleSelectComposition = async (codigo: string) => {
        if (selectedComposicao?.codigo === codigo) {
            setSelectedComposicao(null);
            return;
        }

        setIsDetailsLoading(true);
        setSelectedComposicao(null);
        try {
            const response = await fetch(`/api/sinapi/composicao/${encodeURIComponent(codigo)}`);
            if (!response.ok) throw new Error('Composição não encontrada');

            const data: IComposicaoAnalitica = await response.json();
            setSelectedComposicao(data);
        } catch (error) {
            console.error("Falha ao buscar detalhes da composição:", error);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* SEÇÃO DE BUSCA */}
            <div className="flex flex-col gap-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Digite o código ou descrição do insumo/composição..."
                    className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />

                {isSearching && <p className="text-gray-500">Buscando...</p>}

                {results.length > 0 && (
                    <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                        {results.map((item) => (
                            <li
                                key={item.codigo}
                                className={`p-4 flex justify-between items-center ${item.tipo === 'COMPOSICAO' ? 'hover:bg-blue-50' : 'bg-gray-50'}`}
                            >
                                <div
                                    onClick={() => item.tipo === 'COMPOSICAO' && handleSelectComposition(item.codigo)}
                                    className={`flex-grow ${item.tipo === 'COMPOSICAO' ? 'cursor-pointer' : ''}`}
                                >
                                    <p className="font-semibold text-gray-800">{item.descricao}</p>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                                        <span>{item.tipo === 'COMPOSICAO' ? 'Composição' : 'Insumo'} - Cód: {item.codigo}</span>
                                        <span className="font-medium text-gray-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)} / {item.unidade}
                    </span>
                                    </div>
                                </div>

                                {/* BOTÃO PARA ADICIONAR ITEM AO ORÇAMENTO */}
                                <button
                                    onClick={() => onAddItem(item)}
                                    className="ml-4 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Adicionar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* SEÇÃO DE DETALHES DA COMPOSIÇÃO */}
            <div className="mt-4">
                {isDetailsLoading && <p className="text-center text-blue-600">Carregando detalhes da composição...</p>}

                {selectedComposicao && <ComposicaoDetails composicao={selectedComposicao} />}
            </div>
        </div>
    );
}