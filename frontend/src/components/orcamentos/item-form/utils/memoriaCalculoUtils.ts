import {
  type VariableConfig,
  type MemoriaCalculoElemento,
  type ParsedMemoria,
  DEFAULT_VARIABLE_CONFIGS,
} from "../types";

/**
 * Checa se a fórmula utiliza o padrão legado (ex: E1 + E2, L1 * L2).
 */
export const isLegacyFormula = (f?: string | null): boolean => {
  if (!f || !f.trim()) return true;
  return /^[EL]\d+(\s*[+\-*/]\s*[EL]\d+)*$/i.test(f.trim());
};

/**
 * Retorna o nome amigável e limpo da variável para uso na fórmula matemática.
 * Mantém a desambiguação interna na chave (key), mas exibe e insere na fórmula
 * o nome limpo sem o sufixo numérico gerado pelo timestamp (ex: "espessura" ao invés de "espessura_4123").
 */
export const getCleanVariableName = (cfg: VariableConfig): string => {
  if (cfg.label && cfg.label.trim()) {
    const trimmedLabel = cfg.label.trim();

    // Rótulos padrão dos presets preservam o nome canônico tradicional
    if (trimmedLabel === "QTD / REP.") return "quantidade";
    if (trimmedLabel === "COMPR. / LARGURA (M)") return "largura";
    if (trimmedLabel === "ALTURA / COMPR. (M)") return "altura";

    // Se o usuário personalizou a label (ex: "LARGURA", "COMPRIMENTO", "ESPESSURA")
    const clean = trimmedLabel
      .split("(")[0]
      .split("/")[0]
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "");

    if (clean) return clean;
  }

  if (cfg.key) {
    return cfg.key.replace(/_\d{4,}$/, "");
  }

  return "var";
};

/**
 * Gera a expressão de fórmula padrão multiplicando todas as variáveis configuradas.
 */
export const generateDefaultFormula = (configs: VariableConfig[]): string => {
  if (!configs || configs.length === 0) return "quantidade";
  return configs.map((c) => getCleanVariableName(c)).join(" * ");
};

/**
 * Calcula o subtotal de um elemento individual aplicando as variáveis e fórmula matemática.
 */
export const calculateElementSubtotal = (
  el: MemoriaCalculoElemento,
  configs: VariableConfig[],
  formulaStr?: string,
  variaveisGlobais: Array<{ nome?: string; valor?: string | number }> | null = []
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

  // Mapeamentos de identificadores e apelidos para valores numéricos
  const mappings: { pattern: string; value: number }[] = [];

  // Coleta os cleanNames oficiais de todas as colunas para evitar que apelidos de uma coluna
  // sobreponham o nome oficial personalizado de outra coluna (ex: se coluna 2 é "comprimento"
  // e coluna 1 é "largura")
  const activeCleanNames = new Set<string>();
  configs.forEach((cfg) => {
    const cn = getCleanVariableName(cfg);
    if (cn) activeCleanNames.add(cn);
  });

  configs.forEach((cfg) => {
    let val = 1;
    if (cfg.key === "quantidade") val = typeof el.quantidade === "number" ? el.quantidade : 1;
    else if (cfg.key === "largura") val = typeof el.largura === "number" ? el.largura : 1;
    else if (cfg.key === "altura") val = typeof el.altura === "number" ? el.altura : 1;
    else if (el.valores && typeof el.valores[cfg.key] === "number") val = el.valores[cfg.key];

    const cleanName = getCleanVariableName(cfg);

    // 1. Identificador prioritário oficial
    if (cleanName) {
      mappings.push({ pattern: cleanName, value: val });
    }

    // 2. Chave técnica primária (se não colidir com o nome limpo de outra coluna)
    if (cfg.key && !activeCleanNames.has(cfg.key)) {
      mappings.push({ pattern: cfg.key, value: val });
    }

    // Função auxiliar para registrar apelidos somente se não colidirem com outras colunas
    const addAlias = (alias: string) => {
      if (alias && !activeCleanNames.has(alias) && alias !== cleanName) {
        mappings.push({ pattern: alias, value: val });
      }
    };

    if (cleanName === "quantidade" || cleanName === "qtd") {
      addAlias("quantidade");
      addAlias("qtd");
      addAlias("quant");
      addAlias("qnt");
    } else if (cleanName === "largura" || cleanName === "larg") {
      addAlias("largura");
      addAlias("larg");
      addAlias("dim1");
    } else if (cleanName === "comprimento" || cleanName === "compr") {
      addAlias("comprimento");
      addAlias("compr");
    } else if (cleanName === "altura" || cleanName === "alt") {
      addAlias("altura");
      addAlias("alt");
      addAlias("dim2");
    }

    // 3. Mapeamento por Label (ex: "QTD / REP.", "LARGURA (M)", "ESPESSURA")
    if (cfg.label) {
      const trimmedLabel = cfg.label.trim();
      if (!activeCleanNames.has(trimmedLabel.toLowerCase())) {
        mappings.push({ pattern: trimmedLabel, value: val });
      }
      const cleanLabel = cfg.label.split("(")[0].split("/")[0].trim();
      if (cleanLabel && cleanLabel !== trimmedLabel && !activeCleanNames.has(cleanLabel.toLowerCase())) {
        mappings.push({ pattern: cleanLabel, value: val });
      }
    }
  });

  // Variáveis globais do orçamento
  if (Array.isArray(variaveisGlobais)) {
    variaveisGlobais.forEach((g) => {
      if (g && g.nome) {
        const num = typeof g.valor === "number" ? g.valor : parseFloat(String(g.valor));
        if (!isNaN(num)) {
          mappings.push({ pattern: g.nome.trim(), value: num });
        }
      }
    });
  }

  // Ordena por comprimento decrescente para evitar substituições parciais indevidas
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

  // Validação de segurança de caracteres
  const testExpr = expression.replace(/,/g, ".").trim();
  if (/[^0-9+*/().\s-]/.test(testExpr)) {
    throw new Error("A fórmula contém variáveis ou caracteres não identificados");
  }

  // Avaliação segura da expressão aritmética
  // eslint-disable-next-line no-new-func
  const result = new Function(`return ${testExpr}`)();

  if (typeof result === "number" && isFinite(result) && !isNaN(result)) {
    return Number(result.toFixed(4));
  } else {
    throw new Error("Resultado do cálculo inválido");
  }
};

