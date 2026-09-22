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
  type Orcamento,
} from "@/lib/api/orcamentos";
import type {
  OrcamentoItemFormProps,
  ItemComposicao,
  VariableConfig,
  MemoriaCalculoElemento,
} from "./item-form/types";
import { DEFAULT_VARIABLE_CONFIGS, ESTADOS } from "./item-form/types";
import {
  isLegacyFormula,
  generateDefaultFormula,
  calculateElementSubtotal,
  parseSavedMemoria,
} from "./item-form/utils/memoriaCalculoUtils";
import { ComposicaoSearchSelect } from "./item-form/components/ComposicaoSearchSelect";
import { EtapaSelect } from "./item-form/components/EtapaSelect";
import { MemoriaCalculoModal } from "./item-form/components/memoria-calculo/MemoriaCalculoModal";

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
  const [composicaoSelecionada, setComposicaoSelecionada] =
    React.useState<ItemComposicao | null>(null);
  const [quantidade, setQuantidade] = React.useState<string>("1");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [baseBusca, setBaseBusca] = React.useState<string>(fonteOrcamento);

  // Etapas
  const [etapas, setEtapas] = React.useState<Etapa[]>([]);
  const [etapaId, setEtapaId] = React.useState<string>(initialEtapaId);

  // Orçamento (para obter locais e variáveis globais)
  const [orcamento, setOrcamento] = React.useState<Orcamento | null>(null);

  // Memória de Cálculo
  const [showFormulaModal, setShowFormulaModal] = React.useState(false);
  const [formula, setFormula] = React.useState("");
  const [variableConfigs, setVariableConfigs] = React.useState<VariableConfig[]>(
    DEFAULT_VARIABLE_CONFIGS.PRESET_3
  );
  const [elementos, setElementos] = React.useState<MemoriaCalculoElemento[]>([]);

  // Carrega os dados do orçamento
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

  // Carrega as etapas do orçamento
  React.useEffect(() => {
    async function fetchEtapas() {
      try {
        const data = await getEtapas(orcamentoId);
        setEtapas(data);
      } catch (err) {
        console.error("Erro ao buscar etapas:", err);
      }
    }
    fetchEtapas();
  }, [orcamentoId, refreshTrigger]);

  // Preenche ou reseta o formulário ao alternar itemToEdit
  React.useEffect(() => {
    if (itemToEdit) {
      setQuantidade(itemToEdit.quantidade.toString());
      setEtapaId(itemToEdit.etapa_id || "");
      setComposicaoSelecionada({
        codigo_composicao: itemToEdit.codigo_composicao,
        descricao: itemToEdit.descricao,
        unidade: itemToEdit.unidade,
        preco: itemToEdit.preco_unitario || undefined,
        fonte: itemToEdit.fonte || fonteOrcamento,
      });

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
    } else {
      setQuantidade("1");
      setEtapaId(initialEtapaId);
      setComposicaoSelecionada(null);
      setFormula("");
      setVariableConfigs(DEFAULT_VARIABLE_CONFIGS.PRESET_3);
      setElementos([]);
    }
  }, [itemToEdit, fonteOrcamento, initialEtapaId, orcamento?.variaveis_globais]);

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
    }

    setShowFormulaModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!composicaoSelecionada) {
      setError("Selecione uma composição");
      return;
    }

    if (!estadoOrcamento) {
      setError(
        "Estado não definido no orçamento. Por favor, edite o orçamento e selecione um estado."
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

        // Limpa formulário apenas na criação
        setComposicaoSelecionada(null);
        setQuantidade("1");
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
        {/* Seleção de Etapa */}
        <EtapaSelect
          etapas={etapas}
          etapaId={etapaId}
          onChangeEtapaId={setEtapaId}
        />

        {/* Busca de Composição */}
        <ComposicaoSearchSelect
          composicaoSelecionada={composicaoSelecionada}
          onSelectComposicao={setComposicaoSelecionada}
          onClearComposicao={() => setComposicaoSelecionada(null)}
          baseBusca={baseBusca}
          onBaseBuscaChange={setBaseBusca}
          isEditing={Boolean(itemToEdit)}
        />

        {/* Estado do Orçamento (Informativo) */}
        {estadoOrcamento ? (
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
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Estado não definido. Por favor, edite o orçamento e selecione um estado primeiro.
            </p>
          </div>
        )}

        {/* Quantidade & Gatilho da Memória de Cálculo */}
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
              className="border border-gray-300 p-2 w-full rounded-md cursor-pointer hover:bg-slate-50 outline-none focus:ring-2 focus:ring-brand-primary"
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

        {/* Botões de Ação */}
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

      {/* Modal da Memória de Cálculo */}
      <MemoriaCalculoModal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        onApply={(calculatedQty) => setQuantidade(calculatedQty.toString())}
        composicaoDescricao={composicaoSelecionada?.descricao}
        unidade={composicaoSelecionada?.unidade}
        locais={orcamento?.locais}
        variaveisGlobais={orcamento?.variaveis_globais}
        formula={formula}
        onChangeFormula={setFormula}
        variableConfigs={variableConfigs}
        onChangeVariableConfigs={setVariableConfigs}
        elementos={elementos}
        onChangeElementos={setElementos}
      />
    </div>
  );
}
