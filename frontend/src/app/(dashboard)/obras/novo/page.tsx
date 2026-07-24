"use client";

import Link from "next/link";
import {
  MapPin,
  Info,
  ArrowRight,
  MapTrifold,
  X,
  Check,
  Calendar,
  Building,
  CaretDown,
} from "@phosphor-icons/react";

import { useWizard } from "@/contexts/WizardContext";
import { getSinapiBases } from "@/lib/api/orcamentos";
import { useState, useEffect } from "react";
import { ObraWizardStepper } from "@/components/obras/ObraWizardStepper";

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
    { num: 1, label: "Informações Básicas", active: true, done: false },
    { num: 2, label: "Equipe & Acessos", active: false, done: false },
    { num: 3, label: "Financeiro Inicial", active: false, done: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f9] -mx-8 -mb-8 -mt-8 font-['Inter']">
      {/* Header / Stepper Progress Header */}
      <ObraWizardStepper currentStep={1} nextStepLabel="Equipe & Acessos" />

      {/* Main Form Content - Bento Grid */}
      <div className="flex-1 px-8 lg:px-16 py-8">
        <div className="max-w-[1152px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Cards (Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Card 1: Identificação do Projeto */}
            <div className="bg-white border border-[#d1d5db] rounded-lg p-6 lg:p-8 shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-9 flex items-center justify-center bg-[#9fd300]/20 rounded-md text-[#001b3c]">
                  <Building size={22} weight="bold" />
                </div>
                <h3 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] leading-[28px]">
                  Identificação do Projeto
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome do Projeto */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Edifício Horizonte - Bloco A"
                    value={data.nome || ""}
                    onChange={(e) => updateData({ nome: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none transition-all focus:border-[#9fd300] focus:bg-white placeholder:text-[#9ca3af]"
                  />
                </div>

                {/* Cliente / Proprietário */}
                <div className="flex flex-col gap-2">
                  <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                    Cliente / Proprietário
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da empresa ou pessoa"
                    value={data.cliente || ""}
                    onChange={(e) => updateData({ cliente: e.target.value })}
                    className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none transition-all focus:border-[#9fd300] focus:bg-white placeholder:text-[#9ca3af]"
                  />
                </div>

                {/* Tipo de Construção */}
                <div className="flex flex-col gap-2">
                  <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                    Tipo de Construção
                  </label>
                  <div className="relative">
                    <select
                      value={data.tipo?.[0] || "Residencial Vertical"}
                      onChange={(e) => updateData({ tipo: [e.target.value] })}
                      className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none appearance-none transition-all focus:border-[#9fd300] focus:bg-white pr-10 cursor-pointer"
                    >
                      <option value="Residencial Vertical">Residencial Vertical</option>
                      <option value="Residencial Horizontal">Residencial Horizontal</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Hospitalar">Hospitalar</option>
                      <option value="Escolar">Escolar</option>
                    </select>
                    <CaretDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                  </div>
                </div>

                {/* Endereço Completo */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                    Endereço Completo
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      type="text"
                      placeholder="Rua, número, bairro e cidade"
                      value={data.endereco || ""}
                      onChange={(e) => updateData({ endereco: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none transition-all focus:border-[#9fd300] focus:bg-white placeholder:text-[#9ca3af]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Cronograma Estimado */}
            <div className="bg-white border border-[#d1d5db] rounded-lg p-6 lg:p-8 shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-9 flex items-center justify-center bg-[#9fd300]/20 rounded-md text-[#001b3c]">
                  <Calendar size={22} weight="bold" />
                </div>
                <h3 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] leading-[28px]">
                  Cronograma Estimado
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data de Início */}
                <div className="flex flex-col gap-2">
                  <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                    Data de Início
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={data.dataInicio || ""}
                      onChange={(e) => updateData({ dataInicio: e.target.value })}
                      className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none transition-all focus:border-[#9fd300] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Previsão de Término */}
                <div className="flex flex-col gap-2">
                  <label className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                    Previsão de Término
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={data.dataTermino || ""}
                      onChange={(e) => updateData({ dataTermino: e.target.value })}
                      className="w-full px-4 py-3.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg font-['Inter'] text-[14px] text-[#001b3c] outline-none transition-all focus:border-[#9fd300] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contextual Sidebar Info Card (Span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Dark Technical Guidelines Card */}
            <div className="bg-[#001b3c] text-white p-8 rounded-lg shadow-[0_10px_15px_-3px_rgba(0,27,60,0.1)] relative overflow-hidden flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-[#9fd300] mb-1">
                <Info size={25} weight="bold" />
              </div>
              <h4 className="font-['Manrope'] font-bold text-[18px] text-white leading-[22.5px]">
                Diretrizes Técnicas
              </h4>
              <p className="font-['Inter'] text-[14px] text-white/70 leading-[22.75px]">
                Estes dados definem o cabeçalho de todos os seus relatórios e
                diários de obra. Certifique-se de que o endereço esteja correto para
                geolocalização automática.
              </p>
              <Link
                href="#"
                className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#9fd300] uppercase tracking-[0.5px] flex items-center gap-1 mt-2 no-underline hover:underline"
              >
                Guia de preenchimento <ArrowRight size={12} weight="bold" />
              </Link>
            </div>

            {/* Map Card */}
            <div className="bg-white border border-[#d1d5db] rounded-lg overflow-hidden shadow-sm flex flex-col">
              <div className="h-[150px] bg-[#e2e8f0] flex items-center justify-center">
                <MapTrifold size={36} className="text-[#94a3b8]" />
              </div>
              <div className="p-6 flex flex-col gap-3">
                <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                  Mapeamento Geográfico
                </span>
                <div className="border border-dashed border-[#d1d5db] rounded-lg p-5 text-center flex flex-col items-center gap-2">
                  <MapTrifold size={26} className="text-[#94a3b8]" />
                  <p className="font-['Inter'] text-[12px] text-[#94a3b8]">
                    O mapa será carregado após inserir um endereço válido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="px-8 lg:px-16 py-5 bg-white border-t border-[#d1d5db] sticky bottom-0 shadow-lg">
        <div className="max-w-[1152px] mx-auto flex justify-between items-center">
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
              className="flex items-center gap-2 px-6 py-3.5 bg-[#001b3d] text-white rounded-lg font-['Manrope'] font-bold text-[14px] no-underline hover:bg-[#00102a] transition-all shadow-[0_10px_15px_-3px_rgba(0,27,61,0.1)] hover:-translate-y-0.5"
            >
              Próximo Passo
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

