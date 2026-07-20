"use client";

import * as React from "react";
import {
  addItem,
  updateItem,
  getEtapas,
  getOrcamento,
  updateOrcamento,
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

interface FormulaVariable {
  id: string;
  name: string;
  value: number;
}

interface MemoriaCalculoElemento {
  id: string;
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  subtotal: number;
}

const parseSavedVariables = (saved: any): MemoriaCalculoElemento[] => {
  if (!saved || !Array.isArray(saved)) return [];
  return saved.map((v: any) => {
    if (v && typeof v === "object" && "descricao" in v) {
      return {
        id: v.id || Math.random().toString(),
        descricao: v.descricao || "",
        quantidade: typeof v.quantidade === "number" ? v.quantidade : 1,
        largura: typeof v.largura === "number" ? v.largura : 0,
        altura: typeof v.altura === "number" ? v.altura : 0,
        subtotal: typeof v.subtotal === "number" ? v.subtotal : 0,
      };
    }
    // Formato antigo legacy
    return {
      id: v.id || Math.random().toString(),
      descricao: v.name || "",
      quantidade: 1,
      largura: typeof v.value === "number" ? v.value : 0,
      altura: 1,
      subtotal: typeof v.value === "number" ? v.value : 0,
    };
  });
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

  // Formula Modal State
  const [showFormulaModal, setShowFormulaModal] = React.useState(false);
  const [formula, setFormula] = React.useState("");
  const [elementos, setElementos] = React.useState<MemoriaCalculoElemento[]>([]);
  const [isFormulaExpanded, setIsFormulaExpanded] = React.useState(false);
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

  // Inline Variable Creation States & Handlers
  const [newVarNome, setNewVarNome] = React.useState("");
  const [newVarValor, setNewVarValor] = React.useState("");
  const [isCreatingVar, setIsCreatingVar] = React.useState(false);

  const handleCreateGlobalVariable = async () => {
    if (!orcamento || !newVarNome.trim() || !newVarValor.trim()) return;
    
    const cleanNome = newVarNome.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const valorNum = parseFloat(newVarValor.trim());
    if (isNaN(valorNum)) {
      alert("Por favor, digite um valor numérico válido.");
      return;
    }

    const antigasVariaveis = orcamento.variaveis_globais || [];
    if (antigasVariaveis.some((v: any) => v.nome === cleanNome)) {
      alert(`A variável "${cleanNome}" já existe neste orçamento.`);
      return;
    }

    const novasVariaveis = [...antigasVariaveis, { nome: cleanNome, valor: valorNum }];
    setIsCreatingVar(true);

    try {
      const updated = await updateOrcamento(orcamento.id, {
        variaveis_globais: novasVariaveis
      });
      setOrcamento(updated);
      setNewVarNome("");
      setNewVarValor("");
    } catch (err) {
      console.error("Erro ao criar variável global:", err);
      alert("Não foi possível salvar a variável global.");
    } finally {
      setIsCreatingVar(false);
    }
  };

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
        fonte: fonteOrcamento, // Provide default or pass from item if needed
      });
      // Load memory and variables
      setFormula(itemToEdit.memoria_calculo || "");
      setElementos(parseSavedVariables(itemToEdit.variaveis));

      // Clear search related states
      setTermo("");
      setResultados([]);
    } else {
      // Reset form when itemToEdit becomes null (e.g., after successful edit or cancel)
      setQuantidade("1");
      setEtapaId(initialEtapaId);
      setComposicaoSelecionada(null);
      setTermo("");
      setResultados([]);
      setFormula("");
      setElementos([]);
      setIsFormulaExpanded(false);
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

  // Formula Calculation Logic
  React.useEffect(() => {
    if (elementos.length === 0) {
      setPreviewResult(null);
      setFormulaError(null);
      return;
    }

    try {
      if (!formula.trim()) {
        // Sem fórmula customizada: soma simples dos subtotais dos elementos
        const total = elementos.reduce((sum, el) => sum + (el.subtotal || 0), 0);
        setPreviewResult(Number(total.toFixed(4)));
        setFormulaError(null);
        return;
      }

      let expression = formula;
      const mappings: { pattern: string; value: number }[] = [];

      elementos.forEach((el, index) => {
        if (el.descricao.trim()) {
          // Padrão 1: Descrição completa
          mappings.push({
            pattern: el.descricao.trim(),
            value: Math.abs(el.subtotal),
          });

          // Padrão 2: Sem parênteses (ex: "Parede 01")
          const cleanName = el.descricao.split("(")[0].trim();
          if (cleanName && cleanName !== el.descricao.trim()) {
            mappings.push({
              pattern: cleanName,
              value: Math.abs(el.subtotal),
            });
          }
        }

        // Padrão 3: Variável automática de linha (E1, E2, L1, L2, etc.)
        mappings.push({ pattern: `E${index + 1}`, value: Math.abs(el.subtotal) });
        mappings.push({ pattern: `L${index + 1}`, value: Math.abs(el.subtotal) });
      });

      // Adicionar variáveis globais ao mapeamento
      if (orcamento?.variaveis_globais && Array.isArray(orcamento.variaveis_globais)) {
        orcamento.variaveis_globais.forEach((v: any) => {
          if (v && v.nome && typeof v.valor === "number") {
            mappings.push({
              pattern: v.nome.trim(),
              value: v.valor,
            });
          }
        });
      }

      // Ordenar por tamanho decrescente de padrão para evitar substituições parciais
      mappings.sort((a, b) => b.pattern.length - a.pattern.length);

      // Substituir na expressão
      for (const m of mappings) {
        const escapedPattern = m.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = /^[a-zA-Z0-9_ ]+$/.test(m.pattern)
          ? new RegExp(`\\b${escapedPattern}\\b`, "gi")
          : new RegExp(escapedPattern, "gi");
        expression = expression.replace(regex, m.value.toString());
      }

      // Validar caracteres: permite números, operadores (+ - * /), parênteses, ponto, vírgula e espaços
      let testExpr = expression.replace(/,/g, ".").trim();
      if (/[^0-9+\-*/().\s]/.test(testExpr)) {
        throw new Error("A fórmula contém caracteres ou variáveis não identificadas");
      }

      // Safe evaluation using Function
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${testExpr}`)();

      if (isFinite(result) && !isNaN(result)) {
        setPreviewResult(Number(result.toFixed(4)));
        setFormulaError(null);
      } else {
        throw new Error("Resultado inválido");
      }
    } catch (err) {
      setPreviewResult(null);
      setFormulaError(err instanceof Error ? err.message : "Fórmula inválida");
    }
  }, [formula, elementos]);

  const handleApplyFormula = () => {
    if (previewResult !== null) {
      setQuantidade(previewResult.toString());
      setShowFormulaModal(false);
    }
  };

  const openFormulaModal = () => {
    // Inicializar elementos se estiver vazio
    if (elementos.length === 0) {
      const qtdAtual = parseFloat(quantidade) || 1;
      setElementos([
        {
          id: Date.now().toString(),
          descricao: "Elemento 1",
          quantidade: qtdAtual,
          largura: 1,
          altura: 1,
          subtotal: qtdAtual,
        },
      ]);
    }
    setShowFormulaModal(true);
  };

  const addElemento = () => {
    const id = Date.now().toString();
    setElementos([
      ...elementos,
      {
        id,
        descricao: `Elemento ${elementos.length + 1}`,
        quantidade: 1,
        largura: 0,
        altura: 0,
        subtotal: 0,
      },
    ]);
  };

  const updateElemento = (
    id: string,
    field: keyof MemoriaCalculoElemento,
    value: string | number
  ) => {
    setElementos(
      elementos.map((el) => {
        if (el.id === id) {
          const updated = { ...el, [field]: value };
          if (field === "quantidade") {
            updated.quantidade = parseFloat(value as string) || 0;
          } else if (field === "largura") {
            updated.largura = parseFloat(value as string) || 0;
          } else if (field === "altura") {
            updated.altura = parseFloat(value as string) || 0;
          }
          updated.subtotal = Number(
            (updated.quantidade * updated.largura * updated.altura).toFixed(4)
          );
          return updated;
        }
        return el;
      })
    );
  };

  const removeElemento = (id: string) => {
    setElementos(elementos.filter((el) => el.id !== id));
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

    try {
      if (itemToEdit) {
        // UPDATE Mode
        const itemUpdate: OrcamentoItemUpdate = {
          codigo_composicao: composicaoSelecionada.codigo_composicao,
          descricao: composicaoSelecionada.descricao,
          quantidade: qtd,
          unidade: composicaoSelecionada.unidade,
          etapa_id: etapaId || undefined,
          memoria_calculo: formula,
          variaveis: elementos,
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
          memoria_calculo: formula,
          variaveis: elementos,
          fonte: composicaoSelecionada.fonte,
          preco_unitario: composicaoSelecionada.preco,
        };
        await addItem(orcamentoId, itemData);

        // Only clear form on create
        setComposicaoSelecionada(null);
        setQuantidade("1");
        setTermo("");
        setFormula("");
        setElementos([]);
        setIsFormulaExpanded(false);
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
    <div className="bg-white p-6 rounded-lg shadow-md">
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
                {!itemToEdit && ( // Only allow remove/search new composition if adding new item?
                  // Or allow changing composition on edit? The user asked to be able to change service.
                  // So we should allow clear even in edit mode.
                  <button
                    type="button"
                    onClick={() => setComposicaoSelecionada(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
                {itemToEdit && (
                  <button
                    type="button"
                    onClick={() => setComposicaoSelecionada(null)}
                    className="text-brand-primary hover:text-brand-navy text-sm underline ml-4"
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
              Clique para inserir fórmula ou memória de cálculo
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 p-2 rounded-md transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !composicaoSelecionada || !estadoOrcamento}
            className="flex-1 bg-brand-primary hover:bg-brand-navy disabled:bg-brand-primary/50 text-white p-2 rounded-md transition-colors"
          >
            {submitting
              ? "Salvando..."
              : itemToEdit
                ? "Salvar Alterações"
                : "Adicionar ao Orçamento"}
          </button>
        </div>
      </form>

      {/* Formula Modal */}
      <Modal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        title={`Memória de Cálculo — ${composicaoSelecionada?.descricao || "Item"}`}
        maxWidth="max-w-5xl"
      >
        <div className="flex flex-col gap-6 text-slate-800">
          {/* Action Bar (Adicionar Elemento) */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addElemento}
              className="border border-[#74777f] hover:bg-slate-50 text-[#44474e] flex gap-2 items-center px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Adicionar Elemento
            </button>
          </div>

          {/* Table Container */}
          <div className="border border-[#c4c6cf] rounded-[12px] overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f4f6] text-[#44474e] font-bold text-xs uppercase border-b border-[#c4c6cf]">
                    <th className="px-4 py-4 w-1/3">ELEMENTO / DESCRIÇÃO</th>
                    <th className="px-4 py-4 text-center">QTD / REP.</th>
                    <th className="px-4 py-4 text-center">LARGURA (M)</th>
                    <th className="px-4 py-4 text-center">ALTURA / COMPR. (M)</th>
                    <th className="px-4 py-4 text-right">SUBTOTAL</th>
                    <th className="px-4 py-4 text-center w-20">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cf]">
                  {elementos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 italic text-sm">
                        Nenhum elemento adicionado. Clique em "Adicionar Elemento" para começar.
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
                              <span className="text-xs text-slate-400 font-bold bg-slate-100 rounded px-1.5 py-0.5" title="Variável de referência">
                                E{index + 1}
                              </span>
                              <input
                                type="text"
                                value={el.descricao}
                                onChange={(e) => updateElemento(el.id, "descricao", e.target.value)}
                                className={`w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-primary outline-none py-1 text-sm ${
                                  isDiscount ? "text-[#ba1a1a] font-semibold" : "text-[#181c1e]"
                                }`}
                                placeholder="Descrição do elemento"
                              />
                              {orcamento?.locais && orcamento.locais.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      updateElemento(el.id, "descricao", e.target.value);
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

                          {/* QTD / REP. */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={el.quantidade}
                              onChange={(e) => updateElemento(el.id, "quantidade", e.target.value)}
                              className={`w-20 mx-auto text-center border rounded-md py-1 text-sm outline-none transition-all ${
                                isDiscount
                                  ? "bg-[rgba(255,218,214,0.3)] border-[rgba(186,26,26,0.4)] text-[#ba1a1a] font-bold focus:ring-1 focus:ring-red-500"
                                  : "border-slate-300 text-[#181c1e] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                              }`}
                              step="any"
                            />
                          </td>

                          {/* LARGURA (M) */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={el.largura}
                              onChange={(e) => updateElemento(el.id, "largura", e.target.value)}
                              className="w-20 mx-auto text-center border border-slate-300 rounded-md py-1 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                              step="any"
                            />
                          </td>

                          {/* ALTURA / COMPR. (M) */}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={el.altura}
                              onChange={(e) => updateElemento(el.id, "altura", e.target.value)}
                              className="w-20 mx-auto text-center border border-slate-300 rounded-md py-1 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                              step="any"
                            />
                          </td>

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
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-all active:scale-90"
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

          {/* Accordion - Fórmula Customizada */}
          <div className="border-t border-[#c4c6cf] pt-4">
            <div className="bg-slate-50 border border-[#c4c6cf] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
                className="w-full flex items-center gap-2 p-4 text-[#44474e] font-bold text-sm hover:bg-slate-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${
                    isFormulaExpanded ? "rotate-90" : ""
                  }`}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                Fórmula Customizada (Opcional)
              </button>

              {isFormulaExpanded && (
                <div className="px-4 pb-4 space-y-3 bg-white border-t border-[#c4c6cf]">
                  <textarea
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="Ex: E1 + E2 - E3"
                    className="w-full border border-[#c4c6cf] rounded-lg p-4 h-24 font-mono text-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none resize-none shadow-sm"
                  />
                  {formulaError && (
                    <p className="text-red-500 text-sm font-medium">{formulaError}</p>
                  )}
                  <p className="text-xs text-slate-500 italic">
                    Por padrão, o sistema soma todos os elementos da tabela acima automaticamente.
                  </p>
                  <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200">
                    <span className="font-bold text-slate-600">Instruções de Fórmula:</span> Você pode referenciar elementos pelos seus códigos automáticos (ex: <code className="bg-slate-200 px-1 rounded">E1</code>, <code className="bg-slate-200 px-1 rounded">E2</code>) ou pelas suas descrições. As referências resolvem para o valor absoluto do subtotal para que você controle os sinais na própria fórmula.
                  </div>
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
                    <div>
                      <span className="font-bold text-slate-600 block mb-1">Variáveis Globais Disponíveis (clique para inserir):</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {!orcamento?.variaveis_globais || orcamento.variaveis_globais.length === 0 ? (
                          <span className="italic text-slate-400">Nenhuma variável global cadastrada. Use o formulário abaixo para criar uma.</span>
                        ) : (
                          orcamento.variaveis_globais.map((v: any, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormula((f) => f ? `${f} * ${v.nome}` : v.nome)}
                              className="bg-white border border-slate-200 hover:border-[#9fd300] hover:text-[#001b3d] rounded px-1.5 py-0.5 transition-colors cursor-pointer font-mono font-semibold"
                              title={`Clique para inserir: ${v.nome} = ${v.valor}`}
                            >
                              {v.nome} ({v.valor})
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Formulário Inline de Criação de Variável */}
                    <div className="border-t border-slate-200 pt-2.5">
                      <span className="font-bold text-slate-600 block mb-1">Criar Nova Variável Global:</span>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="NOME (ex: LARGURA)"
                          value={newVarNome}
                          onChange={(e) => setNewVarNome(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                          className="bg-white border border-slate-300 rounded px-2.5 py-1 text-[11px] font-mono outline-none focus:border-[#9fd300] flex-1 max-w-[150px]"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Valor (ex: 1.5)"
                          value={newVarValor}
                          onChange={(e) => setNewVarValor(e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2.5 py-1 text-[11px] outline-none focus:border-[#9fd300] w-24"
                        />
                        <button
                          type="button"
                          onClick={handleCreateGlobalVariable}
                          disabled={isCreatingVar || !newVarNome.trim() || !newVarValor.trim()}
                          className="bg-[#001b3d] hover:bg-[#00102a] text-white disabled:opacity-40 disabled:cursor-not-allowed rounded px-3 py-1 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors border-none"
                        >
                          {isCreatingVar ? "Salvando..." : "Criar Variável"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Result Bar */}
          <div className="bg-[#001b3d] rounded-lg p-5 flex justify-between items-center shadow-md">
            <span className="text-[#6f84ac] text-xs font-bold tracking-widest uppercase font-sans">
              RESULTADO TOTAL DO ITEM
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
          <div className="flex gap-3 justify-end pt-2 border-t border-[#c4c6cf]">
            <button
              type="button"
              onClick={() => setShowFormulaModal(false)}
              className="px-6 py-2.5 text-[#44474e] hover:bg-slate-100 rounded-lg font-bold transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyFormula}
              disabled={previewResult === null}
              className="bg-[#b9f61d] text-[#141f00] flex gap-2 items-center px-6 py-2.5 rounded-xl font-bold hover:bg-[#a6de1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm active:scale-95"
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
