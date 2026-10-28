"use client";

import * as React from "react";
import { ArrowCounterClockwise, WarningCircle } from "@phosphor-icons/react";
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
    onChangeFormula(formula ? `${formula} ${text}` : text);
  };

  const insertOperator = (op: string) => {
    onChangeFormula(formula ? `${formula} ${op} ` : `${op} `);
  };

  const chip = {
    border: "1px solid #CBD5E1", background: "#fff", color: "#001b3d", borderRadius: 10,
    padding: "4px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, cursor: "pointer",
  } as const;
  const rotulo = { fontSize: 12, fontWeight: 800, color: "#334155" } as const;

  return (
    <section className="gp-card gp-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="formula-input" className="gp-lb">
            Fórmula de Cálculo
          </label>
          <span className="gp-bg gp-wa">Campo necessário</span>
        </div>
        <button
          type="button"
          onClick={onRestoreDefault}
          className="gp-btn gp-bs gp-sm"
          title="Redefinir fórmula para a multiplicação padrão das variáveis"
        >
          <ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />
          Restaurar Fórmula Padrão ({defaultFormulaString})
        </button>
      </div>

      <p className="gp-hint" style={{ margin: 0 }}>
        Esta fórmula é aplicada ao subtotal de cada elemento utilizando suas variáveis (ex:{" "}
        {variableConfigs.map((cfg, idx) => (
          <React.Fragment key={cfg.id}>
            <code className="gp-mono" style={{ fontWeight: 600, color: "#001b3d" }}>
              {getCleanVariableName(cfg)}
            </code>
            {idx < variableConfigs.length - 1 ? ", " : ""}
          </React.Fragment>
        ))}
        ). O resultado total do item é a soma de todos os subtotais.
      </p>

      <div className="gp-fld">
        <input
          id="formula-input"
          type="text"
          value={formula}
          onChange={(e) => onChangeFormula(e.target.value)}
          placeholder={`Ex: ${defaultFormulaString || "largura * comprimento"}`}
          className="gp-in gp-mono"
          style={{
            fontSize: 17, fontWeight: 600,
            ...(formulaError ? { borderColor: "#B91C1C", background: "#FEF2F2" } : null),
          }}
          aria-invalid={Boolean(formulaError)}
          required
        />
        {formulaError && (
          <p role="alert" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#B91C1C" }}>
            <WarningCircle size={16} weight="bold" aria-hidden="true" />
            {formulaError}
          </p>
        )}
      </div>

      {/* Botões Rápidos para Construção da Fórmula */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12, borderTop: "1px solid #E6EBF2" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span style={rotulo}>Variáveis de coluna:</span>
          {variableConfigs.map((cfg) => {
            const label = cfg.label.split("(")[0].split("/")[0].trim() || cfg.key;
            const varIdentifier = getCleanVariableName(cfg);
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => insertText(varIdentifier)}
                className="gp-4b-fchip"
                style={chip}
                title={`Inserir variável da coluna: ${cfg.label} (${varIdentifier})`}
              >
                {label}
              </button>
            );
          })}
          {variaveisGlobais && variaveisGlobais.length > 0 && (
            <>
              <span style={{ ...rotulo, marginLeft: 8 }}>Globais:</span>
              {variaveisGlobais.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertText(g.nome || "")}
                  className="gp-4b-fchip"
                  style={{ ...chip, background: "#F7FCE9", borderColor: "#9fd300" }}
                  title={`Inserir variável global: ${g.nome} = ${g.valor}`}
                >
                  {g.nome} ({g.valor})
                </button>
              ))}
            </>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span style={rotulo}>Operadores:</span>
          {["+", "-", "*", "/", "(", ")"].map((op) => (
            <button key={op} type="button" onClick={() => insertOperator(op)} className="gp-4b-fchip" style={{ ...chip, minWidth: 36 }}>
              {op}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChangeFormula("")}
            className="gp-btn gp-bs gp-sm"
            style={{ marginLeft: "auto" }}
            title="Limpar campo de fórmula"
          >
            Limpar
          </button>
        </div>
      </div>
    </section>
  );
}
