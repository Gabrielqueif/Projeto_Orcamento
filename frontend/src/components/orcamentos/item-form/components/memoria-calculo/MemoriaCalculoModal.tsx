"use client";

import * as React from "react";
import { Check, Plus } from "@phosphor-icons/react";
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

  const modo = (
    key: "PRESET_1" | "PRESET_2" | "PRESET_3",
    label: string,
    title: string,
    ativo: boolean
  ) => (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={() => handleSelectPresetMode(key)}
      title={title}
    >
      {label}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Memória de Cálculo — ${composicaoDescricao || "Item"}`}
      maxWidth="max-w-5xl"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#001b3d" }}>
        {/* Barra Superior de Ações e Modos de Variáveis */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="gp-ml">Modo de variáveis:</span>
            <div role="radiogroup" aria-label="Modo de variáveis" className="gp-seg">
              {modo("PRESET_1", "QUANT (1 var)", "1 Variável: Subtotal = Dimensão 1", variableConfigs.length === 1 && variableConfigs[0].key === "Dim1")}
              {modo(
                "PRESET_2",
                "ÁREA (2 vars)",
                "2 Variáveis: Subtotal = Qtd × Dimensão 1",
                variableConfigs.length === 2 && variableConfigs[0].key === "quantidade" && variableConfigs[1].key === "largura"
              )}
              {modo(
                "PRESET_3",
                "VOL (3 vars)",
                "3 Variáveis: Subtotal = Qtd × Dim1 × Dim2",
                variableConfigs.length === 3 &&
                  variableConfigs[0].key === "quantidade" &&
                  variableConfigs[1].key === "largura" &&
                  variableConfigs[2].key === "altura"
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={handleAddCustomVariable} className="gp-btn gp-bs gp-sm">
              <Plus size={16} weight="bold" aria-hidden="true" />
              Variável de Coluna
            </button>
            <button type="button" onClick={addElemento} className="gp-btn gp-bs gp-sm">
              <Plus size={16} weight="bold" aria-hidden="true" />
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

        {/* Resultado Total (Soma dos Subtotais) */}
        <div className="gp-card gp-pad gp-dark" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h3 className="gp-h2" style={{ color: "#fff" }}>Quantidade calculada</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#cbd5e1" }}>Soma dos subtotais dos elementos</p>
          </div>
          <p role="status" className="gp-mono" style={{ margin: 0, fontSize: 34, fontWeight: 600 }}>
            {previewResult !== null
              ? previewResult.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })
              : "---"}{" "}
            <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 16, color: "#cbd5e1" }}>{unidade}</span>
          </p>
        </div>

        {/* Ações Finais do Modal */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} className="gp-btn gp-bs">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={previewResult === null || !formula.trim() || !!formulaError}
            className="gp-btn gp-bp disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} weight="bold" aria-hidden="true" />
            Aplicar no Orçamento
          </button>
        </div>
      </div>
    </Modal>
  );
}
