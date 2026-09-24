"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import {
  type BDIConfig,
  type TipoBDI,
  type RegimeTributario,
  updateOrcamento,
  type Orcamento
} from "@/lib/api/orcamentos";
import {
  Calculator,
  Percent,
  Sparkle,
  Info,
  CheckCircle,
  Spinner,
  ArrowClockwise
} from "@phosphor-icons/react";

interface BdiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  orcamento: Orcamento;
  onUpdated: () => void;
}

const DEFAULT_BDI_CONFIG: BDIConfig = {
  regime_tributario: "LUCRO_PRESUMIDO_REAL",
  ac: 4.0,
  sg: 0.8,
  r: 1.2,
  df: 1.23,
  lucro: 7.4,
  pis: 0.65,
  cofins: 3.0,
  iss: 5.0,
  cprb: 0.0,
  aliquota_simples: 0.0,
  bdi_diferenciado: 15.0
};

export function BdiConfigModal({ isOpen, onClose, orcamento, onUpdated }: BdiConfigModalProps) {
  const [tipoBdi, setTipoBdi] = React.useState<TipoBDI>(orcamento.tipo_bdi || "ANALITICO");
  const [bdiSintetico, setBdiSintetico] = React.useState<number>(orcamento.bdi || 25.0);
  const [bdiConfig, setBdiConfig] = React.useState<BDIConfig>(() => {
    return {
      ...DEFAULT_BDI_CONFIG,
      ...(orcamento.bdi_config || {})
    };
  });
  const [saving, setSaving] = React.useState(false);

  // Sincroniza estado quando o modal abre ou o orçamento muda
  React.useEffect(() => {
    if (isOpen) {
      setTipoBdi(orcamento.tipo_bdi || "ANALITICO");
      setBdiSintetico(orcamento.bdi || 25.0);
      setBdiConfig({
        ...DEFAULT_BDI_CONFIG,
        ...(orcamento.bdi_config || {})
      });
    }
  }, [isOpen, orcamento]);

  // Cálculo matemático TCU em tempo real no cliente
  const bdiCalculado = React.useMemo(() => {
    const acDec = (bdiConfig.ac || 0) / 100;
    const sgDec = (bdiConfig.sg || 0) / 100;
    const rDec = (bdiConfig.r || 0) / 100;
    const dfDec = (bdiConfig.df || 0) / 100;
    const lDec = (bdiConfig.lucro || 0) / 100;

    const impostosTotais =
      bdiConfig.regime_tributario === "SIMPLES_NACIONAL"
        ? bdiConfig.aliquota_simples || 0
        : (bdiConfig.pis || 0) + (bdiConfig.cofins || 0) + (bdiConfig.iss || 0) + (bdiConfig.cprb || 0);

    const iDec = impostosTotais / 100;

    if (iDec >= 1) return 0;

    const numerador = (1 + acDec + sgDec + rDec) * (1 + dfDec) * (1 + lDec);
    const denominador = 1 - iDec;

    const resultado = (numerador / denominador - 1) * 100;
    return Number(resultado.toFixed(2));
  }, [bdiConfig]);

  const impostosCalculados = React.useMemo(() => {
    if (bdiConfig.regime_tributario === "SIMPLES_NACIONAL") {
      return bdiConfig.aliquota_simples || 0;
    }
    return Number(((bdiConfig.pis || 0) + (bdiConfig.cofins || 0) + (bdiConfig.iss || 0) + (bdiConfig.cprb || 0)).toFixed(2));
  }, [bdiConfig]);

  // Aplicar Presets Rápidos
  const aplicarPresetLucroPresumido = () => {
    setBdiConfig({
      regime_tributario: "LUCRO_PRESUMIDO_REAL",
      ac: 4.0,
      sg: 0.8,
      r: 1.2,
      df: 1.23,
      lucro: 7.4,
      pis: 0.65,
      cofins: 3.0,
      iss: 5.0,
      cprb: 0.0,
      aliquota_simples: 0.0,
      bdi_diferenciado: 15.0
    });
  };

  const aplicarPresetSimplesNacional = () => {
    setBdiConfig({
      regime_tributario: "SIMPLES_NACIONAL",
      ac: 3.5,
      sg: 0.8,
      r: 1.0,
      df: 1.0,
      lucro: 8.0,
      pis: 0.0,
      cofins: 0.0,
      iss: 0.0,
      cprb: 0.0,
      aliquota_simples: 8.5,
      bdi_diferenciado: 14.0
    });
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      const bdiEfetivo = tipoBdi === "ANALITICO" ? bdiCalculado : bdiSintetico;

      await updateOrcamento(orcamento.id, {
        tipo_bdi: tipoBdi,
        bdi: bdiEfetivo,
        bdi_config: bdiConfig
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar BDI:", error);
      alert("Erro ao atualizar os parâmetros de BDI.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração de BDI (Bonificação e Despesas Indiretas)"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Toggle de Modo: Analítico TCU vs Sintético */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTipoBdi("ANALITICO")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              tipoBdi === "ANALITICO"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calculator size={16} /> BDI Analítico (Fórmula Oficial TCU)
          </button>
          <button
            type="button"
            onClick={() => setTipoBdi("SINTETICO")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              tipoBdi === "SINTETICO"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Percent size={16} /> BDI Sintético (Taxa Fixa Direta)
          </button>
        </div>

        {tipoBdi === "ANALITICO" ? (
          <div className="space-y-6">
            {/* Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkle size={14} className="text-amber-500" /> Presets Rápidos:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={aplicarPresetLucroPresumido}
                  className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 rounded transition-colors shadow-2xs cursor-pointer"
                >
                  Lucro Presumido / Real (Padrão TCU)
                </button>
                <button
                  type="button"
                  onClick={aplicarPresetSimplesNacional}
                  className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 rounded transition-colors shadow-2xs cursor-pointer"
                >
                  Simples Nacional (DAS)
                </button>
              </div>
            </div>

            {/* Grid de Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coluna 1: Custos Indiretos */}
              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  Custos Indiretos
                </h4>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Administração Central (AC %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiConfig.ac}
                    onChange={(e) => setBdiConfig({ ...bdiConfig, ac: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Ref. TCU: 3,00% a 5,50%</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Seguros e Garantias (SG %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiConfig.sg}
                    onChange={(e) => setBdiConfig({ ...bdiConfig, sg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Ref. TCU: 0,80% a 1,00%</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Riscos e Imprevistos (R %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiConfig.r}
                    onChange={(e) => setBdiConfig({ ...bdiConfig, r: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Ref. TCU: 0,97% a 1,27%</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Despesas Financeiras (DF %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiConfig.df}
                    onChange={(e) => setBdiConfig({ ...bdiConfig, df: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Ref. TCU: 0,59% a 1,39%</span>
                </div>
              </div>

              {/* Coluna 2: Remuneração e BDI Diferenciado */}
              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Lucro e Diferenciação
                </h4>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Lucro Bruto / Remuneração (L %)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiConfig.lucro}
                    onChange={(e) => setBdiConfig({ ...bdiConfig, lucro: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none font-semibold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Ref. TCU: 6,16% a 8,96%</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-indigo-700 block mb-1">
                    BDI Diferenciado (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiConfig.bdi_diferenciado}
                    onChange={(e) => setBdiConfig({ ...bdiConfig, bdi_diferenciado: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 bg-indigo-50/40 rounded focus:border-indigo-500 outline-none font-semibold text-indigo-900"
                  />
                  <span className="text-[10px] text-indigo-600">
                    Aplicado automaticamente em aquisição de equipamentos e materiais relevantes (Ref. TCU: 11% a 16%).
                  </span>
                </div>
              </div>

              {/* Coluna 3: Tributos e Impostos */}
              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Tributos e Impostos (I)
                </h4>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Regime Tributário
                  </label>
                  <select
                    value={bdiConfig.regime_tributario}
                    onChange={(e) => setBdiConfig({ ...bdiConfig, regime_tributario: e.target.value as RegimeTributario })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:border-blue-500 outline-none"
                  >
                    <option value="LUCRO_PRESUMIDO_REAL">Lucro Presumido / Real</option>
                    <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                  </select>
                </div>

                {bdiConfig.regime_tributario === "SIMPLES_NACIONAL" ? (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Alíquota Efetiva DAS (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={bdiConfig.aliquota_simples}
                      onChange={(e) => setBdiConfig({ ...bdiConfig, aliquota_simples: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">PIS (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bdiConfig.pis}
                          onChange={(e) => setBdiConfig({ ...bdiConfig, pis: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">COFINS (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bdiConfig.cofins}
                          onChange={(e) => setBdiConfig({ ...bdiConfig, cofins: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">ISS Municipal (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bdiConfig.iss}
                          onChange={(e) => setBdiConfig({ ...bdiConfig, iss: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">CPRB (Deson.) (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bdiConfig.cprb}
                          onChange={(e) => setBdiConfig({ ...bdiConfig, cprb: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-slate-50 p-2 rounded text-[11px] font-bold text-slate-700 flex justify-between">
                  <span>Total Impostos (I):</span>
                  <span>{impostosCalculados}%</span>
                </div>
              </div>
            </div>

            {/* Painel de Resultado e Fórmula */}
            <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-blue-200 font-mono uppercase tracking-wider">
                  Fórmula TCU Acórdão 2622/2013
                </span>
                <div className="text-xs font-mono text-blue-100">
                  BDI = [ ((1 + AC + SG + R) × (1 + DF) × (1 + L)) / (1 - I) ] - 1
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-blue-200 block">BDI Diferenciado</span>
                  <span className="text-lg font-bold text-amber-300">{bdiConfig.bdi_diferenciado}%</span>
                </div>
                <div className="text-right border-l border-blue-700/60 pl-6">
                  <span className="text-[10px] uppercase tracking-wider text-blue-200 block">BDI Padrão Calculado</span>
                  <span className="text-2xl font-black text-emerald-300">{bdiCalculado}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Modo Sintético */
          <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
              <Info size={18} className="text-blue-600" />
              <span>No modo sintético, você define diretamente as alíquotas fixas de BDI.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  BDI Padrão (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={bdiSintetico}
                  onChange={(e) => setBdiSintetico(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-indigo-800 block mb-1">
                  BDI Diferenciado (Materiais/Equipamentos) (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={bdiConfig.bdi_diferenciado}
                  onChange={(e) => setBdiConfig({ ...bdiConfig, bdi_diferenciado: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg bg-white focus:border-indigo-500 outline-none font-bold text-indigo-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rodapé / Ações */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Spinner size={16} className="animate-spin" /> Recalculando Orçamento...
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Salvar e Recalcular Orçamento
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
