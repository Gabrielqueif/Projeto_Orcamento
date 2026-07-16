"use client";

import Link from "next/link";
import {
  FileText,
  MapPin,
  Info,
  ArrowRight,
  MapTrifold,
  X,
  Check,
} from "@phosphor-icons/react";

import { useWizard } from "@/contexts/WizardContext";
import { getSinapiBases } from "@/lib/api/orcamentos";
import { useState, useEffect } from "react";

export default function NovaObraPage() {
  const { data, updateData } = useWizard();
  const [bases, setBases] = useState<{ mes_referencia: string; fonte: string; tipo_composicao?: string }[]>([]);

  useEffect(() => {
    async function loadBases() {
      try {
        const fetchedBases = await getSinapiBases();
        setBases(fetchedBases);
        if (!data.baseReferencia && fetchedBases.length > 0) {
          updateData({ baseReferencia: fetchedBases[0].mes_referencia });
        }
      } catch (error) {
        console.error("Erro ao carregar bases:", error);
      }
    }
    loadBases();
  }, []);

  const steps = [
    { num: 1, label: "Dados Gerais", active: true, done: false },
    { num: 2, label: "Equipe e Acessos", active: false, done: false },
  ];

  return (
    <div className="flex flex-col h-full -mx-8 -mb-8 -mt-8">
      {/* Stepper Header */}
      <div className="bg-white border-b border-[#d1d5db] px-16 py-6">
        <div className="max-w-[896px] flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                {/* Step indicator */}
                <div
                  className={`w-10 h-10 rounded-[8px] flex items-center justify-center shadow-[0_1px_1px_rgba(0,0,0,0.05)] font-['Manrope'] font-bold ${
                    step.done
                      ? "bg-[#9fd300]"
                      : step.active
                      ? "bg-[#9fd300]"
                      : "bg-white border border-[#d1d5db]"
                  }`}
                >
                  {step.done ? (
                    <Check size={16} weight="bold" className="text-[#001b3d]" />
                  ) : (
                    <span
                      className={`font-['JetBrains_Mono'] font-bold text-[12px] ${
                        step.active ? "text-[#001b3d]" : "text-[#94a3b8]"
                      }`}
                    >
                      {step.num}
                    </span>
                  )}
                </div>
                {/* Step label */}
                <div className="flex flex-col">
                  <span
                    className={`font-['Inter'] font-bold text-[10px] uppercase tracking-[1px] ${
                      step.active ? "text-[#001b3c]" : "text-[rgba(0,27,60,0.4)]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
              {/* Connector */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-4 h-1 rounded-full bg-[rgba(159,211,0,0.2)] min-w-[60px]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-16 pt-8 pb-0 bg-[#f4f7f9]">
        <div className="max-w-[1152px]">
          <div className="bg-white border border-[#d1d5db] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-[25px] flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#00bcd4] uppercase tracking-[0.5px]">
                Etapa 1 de 2
              </span>
              <span className="font-['Inter'] font-bold text-[12px] text-[rgba(0,27,60,0.6)]">
                Próximo: Equipe e Acessos
              </span>
            </div>
            <div className="bg-[#f1f5f9] h-2 rounded-full w-full overflow-hidden">
              <div className="bg-[#9fd300] h-full rounded-full" style={{ width: "50%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 px-16 py-8 bg-[#f4f7f9] overflow-y-auto">
        <div className="max-w-[1152px] grid grid-cols-[1fr_380px] gap-8">
          {/* Left: Main Form */}
          <div className="flex flex-col gap-6">
            {/* Identificação */}
            <div className="bg-white border border-[#d1d5db] rounded-[8px] p-[33px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-1">
              <h2 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] uppercase tracking-[-0.5px] leading-[28px]">
                Identificação do Projeto
              </h2>
              <div className="w-12 h-1 bg-[#9fd300] mb-5" />

              {/* Nome */}
              <div className="mb-5">
                <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Edifício Horizonte — Bloco A"
                  value={data.nome}
                  onChange={(e) => updateData({ nome: e.target.value })}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300] placeholder:text-[#9ca3af]"
                />
              </div>

              {/* Grid: Cliente + Estado */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                    Cliente / Proprietário
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da empresa ou pessoa"
                    value={data.cliente}
                    onChange={(e) => updateData({ cliente: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300] placeholder:text-[#9ca3af]"
                  />
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                    Estado (UF)
                  </label>
                  <select
                    value={data.estado}
                    onChange={(e) => updateData({ estado: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300]"
                  >
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo de Construção */}
              <div className="mb-5">
                <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-3">
                  Tipo de Construção
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Residencial Vertical", "Residencial Horizontal", "Comercial", "Industrial", "Hospitalar", "Escolar"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const current = data.tipo || [];
                        if (current.includes(t)) {
                          updateData({ tipo: current.filter((x) => x !== t) });
                        } else {
                          updateData({ tipo: [...current, t] });
                        }
                      }}
                      className={`px-4 py-2 rounded-full font-['Inter'] text-[12px] font-medium transition-all border cursor-pointer ${
                        data.tipo?.includes(t)
                          ? "bg-[#9fd300] border-[#9fd300] text-[#001b3d] font-bold"
                          : "bg-white border-[#d1d5db] text-[#64748b] hover:border-[#9fd300]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid: BDI + Status + Base + Desoneração */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                    BDI (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={data.bdi}
                    onChange={(e) => updateData({ bdi: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300]"
                  />
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                    Status Inicial
                  </label>
                  <select
                    value={data.status}
                    onChange={(e) => updateData({ status: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300]"
                  >
                    <option value="em_elaboracao">Em Elaboração</option>
                    <option value="orcamento_concluido">Orçamento Concluído</option>
                    <option value="em_execucao">Em Execução</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                    Base de Referência
                    <span className="block normal-case font-normal text-[9px] text-[#94a3b8] mt-0.5">
                      (define o mês de referência SINAPI)
                    </span>
                  </label>
                  <select
                    value={data.baseReferencia}
                    onChange={(e) => updateData({ baseReferencia: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300]"
                  >
                    {bases.length === 0 ? (
                      <option value="">Carregando bases...</option>
                    ) : (
                      bases.map((base) => (
                        <option key={base.mes_referencia} value={base.mes_referencia}>
                          {base.mes_referencia} ({base.fonte})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                    Desoneração (SINAPI)
                    <span className="block normal-case font-normal text-[9px] text-[#94a3b8] mt-0.5">
                      (encargos sociais)
                    </span>
                  </label>
                  <select
                    value={data.tipoComposicao}
                    onChange={(e) => updateData({ tipoComposicao: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300]"
                  >
                    <option value="Sem Desoneração">Sem Desoneração</option>
                    <option value="Com Desoneração">Com Desoneração</option>
                  </select>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                  Endereço Completo
                </label>
                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
                  />
                  <input
                    type="text"
                    placeholder="Rua, número, bairro e cidade"
                    value={data.endereco}
                    onChange={(e) => updateData({ endereco: e.target.value })}
                    className="w-full py-3 pr-4 pl-11 border border-[#d1d5db] rounded-[8px] font-['Inter'] text-[14px] text-[#001b3c] bg-white outline-none transition-colors focus:border-[#9fd300] placeholder:text-[#9ca3af]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info + Map */}
          <div className="flex flex-col gap-5">
            {/* Info panel */}
            <div className="bg-[#001b3d] text-white p-6 rounded-[8px] shadow-sm">
              <Info size={24} weight="fill" className="text-[#9fd300] mb-4" />
              <h4 className="font-['Manrope'] font-bold text-[16px] mb-2">
                Diretrizes Técnicas
              </h4>
              <p className="font-['Inter'] text-[14px] text-[#8C9CAB] leading-relaxed mb-4">
                Estes dados definem o cabeçalho de todos os seus relatórios e
                diários de obra. Certifique-se de que o endereço esteja correto
                para geolocalização automática.
              </p>
              <Link
                href="#"
                className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#9fd300] uppercase tracking-[0.5px] flex items-center gap-1 no-underline hover:underline"
              >
                Guia de preenchimento <ArrowRight size={12} weight="bold" />
              </Link>
            </div>

            {/* Map */}
            <div className="bg-white border border-[#d1d5db] rounded-[8px] overflow-hidden shadow-sm">
              <div className="h-[150px] bg-[#e2e8f0] flex items-center justify-center">
                <MapTrifold size={32} className="text-[#94a3b8]" />
              </div>
              <div className="p-6">
                <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-3">
                  Mapeamento Geográfico
                </div>
                <div className="border border-dashed border-[#d1d5db] rounded-[8px] p-6 text-center flex flex-col items-center gap-2">
                  <MapTrifold size={28} className="text-[#94a3b8]" />
                  <p className="font-['Inter'] text-[12px] text-[#94a3b8]">
                    O mapa será carregado após inserir um endereço válido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-16 py-6 bg-white border-t border-[#d1d5db] flex justify-between items-center">
        <Link
          href="/obras"
          className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] flex items-center gap-2 no-underline hover:text-[#001b3d] transition-colors"
        >
          <X size={12} weight="bold" />
          Cancelar e Sair
        </Link>
        <div className="flex items-center gap-6">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[rgba(0,27,60,0.3)] uppercase tracking-[0.5px] cursor-not-allowed">
            Voltar
          </span>
          <Link
            href="/obras/novo/etapa-2"
            className="flex items-center gap-2 px-6 py-3 bg-[#001b3d] text-white rounded-[8px] font-['Manrope'] font-bold text-[14px] no-underline hover:bg-[#00102a] transition-colors shadow-[0_10px_15px_-3px_rgba(0,27,61,0.1)]"
          >
            Próximo Passo
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
