"use client";

import * as React from "react";
import {
  addItem,
  updateItem,
  getEtapas,
  getOrcamento,
  type OrcamentoItemCreate,
  type OrcamentoItemUpdate,
  type Etapa,
  type OrcamentoItem,
  type Orcamento,
} from "@/lib/api/orcamentos";
import { buscarComposicoes as apiBuscarComposicoes } from "@/lib/api/composicoes";
import { Modal } from "@/components/ui/Modal";

interface ItemComposicao {
  codigo_composicao: string;
  descricao: string;
  unidade: string;
  preco?: number;
  fonte: string; // Adicionado campo fonte
}

interface VariableConfig {
  id: string;
  label: string;
  key: string;
}

interface MemoriaCalculoElemento {
  id: string;
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  valores?: Record<string, number>;
  subtotal: number;
}

const DEFAULT_VARIABLE_CONFIGS: Record<string, VariableConfig[]> = {
  PRESET_1: [{ id: "qtd", label: "QTD / REP.", key: "quantidade" }],
  PRESET_2: [
    { id: "qtd", label: "QTD / REP.", key: "quantidade" },
    { id: "dim1", label: "COMPR. / LARGURA (M)", key: "largura" },
  ],
  PRESET_3: [
    { id: "qtd", label: "QTD / REP.", key: "quantidade" },
    { id: "dim1", label: "LARGURA (M)", key: "largura" },
    { id: "dim2", label: "ALTURA / COMPR. (M)", key: "altura" },
  ],
};

const isLegacyFormula = (f?: string | null): boolean => {
  if (!f || !f.trim()) return true;
  return /^[EL]\d+(\s*[+\-*/]\s*[EL]\d+)*$/i.test(f.trim());
};

const generateDefaultFormula = (configs: VariableConfig[]): string => {
  if (!configs || configs.length === 0) return "quantidade";
  return configs.map((c) => c.key).join(" * ");
};

const calculateElementSubtotal = (
  el: MemoriaCalculoElemento,
  configs: VariableConfig[],
  formulaStr?: string,
  variaveisGlobais: any[] = []
): number => {
  if (!configs || configs.length === 0) return 0;

  const trimmed = (formulaStr || "").trim();
  if (!trimmed) {
    let prod = 1;
    configs.forEach((cfg) => {
      let val = 1;
      if (cfg.key === "quantidade") val = typeof el.quantidade === "number" ? el.quantidade : 1;
      else if (cfg.key === "largura") val = typeof el.largura === "number" ? el.largura : 1;
      else if (cfg.key === "altura") val = typeof el.altura === "number" ? el.altura : 1;
      else if (el.valores && typeof el.valores[cfg.key] === "number") val = el.valores[cfg.key];
      prod *= val;
    });
    return Number(prod.toFixed(4));
  }

  // Mappings of variable names to element values
  const mappings: { pattern: string; value: number }[] = [];

  configs.forEach((cfg) => {
    let val = 1;
    if (cfg.key === "quantidade") val = typeof el.quantidade === "number" ? el.quantidade : 1;
    else if (cfg.key === "largura") val = typeof el.largura === "number" ? el.largura : 1;
    else if (cfg.key === "altura") val = typeof el.altura === "number" ? el.altura : 1;
    else if (el.valores && typeof el.valores[cfg.key] === "number") val = el.valores[cfg.key];

    // Primary key mapping
    mappings.push({ pattern: cfg.key, value: val });

    // Common aliases for ease of typing
    if (cfg.key === "quantidade") {
      mappings.push({ pattern: "qtd", value: val });
      mappings.push({ pattern: "quant", value: val });
      mappings.push({ pattern: "qnt", value: val });
    } else if (cfg.key === "largura") {
      mappings.push({ pattern: "larg", value: val });
      mappings.push({ pattern: "comprimento", value: val });
      mappings.push({ pattern: "compr", value: val });
      mappings.push({ pattern: "dim1", value: val });
    } else if (cfg.key === "altura") {
      mappings.push({ pattern: "alt", value: val });
      mappings.push({ pattern: "dim2", value: val });
    }

    // Label mapping (e.g. "QTD / REP.", "LARGURA (M)", "ESPESSURA")
    if (cfg.label) {
      mappings.push({ pattern: cfg.label.trim(), value: val });
      const cleanLabel = cfg.label.split("(")[0].split("/")[0].trim();
      if (cleanLabel && cleanLabel !== cfg.label.trim()) {
        mappings.push({ pattern: cleanLabel, value: val });
      }
    }
  });

  // Global variables
  if (Array.isArray(variaveisGlobais)) {
    variaveisGlobais.forEach((g: any) => {
      if (g && g.nome) {
        const num = parseFloat(g.valor);
        if (!isNaN(num)) {
          mappings.push({ pattern: g.nome.trim(), value: num });
        }
      }
    });
  }

  // Sort mappings by pattern length descending to avoid partial replacements
  mappings.sort((a, b) => b.pattern.length - a.pattern.length);

  let expression = trimmed;
  for (const m of mappings) {
    if (!m.pattern) continue;
    const escaped = m.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = /^[a-zA-Z0-9_]+$/.test(m.pattern)
      ? new RegExp(`\\b${escaped}\\b`, "gi")
      : new RegExp(escaped, "gi");
    expression = expression.replace(regex, `(${m.value})`);
  }

  // Check for invalid characters
  const testExpr = expression.replace(/,/g, ".").trim();
  if (/[^0-9+*/().\s-]/.test(testExpr)) {
    throw new Error("A fórmula contém variáveis ou caracteres não identificados");
  }

  // Safe evaluation
  // eslint-disable-next-line no-new-func
  const result = new Function(`return ${testExpr}`)();

  if (typeof result === "number" && isFinite(result) && !isNaN(result)) {
    return Number(result.toFixed(4));
  } else {
    throw new Error("Resultado do cálculo inválido");
  }
};

