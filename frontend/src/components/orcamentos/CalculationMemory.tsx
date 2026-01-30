import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

export interface MemoryRow {
    id: string;
    description: string;
    expression: string;
    result: number;
}

interface CalculationMemoryProps {
    initialRows?: MemoryRow[];
    onChange: (total: number, rows: MemoryRow[]) => void;
}

export function CalculationMemory({ initialRows = [], onChange }: CalculationMemoryProps) {
    const [rows, setRows] = useState<MemoryRow[]>(
        initialRows.length > 0 ? initialRows : []
    );

    // Function to evaluate expression safely
    const evaluateExpression = (expr: string): number => {
        try {
            // Validate characters: allowed digits, operators, parens, dot, comma, space
            if (/[^0-9+\-*/().,\s]/.test(expr)) {
                return 0;
            }

            const sanitized = expr.replace(/,/g, '.');
            // eslint-disable-next-line no-new-func
            const result = new Function(`return ${sanitized}`)();

            return (isFinite(result) && !isNaN(result)) ? Number(result) : 0;
        } catch {
            return 0;
        }
    };

    const addRow = () => {
        const newRow: MemoryRow = {
            id: Date.now().toString(),
            description: '',
            expression: '',
            result: 0
        };
        setRows([...rows, newRow]);
    };

    const removeRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: keyof MemoryRow, value: string) => {
        setRows(rows.map(row => {
            if (row.id === id) {
                const updatedRow = { ...row, [field]: value };

                if (field === 'expression') {
                    updatedRow.result = evaluateExpression(value);
                }

                return updatedRow;
            }
            return row;
        }));
    };

    // Calculate total whenever rows change
    useEffect(() => {
        const total = rows.reduce((acc, row) => acc + row.result, 0);
        // Round to 2 decimal places for the total
        const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100;
        onChange(roundedTotal, rows);
    }, [rows, onChange]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-700">Memória de Cálculo</h4>
                <button
                    type="button"
                    onClick={addRow}
                    className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Adicionar Linha
                </button>
            </div>

            <div className="border rounded-md overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-12 bg-slate-50 border-b p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-5 px-2">Descrição</div>
                    <div className="col-span-4 px-2">Expressão / Medidas</div>
                    <div className="col-span-2 px-2 text-right">Resultado</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {rows.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            Nenhuma linha adicionada. <br />
                            Clique em "Adicionar Linha" para iniciar a memória de cálculo.
                        </div>
                    )}

                    {rows.map((row) => (
                        <div key={row.id} className="grid grid-cols-12 p-2 items-center gap-2 hover:bg-slate-50 transition-colors">
                            <div className="col-span-5">
                                <input
                                    type="text"
                                    placeholder="Ex: Parede Sala"
                                    value={row.description}
                                    onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded border px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-4">
                                <input
                                    type="text"
                                    placeholder="Ex: 3.0 * 2.8"
                                    value={row.expression}
                                    onChange={(e) => updateRow(row.id, 'expression', e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded border px-2 py-1 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2 text-right">
                                <span className={`text-sm font-medium ${row.result < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                    {(row.result || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    type="button"
                                    onClick={() => removeRow(row.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title="Remover linha"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {rows.length > 0 && (
                    <div className="bg-slate-50 p-3 border-t flex justify-between items-center">
                        <span className="font-semibold text-slate-600 text-sm">Total Calculado:</span>
                        <span className="font-bold text-lg text-blue-700">
                            {rows.reduce((acc, r) => acc + (r.result || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
