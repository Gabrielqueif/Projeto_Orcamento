"use client";

import Link from "next/link";
import { useState } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { criarObra } from "@/lib/api/obras";
import { alocarMembrosAoOrcamento } from "@/lib/api/membros_equipe";
import { useRouter } from "next/navigation";

import { ObraWizardStepper, ObraWizardResumo, resumoBase } from "@/components/obras/ObraWizardStepper";
import { useToast } from "@/components/common/toast";

export default function NovaObraEtapa3Page() {
  const { showToast } = useToast();
  const { data, updateData } = useWizard();
  const [custoEstimado, setCustoEstimado] = useState<string>("");
  const [margemLucro, setMargemLucro] = useState<number>(15);
  const [centroCusto, setCentroCusto] = useState<string>("");
  const [metodoFaturamento, setMetodoFaturamento] = useState<string>("monthly");
  const [prazosFornecedores, setPrazosFornecedores] = useState<number[]>([15, 28]);
  const [outroPrazo, setOutroPrazo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const togglePrazo = (dias: number) => {
    setPrazosFornecedores((prev) =>
      prev.includes(dias) ? prev.filter((d) => d !== dias) : [...prev, dias]
    );
  };

  const handleFinish = async () => {
    if (!data.nome || !data.cliente) {
      showToast("Por favor, preencha os dados básicos na Etapa 1.", undefined, "warning");
      router.push("/obras/novo");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataInicio = data.dataInicio || new Date().toISOString().split("T")[0];
      const msPorDia = 24 * 60 * 60 * 1000;
      const prazoDias = data.dataTermino
        ? Math.max(
            0,
            Math.round(
              (new Date(data.dataTermino).getTime() - new Date(dataInicio).getTime()) / msPorDia
            )
          )
        : 0;

      // 1. Criar a obra; o backend gera junto um orçamento em branco vinculado a ela
      const novaObra = await criarObra({
        nome: data.nome,
        cliente: data.cliente,
        endereco: data.endereco ? { logradouro: data.endereco } : undefined,
        escopo: data.nome,
        estado: data.estado || "SP",
        fonte: "SINAPI",
        base_referencia: data.baseReferencia || "SINAPI",
        tipo_composicao: data.tipoComposicao || "Sem Desoneração",
        bdi: data.bdi || 0,
        data_inicio_real: dataInicio,
        prazo_estimado_dias: prazoDias,
      });

      // 2. Alocar membros do contexto ao orçamento da obra, se houver
      if (data.membros && data.membros.length > 0 && novaObra?.orcamento_id) {
        await alocarMembrosAoOrcamento(data.membros, novaObra.orcamento_id).catch(() => {});
      }

      showToast("Obra e Orçamento criados com sucesso!", undefined, "success");
      router.push("/obras");
    } catch (error) {
      console.error("Erro ao finalizar projeto:", error);
      showToast("Ocorreu um erro ao salvar o projeto.", undefined, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FATS = [
    { k: "monthly", titulo: "Medição mensal", desc: "Fatura o executado no mês, com boletim." },
    { k: "milestone", titulo: "Por marco de entrega", desc: "Fatura quando cada marco ou etapa é entregue." },
    { k: "fixed", titulo: "Preço global", desc: "Valor fechado para a obra inteira." },
  ];
  const fatAtual = FATS.find((f) => f.k === metodoFaturamento);

  return (
    <>
      <ObraWizardStepper currentStep={3} />

      <div className="gp-split">
        <div className="gp-main" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section className="gp-card gp-pad gp-4c-form" aria-label="Financeiro" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div className="gp-fld">
                <label htmlFor="o-vc" className="gp-lb">Custo total estimado</label>
                <div className="gp-affix">
                  <span>R$</span>
                  <input id="o-vc" placeholder="0,00" aria-describedby="o-vc-h" value={custoEstimado} onChange={(e) => setCustoEstimado(e.target.value)} />
                </div>
                <span id="o-vc-h" className="gp-hint">Valor bruto aproximado para o fechamento do contrato inicial.</span>
              </div>
              <div className="gp-fld">
                <label htmlFor="o-bdi" className="gp-lb">BDI</label>
                <div className="gp-affix">
                  <input id="o-bdi" type="number" step="0.01" placeholder="0,00" value={data.bdi || 0} onChange={(e) => updateData({ bdi: parseFloat(e.target.value) || 0 })} />
                  <span>%</span>
                </div>
              </div>
              <div className="gp-fld">
                <label htmlFor="o-mg" className="gp-lb">Margem de lucro esperada</label>
                <div className="gp-affix">
                  <input id="o-mg" type="number" step="0.1" placeholder="15,0" value={margemLucro} onChange={(e) => setMargemLucro(parseFloat(e.target.value) || 0)} />
                  <span>%</span>
                </div>
              </div>
            </div>

            <div role="radiogroup" aria-label="Forma de faturamento" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {FATS.map((f) => {
                const on = f.k === metodoFaturamento;
                return (
                  <button
                    key={f.k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMetodoFaturamento(f.k)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, minHeight: 92, padding: 14, borderRadius: 14,
                      color: "#001b3d", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                      ...(on ? { border: "2px solid #001b3d", background: "#F7FCE9" } : { border: "1px solid #CBD5E1", background: "#fff" }),
                    }}
                  >
                    <strong style={{ fontSize: 15 }}>{f.titulo}</strong>
                    <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.4 }}>{f.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="gp-fld" style={{ maxWidth: 320 }}>
              <label htmlFor="o-cc" className="gp-lb">Código do centro de custo</label>
              <input id="o-cc" className="gp-in gp-mono" placeholder="Ex: OBRA-2024-001" value={centroCusto} onChange={(e) => setCentroCusto(e.target.value)} />
            </div>

            <h2 className="gp-h2" style={{ fontSize: 16 }}>Regras de pagamento</h2>
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <legend className="gp-lb" style={{ marginBottom: 8, padding: 0 }}>Prazos padrão para fornecedores (dias)</legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                {[15, 28, 45].map((dias) => (
                  <label key={dias} className="gp-chip" style={{ gap: 10 }}>
                    <input type="checkbox" checked={prazosFornecedores.includes(dias)} onChange={() => togglePrazo(dias)} style={{ width: 18, height: 18, accentColor: "#001b3d" }} />
                    {dias} dias
                  </label>
                ))}
                <div style={{ flex: "1 1 200px", maxWidth: 280 }}>
                  <label htmlFor="o-outro" className="gp-sr">Outro prazo em dias</label>
                  <input id="o-outro" className="gp-in" style={{ height: 44 }} placeholder="Outro prazo (ex: 30, 60...)" value={outroPrazo} onChange={(e) => setOutroPrazo(e.target.value)} />
                </div>
              </div>
              <span className="gp-hint">Estas regras serão sugeridas automaticamente em novos pedidos de compra vinculados a esta obra.</span>
            </fieldset>
          </section>

          {/* No mobile vira rodapé fixo (gp-4c-wfoot) */}
          <div className="gp-4c-wfoot" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Link href="/obras/novo/etapa-2" className="gp-btn gp-bs">Voltar</Link>
            <button type="button" className="gp-btn gp-bp" onClick={handleFinish} disabled={isSubmitting} style={isSubmitting ? { opacity: 0.6 } : undefined}>
              {isSubmitting ? "Criando projeto..." : "Criar obra"}
            </button>
          </div>
        </div>

        <ObraWizardResumo itens={[...resumoBase(data), { label: "Faturamento", valor: fatAtual?.titulo ?? "—" }]} />
      </div>
    </>
  );
}