interface ParsedMemoria {
  config: VariableConfig[];
  elementos: MemoriaCalculoElemento[];
}

const parseSavedMemoria = (saved: any): ParsedMemoria => {
  if (!saved) {
    return {
      config: DEFAULT_VARIABLE_CONFIGS.PRESET_3,
      elementos: [],
    };
  }

  // Formato novo com config e elementos
  if (typeof saved === "object" && !Array.isArray(saved) && Array.isArray(saved.elementos)) {
    const rawConfigs = Array.isArray(saved.config) && saved.config.length > 0
      ? saved.config
      : DEFAULT_VARIABLE_CONFIGS.PRESET_3;

    const parsedEls = saved.elementos.map((v: any) => ({
      id: v.id || Math.random().toString(),
      descricao: v.descricao || "",
      quantidade: typeof v.quantidade === "number" ? v.quantidade : 1,
      largura: typeof v.largura === "number" ? v.largura : 1,
      altura: typeof v.altura === "number" ? v.altura : 1,
      valores: v.valores || {},
      subtotal: typeof v.subtotal === "number" ? v.subtotal : 0,
    }));

    return {
      config: rawConfigs,
      elementos: parsedEls,
    };
  }

  // Formato antigo legacy (Array de elementos)
  if (Array.isArray(saved)) {
    const parsedEls: MemoriaCalculoElemento[] = saved.map((v: any) => {
      if (v && typeof v === "object" && "descricao" in v) {
        return {
          id: v.id || Math.random().toString(),
          descricao: v.descricao || "",
          quantidade: typeof v.quantidade === "number" ? v.quantidade : 1,
          largura: typeof v.largura === "number" ? v.largura : 1,
          altura: typeof v.altura === "number" ? v.altura : 1,
          valores: v.valores || {},
          subtotal: typeof v.subtotal === "number" ? v.subtotal : 0,
        };
      }
      return {
        id: v.id || Math.random().toString(),
        descricao: v.name || "",
        quantidade: 1,
        largura: typeof v.value === "number" ? v.value : 1,
        altura: 1,
        valores: {},
        subtotal: typeof v.value === "number" ? v.value : 0,
      };
    });

    let guessedPreset = DEFAULT_VARIABLE_CONFIGS.PRESET_3;
    if (parsedEls.length > 0) {
      const hasAltura = parsedEls.some((el) => el.altura !== 1 && el.altura !== 0);
      const hasLargura = parsedEls.some((el) => el.largura !== 1 && el.largura !== 0);
      if (!hasAltura && !hasLargura) {
        guessedPreset = DEFAULT_VARIABLE_CONFIGS.PRESET_1;
      } else if (!hasAltura && hasLargura) {
        guessedPreset = DEFAULT_VARIABLE_CONFIGS.PRESET_2;
      }
    }

    return {
      config: guessedPreset,
      elementos: parsedEls,
    };
  }

  return {
    config: DEFAULT_VARIABLE_CONFIGS.PRESET_3,
    elementos: [],
  };
};

