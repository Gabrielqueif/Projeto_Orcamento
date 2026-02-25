'use client';

import * as React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, ChevronRight, ChevronDown, FolderPlus } from 'lucide-react';
import { type Etapa, updateEtapa, deleteEtapa, createEtapa, getEtapas } from '@/lib/api/orcamentos';

interface EtapasManagerProps {
    orcamentoId: string;
    onEtapasChange?: () => void;
}

export function EtapasManager({ orcamentoId, onEtapasChange }: EtapasManagerProps) {
    const [etapas, setEtapas] = React.useState<Etapa[]>([]);
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const carregarEtapas = async () => {
        try {
            const data = await getEtapas(orcamentoId);
            setEtapas(data);
        } catch (error) {
            console.error("Erro ao carregar etapas:", error);
        }
    };

    React.useEffect(() => {
        carregarEtapas();
    }, [orcamentoId]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = etapas.findIndex((item) => item.id === active.id);
            const newIndex = etapas.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(etapas, oldIndex, newIndex);
            setEtapas(newItems);

            try {
                setLoading(true);
                // Persist new order
                await Promise.all(
                    newItems.map((item, index) =>
                        updateEtapa(orcamentoId, item.id, { ordem: index })
                    )
                );
                if (onEtapasChange) onEtapasChange();
            } catch (error) {
                console.error('Erro ao salvar ordem:', error);
                alert("Erro ao salvar ordem das etapas");
                carregarEtapas(); // Revert on failure
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddEtapa = async (parentId: string | null = null) => {
        const nome = window.prompt(parentId ? 'Nome da sub-etapa:' : 'Nome da nova etapa raiz:');
        if (!nome?.trim()) return;

        setLoading(true);
        try {
            await createEtapa(orcamentoId, {
                nome,
                ordem: etapas.length,
                parent_id: parentId
            });
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
        setLoading(true);
        try {
            await deleteEtapa(orcamentoId, id);
            await carregarEtapas();
            if (onEtapasChange) onEtapasChange();
        } catch (error) {
            console.error(error);
            alert("Erro ao remover etapa");
        } finally {
            setLoading(false);
        }
    };

    const rootItems = etapas.filter(item => !item.parent_id);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Estrutura de Etapas</h3>
                    <p className="text-sm text-slate-500">Arraste para reordenar ou aninhe etapas</p>
                </div>
                <button
                    onClick={() => handleAddEtapa(null)}
                    disabled={loading}
                    className="flex items-center gap-2 bg-brand-primary hover:bg-brand-navy text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    <Plus size={18} /> Nova Etapa Raiz
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={etapas.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {rootItems.length === 0 && !loading && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                <p className="text-sm text-slate-400 italic">Nenhuma etapa definida. Comece criando uma etapa raiz.</p>
                            </div>
                        )}
                        {rootItems.map((etapa) => (
                            <SortableEtapaItem
                                key={etapa.id}
                                etapa={etapa}
                                allEtapas={etapas}
                                onDelete={handleDeleteEtapa}
                                onAddSub={handleAddEtapa}
                                loading={loading}
                            />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-brand-primary flex items-center gap-3">
                            <GripVertical className="text-slate-400" size={20} />
                            <span className="font-bold text-slate-700">
                                {etapas.find(i => i.id === activeId)?.nome}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

interface SortableEtapaItemProps {
    etapa: Etapa;
    allEtapas: Etapa[];
    onDelete: (id: string) => void;
    onAddSub: (parentId: string) => void;
    loading: boolean;
}

function SortableEtapaItem({ etapa, allEtapas, onDelete, onAddSub, loading }: SortableEtapaItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: etapa.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const children = allEtapas.filter(item => item.parent_id === etapa.id);
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-50' : ''}`}>
            <div className="group flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 hover:border-brand-primary hover:shadow-md transition-all">
                <div className="flex items-center gap-3 flex-1">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-brand-primary transition-colors"
                    >
                        <GripVertical size={20} />
                    </button>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-1 hover:bg-slate-100 rounded transition-colors ${children.length === 0 ? 'invisible' : ''}`}
                    >
                        {isExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                    </button>

                    <span className="font-bold text-slate-700">{etapa.nome}</span>

                    {children.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {children.length} {children.length === 1 ? 'sub-etapa' : 'sub-etapas'}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onAddSub(etapa.id)}
                        disabled={loading}
                        className="p-2 text-brand-primary hover:bg-brand-primary/5 rounded-md transition-colors"
                        title="Adicionar Sub-etapa"
                    >
                        <FolderPlus size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(etapa.id)}
                        disabled={loading}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir Etapa"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {isExpanded && children.length > 0 && (
                <div className="ml-9 mt-2 space-y-3 border-l-2 border-slate-100 pl-4 py-1">
                    {children.map(child => (
                        <SortableEtapaItem
                            key={child.id}
                            etapa={child}
                            allEtapas={allEtapas}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                            loading={loading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
