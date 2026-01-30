'use client';

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getItens, getEtapas, type OrcamentoItem, type Etapa } from "@/lib/api/orcamentos";

interface BudgetAnalyticsProps {
    orcamentoId: string;
    refreshTrigger?: number;
}

interface ChartData {
    name: string;
    total: number;
}

export function BudgetAnalytics({ orcamentoId, refreshTrigger }: BudgetAnalyticsProps) {
    const [data, setData] = React.useState<ChartData[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [intesRes, etapasRes] = await Promise.all([
                    getItens(orcamentoId),
                    getEtapas(orcamentoId)
                ]);

                // Map Etapas to calculate totals
                const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

                const chartData: ChartData[] = etapasRes.map(etapa => {
                    const totalEtapa = intesRes
                        .filter(item => item.etapa_id === etapa.id)
                        .reduce((acc, curr) => acc + (curr.preco_total || 0), 0);

                    return {
                        name: etapa.nome,
                        total: totalEtapa
                    };
                });

                // Add items without stage
                const totalSemEtapa = intesRes
                    .filter(item => !item.etapa_id)
                    .reduce((acc, curr) => acc + (curr.preco_total || 0), 0);

                if (totalSemEtapa > 0) {
                    chartData.push({ name: 'Outros', total: totalSemEtapa });
                }

                // Filter out zero values if desired, or keep to show empty stages
                // Keeping only > 0 for cleaner chart
                const filteredData = chartData.filter(d => d.total > 0);

                setData(filteredData);
            } catch (error) {
                console.error("Erro ao carregar dados do gráfico", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orcamentoId, refreshTrigger]);

    if (loading) return <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />;

    if (data.length === 0) return null;

    const totalGeral = data.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Distribuição de Custos</h3>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(val) => `R$${val / 1000}k`} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip
                            formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.map((d, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">{d.name}</p>
                        <p className="text-sm font-bold text-slate-800">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.total)}
                        </p>
                        <p className="text-xs text-slate-400">
                            {((d.total / totalGeral) * 100).toFixed(1)}%
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
