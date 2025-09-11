// src/app/api/sinapi/composicao/[codigo]/route.ts
import { NextResponse } from 'next/server';
import { mockAnalitico } from '@/lib/sinapi-mock-data';

interface IParams {
    params: {
        codigo: string;
    }
}

export async function GET(request: Request, { params }: IParams) {
    const { codigo } = params;

    // O Next.js decodifica o %2F para /, então re-codificamos para buscar
    const formattedCodigo = decodeURIComponent(codigo);

    const composicao = mockAnalitico.find(c => c.codigo === formattedCodigo);

    await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay de uma busca mais complexa

    if (!composicao) {
        return NextResponse.json({ error: 'Composição não encontrada' }, { status: 404 });
    }

    return NextResponse.json(composicao);
}