'use client';

import { useEffect, useState } from 'react';
import { getOrcamento, updateOrcamento, type Orcamento, type OrcamentoUpdate } from '@/lib/api/orcamentos';
import Link from 'next/link';
import { Input } from '../ui/input';
// If custom Input/Select components don't exist or aren't suitable, I'll use standard HTML elements with tailwind classes logic.
// Checking previous file list, `cards.tsx`, `input.tsx` exist.

interface SidebarOrcamentoInfoProps {
    orcamentoId: string;
}

const ESTADOS_BRASIL = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const OPCOES_STATUS = [
    { value: 'em_elaboracao', label: 'Em Elaboração' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'cancelado', label: 'Cancelado' },
];

export function SidebarOrcamentoInfo({ orcamentoId }: SidebarOrcamentoInfoProps) {
    const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
    const [loading, setLoading] = useState(true);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<OrcamentoUpdate>({});
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getOrcamento(orcamentoId);
            setOrcamento(data);
            // Initialize form data
            setFormData({
                nome: data.nome,
                cliente: data.cliente,
                estado: data.estado,
                base_referencia: data.base_referencia,
                status: data.status,
                data: data.data.split('T')[0] // Format for date input yyyy-MM-dd
            });
        } catch (error) {
            console.error('Erro ao carregar info do orçamento:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orcamentoId) {
            loadData();
        }
    }, [orcamentoId]);

    const handleSave = async () => {
        if (!orcamento) return;
        try {
            setSaving(true);
            const updated = await updateOrcamento(orcamento.id, formData);
            setOrcamento(updated);
            setIsEditing(false);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar alterações.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to current budget values
        if (orcamento) {
            setFormData({
                nome: orcamento.nome,
                cliente: orcamento.cliente,
                estado: orcamento.estado,
                base_referencia: orcamento.base_referencia,
                status: orcamento.status,
                data: orcamento.data.split('T')[0]
            });
        }
    };

    if (loading) {
        return <div className="p-4 text-white">Carregando informações...</div>;
    }

    if (!orcamento) {
        return <div className="p-4 text-white">Orçamento não encontrado.</div>;
    }

    return (
        <div className="flex flex-col h-full text-white bg-[#154255]">

            <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-start mb-4">
                    <Link
                        href="/orcamentos"
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        <span>←</span> Voltar
                    </Link>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition"
                        >
                            Editar
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2 py-1 rounded transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-200 px-2 py-1 rounded transition"
                            >
                                {saving ? '...' : 'Salvar'}
                            </button>
                        </div>
                    )}
                </div>

                {!isEditing ? (
                    <>
                        <h2 className="text-xl font-bold leading-tight mb-2 break-words">
                            {orcamento.nome}
                        </h2>
                        <p className="text-sm text-gray-300">{orcamento.cliente}</p>
                    </>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Nome</label>
                            <input
                                type="text"
                                value={formData.nome || ''}
                                onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Cliente</label>
                            <input
                                type="text"
                                value={formData.cliente || ''}
                                onChange={e => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/50"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                <div>
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Valor Total</label>
                    <div className="text-2xl font-bold text-green-400 mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orcamento.valor_total || 0)}
                    </div>
                </div>

                <div>
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">Status</label>
                    {!isEditing ? (
                        <div className="mt-1">
                            <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${orcamento.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                                    orcamento.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'}
                        `}>
                                {OPCOES_STATUS.find(s => s.value === orcamento.status)?.label || orcamento.status}
                            </span>
                        </div>
                    ) : (
                        <select
                            value={formData.status || 'em_elaboracao'}
                            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/50"
                        >
                            {OPCOES_STATUS.map(opt => (
                                <option key={opt.value} value={opt.value} className="text-black">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">Data</label>
                        {!isEditing ? (
                            <p className="text-sm mt-1">
                                {new Date(orcamento.data).toLocaleDateString('pt-BR')}
                            </p>
                        ) : (
                            <input
                                type="date"
                                value={formData.data ? String(formData.data).split('T')[0] : ''}
                                onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/50"
                            />
                        )}
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">Estado</label>
                        {!isEditing ? (
                            <p className="text-sm mt-1 uppercase">{orcamento.estado}</p>
                        ) : (
                            <select
                                value={formData.estado?.toUpperCase() || ''}
                                onChange={e => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/50"
                            >
                                {ESTADOS_BRASIL.map(uf => (
                                    <option key={uf} value={uf} className="text-black">{uf}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">Base</label>
                        {!isEditing ? (
                            <p className="text-sm mt-1">{orcamento.base_referencia}</p>
                        ) : (
                            <input
                                type="text"
                                value={formData.base_referencia || ''}
                                onChange={e => setFormData(prev => ({ ...prev, base_referencia: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/50"
                            />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
