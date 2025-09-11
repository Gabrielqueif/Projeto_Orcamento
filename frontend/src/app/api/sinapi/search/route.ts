// src/app/api/sinapi/search/route.ts
import { NextResponse } from 'next/server';
import { mockSearchResults } from '@/lib/sinapi-mock-data';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    const filteredData = query
        ? mockSearchResults.filter(item => item.descricao.toLowerCase().includes(query))
        : mockSearchResults;

    await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay

    return NextResponse.json(filteredData);
}