"use client";

import Link from "next/link";
import {
  CurrencyDollar,
  Wallet,
  SlidersHorizontal,
  ArrowLeft,
  Check,
  Rocket,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { createOrcamento } from "@/lib/api/orcamentos";
import { alocarMembrosAoOrcamento } from "@/lib/api/membros_equipe";
import { useRouter } from "next/navigation";

import { ObraWizardStepper } from "@/components/obras/ObraWizardStepper";

export default function NovaObraEtapa3Page() {
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
      alert("Por favor, preencha os dados básicos na Etapa 1.");
      router.push("/obras/novo");
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse do valor total estimado preenchido pelo usuário no Wizard (Etapa 3)
      const valorTotalNum = parseFloat(
        custoEstimado.replace(/[^\d.,]/g, "").replace(",", ".")
      ) || 0;

      // 1. Criar o orçamento (obra) no backend persistindo o valor_total
      const newOrcamento = await createOrcamento({
        nome: data.nome,
        cliente: data.cliente,
        data: data.dataInicio || new Date().toISOString().split("T")[0],
        base_referencia: data.baseReferencia || "SINAPI",
        tipo_composicao: data.tipoComposicao || "Sem Desoneração",
        estado: data.estado || "SP",
        fonte: "SINAPI",
        bdi: data.bdi || 0,
        valor_total: valorTotalNum,
        status: data.status || "em_elaboracao",
      });

      // 2. Alocar membros do contexto se houver
      if (data.membros && data.membros.length > 0 && newOrcamento?.id) {
        await alocarMembrosAoOrcamento(data.membros, newOrcamento.id).catch(() => {});
      }

      alert("Obra e Orçamento criados com sucesso!");
      router.push("/obras");
    } catch (error) {
      console.error("Erro ao finalizar projeto:", error);
      alert("Ocorreu um erro ao salvar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Informações Básicas", done: true, active: false },
    { num: 2, label: "Equipe & Acessos", done: true, active: false },
    { num: 3, label: "Financeiro Inicial", done: false, active: true },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f9] -mx-8 -mb-8 -mt-8 font-['Inter']">
      {/* Header / Stepper Progress Header */}
      <ObraWizardStepper currentStep={3} nextStepLabel="Revisão Financeira" />

      {/* Main Content Area */}
      <div className="flex-1 px-8 lg:px-16 py-8">
        <div className="max-w-[1152px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card 1: Orçamento Estimado (Span 8) */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-[#d1d5db] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-9 flex items-center justify-center bg-[#9fd300]/20 rounded-md text-[#001b3c]">
                <CurrencyDollar size={22} weight="bold" />
              </div>
              <h3 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] leading-[28px]">
                Orçamento Estimado
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custo Total Estimado */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                  CUSTO TOTAL ESTIMADO (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#64748b]">
                    R$
                  </span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={custoEstimado}
                    onChange={(e) => setCustoEstimado(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[18px] font-bold text-[#001b3c] outline-none transition-all focus:border-[#9fd300] focus:bg-white"
                  />
                </div>
                <p className="text-[12px] text-[#64748b] italic">
                  Valor bruto aproximado para o fechamento do contrato inicial.
                </p>
              </div>

              {/* BDI */}
              <div className="flex flex-col gap-2">
                <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                  BDI (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={data.bdi || 0}
                    onChange={(e) => updateData({ bdi: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] font-bold text-[#001b3c] outline-none focus:border-[#9fd300]"
                  />
                  <div className="px-4 py-3.5 bg-[#e2e8f0] rounded-lg font-bold text-[#475569]">
                    %
                  </div>
                </div>
              </div>

              {/* Margem de Lucro Esperada */}
              <div className="flex flex-col gap-2">
                <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                  MARGEM DE LUCRO ESPERADA (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="15.0"
                    value={margemLucro}
                    onChange={(e) => setMargemLucro(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] font-bold text-[#001b3c] outline-none focus:border-[#9fd300]"
                  />
                  <div className="px-4 py-3.5 bg-[#e2e8f0] rounded-lg font-bold text-[#475569]">
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Faturamento & Centro de Custo (Span 4) */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-[#d1d5db] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-9 flex items-center justify-center bg-[#9fd300]/20 rounded-md text-[#001b3c]">
                <Wallet size={22} weight="bold" />
              </div>
              <h3 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] leading-[28px]">
                Faturamento
              </h3>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px] mb-2">
                  CÓDIGO CENTRO DE CUSTO
                </label>
                <input
                  type="text"
                  placeholder="Ex: OBRA-2024-001"
                  value={centroCusto}
                  onChange={(e) => setCentroCusto(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-mono text-[13px] text-[#001b3c] outline-none focus:border-[#9fd300]"
                />
              </div>

              <div>
                <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px] mb-2">
                  MÉTODO DE FATURAMENTO
                </label>
                <select
                  value={metodoFaturamento}
                  onChange={(e) => setMetodoFaturamento(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none cursor-pointer focus:border-[#9fd300]"
                >
                  <option value="monthly">Faturamento Mensal (Medição)</option>
                  <option value="milestone">Por Marco de Entrega (Milestones)</option>
                  <option value="fixed">Preço Global</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Regras de Pagamento (Span 12) */}
          <div className="lg:col-span-12 bg-white rounded-lg border border-[#d1d5db] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-6 lg:p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-9 flex items-center justify-center bg-[#9fd300]/20 rounded-md text-[#001b3c]">
                <SlidersHorizontal size={22} weight="bold" />
              </div>
              <h3 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] leading-[28px]">
                Regras de Pagamento
              </h3>
            </div>

            <div className="max-w-3xl flex flex-col gap-3">
              <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                PRAZOS PADRÃO PARA FORNECEDORES (DIAS)
              </label>
              <div className="flex flex-wrap gap-4 items-center">
                {[15, 28, 45].map((dias) => (
                  <label
                    key={dias}
                    className="flex items-center gap-3 px-5 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg cursor-pointer hover:border-[#9fd300] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={prazosFornecedores.includes(dias)}
                      onChange={() => togglePrazo(dias)}
                      className="w-4 h-4 accent-[#9fd300] cursor-pointer"
                    />
                    <span className="font-['Inter'] text-[14px] font-semibold text-[#001b3c]">
                      {dias} Dias
                    </span>
                  </label>
                ))}
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Outro prazo (ex: 30, 60...)"
                    value={outroPrazo}
                    onChange={(e) => setOutroPrazo(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none focus:border-[#9fd300]"
                  />
                </div>
              </div>
              <p className="text-[12px] text-[#64748b] italic mt-1">
                Estas regras serão sugeridas automaticamente em novos pedidos de compra vinculados a esta obra.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="px-8 lg:px-16 py-5 bg-white border-t border-[#d1d5db] sticky bottom-0 shadow-lg">
        <div className="max-w-[1152px] mx-auto flex justify-between items-center">
          <Link
            href="/obras/novo/etapa-2"
            className="font-['Manrope'] font-bold text-[14px] text-[#001b3c] flex items-center gap-2 no-underline hover:underline"
          >
            <ArrowLeft size={14} weight="bold" />
            Anterior: Equipe & Acessos
          </Link>
          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#9fd300] text-[#001b3d] rounded-lg font-['Manrope'] font-bold text-[14px] transition-all hover:opacity-90 disabled:opacity-50 border-none cursor-pointer shadow-[0_10px_15px_-3px_rgba(159,211,0,0.2)] hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              "Criando projeto..."
            ) : (
              <>
                <Rocket size={18} weight="bold" />
                FINALIZAR E CRIAR PROJETO
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
