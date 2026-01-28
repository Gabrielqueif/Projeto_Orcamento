'use client';

import * as React from "react";
import { addItem, updateItem, getEtapas, type OrcamentoItemCreate, type OrcamentoItemUpdate, type Etapa, type OrcamentoItem } from "@/lib/api/orcamentos";
import { buscarComposicoes as apiBuscarComposicoes } from "@/lib/api/composicoes";
import { Modal } from "@/components/ui/Modal";

interface ItemComposicao {
  codigo_composicao: string;
  descricao: string;
  unidade: string;
  preco?: number;
}

interface FormulaVariable {
  id: string;
  name: string;
  value: number;
}

const ESTADOS = [
  { value: 'ac', label: 'AC - Acre' },
  { value: 'al', label: 'AL - Alagoas' },
  { value: 'ap', label: 'AP - Amapá' },
  { value: 'am', label: 'AM - Amazonas' },
  { value: 'ba', label: 'BA - Bahia' },
  { value: 'ce', label: 'CE - Ceará' },
  { value: 'df', label: 'DF - Distrito Federal' },
  { value: 'es', label: 'ES - Espírito Santo' },
  { value: 'go', label: 'GO - Goiás' },
  { value: 'ma', label: 'MA - Maranhão' },
  { value: 'mt', label: 'MT - Mato Grosso' },
  { value: 'ms', label: 'MS - Mato Grosso do Sul' },
  { value: 'mg', label: 'MG - Minas Gerais' },
  { value: 'pa', label: 'PA - Pará' },
  { value: 'pb', label: 'PB - Paraíba' },
  { value: 'pr', label: 'PR - Paraná' },
  { value: 'pe', label: 'PE - Pernambuco' },
  { value: 'pi', label: 'PI - Piauí' },
  { value: 'rj', label: 'RJ - Rio de Janeiro' },
  { value: 'rn', label: 'RN - Rio Grande do Norte' },
  { value: 'rs', label: 'RS - Rio Grande do Sul' },
  { value: 'ro', label: 'RO - Rondônia' },
  { value: 'rr', label: 'RR - Roraima' },
  { value: 'sc', label: 'SC - Santa Catarina' },
  { value: 'sp', label: 'SP - São Paulo' },
  { value: 'se', label: 'SE - Sergipe' },
  { value: 'to', label: 'TO - Tocantins' },
];

type OrcamentoItemFormProps = {
  orcamentoId: string;
  estadoOrcamento?: string;
  refreshTrigger?: number;
  onItemAdded?: () => void;
  itemToEdit?: OrcamentoItem;
  onCancel?: () => void;
};