const ESTADOS = [
  { value: "ac", label: "AC - Acre" },
  { value: "al", label: "AL - Alagoas" },
  { value: "ap", label: "AP - Amapá" },
  { value: "am", label: "AM - Amazonas" },
  { value: "ba", label: "BA - Bahia" },
  { value: "ce", label: "CE - Ceará" },
  { value: "df", label: "DF - Distrito Federal" },
  { value: "es", label: "ES - Espírito Santo" },
  { value: "go", label: "GO - Goiás" },
  { value: "ma", label: "MA - Maranhão" },
  { value: "mt", label: "MT - Mato Grosso" },
  { value: "ms", label: "MS - Mato Grosso do Sul" },
  { value: "mg", label: "MG - Minas Gerais" },
  { value: "pa", label: "PA - Pará" },
  { value: "pb", label: "PB - Paraíba" },
  { value: "pr", label: "PR - Paraná" },
  { value: "pe", label: "PE - Pernambuco" },
  { value: "pi", label: "PI - Piauí" },
  { value: "rj", label: "RJ - Rio de Janeiro" },
  { value: "rn", label: "RN - Rio Grande do Norte" },
  { value: "rs", label: "RS - Rio Grande do Sul" },
  { value: "ro", label: "RO - Rondônia" },
  { value: "rr", label: "RR - Roraima" },
  { value: "sc", label: "SC - Santa Catarina" },
  { value: "sp", label: "SP - São Paulo" },
  { value: "se", label: "SE - Sergipe" },
  { value: "to", label: "TO - Tocantins" },
];

type OrcamentoItemFormProps = {
  orcamentoId: string;
  estadoOrcamento?: string;
  fonteOrcamento?: string;
  refreshTrigger?: number;
  onItemAdded?: () => void;
  itemToEdit?: OrcamentoItem;
  initialEtapaId?: string;
  onCancel?: () => void;
};

