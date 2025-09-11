// src/components/features/OrcamentoHeader.tsx
'use client';

import { IOrcamento } from "@/types/sinapi";

// Definimos quais dados do orçamento o Header precisa e qual função ele pode chamar
type OrcamentoHeaderProps = {
    data: Pick<IOrcamento, 'tituloObra' | 'cliente' | 'local' | 'data' | 'bdiPercentual' | 'encargosSociaisPercentual'>;
    onUpdate: (field: keyof IOrcamento, value: string | number) => void;
}

export function OrcamentoHeader({ data, onUpdate }: OrcamentoHeaderProps) {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
        onUpdate(name as keyof IOrcamento, finalValue);
    };

    return (
        <div className="p-6 border rounded-lg bg-white shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <h2 className="md:col-span-2 text-lg font-semibold text-gray-800 border-b pb-2">Informações do Projeto</h2>

            <div>
                <label htmlFor="tituloObra" className="block text-sm font-medium text-gray-700">Título da Obra</label>
                <input
                    type="text"
                    id="tituloObra"
                    name="tituloObra"
                    value={data.tituloObra}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">Cliente</label>
                <input
                    type="text"
                    id="cliente"
                    name="cliente"
                    value={data.cliente}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label htmlFor="local" className="block text-sm font-medium text-gray-700">Local</label>
                <input
                    type="text"
                    id="local"
                    name="local"
                    value={data.local}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label htmlFor="data" className="block text-sm font-medium text-gray-700">Data</label>
                <input
                    type="date"
                    id="data"
                    name="data"
                    value={data.data}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <h2 className="md:col-span-2 text-lg font-semibold text-gray-800 border-b pb-2 mt-4">Taxas e Encargos</h2>

            <div>
                <label htmlFor="bdiPercentual" className="block text-sm font-medium text-gray-700">BDI (%)</label>
                <input
                    type="number"
                    id="bdiPercentual"
                    name="bdiPercentual"
                    value={data.bdiPercentual}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label htmlFor="encargosSociaisPercentual" className="block text-sm font-medium text-gray-700">Encargos Sociais (%)</label>
                <input
                    type="number"
                    id="encargosSociaisPercentual"
                    name="encargosSociaisPercentual"
                    value={data.encargosSociaisPercentual}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>
    );
}