export function OrcamentoItemForm({ orcamentoId, estadoOrcamento, refreshTrigger, onItemAdded, itemToEdit, onCancel }: OrcamentoItemFormProps) {
  const [termo, setTermo] = React.useState('');
  const [resultados, setResultados] = React.useState<ItemComposicao[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [composicaoSelecionada, setComposicaoSelecionada] = React.useState<ItemComposicao | null>(null);
  const [quantidade, setQuantidade] = React.useState<string>('1');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Etapas State
  const [etapas, setEtapas] = React.useState<Etapa[]>([]);
  const [etapaId, setEtapaId] = React.useState<string>("");

  // Formula Modal State
  const [showFormulaModal, setShowFormulaModal] = React.useState(false);
  const [formula, setFormula] = React.useState('');
  const [variables, setVariables] = React.useState<FormulaVariable[]>([]);
  const [previewResult, setPreviewResult] = React.useState<number | null>(null);
  const [formulaError, setFormulaError] = React.useState<string | null>(null);

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
        preco: itemToEdit.preco_unitario || undefined
      });
      // Load memory and variables
      setFormula(itemToEdit.memoria_calculo || '');
      setVariables(itemToEdit.variaveis || []);

      // Clear search related states
      setTermo('');
      setResultados([]);
    } else {
      // Reset form when itemToEdit becomes null (e.g., after successful edit or cancel)
      setQuantidade('1');
      setEtapaId('');
      setComposicaoSelecionada(null);
      setTermo('');
      setResultados([]);
      setFormula('');
      setVariables([]);
    }
  }, [itemToEdit]);

  const buscarComposicoes = async () => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    setLoading(true);
    try {
      const data = await apiBuscarComposicoes(termo);
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
    if (!formula.trim()) {
      setPreviewResult(null);
      setFormulaError(null);
      return;
    }

    try {
      let expression = formula;

      // Replace variables
      // Sort by length desc to prevent partial replacements (e.g. VAR1 vs VAR10)
      const sortedVars = [...variables].sort((a, b) => b.name.length - a.name.length);

      for (const v of sortedVars) {
        if (!v.name) continue;
        // Escape special regex chars in name just in case, though we limit to alphanumeric
        const safeName = v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use word boundaries to match exact variable names
        const regex = new RegExp(`\\b${safeName}\\b`, 'g');
        expression = expression.replace(regex, v.value.toString());
      }

      // Validate characters: allowed digits, operators, parens, dot, comma, space
      if (/[^0-9+\-*/().,\s]/.test(expression)) {
        // Check if it's a variable that wasn't replaced?
        throw new Error("Caracteres ou variáveis inválidas");
      }

      // Replace comma with dot for JS evaluation
      expression = expression.replace(/,/g, '.');

      // Safe evaluation using Function
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expression}`)();

      if (isFinite(result) && !isNaN(result)) {
        setPreviewResult(Number(result.toFixed(4))); // 4 decimal places precision
        setFormulaError(null);
      } else {
        throw new Error("Resultado inválido");
      }
    } catch (err) {
      setPreviewResult(null);
      // Only show error if formula is not partial/empty looking
      setFormulaError("Fórmula inválida");
    }
  }, [formula, variables]);

  const handleApplyFormula = () => {
    if (previewResult !== null) {
      setQuantidade(previewResult.toString());
      setShowFormulaModal(false);
      // Persist formula and variables so they are available if user re-opens
    }
  };

  const openFormulaModal = () => {
    // If formula is empty, start with current quantity. Otherwise keep existing formula/memory.
    if (!formula) {
      setFormula(quantidade);
    }
    setShowFormulaModal(true);
  };

  const addVariable = () => {
    const id = Date.now().toString();
    setVariables([...variables, { id, name: `VAR${variables.length + 1}`, value: 0 }]);
  };

  const updateVariable = (id: string, field: keyof FormulaVariable, value: string | number) => {
    setVariables(variables.map(v => {
      if (v.id === id) {
        if (field === 'name') {
          // Restrict name to alphanumeric
          const sanitized = (value as string).replace(/[^a-zA-Z0-9_]/g, '');
          return { ...v, name: sanitized.toUpperCase() };
        }
        return { ...v, [field]: value };
      }
      return v;
    }));
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const insertVariable = (name: string) => {
    setFormula(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + name + ' ');
  };

  const handleSelectComposicao = (composicao: ItemComposicao) => {
    setComposicaoSelecionada(composicao);
    setResultados([]);
    setTermo('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!composicaoSelecionada) {
      setError("Selecione uma composição");
      return;
    }

    if (!estadoOrcamento) {
      setError("Estado não definido no orçamento. Por favor, edite o orçamento e selecione um estado.");
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
          variaveis: variables
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
          variaveis: variables
        };
        await addItem(orcamentoId, itemData);

        // Only clear form on create
        setComposicaoSelecionada(null);
        setQuantidade('1');
        setTermo('');
        setFormula(''); // Clear formula for next item, but keep variables
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
            <label className="block text-sm font-bold mb-2" htmlFor="etapa">Etapa</label>
            <select
              id="etapa"
              value={etapaId}
              onChange={(e) => setEtapaId(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded-md"
            >
              <option value="">Sem etapa definida</option>
              {etapas.map(etapa => (
                <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Busca de Composição */}
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="busca">
            Buscar Composição (SINAPI)
          </label>
          {composicaoSelecionada ? (
            <div className="border border-green-300 bg-green-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800">
                    {composicaoSelecionada.codigo_composicao} - {composicaoSelecionada.descricao}
                  </p>
                  <p className="text-sm text-slate-600">Unidade: {composicaoSelecionada.unidade}</p>
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
                    className="text-blue-600 hover:text-blue-800 text-sm underline ml-4"
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
              {loading && <p className="text-sm text-slate-500 mt-1">Buscando...</p>}
              {resultados.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                  {resultados.map((item) => (
                    <div
                      key={item.codigo_composicao}
                      onClick={() => handleSelectComposicao(item)}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-semibold text-slate-800">
                        {item.codigo_composicao} - {item.descricao}
                      </p>
                      <p className="text-sm text-slate-600">Unidade: {item.unidade}</p>
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
              <span className="font-semibold">Estado do orçamento:</span>{' '}
              {ESTADOS.find(e => e.value === estadoOrcamento)?.label || estadoOrcamento.toUpperCase()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Os preços serão buscados automaticamente para este estado.
            </p>
          </div>
        )}

        {!estadoOrcamento && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Estado não definido. Por favor, edite o orçamento e selecione um estado primeiro.
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
            </div>
            <p className="text-xs text-slate-500 mt-1">Clique para inserir fórmula ou memória de cálculo</p>
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
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white p-2 rounded-md transition-colors"
          >
            {submitting ? "Salvando..." : (itemToEdit ? "Salvar Alterações" : "Adicionar ao Orçamento")}
          </button>
        </div>
      </form>

      {/* Formula Modal */}
      <Modal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        title="Memória de Cálculo"
      >
        <div className="space-y-4">

          {/* Variables Section */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700">Colunas (Variáveis)</label>
              <button
                type="button"
                onClick={addVariable}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors"
              >
                + Adicionar Coluna
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {variables.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Nenhuma variável definida.</p>
              )}
              {variables.map((variable) => (
                <div key={variable.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                    placeholder="Nome"
                    className="w-1/3 text-xs border border-gray-300 p-1.5 rounded uppercase"
                  />
                  <span className="text-slate-400 font-bold">=</span>
                  <input
                    type="number"
                    value={variable.value}
                    onChange={(e) => updateVariable(variable.id, 'value', Number(e.target.value))}
                    placeholder="Valor"
                    className="flex-1 text-xs border border-gray-300 p-1.5 rounded"
                  />
                  <button
                    onClick={() => insertVariable(variable.name)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    title="Inserir na fórmula"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => removeVariable(variable.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formula Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fórmula / Memória
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 h-24 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Ex: (LARGURA * COMPRIMENTO) + 5"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              autoFocus
            />
            {formulaError && (
              <p className="text-red-500 text-sm mt-1">{formulaError}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Suporta: números, variáveis acima, operações (+ - * /) e parênteses.
            </p>
          </div>

          {/* Result Display */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex justify-between items-center">
            <span className="text-slate-600 font-medium">Resultado:</span>
            <span className="text-2xl font-bold text-blue-600">
              {previewResult !== null ? previewResult : '---'}
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowFormulaModal(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyFormula}
              disabled={previewResult === null}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar Quantidade
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
