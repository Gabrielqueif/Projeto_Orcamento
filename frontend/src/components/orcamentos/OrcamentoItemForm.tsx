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
    DEFAULT_VARIABLE_CONFIGS.PRESET_1
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
        base_propria_id: itemToEdit.base_propria_id ?? undefined,
        base_propria_nome: itemToEdit.base_propria_nome ?? undefined,
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
      setVariableConfigs(DEFAULT_VARIABLE_CONFIGS.PRESET_1);
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
          base_propria_id: composicaoSelecionada.base_propria_id,
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
          base_propria_id: composicaoSelecionada.base_propria_id,
          preco_unitario: composicaoSelecionada.preco,
        };
        await addItem(orcamentoId, itemData);

        // Limpa formulário apenas na criação
        setComposicaoSelecionada(null);
        setQuantidade("1");
        setFormula("");
        setVariableConfigs(DEFAULT_VARIABLE_CONFIGS.PRESET_1);
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
    <div className="gp-card gp-pad" style={{ maxHeight: "80vh", overflowY: "auto" }}>
      <h3 className="gp-h2" style={{ marginBottom: 16 }}>
        {itemToEdit ? "Editar Item" : "Adicionar Item"}
      </h3>

      {error && (
        <div
          role="alert"
          style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 14, background: "#FEE2E2", color: "#B91C1C", fontSize: 14, fontWeight: 700 }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          orcamentoId={orcamentoId}
          contextoPreco={{
            estado: estadoOrcamento,
            mes_referencia: orcamento?.base_referencia,
            tipo_composicao: orcamento?.tipo_composicao,
          }}
        />

        {/* Estado do Orçamento (Informativo) */}
        {estadoOrcamento ? (
          <div style={{ padding: "12px 16px", borderRadius: 14, background: "#e0f5f7", color: "#00626b" }}>
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong>Estado do orçamento:</strong>{" "}
              {ESTADOS.find((e) => e.value === estadoOrcamento)?.label ||
                estadoOrcamento.toUpperCase()}
            </p>
            <p className="gp-hint" style={{ margin: "4px 0 0", color: "#00626b" }}>
              Os preços serão buscados automaticamente para este estado.
            </p>
          </div>
        ) : (
          <div role="alert" className="gp-wa" style={{ padding: "12px 16px", borderRadius: 14, fontSize: 14, fontWeight: 700 }}>
            Estado não definido. Por favor, edite o orçamento e selecione um estado primeiro.
          </div>
        )}

        {/* Quantidade & Gatilho da Memória de Cálculo */}
        <div className="gp-fld">
          <label className="gp-lb" htmlFor="quantidade">
            Quantidade
          </label>
          <div className="gp-affix">
            <input
              type="number"
              id="quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              onClick={openFormulaModal}
              min="0.01"
              step="0.01"
              required
              disabled={!composicaoSelecionada}
            />
            {composicaoSelecionada && <span>{composicaoSelecionada.unidade}</span>}
          </div>
          <button
            type="button"
            onClick={openFormulaModal}
            disabled={!composicaoSelecionada}
            style={{ alignSelf: "flex-start", border: 0, background: "transparent", padding: 0, fontSize: 14, fontWeight: 800, color: "#001b3d", textDecoration: "underline", cursor: "pointer" }}
          >
            Calcular pela memória de cálculo
          </button>
        </div>

        {composicaoSelecionada?.preco != null && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 16px", borderRadius: 14, background: "#001b3d", color: "#fff" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1" }}>Total do item</span>
            <span className="gp-mono" style={{ fontSize: 22, fontWeight: 600 }}>
              {((parseFloat(quantidade) || 0) * composicaoSelecionada.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="submit"
            disabled={submitting || !composicaoSelecionada || !estadoOrcamento}
            className="gp-btn gp-bp disabled:opacity-50"
          >
            {submitting
              ? "Salvando..."
              : itemToEdit
                ? "Salvar Alterações"
                : "Adicionar ao Orçamento"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="gp-btn gp-bs">
              Cancelar
            </button>
          )}
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
