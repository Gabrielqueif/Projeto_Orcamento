"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import type { VariableConfig, MemoriaCalculoElemento } from "../../types";
import { DEFAULT_VARIABLE_CONFIGS } from "../../types";
import {
  calculateElementSubtotal,
  generateDefaultFormula,
} from "../../utils/memoriaCalculoUtils";
import { MemoriaCalculoTable } from "./MemoriaCalculoTable";
import { FormulaEditor } from "./FormulaEditor";

interface MemoriaCalculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (calculatedQty: number) => void;
  composicaoDescricao?: string;
  unidade?: string;
  locais?: Array<string | { nome?: string }> | null;
  variaveisGlobais?: Array<{ nome?: string; valor?: string | number }> | null;
  formula: string;
  onChangeFormula: (formula: string) => void;
  variableConfigs: VariableConfig[];
  onChangeVariableConfigs: (configs: VariableConfig[]) => void;
  elementos: MemoriaCalculoElemento[];
  onChangeElementos: (elementos: MemoriaCalculoElemento[]) => void;
}

export function MemoriaCalculoModal({
  isOpen,
  onClose,
  onApply,
  composicaoDescricao,
  unidade = "m²",
  locais = [],
  variaveisGlobais = [],
  formula,
  onChangeFormula,
  variableConfigs,
  onChangeVariableConfigs,
  elementos,
  onChangeElementos,
}: MemoriaCalculoModalProps) {
  const [previewResult, setPreviewResult] = React.useState<number | null>(null);
  const [formulaError, setFormulaError] = React.useState<string | null>(null);

  // Recalcular totais e subtotais sempre que a fórmula, configs ou elementos mudarem
  React.useEffect(() => {
    if (!isOpen) return;

    if (elementos.length === 0) {
      setPreviewResult(null);
      setFormulaError("Adicione ao menos um elemento na memória de cálculo.");
      return;
    }

    if (!formula.trim()) {
      setPreviewResult(null);
      setFormulaError("A fórmula de cálculo é obrigatória.");
      return;
    }

    try {
      let total = 0;
      let hasError: string | null = null;
      let hasSubtotalChanged = false;

      const updatedElementos = elementos.map((el) => {
        try {
          const sub = calculateElementSubtotal(
            el,
            variableConfigs,
            formula,
            variaveisGlobais
          );
          if (sub !== el.subtotal) {
            hasSubtotalChanged = true;
          }
          total += sub;
          return { ...el, subtotal: sub };
        } catch (err: unknown) {
          hasError = err instanceof Error ? err.message : "Fórmula inválida";
          return el;
        }
      });

      if (hasError) {
        setPreviewResult(null);
        setFormulaError(hasError);
      } else {
        setFormulaError(null);
        setPreviewResult(Number(total.toFixed(4)));
        if (hasSubtotalChanged) {
          onChangeElementos(updatedElementos);
        }
      }
    } catch (err) {
      setPreviewResult(null);
      setFormulaError(err instanceof Error ? err.message : "Fórmula inválida");
    }
  }, [isOpen, formula, variableConfigs, variaveisGlobais]);

  const handleApply = () => {
    if (previewResult !== null && formula.trim() && !formulaError) {
      onApply(previewResult);
      onClose();
    }
  };

  const getElementVariableValue = (el: MemoriaCalculoElemento, key: string): number => {
    if (key === "quantidade") return typeof el.quantidade === "number" ? el.quantidade : 1;
    if (key === "largura") return typeof el.largura === "number" ? el.largura : 1;
    if (key === "altura") return typeof el.altura === "number" ? el.altura : 1;
    if (el.valores && typeof el.valores[key] === "number") return el.valores[key];
    return 1;
  };

  const updateElementoVariable = (id: string, key: string, rawVal: string) => {
    const val = rawVal === "" ? 0 : parseFloat(rawVal) || 0;
    let total = 0;
    let hasErr: string | null = null;

    const updated = elementos.map((el) => {
      if (el.id === id) {
        const mod = { ...el };
        if (key === "quantidade") mod.quantidade = val;
        else if (key === "largura") mod.largura = val;
        else if (key === "altura") mod.altura = val;
        else {
          mod.valores = { ...(mod.valores || {}), [key]: val };
        }
        try {
          mod.subtotal = calculateElementSubtotal(
            mod,
            variableConfigs,
            formula,
            variaveisGlobais
          );
        } catch (e: unknown) {
          hasErr = e instanceof Error ? e.message : "Fórmula inválida";
        }
        total += mod.subtotal;
        return mod;
      }
      total += el.subtotal;
      return el;
    });

    onChangeElementos(updated);
    if (!hasErr && !formulaError) {
      setPreviewResult(Number(total.toFixed(4)));
    }
  };

  const updateElementoDescricao = (id: string, desc: string) => {
    onChangeElementos(
      elementos.map((el) => (el.id === id ? { ...el, descricao: desc } : el))
    );
  };

  const addElemento = () => {
    const id = Date.now().toString();
    const newEl: MemoriaCalculoElemento = {
      id,
      descricao: `Elemento ${elementos.length + 1}`,
      quantidade: 1,
      largura: 1,
      altura: 1,
      valores: {},
      subtotal: 1,
    };
    try {
      newEl.subtotal = calculateElementSubtotal(
        newEl,
        variableConfigs,
        formula,
        variaveisGlobais
      );
    } catch {
      newEl.subtotal = 1;
    }
    const updatedElementos = [...elementos, newEl];
    onChangeElementos(updatedElementos);
    const sum = updatedElementos.reduce((acc, el) => acc + el.subtotal, 0);
    setPreviewResult(Number(sum.toFixed(4)));
  };

  const removeElemento = (id: string) => {
    const updatedElementos = elementos.filter((el) => el.id !== id);
    onChangeElementos(updatedElementos);
    if (updatedElementos.length === 0) {
      setPreviewResult(null);
      setFormulaError("Adicione ao menos um elemento na memória de cálculo.");
    } else {
      const sum = updatedElementos.reduce((acc, el) => acc + el.subtotal, 0);
      setPreviewResult(Number(sum.toFixed(4)));
    }
  };

  const handleSelectPresetMode = (presetKey: "PRESET_1" | "PRESET_2" | "PRESET_3") => {
    const newConfigs = DEFAULT_VARIABLE_CONFIGS[presetKey];
    const newFormula = generateDefaultFormula(newConfigs);
    onChangeVariableConfigs(newConfigs);
    onChangeFormula(newFormula);

    let sum = 0;
    const updated = elementos.map((el) => {
      const sub = calculateElementSubtotal(
        el,
        newConfigs,
        newFormula,
        variaveisGlobais
      );
      sum += sub;
      return { ...el, subtotal: sub };
    });
    onChangeElementos(updated);
    setPreviewResult(Number(sum.toFixed(4)));
    setFormulaError(null);
  };

  const handleAddCustomVariable = () => {
    const varName = prompt("Digite o nome da nova variável (ex: Espessura, Perímetro):");
    if (!varName || !varName.trim()) return;
    const cleanName = varName.trim();

    let key = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "_");
    if (!key || /^\d/.test(key)) {
      key = `col_${key || Date.now()}`;
    }
    if (variableConfigs.some((c) => c.key === key)) {
      key = `${key}_${Date.now().toString().slice(-4)}`;
    }

    const newConfigs = [...variableConfigs, { id: key, label: cleanName.toUpperCase(), key }];
    onChangeVariableConfigs(newConfigs);

    const updated = elementos.map((el) => {
      const updatedEl = { ...el, valores: { ...(el.valores || {}), [key]: 1 } };
      try {
        updatedEl.subtotal = calculateElementSubtotal(
          updatedEl,
          newConfigs,
          formula,
          variaveisGlobais
        );
      } catch {
        // mantém subtotal se houver erro transitório
      }
      return updatedEl;
    });
    onChangeElementos(updated);
    const sum = updated.reduce((acc, el) => acc + el.subtotal, 0);
    setPreviewResult(Number(sum.toFixed(4)));
  };

  const handleRemoveVariableColumn = (keyToRemove: string) => {
    if (variableConfigs.length <= 1) {
      alert("É necessário ter ao menos 1 variável na memória de cálculo.");
      return;
    }
    const newConfigs = variableConfigs.filter((c) => c.key !== keyToRemove);
    onChangeVariableConfigs(newConfigs);

    let newFormula = formula;
    if (formula.includes(keyToRemove)) {
      newFormula = generateDefaultFormula(newConfigs);
      onChangeFormula(newFormula);
    }

    let sum = 0;
    const updated = elementos.map((el) => {
      const sub = calculateElementSubtotal(
        el,
        newConfigs,
        newFormula,
        variaveisGlobais
      );
      sum += sub;
      return { ...el, subtotal: sub };
    });
    onChangeElementos(updated);
    setPreviewResult(Number(sum.toFixed(4)));
  };

  const handleUpdateColumnLabel = (keyToUpdate: string, newLabel: string) => {
    const oldDefault = generateDefaultFormula(variableConfigs);
    const updatedConfigs = variableConfigs.map((c) =>
      c.key === keyToUpdate ? { ...c, label: newLabel } : c
    );
    onChangeVariableConfigs(updatedConfigs);

    if (!formula.trim() || formula === oldDefault) {
      onChangeFormula(generateDefaultFormula(updatedConfigs));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Memória de Cálculo — ${composicaoDescricao || "Item"}`}
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col gap-6 text-slate-800">
        {/* Barra Superior de Ações e Modos de Variáveis */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-[#c4c6cf]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#44474e] uppercase tracking-wider">
              Modo de Variáveis:
            </span>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm gap-1">
              <button
                type="button"
                onClick={() => handleSelectPresetMode("PRESET_1")}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  variableConfigs.length === 1 && variableConfigs[0].key === "quantidade"
                    ? "bg-[#001b3d] text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="1 Variável: Subtotal = Quantidade"
              >
                1 Var (Qtd)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetMode("PRESET_2")}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  variableConfigs.length === 2 &&
                  variableConfigs[0].key === "quantidade" &&
                  variableConfigs[1].key === "largura"
                    ? "bg-[#001b3d] text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="2 Variáveis: Subtotal = Qtd × Dimensão 1"
              >
                2 Vars (Qtd × Dim1)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetMode("PRESET_3")}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  variableConfigs.length === 3 &&
                  variableConfigs[0].key === "quantidade" &&
                  variableConfigs[1].key === "largura" &&
                  variableConfigs[2].key === "altura"
                    ? "bg-[#001b3d] text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="3 Variáveis: Subtotal = Qtd × Dim1 × Dim2"
              >
                3 Vars (Qtd × Dim1 × Dim2)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddCustomVariable}
              className="text-xs font-bold text-brand-primary hover:text-brand-navy border border-brand-primary/30 hover:border-brand-primary bg-white px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Variável de Coluna
            </button>
            <button
              type="button"
              onClick={addElemento}
              className="border border-[#74777f] hover:bg-slate-100 text-[#44474e] flex gap-2 items-center px-4 py-1.5 rounded-lg font-bold transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Adicionar Elemento
            </button>
          </div>
        </div>

        {/* Tabela de Elementos e Variáveis */}
        <MemoriaCalculoTable
          elementos={elementos}
          variableConfigs={variableConfigs}
          unidade={unidade}
          locais={locais}
          onUpdateElementoVariable={updateElementoVariable}
          onUpdateElementoDescricao={updateElementoDescricao}
          onRemoveElemento={removeElemento}
          onUpdateColumnLabel={handleUpdateColumnLabel}
          onRemoveVariableColumn={handleRemoveVariableColumn}
          getElementVariableValue={getElementVariableValue}
        />

        {/* Editor de Fórmula com Chips de Variáveis e Operadores */}
        <FormulaEditor
          formula={formula}
          onChangeFormula={onChangeFormula}
          formulaError={formulaError}
          variableConfigs={variableConfigs}
          variaveisGlobais={variaveisGlobais}
          onRestoreDefault={() => onChangeFormula(generateDefaultFormula(variableConfigs))}
          defaultFormulaString={generateDefaultFormula(variableConfigs)}
        />

        {/* Barra de Resultado Total (Soma dos Subtotais) */}
        <div className="shrink-0 bg-[#001b3d] rounded-lg p-5 flex justify-between items-center shadow-md">
          <span className="text-[#6f84ac] text-xs font-bold tracking-widest uppercase font-sans">
            RESULTADO TOTAL DO ITEM (SOMA DOS SUBTOTAIS)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-[#b9f61d] tracking-tight">
              {previewResult !== null
                ? previewResult.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })
                : "---"}
            </span>
            <span className="text-xs font-bold text-[#b9f61d] uppercase ml-1">
              {unidade}
            </span>
          </div>
        </div>

        {/* Ações Finais do Modal */}
        <div className="shrink-0 flex gap-3 justify-end pt-2 border-t border-[#c4c6cf]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-[#44474e] hover:bg-slate-100 rounded-lg font-bold transition-all text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={previewResult === null || !formula.trim() || !!formulaError}
            className="bg-[#b9f61d] text-[#141f00] flex gap-2 items-center px-6 py-2.5 rounded-xl font-bold hover:bg-[#a6de1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm active:scale-95 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Aplicar no Orçamento
          </button>
        </div>
      </div>
    </Modal>
  );
}
