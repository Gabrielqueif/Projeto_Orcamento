"use client";

import * as React from "react";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  DotsSixVertical,
  CaretRight,
  CaretDown,
  PencilSimple,
  Trash,
  Check,
} from "@phosphor-icons/react";
import type { Etapa } from "@/lib/api/orcamentos";

export const MAX_NIVEL_ETAPAS = 3;

interface EtapasEstruturaProps {
  etapas: Etapa[];
  totais: Record<string, number>;
  formatarValor: (valor: number) => string;
  onAdd: (parentId: string | null) => void;
  onRename: (id: string, nome: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  /** targetId null = mover para o fim da raiz */
  onMove: (dragId: string, targetId: string | null, pos: DropPos) => void;
}

export type DropPos = "before" | "after" | "inside";

const NIVEL_LABEL = ["Etapa", "Sub-etapa", "Sub-etapa"];

export function EtapasEstrutura({
  etapas,
  totais,
  formatarValor,
  onAdd,
  onRename,
  onRemove,
  onSelect,
  onMove,
}: EtapasEstruturaProps) {
  const [painelAberto, setPainelAberto] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{ id: string | null; pos: DropPos } | null>(null);

  const byId = (id: string) => etapas.find((e) => e.id === id);

  const nivelDe = (id: string): number => {
    let nivel = 1;
    let atual = byId(id);
    while (atual?.parent_id) {
      nivel++;
      atual = byId(atual.parent_id);
    }
    return nivel;
  };

  const alturaSubarvore = (id: string): number =>
    1 + Math.max(0, ...etapas.filter((e) => e.parent_id === id).map((e) => alturaSubarvore(e.id)));

  const ehDescendente = (id: string, ancestralId: string): boolean => {
    let atual = byId(id);
    while (atual?.parent_id) {
      if (atual.parent_id === ancestralId) return true;
      atual = byId(atual.parent_id);
    }
    return false;
  };

  const podeSoltar = (drag: string, targetId: string | null, pos: DropPos): boolean => {
    if (targetId === null) return alturaSubarvore(drag) <= MAX_NIVEL_ETAPAS;
    if (drag === targetId || ehDescendente(targetId, drag)) return false;
    const novoPai = pos === "inside" ? targetId : byId(targetId)?.parent_id ?? null;
    const novoNivel = novoPai ? nivelDe(novoPai) + 1 : 1;
    return novoNivel + alturaSubarvore(drag) - 1 <= MAX_NIVEL_ETAPAS;
  };

  const limparDrag = () => {
    setDragId(null);
    setDropTarget(null);
  };

  const filhos = (parentId: string | null) =>
    etapas
      .filter((e) => (e.parent_id ?? null) === parentId)
      .sort((a, b) => a.ordem - b.ordem);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const startEdit = (etapa: Etapa) => {
    setEditingId(etapa.id);
    setDraft(etapa.nome);
  };

  const commitEdit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft.trim());
    setEditingId(null);
  };

  const renderNode = (etapa: Etapa, prefix: string, nivel: number): React.ReactNode => {
    const subs = filhos(etapa.id);
    const isCollapsed = collapsed.has(etapa.id);
    const isEditing = editingId === etapa.id;
    const FolderIcon = subs.length > 0 && !isCollapsed ? FolderOpen : Folder;

    const alvo = dropTarget?.id === etapa.id ? dropTarget.pos : null;
    const dropStyle =
      alvo === "inside"
        ? "bg-brand-primary/10 ring-2 ring-brand-primary"
        : alvo === "before"
          ? "shadow-[0_-2px_0_0_var(--color-brand-primary,#00a3b1)]"
          : alvo === "after"
            ? "shadow-[0_2px_0_0_var(--color-brand-primary,#00a3b1)]"
            : "hover:bg-bg-light/60";

    return (
      <li key={etapa.id}>
        <div
          draggable={!isEditing}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", etapa.id);
            setDragId(etapa.id);
          }}
          onDragEnd={limparDrag}
          onDragOver={(e) => {
            if (!dragId) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientY - rect.top) / rect.height;
            const pos: DropPos = ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside";
            if (!podeSoltar(dragId, etapa.id, pos)) {
              setDropTarget(null);
              return;
            }
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dropTarget?.id !== etapa.id || dropTarget.pos !== pos) {
              setDropTarget({ id: etapa.id, pos });
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragId && dropTarget?.id === etapa.id) onMove(dragId, etapa.id, dropTarget.pos);
            limparDrag();
          }}
          className={`group flex items-center gap-1.5 py-1.5 pr-2 rounded transition-colors ${
            dragId === etapa.id ? "opacity-40" : ""
          } ${dropStyle} ${isEditing ? "" : "cursor-grab active:cursor-grabbing"}`}
        >
          <DotsSixVertical size={14} className="text-text-muted/60 shrink-0" aria-hidden />
          <button
            type="button"
            onClick={() => toggle(etapa.id)}
            disabled={subs.length === 0}
            className="p-0.5 text-text-muted border-none bg-transparent cursor-pointer disabled:opacity-0 disabled:cursor-default"
            aria-label={isCollapsed ? "Expandir" : "Recolher"}
          >
            {isCollapsed ? <CaretRight size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
          </button>
          <FolderIcon size={18} weight="fill" className="text-brand-primary shrink-0" />
          <span className="text-[11px] font-bold text-text-muted tabular-nums shrink-0">{prefix}</span>

          {isEditing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditingId(null);
              }}
              className="flex-1 min-w-0 text-[13px] font-semibold text-text-main border-b-2 border-brand-primary outline-none bg-white px-1"
            />
          ) : (
            <button
              type="button"
              onClick={() => onSelect(etapa.id)}
              className="flex-1 min-w-0 text-left text-[13px] font-semibold text-text-main truncate border-none bg-transparent cursor-pointer p-0 hover:text-brand-primary"
              title="Ir para esta etapa na planilha"
            >
              {etapa.nome}
            </button>
          )}

          <span className="text-[11px] font-bold text-brand-primary tabular-nums shrink-0">
            {formatarValor(totais[etapa.id] || 0)}
          </span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
            {nivel < MAX_NIVEL_ETAPAS && (
              <button
                type="button"
                onClick={() => onAdd(etapa.id)}
                className="p-1 text-text-muted hover:text-brand-primary rounded border-none bg-transparent cursor-pointer"
                title={`Adicionar ${NIVEL_LABEL[nivel].toLowerCase()} dentro desta pasta`}
              >
                <FolderPlus size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => (isEditing ? commitEdit() : startEdit(etapa))}
              className="p-1 text-text-muted hover:text-brand-primary rounded border-none bg-transparent cursor-pointer"
              title="Renomear"
            >
              {isEditing ? <Check size={15} className="text-emerald-600" /> : <PencilSimple size={15} />}
            </button>
            <button
              type="button"
              onClick={() => onRemove(etapa.id)}
              className="p-1 text-text-muted hover:text-status-danger rounded border-none bg-transparent cursor-pointer"
              title="Excluir"
            >
              <Trash size={15} />
            </button>
          </div>
        </div>

        {subs.length > 0 && !isCollapsed && (
          <ul className="ml-4 pl-3 border-l border-slate-200 list-none m-0 p-0 pl-3">
            {subs.map((s, i) => renderNode(s, `${prefix}.${i + 1}`, nivel + 1))}
          </ul>
        )}
      </li>
    );
  };

  const raizes = filhos(null);

  return (
    <div className="mb-6 p-4 bg-white border border-border rounded-lg shadow-sm">
      <div className={`flex items-center justify-between gap-3 ${painelAberto ? "mb-2" : ""}`}>
        <button
          type="button"
          onClick={() => setPainelAberto((v) => !v)}
          aria-expanded={painelAberto}
          className="flex items-start gap-2 text-left cursor-pointer border-none bg-transparent p-0"
        >
          <span className="mt-0.5 text-text-muted">
            {painelAberto ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
          </span>
          <span>
            <span className="block text-sm font-bold text-text-main">Estrutura de Etapas</span>
            {painelAberto && (
              <span className="block text-[11px] text-text-muted font-normal">
                Organize em pastas de até {MAX_NIVEL_ETAPAS} níveis: Etapa 1, Etapa 1.1 e Etapa 1.1.1. Arraste para reordenar ou soltar no meio de outra pasta para aninhar.
              </span>
            )}
          </span>
        </button>
        {painelAberto && (
          <button
            type="button"
            onClick={() => onAdd(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded text-[11px] font-bold text-text-main hover:bg-bg-light cursor-pointer shadow-sm shrink-0"
          >
            <FolderPlus size={14} /> NOVA PASTA
          </button>
        )}
      </div>

      {!painelAberto ? null : raizes.length === 0 ? (
        <div className="py-4 text-center text-xs text-text-muted italic">Nenhuma etapa criada ainda.</div>
      ) : (
        <ul className="list-none m-0 p-0">{raizes.map((e, i) => renderNode(e, String(i + 1), 1))}</ul>
      )}

      {painelAberto && dragId && (
        <div
          onDragOver={(e) => {
            if (!podeSoltar(dragId, null, "after")) return;
            e.preventDefault();
            if (dropTarget?.id !== null || dropTarget?.pos !== "after") setDropTarget({ id: null, pos: "after" });
          }}
          onDrop={(e) => {
            e.preventDefault();
            onMove(dragId, null, "after");
            limparDrag();
          }}
          className={`mt-2 py-2 text-center text-[11px] font-semibold rounded border-2 border-dashed transition-colors ${
            dropTarget?.id === null && dropTarget.pos === "after"
              ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
              : "border-slate-200 text-text-muted"
          }`}
        >
          Solte aqui para mover para o nível principal
        </div>
      )}
    </div>
  );
}
