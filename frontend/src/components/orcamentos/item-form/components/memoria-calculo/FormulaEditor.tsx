"use client";

import * as React from "react";
import type { VariableConfig } from "../../types";
import { getCleanVariableName } from "../../utils/memoriaCalculoUtils";

interface FormulaEditorProps {
  formula: string;
  onChangeFormula: (formula: string) => void;
  formulaError: string | null;
  variableConfigs: VariableConfig[];
  variaveisGlobais?: Array<{ nome?: string; valor?: string | number }> | null;
  onRestoreDefault: () => void;
  defaultFormulaString: string;
}

export function FormulaEditor({
  formula,
  onChangeFormula,
  formulaError,
  variableConfigs,
  variaveisGlobais = [],
  onRestoreDefault,
  defaultFormulaString,
}: FormulaEditorProps) {
  const insertText = (text: string) => {
    onChangeFormula(formula ? `${formula} * ${text}` : text);
  };

  const insertOperator = (op: string) => {
    onChangeFormula(formula ? `${formula} ${op} ` : `${op} `);
  };

  return (
    <div className="shrink-0 border-t border-[#c4c6cf] pt-4">
      <div className="bg-slate-50 border border-[#c4c6cf] rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label
              htmlFor="formula-input"
              className="text-sm font-bold text-slate-800 flex items-center gap-1.5"
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
                className="text-brand-primary"
              >
                <line x1="4" y1="9" x2="20" y2="9"></line>
                <line x1="4" y1="15" x2="20" y2="15"></line>
                <line x1="10" y1="3" x2="8" y2="21"></line>
                <line x1="16" y1="3" x2="14" y2="21"></line>
              </svg>
              Fórmula de Cálculo
            </label>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Campo Necessário
            </span>
          </div>

          <button
            type="button"
            onClick={onRestoreDefault}
            className="text-xs text-brand-primary hover:text-brand-navy font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            title="Redefinir fórmula para a multiplicação padrão das variáveis"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Restaurar Fórmula Padrão ({defaultFormulaString})
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Esta fórmula é aplicada ao subtotal de cada elemento utilizando suas variáveis (ex:{" "}
          {variableConfigs.map((cfg, idx) => (
            <React.Fragment key={cfg.id}>
              <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">
                {getCleanVariableName(cfg)}
              </code>
              {idx < variableConfigs.length - 1 ? ", " : ""}
            </React.Fragment>
          ))}
          ). O resultado total do item é a soma de todos os subtotais.
        </p>

        <div className="space-y-1.5">
          <input
            id="formula-input"
            type="text"
            value={formula}
            onChange={(e) => onChangeFormula(e.target.value)}
            placeholder={`Ex: ${defaultFormulaString || "largura * comprimento"}`}
            className={`w-full border rounded-lg p-3 font-mono text-base font-bold outline-none transition-all shadow-sm ${
              formulaError
                ? "border-red-400 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-400"
                : "border-slate-300 bg-white text-slate-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            }`}
            required
          />

          {formulaError && (
            <p className="text-red-500 text-xs font-semibold flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {formulaError}
            </p>
          )}
        </div>

        {/* Botões Rápidos para Construção da Fórmula */}
        <div className="pt-2 border-t border-slate-200 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Variáveis de Coluna:
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-0.5">
              {variableConfigs.map((cfg) => {
                const label = cfg.label.split("(")[0].split("/")[0].trim() || cfg.key;
                const varIdentifier = getCleanVariableName(cfg);
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => insertText(varIdentifier)}
                    className="bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                    title={`Inserir variável da coluna: ${cfg.label} (${varIdentifier})`}
                  >
                    {label}
                  </button>
                );
              })}
              {variaveisGlobais && variaveisGlobais.length > 0 && (
                <>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2 self-center">
                    Globais:
                  </span>
                  {variaveisGlobais.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertText(g.nome || "")}
                      className="bg-white border border-slate-200 hover:border-[#9fd300] hover:text-[#001b3d] text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-semibold shadow-xs transition-colors cursor-pointer"
                      title={`Inserir variável global: ${g.nome} = ${g.valor}`}
                    >
                      {g.nome} ({g.valor})
                    </button>
                  ))}
                </>
              )}
            </div>

            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">
              Operadores:
            </span>
            <div className="flex flex-wrap gap-1">
              {["+", "-", "*", "/", "(", ")"].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => insertOperator(op)}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {op}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onChangeFormula("")}
                className="text-slate-400 hover:text-red-500 text-[11px] font-semibold px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors ml-auto cursor-pointer"
                title="Limpar campo de fórmula"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
