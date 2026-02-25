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
              className="border border-gray-300 p-2 w-full rounded-md bg-white focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
            >
              <option value="">Sem etapa definida</option>
              {(() => {
                // Função recursiva para renderizar opções do select com indentação
                const renderOptions = (parentId: string | null = null, level = 0) => {
                  return etapas
                    .filter(etapa => etapa.parent_id === parentId)
                    .sort((a, b) => a.ordem - b.ordem)
                    .map(etapa => (
                      <React.Fragment key={etapa.id}>
                        <option value={etapa.id}>
                          {'\u00A0'.repeat(level * 4)}
                          {level > 0 ? '↳ ' : ''}
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
            <p className="text-xs text-brand-primary mt-1">
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
            className="flex-1 bg-brand-primary hover:bg-brand-navy disabled:bg-brand-primary/50 text-white p-2 rounded-md transition-colors"
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
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Coluna da Esquerda: Fórmula e Resultado (2/3) */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Fórmula / Memória de Cálculo
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-4 h-64 font-mono text-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none resize-none shadow-sm"
                placeholder="Ex: (LARGURA * COMPRIMENTO) + 5"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                autoFocus
              />
              {formulaError && (
                <p className="text-red-500 text-sm mt-2 font-medium">{formulaError}</p>
              )}
              <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-bold">Dica:</span> Use os nomes das variáveis criadas à direita.
                  Suporta operações básicas <code className="bg-white px-1 rounded">+ - * /</code> e parênteses.
                </p>
              </div>
            </div>

            {/* Resultado em destaque */}
            <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center shadow-inner">
              <span className="text-slate-400 font-medium tracking-wide uppercase text-sm">Resultado Final</span>
              <div className="text-right">
                <span className="text-4xl font-black text-brand-primary">
                  {previewResult !== null ? previewResult.toLocaleString('pt-BR') : '---'}
                </span>
                <span className="ml-2 text-slate-500 font-bold">{composicaoSelecionada?.unidade}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyFormula}
                disabled={previewResult === null}
                className="px-8 py-2.5 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                Aplicar no Item
              </button>
            </div>
          </div>

          {/* Coluna da Direita: Variáveis (1/3) */}
          <div className="md:col-span-4 flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Variáveis</h4>
              <button
                type="button"
                onClick={addVariable}
                className="text-xs bg-brand-primary text-white hover:bg-brand-navy px-3 py-1.5 rounded-full transition-colors font-bold shadow-sm"
              >
                + Nova
              </button>
            </div>

            <div className="p-4 flex-grow space-y-3 overflow-y-auto max-h-[400px]">
              {variables.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-slate-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-slate-400 text-xl font-bold">x</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">Crie variáveis para reutilizar valores na fórmula.</p>
                </div>
              ) : (
                variables.map((variable) => (
                  <div key={variable.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2 group relative">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                        placeholder="NOME"
                        className="w-full text-xs font-bold border-none bg-slate-100 focus:bg-white p-1.5 rounded uppercase outline-brand-primary"
                      />
                      <button
                        onClick={() => removeVariable(variable.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={variable.value}
                        onChange={(e) => updateVariable(variable.id, 'value', Number(e.target.value))}
                        placeholder="Valor"
                        className="flex-1 text-sm border border-slate-200 p-1.5 rounded focus:ring-1 focus:ring-brand-primary outline-none"
                      />
                      <button
                        onClick={() => insertVariable(variable.name)}
                        className="px-3 py-1.5 text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-200 rounded-md hover:bg-blue-100 transition-colors uppercase"
                        title="Inserir na fórmula"
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-tighter">
                Reutilize variáveis clicando em "USAR"
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