export function OrcamentoItemForm({
  orcamentoId,
  estadoOrcamento,
  fonteOrcamento = "SINAPI",
  refreshTrigger,
  onItemAdded,
  itemToEdit,
  initialEtapaId = "",
  onCancel,
}: OrcamentoItemFormProps) {
  const [termo, setTermo] = React.useState("");
  const [resultados, setResultados] = React.useState<ItemComposicao[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [composicaoSelecionada, setComposicaoSelecionada] =
    React.useState<ItemComposicao | null>(null);
  const [quantidade, setQuantidade] = React.useState<string>("1");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [baseBusca, setBaseBusca] = React.useState<string>(fonteOrcamento);

  // Etapas State
  const [etapas, setEtapas] = React.useState<Etapa[]>([]);
  const [etapaId, setEtapaId] = React.useState<string>(initialEtapaId);

  // Memória de Cálculo Modal State
  const [showFormulaModal, setShowFormulaModal] = React.useState(false);
  const [formula, setFormula] = React.useState("");
  const [variableConfigs, setVariableConfigs] = React.useState<VariableConfig[]>(
    DEFAULT_VARIABLE_CONFIGS.PRESET_3
  );
  const [elementos, setElementos] = React.useState<MemoriaCalculoElemento[]>([]);
  const [previewResult, setPreviewResult] = React.useState<number | null>(null);
  const [formulaError, setFormulaError] = React.useState<string | null>(null);

  const [orcamento, setOrcamento] = React.useState<Orcamento | null>(null);

  React.useEffect(() => {
    async function loadOrcamento() {
      if (!orcamentoId) return;
      try {
        const data = await getOrcamento(orcamentoId);
        setOrcamento(data);
      } catch (err) {
        console.error("Erro ao carregar orcamento:", err);
      }
    }
    loadOrcamento();
  }, [orcamentoId]);

  const fetchEtapas = async () => {
    try {
      const data = await getEtapas(orcamentoId);
      setEtapas(data);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchEtapas();
  }, [orcamentoId, refreshTrigger]);

  // Populate form when updating an item
  React.useEffect(() => {
    if (itemToEdit) {
      setQuantidade(itemToEdit.quantidade.toString());
      setEtapaId(itemToEdit.etapa_id || "");
      setComposicaoSelecionada({
        codigo_composicao: itemToEdit.codigo_composicao,
        descricao: itemToEdit.descricao,
        unidade: itemToEdit.unidade,
        preco: itemToEdit.preco_unitario || undefined,
        fonte: fonteOrcamento,
      });
      // Load memory and variables dynamically
      const parsed = parseSavedMemoria(itemToEdit.variaveis);
      let initialFormula = itemToEdit.memoria_calculo;
      if (!initialFormula || isLegacyFormula(initialFormula)) {
        initialFormula = generateDefaultFormula(parsed.config);
      }
      const initialEls = parsed.elementos.map((el) => {
        try {
          return {
            ...el,
            subtotal: calculateElementSubtotal(
              el,
              parsed.config,
              initialFormula,
              orcamento?.variaveis_globais || []
            ),
          };
        } catch {
          return el;
        }
      });
      setFormula(initialFormula);
      setVariableConfigs(parsed.config);
      setElementos(initialEls);

      // Clear search related states
      setTermo("");
      setResultados([]);
    } else {
      // Reset form when itemToEdit becomes null
      setQuantidade("1");
      setEtapaId(initialEtapaId);
      setComposicaoSelecionada(null);
      setTermo("");
      setResultados([]);
      setFormula("");
      setVariableConfigs(DEFAULT_VARIABLE_CONFIGS.PRESET_3);
      setElementos([]);
    }
  }, [itemToEdit, fonteOrcamento, initialEtapaId]);

  const buscarComposicoes = async () => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    setLoading(true);
    try {
      const data = await apiBuscarComposicoes(termo, baseBusca);
      setResultados(data || []);
    } catch (error) {
      console.error(error);
      setError("Erro ao buscar composições.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      buscarComposicoes();
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo]);

  // Formula Calculation Logic - Formula is applied to each element's subtotal
  React.useEffect(() => {
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
            orcamento?.variaveis_globais || []
          );
          if (sub !== el.subtotal) {
            hasSubtotalChanged = true;
          }
          total += sub;
          return { ...el, subtotal: sub };
        } catch (err: any) {
          hasError = err?.message || "Fórmula inválida";
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
          setElementos(updatedElementos);
        }
      }
    } catch (err) {
      setPreviewResult(null);
      setFormulaError(err instanceof Error ? err.message : "Fórmula inválida");
    }
  }, [formula, variableConfigs, orcamento?.variaveis_globais]);

  const handleApplyFormula = () => {
    if (previewResult !== null && formula.trim() && !formulaError) {
      setQuantidade(previewResult.toString());
      setShowFormulaModal(false);
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
    setElementos((prev) => {
      let total = 0;
      let hasErr: string | null = null;
      const updated = prev.map((el) => {
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
              orcamento?.variaveis_globais || []
            );
          } catch (e: any) {
            hasErr = e?.message || "Fórmula inválida";
          }
          total += mod.subtotal;
          return mod;
        }
        total += el.subtotal;
        return el;
      });

      if (!hasErr && !formulaError) {
        setPreviewResult(Number(total.toFixed(4)));
      }
      return updated;
    });
  };

  const updateElementoDescricao = (id: string, desc: string) => {
    setElementos(
      elementos.map((el) => (el.id === id ? { ...el, descricao: desc } : el))
    );
  };

  const openFormulaModal = () => {
    let activeFormula = formula;
    if (!activeFormula.trim() || isLegacyFormula(activeFormula)) {
      activeFormula = generateDefaultFormula(variableConfigs);
      setFormula(activeFormula);
    }

    if (elementos.length === 0) {
      const qtdAtual = parseFloat(quantidade) || 1;
      const initialEl: MemoriaCalculoElemento = {
        id: Date.now().toString(),
        descricao: "Elemento 1",
        quantidade: qtdAtual,
        largura: 1,
        altura: 1,
        valores: {},
        subtotal: qtdAtual,
      };
      try {
        initialEl.subtotal = calculateElementSubtotal(
          initialEl,
          variableConfigs,
          activeFormula,
          orcamento?.variaveis_globais || []
        );
      } catch {
        initialEl.subtotal = qtdAtual;
      }
      setElementos([initialEl]);
      setPreviewResult(initialEl.subtotal);
    } else {
      let sum = 0;
      const updated = elementos.map((el) => {
        try {
          const sub = calculateElementSubtotal(
            el,
            variableConfigs,
            activeFormula,
            orcamento?.variaveis_globais || []
          );
          sum += sub;
          return { ...el, subtotal: sub };
        } catch {
          sum += el.subtotal;
          return el;
        }
      });
      setElementos(updated);
      setPreviewResult(Number(sum.toFixed(4)));
    }
    setShowFormulaModal(true);
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
        orcamento?.variaveis_globais || []
      );
    } catch {
      newEl.subtotal = 1;
    }
    const updatedElementos = [...elementos, newEl];
    setElementos(updatedElementos);
    const sum = updatedElementos.reduce((acc, el) => acc + el.subtotal, 0);
    setPreviewResult(Number(sum.toFixed(4)));
  };

  const removeElemento = (id: string) => {
    const updatedElementos = elementos.filter((el) => el.id !== id);
    setElementos(updatedElementos);
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
    setVariableConfigs(newConfigs);
    setFormula(newFormula);
    let sum = 0;
    const updated = elementos.map((el) => {
      const sub = calculateElementSubtotal(
        el,
        newConfigs,
        newFormula,
        orcamento?.variaveis_globais || []
      );
      sum += sub;
      return { ...el, subtotal: sub };
    });
    setElementos(updated);
    setPreviewResult(Number(sum.toFixed(4)));
    setFormulaError(null);
  };

  const handleAddCustomVariable = () => {
    const varName = prompt("Digite o nome da nova variável (ex: Espessura, Perímetro):");
    if (!varName || !varName.trim()) return;
    const cleanName = varName.trim();
    const key = `var_${Date.now()}`;
    const newConfigs = [...variableConfigs, { id: key, label: cleanName.toUpperCase(), key }];
    setVariableConfigs(newConfigs);

    const currentDefault = generateDefaultFormula(variableConfigs);
    let newFormula = formula;
    if (!formula.trim() || formula.trim() === currentDefault) {
      newFormula = `${formula ? `${formula} * ` : ""}${key}`;
      setFormula(newFormula);
    }

    let sum = 0;
    const updated = elementos.map((el) => {
      const updatedEl = { ...el, valores: { ...(el.valores || {}), [key]: 1 } };
      try {
        updatedEl.subtotal = calculateElementSubtotal(
          updatedEl,
          newConfigs,
          newFormula,
          orcamento?.variaveis_globais || []
        );
      } catch {
        // fallback
      }
      sum += updatedEl.subtotal;
      return updatedEl;
    });
    setElementos(updated);
    setPreviewResult(Number(sum.toFixed(4)));
  };

  const handleRemoveVariableColumn = (keyToRemove: string) => {
    if (variableConfigs.length <= 1) {
      alert("É necessário ter ao menos 1 variável na memória de cálculo.");
      return;
    }
    const newConfigs = variableConfigs.filter((c) => c.key !== keyToRemove);
    setVariableConfigs(newConfigs);

    let newFormula = formula;
    if (formula.includes(keyToRemove)) {
      newFormula = generateDefaultFormula(newConfigs);
      setFormula(newFormula);
    }

    let sum = 0;
    const updated = elementos.map((el) => {
      const sub = calculateElementSubtotal(
        el,
        newConfigs,
        newFormula,
        orcamento?.variaveis_globais || []
      );
      sum += sub;
      return { ...el, subtotal: sub };
    });
    setElementos(updated);
    setPreviewResult(Number(sum.toFixed(4)));
  };

  const handleUpdateColumnLabel = (keyToUpdate: string, newLabel: string) => {
    setVariableConfigs(
      variableConfigs.map((c) => (c.key === keyToUpdate ? { ...c, label: newLabel } : c))
    );
  };

  const handleSelectComposicao = (composicao: ItemComposicao) => {
    setComposicaoSelecionada(composicao);
    setResultados([]);
    setTermo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!composicaoSelecionada) {
      setError("Selecione uma composição");
      return;
    }

    if (!estadoOrcamento) {
      setError(
        "Estado não definido no orçamento. Por favor, edite o orçamento e selecione um estado.",
      );
      return;
    }

    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      setError("Quantidade deve ser maior que zero");
      return;
    }

    setSubmitting(true);
    setError(null);

    const variaveisPayload = {
      config: variableConfigs,
      elementos: elementos,
    };

    try {
      if (itemToEdit) {
        // UPDATE Mode
        const itemUpdate: OrcamentoItemUpdate = {
          codigo_composicao: composicaoSelecionada.codigo_composicao,
          descricao: composicaoSelecionada.descricao,
          quantidade: qtd,
          unidade: composicaoSelecionada.unidade,
          etapa_id: etapaId || undefined,
          memoria_calculo: formula || undefined,
          variaveis: variaveisPayload,
          fonte: composicaoSelecionada.fonte,
        };
        await updateItem(orcamentoId, itemToEdit.id, itemUpdate);
      } else {
        // CREATE Mode
        const itemData: OrcamentoItemCreate = {
          codigo_composicao: composicaoSelecionada.codigo_composicao,
          descricao: composicaoSelecionada.descricao,
          quantidade: qtd,
          unidade: composicaoSelecionada.unidade,
          etapa_id: etapaId || undefined,
          memoria_calculo: formula || undefined,
          variaveis: variaveisPayload,
          fonte: composicaoSelecionada.fonte,
          preco_unitario: composicaoSelecionada.preco,
        };
        await addItem(orcamentoId, itemData);

        // Only clear form on create
        setComposicaoSelecionada(null);
        setQuantidade("1");
        setTermo("");
        setFormula("");
        setVariableConfigs(DEFAULT_VARIABLE_CONFIGS.PRESET_3);
        setElementos([]);
      }

      if (onItemAdded) {
        onItemAdded();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        {itemToEdit ? "Editar Item" : "Adicionar Item"}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Etapa Selection */}
        {etapas.length > 0 && (
          <div>
            <label className="block text-sm font-bold mb-2" htmlFor="etapa">
              Etapa
            </label>
            <select
              id="etapa"
              value={etapaId}
              onChange={(e) => setEtapaId(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md bg-white focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
            >
              <option value="">Sem etapa definida</option>
              {(() => {
                // Função recursiva para renderizar opções do select com indentação
                const renderOptions = (
                  parentId: string | null = null,
                  level = 0,
                ) => {
                  return etapas
                    .filter((etapa) => etapa.parent_id === parentId)
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((etapa) => (
                      <React.Fragment key={etapa.id}>
                        <option value={etapa.id}>
                          {"\u00A0".repeat(level * 4)}
                          {level > 0 ? "↳ " : ""}
                          {etapa.nome}
                        </option>
                        {renderOptions(etapa.id, level + 1)}
                      </React.Fragment>
                    ));
                };
                return renderOptions();
              })()}
            </select>
          </div>
        )}

        {/* Busca de Composição */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold" htmlFor="busca">
              Buscar Composição
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBaseBusca("SINAPI")}
                className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${
                  baseBusca === "SINAPI"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                SINAPI
              </button>
              <button
                type="button"
                onClick={() => setBaseBusca("SEINFRA")}
                className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${
                  baseBusca === "SEINFRA"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                SEINFRA
              </button>
            </div>
          </div>

          {composicaoSelecionada ? (
            <div className="border border-green-300 bg-green-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        composicaoSelecionada.fonte === "SEINFRA"
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {composicaoSelecionada.fonte}
                    </span>
                    {composicaoSelecionada.codigo_composicao} -{" "}
                    {composicaoSelecionada.descricao}
                  </p>
                  <p className="text-sm text-slate-600">
                    Unidade: {composicaoSelecionada.unidade}
                  </p>
                </div>
                {!itemToEdit && (
                  <button
                    type="button"
                    onClick={() => setComposicaoSelecionada(null)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
                {itemToEdit && (
                  <button
                    type="button"
                    onClick={() => setComposicaoSelecionada(null)}
                    className="text-brand-primary hover:text-brand-navy text-sm underline ml-4 cursor-pointer"
                  >
                    Trocar Serviço
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                id="busca"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Digite código ou descrição da composição"
                className="border border-gray-300 p-2 w-full rounded-md"
              />
              {loading && (
                <p className="text-sm text-slate-500 mt-1">Buscando...</p>
              )}
              {resultados.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                  {resultados.map((item) => (
                    <div
                      key={item.codigo_composicao}
                      onClick={() => handleSelectComposicao(item)}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-semibold text-slate-800 flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.fonte === "SEINFRA"
                              ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {item.fonte}
                        </span>
                        {item.codigo_composicao} - {item.descricao}
                      </p>
                      <p className="text-sm text-slate-600">
                        Unidade: {item.unidade}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Estado do Orçamento (apenas informativo) */}
        {estadoOrcamento && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Estado do orçamento:</span>{" "}
              {ESTADOS.find((e) => e.value === estadoOrcamento)?.label ||
                estadoOrcamento.toUpperCase()}
            </p>
            <p className="text-xs text-brand-primary mt-1">
              Os preços serão buscados automaticamente para este estado.
            </p>
          </div>
        )}

        {!estadoOrcamento && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Estado não definido. Por favor, edite o orçamento e selecione
              um estado primeiro.
            </p>
          </div>
        )}

        {/* Quantidade */}
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="quantidade">
            Quantidade
          </label>
          <div className="relative">
            <input
              type="number"
              id="quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              onClick={openFormulaModal}
              min="0.01"
              step="0.01"
              className="border border-gray-300 p-2 w-full rounded-md cursor-pointer hover:bg-slate-50"
              required
              disabled={!composicaoSelecionada}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clique para abrir a memória de cálculo e definir a fórmula
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 p-2 rounded-md transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !composicaoSelecionada || !estadoOrcamento}
            className="flex-1 bg-brand-primary hover:bg-brand-navy disabled:bg-brand-primary/50 text-white p-2 rounded-md transition-colors cursor-pointer"
          >
            {submitting
              ? "Salvando..."
              : itemToEdit
                ? "Salvar Alterações"
                : "Adicionar ao Orçamento"}
          </button>
        </div>
      </form>

      {/* Memorial de Cálculo Modal */}
      <Modal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        title={`Memória de Cálculo — ${composicaoSelecionada?.descricao || "Item"}`}
        maxWidth="max-w-5xl"
      >
        <div className="flex flex-col gap-6 text-slate-800">
          {/* Action Bar & Dynamic Variable Mode Controls */}
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
                    variableConfigs.length === 2 && variableConfigs[0].key === "quantidade" && variableConfigs[1].key === "largura"
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
                    variableConfigs.length === 3 && variableConfigs[0].key === "quantidade" && variableConfigs[1].key === "largura" && variableConfigs[2].key === "altura"
                      ? "bg-[#001b3d] text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="3 Variáveis: Subtotal = Qtd × Largura × Altura"
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
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                + Variável de Coluna
              </button>
              <button
                type="button"
                onClick={addElemento}
                className="border border-[#74777f] hover:bg-slate-100 text-[#44474e] flex gap-2 items-center px-4 py-1.5 rounded-lg font-bold transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Adicionar Elemento
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="shrink-0 border border-[#c4c6cf] rounded-[12px] overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto overflow-y-auto min-h-[140px] max-h-60 sm:max-h-72">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#f1f4f6] shadow-sm">
                  <tr className="bg-[#f1f4f6] text-[#44474e] font-bold text-xs uppercase border-b border-[#c4c6cf]">
                    <th className="px-4 py-4 w-1/3">ELEMENTO / DESCRIÇÃO</th>
                    {variableConfigs.map((cfg) => (
                      <th key={cfg.id} className="px-4 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={cfg.label}
                            onChange={(e) => handleUpdateColumnLabel(cfg.key, e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-400 focus:border-brand-primary text-center font-bold text-xs uppercase outline-none max-w-[140px]"
                            title="Clique para editar o nome da variável"
                          />
                          {variableConfigs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariableColumn(cfg.key)}
                              className="text-slate-400 hover:text-red-500 text-xs p-0.5 rounded transition-colors cursor-pointer"
                              title="Remover esta variável"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-4 text-right">SUBTOTAL</th>
                    <th className="px-4 py-4 text-center w-20">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cf]">
                  {elementos.length === 0 ? (
                    <tr>
                      <td colSpan={variableConfigs.length + 3} className="text-center py-8 text-slate-400 italic text-sm">
                        Nenhum elemento adicionado. Clique em &quot;Adicionar Elemento&quot; para começar.
                      </td>
                    </tr>
                  ) : (
                    elementos.map((el, index) => {
                      const isDiscount = el.quantidade < 0;
                      return (
                        <tr
                          key={el.id}
                          className={`transition-colors ${
                            isDiscount
                              ? "bg-[rgba(255,218,214,0.15)] hover:bg-[rgba(255,218,214,0.25)]"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          {/* ELEMENTO / DESCRIÇÃO */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-bold bg-slate-100 rounded px-1.5 py-0.5" title={`Código da variável: E${index + 1}`}>
                                E{index + 1}
                              </span>
                              <input
                                type="text"
                                value={el.descricao}
                                onChange={(e) => updateElementoDescricao(el.id, e.target.value)}
                                className={`w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-primary outline-none py-1 text-sm ${
                                  isDiscount ? "text-[#ba1a1a] font-semibold" : "text-[#181c1e]"
                                }`}
                                placeholder="Descrição do elemento"
                              />
                              {orcamento?.locais && orcamento.locais.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      updateElementoDescricao(el.id, e.target.value);
                                    }
                                  }}
                                  className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-600 cursor-pointer max-w-[120px]"
                                >
                                  <option value="">Locais...</option>
                                  {orcamento.locais.map((loc: any, idx: number) => {
                                    const value = typeof loc === "string" ? loc : loc?.nome || "";
                                    return (
                                      <option key={idx} value={value}>
                                        {value}
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </div>
                          </td>

                          {/* VARIÁVEIS ATIVAS */}
                          {variableConfigs.map((cfg) => {
                            const val = getElementVariableValue(el, cfg.key);
                            const isQtdKey = cfg.key === "quantidade";
                            return (
                              <td key={cfg.id} className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={val}
                                  onChange={(e) => updateElementoVariable(el.id, cfg.key, e.target.value)}
                                  className={`w-20 mx-auto text-center border rounded-md py-1 text-sm outline-none transition-all ${
                                    isDiscount && isQtdKey
                                      ? "bg-[rgba(255,218,214,0.3)] border-[rgba(186,26,26,0.4)] text-[#ba1a1a] font-bold focus:ring-1 focus:ring-red-500"
                                      : "border-slate-300 text-[#181c1e] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                  }`}
                                  step="any"
                                />
                              </td>
                            );
                          })}

                          {/* SUBTOTAL */}
                          <td className={`px-4 py-3 text-right text-sm font-bold whitespace-nowrap ${
                            isDiscount ? "text-[#ba1a1a]" : "text-[#181c1e]"
                          }`}>
                            {el.subtotal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}{" "}
                            {composicaoSelecionada?.unidade || "m²"}
                          </td>

                          {/* AÇÕES */}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeElemento(el.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-all active:scale-90 cursor-pointer"
                              title="Remover Elemento"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção - Fórmula de Cálculo (Campo Necessário) */}
          <div className="shrink-0 border-t border-[#c4c6cf] pt-4">
            <div className="bg-slate-50 border border-[#c4c6cf] rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="formula-input" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
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
                  onClick={() => setFormula(generateDefaultFormula(variableConfigs))}
                  className="text-xs text-brand-primary hover:text-brand-navy font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  title="Redefinir fórmula para a multiplicação padrão das variáveis"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Restaurar Fórmula Padrão ({generateDefaultFormula(variableConfigs)})
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Esta fórmula é aplicada ao subtotal de cada elemento utilizando suas variáveis (ex: <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">quantidade</code>, <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">largura</code>, <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">altura</code>). O resultado total do item é a soma de todos os subtotais.
              </p>

              <div className="space-y-1.5">
                <input
                  id="formula-input"
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="Ex: quantidade * largura * altura"
                  className={`w-full border rounded-lg p-3 font-mono text-base font-bold outline-none transition-all shadow-sm ${
                    formulaError
                      ? "border-red-400 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-400"
                      : "border-slate-300 bg-white text-slate-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  }`}
                  required
                />

                {formulaError && (
                  <p className="text-red-500 text-xs font-semibold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                {/* Inserir Variáveis & Operadores */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Variáveis de Coluna:</span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-0.5">
                    {variableConfigs.map((cfg) => {
                      const label = cfg.label.split("(")[0].split("/")[0].trim() || cfg.key;
                      return (
                        <button
                          key={cfg.id}
                          type="button"
                          onClick={() => setFormula((f) => (f ? `${f} * ${cfg.key}` : cfg.key))}
                          className="bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                          title={`Inserir variável da coluna: ${cfg.label} (${cfg.key})`}
                        >
                          {label}
                        </button>
                      );
                    })}
                    {orcamento?.variaveis_globais && orcamento.variaveis_globais.length > 0 && (
                      <>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2 self-center">Globais:</span>
                        {orcamento.variaveis_globais.map((g: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormula((f) => (f ? `${f} * ${g.nome}` : g.nome))}
                            className="bg-white border border-slate-200 hover:border-[#9fd300] hover:text-[#001b3d] text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-semibold shadow-xs transition-colors cursor-pointer"
                            title={`Inserir variável global: ${g.nome} = ${g.valor}`}
                          >
                            {g.nome} ({g.valor})
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-2">Operadores:</span>
                  <div className="flex flex-wrap gap-1">
                    {["+", "-", "*", "/", "(", ")"].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setFormula((f) => (f ? `${f} ${op} ` : `${op} `))}
                        className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        {op}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormula("")}
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

          {/* Footer Result Bar */}
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
                {composicaoSelecionada?.unidade || "m²"}
              </span>
            </div>
          </div>

          {/* Final Actions */}
          <div className="shrink-0 flex gap-3 justify-end pt-2 border-t border-[#c4c6cf]">
            <button
              type="button"
              onClick={() => setShowFormulaModal(false)}
              className="px-6 py-2.5 text-[#44474e] hover:bg-slate-100 rounded-lg font-bold transition-all text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyFormula}
              disabled={previewResult === null || !formula.trim() || !!formulaError}
              className="bg-[#b9f61d] text-[#141f00] flex gap-2 items-center px-6 py-2.5 rounded-xl font-bold hover:bg-[#a6de1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm active:scale-95 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Aplicar no Orçamento
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