/**
 * Trata retrocompatibilidade para carregar memórias de cálculo salvas em versões anteriores.
 */
export const parseSavedMemoria = (saved: unknown): ParsedMemoria => {
  if (!saved) {
    return {
      config: DEFAULT_VARIABLE_CONFIGS.PRESET_3,
      elementos: [],
    };
  }

  // Formato novo com config e elementos
  if (
    typeof saved === "object" &&
    saved !== null &&
    !Array.isArray(saved) &&
    "elementos" in saved &&
    Array.isArray((saved as Record<string, unknown>).elementos)
  ) {
    const obj = saved as Record<string, unknown>;
    const rawConfigs =
      Array.isArray(obj.config) && obj.config.length > 0
        ? (obj.config as VariableConfig[])
        : DEFAULT_VARIABLE_CONFIGS.PRESET_3;

    const parsedEls = (obj.elementos as Array<Record<string, unknown>>).map((v) => ({
      id: typeof v.id === "string" ? v.id : Math.random().toString(),
      descricao: typeof v.descricao === "string" ? v.descricao : "",
      quantidade: typeof v.quantidade === "number" ? v.quantidade : 1,
      largura: typeof v.largura === "number" ? v.largura : 1,
      altura: typeof v.altura === "number" ? v.altura : 1,
      valores: (v.valores as Record<string, number>) || {},
      subtotal: typeof v.subtotal === "number" ? v.subtotal : 0,
    }));

    return {
      config: rawConfigs,
      elementos: parsedEls,
    };
  }

  // Formato antigo legacy (Array de elementos)
  if (Array.isArray(saved)) {
    const parsedEls: MemoriaCalculoElemento[] = saved.map((v: Record<string, unknown>) => {
      if (v && typeof v === "object" && "descricao" in v) {
        return {
          id: typeof v.id === "string" ? v.id : Math.random().toString(),
          descricao: typeof v.descricao === "string" ? v.descricao : "",
          quantidade: typeof v.quantidade === "number" ? v.quantidade : 1,
          largura: typeof v.largura === "number" ? v.largura : 1,
          altura: typeof v.altura === "number" ? v.altura : 1,
          valores: (v.valores as Record<string, number>) || {},
          subtotal: typeof v.subtotal === "number" ? v.subtotal : 0,
        };
      }
      return {
        id: typeof v.id === "string" ? v.id : Math.random().toString(),
        descricao: typeof v.name === "string" ? v.name : "",
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
