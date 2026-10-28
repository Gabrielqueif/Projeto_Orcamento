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

  const setCampo = (k: keyof BDIConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBdiConfig({ ...bdiConfig, [k]: parseFloat(e.target.value) || 0 });

  const campo = (
    k: keyof BDIConfig,
    label: string,
    ref?: string,
    opts: { limite?: boolean } = { limite: true }
  ) => (
    <div className="gp-fld">
      <label className="gp-lb" htmlFor={`bdi-${k}`}>{label}</label>
      <div className="gp-affix">
        <input
          id={`bdi-${k}`}
          type="number"
          step="0.01"
          min={opts.limite === false ? undefined : "0"}
          max={opts.limite === false ? undefined : "100"}
          value={bdiConfig[k] as number}
          onChange={setCampo(k)}
        />
        <span>%</span>
      </div>
      {ref && <span className="gp-hint">{ref}</span>}
    </div>
  );

  const cartao = (titulo: string, soma: string | null, filhos: React.ReactNode) => (
    <section className="gp-card gp-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 className="gp-h2" style={{ fontSize: 16 }}>{titulo}</h3>
        {soma && <span className="gp-mono" style={{ fontWeight: 600 }}>{soma}</span>}
      </div>
      {filhos}
    </section>
  );

  const tabBtn = (ativo: boolean, onClick: () => void, icone: React.ReactNode, rotulo: string) => (
    <button type="button" role="tab" aria-selected={ativo} onClick={onClick} className="gp-tab">
      {icone} {rotulo}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração de BDI (Bonificação e Despesas Indiretas)"
      maxWidth="max-w-3xl gp-4b-tela"
    >
      <div className="gp-4b-corpo" style={{ display: "flex", flexDirection: "column", gap: 16, color: "#001b3d" }}>
        {/* Toggle de Modo: Analítico TCU vs Sintético */}
        <div role="tablist" aria-label="Modo do BDI" className="gp-tabs">
          {tabBtn(tipoBdi === "ANALITICO", () => setTipoBdi("ANALITICO"), <Calculator size={16} weight="bold" aria-hidden="true" />, "BDI Analítico (Fórmula Oficial TCU)")}
          {tabBtn(tipoBdi === "SINTETICO", () => setTipoBdi("SINTETICO"), <Percent size={16} weight="bold" aria-hidden="true" />, "BDI Sintético (Taxa Fixa Direta)")}
        </div>

        {tipoBdi === "ANALITICO" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Presets */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <span className="gp-ml" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Sparkle size={16} weight="bold" aria-hidden="true" /> Presets rápidos:
              </span>
              <button type="button" onClick={aplicarPresetLucroPresumido} className="gp-btn gp-bs gp-sm">
                Lucro Presumido / Real (Padrão TCU)
              </button>
              <button type="button" onClick={aplicarPresetSimplesNacional} className="gp-btn gp-bs gp-sm">
                Simples Nacional (DAS)
              </button>
            </div>

            <p className="gp-mono" style={{ margin: 0, padding: "14px 16px", borderRadius: 14, background: "#F4F6FA", fontSize: 14 }}>
              BDI = [(1+AC+SG+R)(1+DF)(1+L) ÷ (1−I)] − 1
              <span className="gp-hint" style={{ display: "block", fontFamily: "Manrope, sans-serif", marginTop: 4 }}>
                Fórmula TCU Acórdão 2622/2013
              </span>
            </p>

            {/* Grid de Configurações */}
            <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {cartao(
                "Despesas indiretas",
                `${(bdiConfig.ac + bdiConfig.sg + bdiConfig.r).toFixed(2).replace(".", ",")}%`,
                <>
                  {campo("ac", "Administração Central (AC)", "Ref. TCU: 3,00% a 5,50%")}
                  {campo("sg", "Seguros e Garantias (SG)", "Ref. TCU: 0,80% a 1,00%")}
                  {campo("r", "Riscos e Imprevistos (R)", "Ref. TCU: 0,97% a 1,27%")}
                </>
              )}

              {cartao(
                "Financeiras e lucro",
                `${(bdiConfig.df + bdiConfig.lucro).toFixed(2).replace(".", ",")}%`,
                <>
                  {campo("df", "Despesas Financeiras (DF)", "Ref. TCU: 0,59% a 1,39%")}
                  {campo("lucro", "Lucro Bruto / Remuneração (L)", "Ref. TCU: 6,16% a 8,96%")}
                  {campo(
                    "bdi_diferenciado",
                    "BDI Diferenciado",
                    "Aplicado automaticamente em aquisição de equipamentos e materiais relevantes (Ref. TCU: 11% a 16%)."
                  )}
                </>
              )}

              {cartao(
                "Tributos (I)",
                `${String(impostosCalculados).replace(".", ",")}%`,
                <>
                  <div className="gp-fld">
                    <label className="gp-lb" htmlFor="bdi-regime">Regime Tributário</label>
                    <select
                      id="bdi-regime"
                      value={bdiConfig.regime_tributario}
                      onChange={(e) => setBdiConfig({ ...bdiConfig, regime_tributario: e.target.value as RegimeTributario })}
                      className="gp-in"
                    >
                      <option value="LUCRO_PRESUMIDO_REAL">Lucro Presumido / Real</option>
                      <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                    </select>
                  </div>
                  {bdiConfig.regime_tributario === "SIMPLES_NACIONAL" ? (
                    campo("aliquota_simples", "Alíquota Efetiva DAS")
                  ) : (
                    <>
                      {campo("pis", "PIS", undefined, { limite: false })}
                      {campo("cofins", "COFINS", undefined, { limite: false })}
                      {campo("iss", "ISS Municipal", undefined, { limite: false })}
                      {campo("cprb", "CPRB (Deson.)", undefined, { limite: false })}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Painel de Resultado */}
            <section className="gp-card gp-pad gp-dark" aria-labelledby="bdi-resultado" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h3 id="bdi-resultado" className="gp-h2" style={{ color: "#fff" }}>BDI calculado</h3>
                <p role="status" className="gp-mono" style={{ margin: "6px 0 0", fontSize: 40, fontWeight: 600 }}>
                  {bdiCalculado}%
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="gp-ml">BDI Diferenciado</span>
                <p className="gp-mono" style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600, color: "#9fd300" }}>
                  {bdiConfig.bdi_diferenciado}%
                </p>
              </div>
            </section>
          </div>
        ) : (
          /* Modo Sintético */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
              <Info size={18} weight="bold" aria-hidden="true" />
              No modo sintético, você define diretamente as alíquotas fixas de BDI.
            </p>
            <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <div className="gp-fld">
                <label className="gp-lb" htmlFor="bdi-sintetico">BDI Padrão</label>
                <div className="gp-affix">
                  <input
                    id="bdi-sintetico"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiSintetico}
                    onChange={(e) => setBdiSintetico(parseFloat(e.target.value) || 0)}
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="gp-fld">
                <label className="gp-lb" htmlFor="bdi-dif-sint">BDI Diferenciado (Materiais/Equipamentos)</label>
                <div className="gp-affix">
                  <input
                    id="bdi-dif-sint"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={bdiConfig.bdi_diferenciado}
                    onChange={setCampo("bdi_diferenciado")}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé / Ações (fixo no mobile, com o BDI resultante sempre à vista) */}
        <div className="gp-4b-pe" style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 10 }}>
          <p className="gp-only-m" style={{ margin: 0, flexBasis: "100%", fontSize: 14, fontWeight: 700, color: "#475569" }}>
            {tipoBdi === "ANALITICO" ? "BDI calculado" : "BDI padrão"}:{" "}
            <strong className="gp-mono" style={{ fontSize: 18, color: "#001b3d" }}>
              {tipoBdi === "ANALITICO" ? bdiCalculado : bdiSintetico}%
            </strong>
          </p>
          <button type="button" onClick={onClose} disabled={saving} className="gp-btn gp-bs">
            Cancelar
          </button>
          <button type="button" onClick={handleSalvar} disabled={saving} className="gp-btn gp-bp disabled:opacity-50">
            {saving ? (
              <>
                <Spinner size={16} weight="bold" className="animate-spin" aria-hidden="true" /> Recalculando Orçamento...
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="bold" aria-hidden="true" /> Salvar e Recalcular Orçamento
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
