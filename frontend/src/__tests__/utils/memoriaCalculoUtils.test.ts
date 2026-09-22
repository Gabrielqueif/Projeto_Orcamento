import {
  isLegacyFormula,
  generateDefaultFormula,
  calculateElementSubtotal,
  parseSavedMemoria,
  getCleanVariableName,
} from "@/components/orcamentos/item-form/utils/memoriaCalculoUtils";
import { DEFAULT_VARIABLE_CONFIGS } from "@/components/orcamentos/item-form/types";

describe("memoriaCalculoUtils", () => {
  describe("getCleanVariableName", () => {
    it("deve retornar a chave técnica limpa para presets", () => {
      expect(getCleanVariableName({ id: "qtd", label: "QTD / REP.", key: "quantidade" })).toBe("quantidade");
      expect(getCleanVariableName({ id: "larg", label: "LARGURA (M)", key: "largura" })).toBe("largura");
    });

    it("deve remover sufixos de timestamp de chave concatenada mantendo o nome limpo", () => {
      expect(
        getCleanVariableName({ id: "col_1", label: "ESPESSURA", key: "espessura_4123" })
      ).toBe("espessura");
    });

    it("deve respeitar labels personalizadas como LARGURA e COMPRIMENTO", () => {
      expect(getCleanVariableName({ id: "qtd", label: "LARGURA", key: "quantidade" })).toBe("largura");
      expect(getCleanVariableName({ id: "dim1", label: "COMPRIMENTO", key: "largura" })).toBe("comprimento");
    });
  });
  describe("isLegacyFormula", () => {
    it("deve identificar fórmulas vazias como legadas para forçar geração padrão", () => {
      expect(isLegacyFormula("")).toBe(true);
      expect(isLegacyFormula("   ")).toBe(true);
      expect(isLegacyFormula(null)).toBe(true);
      expect(isLegacyFormula(undefined)).toBe(true);
    });

    it("deve identificar padrões legados E1 + E2 ou L1 * L2", () => {
      expect(isLegacyFormula("E1 + E2")).toBe(true);
      expect(isLegacyFormula("E1 * E2 - E3")).toBe(true);
      expect(isLegacyFormula("L1 + L2")).toBe(true);
    });

    it("não deve considerar fórmulas com nomes de variáveis como legadas", () => {
      expect(isLegacyFormula("quantidade * largura * altura")).toBe(false);
      expect(isLegacyFormula("qtd * larg")).toBe(false);
    });
  });

  describe("generateDefaultFormula", () => {
    it("deve gerar fórmula padrão multiplicando variáveis", () => {
      expect(generateDefaultFormula(DEFAULT_VARIABLE_CONFIGS.PRESET_1)).toBe("quantidade");
      expect(generateDefaultFormula(DEFAULT_VARIABLE_CONFIGS.PRESET_2)).toBe("quantidade * largura");
      expect(generateDefaultFormula(DEFAULT_VARIABLE_CONFIGS.PRESET_3)).toBe(
        "quantidade * largura * altura"
      );
    });
  });

  describe("calculateElementSubtotal", () => {
    const configs = DEFAULT_VARIABLE_CONFIGS.PRESET_3;
    const elemento = {
      id: "1",
      descricao: "Parede Sala",
      quantidade: 2,
      largura: 3.5,
      altura: 2.8,
      subtotal: 0,
    };

    it("deve calcular subtotal multiplicando variáveis quando não houver fórmula", () => {
      const subtotal = calculateElementSubtotal(elemento, configs, "");
      expect(subtotal).toBe(19.6); // 2 * 3.5 * 2.8 = 19.6
    });

    it("deve calcular subtotal aplicando fórmula fornecida", () => {
      const subtotal = calculateElementSubtotal(elemento, configs, "quantidade * largura * altura");
      expect(subtotal).toBe(19.6);
    });

    it("deve aceitar aliases comuns como qtd, larg e alt", () => {
      const subtotal = calculateElementSubtotal(elemento, configs, "qtd * larg * alt");
      expect(subtotal).toBe(19.6);
    });

    it("deve suportar valores de quantidade negativos como dedução/desconto", () => {
      const elementoDesconto = {
        ...elemento,
        quantidade: -1,
        largura: 0.8,
        altura: 2.1,
      };
      const subtotal = calculateElementSubtotal(elementoDesconto, configs, "quantidade * largura * altura");
      expect(subtotal).toBe(-1.68);
    });

    it("deve suportar variáveis globais do orçamento", () => {
      const globais = [{ nome: "pe_direito", valor: "3.0" }];
      const subtotal = calculateElementSubtotal(
        elemento,
        configs,
        "quantidade * largura * pe_direito",
        globais
      );
      expect(subtotal).toBe(21); // 2 * 3.5 * 3.0 = 21
    });

    it("deve calcular usando o nome limpo mesmo se a chave técnica estiver concatenada", () => {
      const customConfigs = [
        { id: "qtd", label: "QTD", key: "quantidade" },
        { id: "col_esp", label: "ESPESSURA", key: "espessura_4123" },
      ];
      const elCustom = {
        id: "1",
        descricao: "Elemento com espessura",
        quantidade: 4,
        largura: 1,
        altura: 1,
        valores: { espessura_4123: 0.15 },
        subtotal: 0,
      };
      // A fórmula usa o nome limpo "espessura", enquanto o objeto guarda "espessura_4123"
      const subtotal = calculateElementSubtotal(elCustom, customConfigs, "quantidade * espessura");
      expect(subtotal).toBe(0.6); // 4 * 0.15 = 0.6
    });

    it("deve calcular corretamente quando colunas forem renomeadas para LARGURA e COMPRIMENTO", () => {
      const renamedConfigs = [
        { id: "qtd", label: "LARGURA", key: "quantidade" },
        { id: "dim1", label: "COMPRIMENTO", key: "largura" },
      ];
      const el = {
        id: "1",
        descricao: "Elemento 1",
        quantidade: 3, // representa a largura na coluna 1
        largura: 5,    // representa o comprimento na coluna 2
        altura: 1,
        subtotal: 0,
      };
      // Fórmula padrão gerada pelas novas labels:
      expect(generateDefaultFormula(renamedConfigs)).toBe("largura * comprimento");
      // Cálculo:
      const subtotal = calculateElementSubtotal(el, renamedConfigs, "largura * comprimento");
      expect(subtotal).toBe(15);
    });

    it("deve lançar erro se a fórmula tiver caracteres ou variáveis inválidas", () => {
      expect(() => {
        calculateElementSubtotal(elemento, configs, "quantidade * variavel_inexistente");
      }).toThrow();
    });
  });

  describe("parseSavedMemoria", () => {
    it("deve retornar preset 3 vazio se não houver dados salvos", () => {
      const result = parseSavedMemoria(null);
      expect(result.config).toEqual(DEFAULT_VARIABLE_CONFIGS.PRESET_3);
      expect(result.elementos).toEqual([]);
    });

    it("deve parsear o formato moderno com config e elementos", () => {
      const saved = {
        config: DEFAULT_VARIABLE_CONFIGS.PRESET_2,
        elementos: [
          {
            id: "el-1",
            descricao: "Viga V1",
            quantidade: 2,
            largura: 5,
            altura: 1,
            valores: {},
            subtotal: 10,
          },
        ],
      };
      const result = parseSavedMemoria(saved);
      expect(result.config).toEqual(DEFAULT_VARIABLE_CONFIGS.PRESET_2);
      expect(result.elementos.length).toBe(1);
      expect(result.elementos[0].descricao).toBe("Viga V1");
    });
  });
});
