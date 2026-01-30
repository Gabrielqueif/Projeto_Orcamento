'use client';

import * as React from "react";
import { addItem, updateItem, getEtapas, type OrcamentoItemCreate, type OrcamentoItemUpdate, type Etapa, type OrcamentoItem } from "@/lib/api/orcamentos";
import { buscarComposicoes as apiBuscarComposicoes } from "@/lib/api/composicoes";
import { Modal } from "@/components/ui/Modal";
import { CalculationMemory, type MemoryRow } from "./CalculationMemory";
import { Calculator } from "lucide-react";

interface ItemComposicao {
  codigo_composicao: string;
  descricao: string;
  unidade: string;
  preco?: number;
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

  // Memory Modal State
  const [showMemoryModal, setShowMemoryModal] = React.useState(false);
  const [memoryRows, setMemoryRows] = React.useState<MemoryRow[]>([]);

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

      // Load memory (stored in 'variaveis')
      // Currently `variaveis` is any, but we expect it to be MemoryRow[]
      if (Array.isArray(itemToEdit.variaveis)) {
        setMemoryRows(itemToEdit.variaveis as MemoryRow[]);
      } else {
        setMemoryRows([]);
      }

      // Clear search
      setTermo('');
      setResultados([]);
    } else {
      // Reset form
      setQuantidade('1');
      setEtapaId('');
      setComposicaoSelecionada(null);
      setTermo('');
      setResultados([]);
      setMemoryRows([]);
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
    const timeoutId = setTimeout(buscarComposicoes, 300);
    return () => clearTimeout(timeoutId);
  }, [termo]);

  const handleSelectComposicao = (composicao: ItemComposicao) => {
    setComposicaoSelecionada(composicao);
    setResultados([]);
    setTermo('');
  };

  const handleMemoryChange = (total: number, rows: MemoryRow[]) => {
    setMemoryRows(rows);
    // Optional: Auto-update quantity?
    // Let's rely on user clicking "Apply" in the modal purely, 
    // or we can sync it live if the modal is open.
  };

  const handleApplyMemory = () => {
    const total = memoryRows.reduce((acc, r) => acc + r.result, 0);
    // Round to 2 decimals
    const rounded = Math.round((total + Number.EPSILON) * 100) / 100;
    setQuantidade(rounded.toString());
    setShowMemoryModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!composicaoSelecionada) {
      setError("Selecione uma composição");
      return;
    }
    if (!estadoOrcamento) {
      setError("Estado não definido no orçamento.");
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
      const commonData = {
        codigo_composicao: composicaoSelecionada.codigo_composicao,
        descricao: composicaoSelecionada.descricao,
        quantidade: qtd,
        unidade: composicaoSelecionada.unidade,
        etapa_id: etapaId || undefined,
        // We store the structured rows in 'variaveis' now
        variaveis: memoryRows.length > 0 ? memoryRows : undefined,
        // 'memoria_calculo' string could be a summary or just "PLANILHA"
        memoria_calculo: memoryRows.length > 0 ? "DYNAMIC_SHEET" : undefined
      };

      if (itemToEdit) {
        await updateItem(orcamentoId, itemToEdit.id, commonData);
      } else {
        await addItem(orcamentoId, commonData);
        // Clear mainly only quantity and composition on add
        setComposicaoSelecionada(null);
        setQuantidade('1');
        setTermo('');
        setMemoryRows([]);
      }

      if (onItemAdded) onItemAdded();
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
                <button
                  type="button"
                  onClick={() => setComposicaoSelecionada(null)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Trocar
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Digite código ou descrição..."
                className="border border-gray-300 p-2 w-full rounded-md"
              />
              {loading && <p className="text-xs text-slate-500 mt-1">Buscando...</p>}
              {resultados.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white shadow-sm z-10 relative">
                  {resultados.map((item) => (
                    <div
                      key={item.codigo_composicao}
                      onClick={() => handleSelectComposicao(item)}
                      className="p-3 hover:bg-slate-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-semibold text-sm text-slate-800">
                        {item.codigo_composicao} - {item.descricao}
                      </p>
                      <p className="text-xs text-slate-600">Unidade: {item.unidade}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Quantidade with Calc Button */}
        <div>
          <label className="block text-sm font-bold mb-2">Quantidade</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="border border-gray-300 p-2 flex-grow rounded-md"
              step="0.01"
              required
            />
            <button
              type="button"
              onClick={() => setShowMemoryModal(true)}
              className="bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 px-3 rounded-md flex items-center gap-2 transition-colors"
              title="Abrir Memória de Cálculo"
            >
              <Calculator className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Memória</span>
            </button>
          </div>
          {memoryRows.length > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              * Existem {memoryRows.length} linhas na memória de cálculo.
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
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
            disabled={submitting || !composicaoSelecionada}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white p-2 rounded-md transition-colors"
          >
            {submitting ? "Salvando..." : (itemToEdit ? "Salvar" : "Adicionar")}
          </button>
        </div>
      </form>

      {/* Dynamic Memory Modal */}
      <Modal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        title="Memória de Cálculo"
      >
        <div className="space-y-4">
          <CalculationMemory
            initialRows={memoryRows}
            onChange={handleMemoryChange}
          />

          <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <button
              onClick={() => setShowMemoryModal(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyMemory}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Aplicar Total
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

