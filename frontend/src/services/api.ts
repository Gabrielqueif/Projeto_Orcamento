import { cache } from 'react';
import { ITEMS_PER_PAGE } from '@/lib/constants';

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

// Cache para armazenar as últimas requisições
const requestCache = new Map<string, { data: ApiResponse; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

// Envolvemos a função de busca com 'cache'
export const getComposicoes = cache(async (page: number, search: string): Promise<ApiResponse> => {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    ...(search && { descricao__icontains: search }),
  });

  const cacheKey = `${page}-${search}`;
  const cachedData = requestCache.get(cacheKey);
  const now = Date.now();

  // Se temos dados em cache e eles ainda são válidos, retornamos eles
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${apiUrl}/api/composicoes/?${searchParams.toString()}`, {
      next: { revalidate: 30 }, // Revalidar a cada 30 segundos
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar composições');
    }

    const data = await response.json();
    
    // Armazenamos no cache
    requestCache.set(cacheKey, { data, timestamp: now });
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar composições:', error);
    throw error;
  }
});