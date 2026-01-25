'use client';

import { useState, useEffect } from "react";
import { createEtapa, getEtapas, deleteEtapa, type Etapa } from "@/lib/api/orcamentos";

interface EtapasManagerProps {
    orcamentoId: string;
    onEtapasChange?: () => void;
}

export function EtapasManager({ orcamentoId, onEtapasChange }: EtapasManagerProps) {
    const [etapas, setEtapas] = useState<Etapa[]>([]);
    const [novaEtapa, setNovaEtapa] = useState("");
    const [loading, setLoading] = useState(false);

    const carregarEtapas = async () => {
        try {
            const data = await getEtapas(orcamentoId);
            setEtapas(data);
        } catch (error) {
            console.error("Erro ao carregar etapas:", error);
        }
    };

    useEffect(() => {
        carregarEtapas();
    }, [orcamentoId]);

    const handleAddEtapa = async () => {
        if (!novaEtapa.trim()) return;
        setLoading(true);
        try {
            await createEtapa(orcamentoId, { nome: novaEtapa, ordem: etapas.length + 1 });
            setNovaEtapa("");
            await carregarEtapas();
            if (onEtapasChange) onEtapasChange();
        } catch (error) {
            console.error(error);
            alert("Erro ao criar etapa");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEtapa = async (id: string) => {
        if (!confirm("Tem certeza? Itens nesta etapa perderão a referência.")) return;
        try {
            await deleteEtapa(orcamentoId, id);
            await carregarEtapas();
            if (onEtapasChange) onEtapasChange();
        } catch (error) {
            console.error(error);
            alert("Erro ao remover etapa");
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Gerenciar Etapas</h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={novaEtapa}
                    onChange={(e) => setNovaEtapa(e.target.value)}
                    placeholder="Nome da nova etapa (ex: Fundação)"
                    className="flex-1 border border-gray-300 rounded p-2 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEtapa()}
                />
                <button
                    onClick={handleAddEtapa}
                    disabled={loading || !novaEtapa.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
                >
                    {loading ? "..." : "+ Adicionar"}
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {etapas.length === 0 && <p className="text-sm text-slate-500 italic">Nenhuma etapa definida.</p>}
                {etapas.map((etapa) => (
                    <div key={etapa.id} className="bg-slate-100 border border-slate-200 rounded px-3 py-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{etapa.nome}</span>
                        <button
                            onClick={() => handleDeleteEtapa(etapa.id)}
                            className="text-gray-400 hover:text-red-500 text-xs font-bold"
                            title="Remover etapa"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
