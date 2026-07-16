"use client";

import Link from "next/link";
import {
  Check,
  MagnifyingGlass,
  User,
  Lock,
  ListChecks,
  Camera,
  FileText,
  Trash,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { createOrcamento } from "@/lib/api/orcamentos";
import { useRouter } from "next/navigation";

const MOCK_PROFESSIONALS = [
  {
    id: "RA",
    name: "Ricardo Almeida",
    role: "Engenheiro Civil • Senior",
    color: "#001b3d",
  },
  {
    id: "MC",
    name: "Mariana Costa",
    role: "Arquiteta Urbanista",
    color: "#00a3b1",
  },
  {
    id: "JP",
    name: "João Pedro Silva",
    role: "Mestre de Obras",
    color: "#94a3b8",
    initials: "JP",
  },
  {
    id: "FO",
    name: "Fernanda Oliveira",
    role: "Gestora de Projetos",
    color: "#9fd300",
    initials: "FO",
  },
];

const TEAM_MEMBERS = [
  { id: "VP", name: "Você (Gestor)", role: "CRIADOR", badge: "GERENTE", fixed: true },
  { id: "JP", name: "João Pedro Silva", role: "Mestre de Obras", badge: "MESTRE", fixed: false },
  { id: "MC", name: "Mariana Costa", role: "Arquitetura", badge: "ARQUITETO", fixed: false },
];

export default function NovaObraEtapa2Page() {
  const { data } = useWizard();
  const [selectedMember, setSelectedMember] = useState<string>("JP");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleFinish = async () => {
    if (!data.nome || !data.cliente) {
      alert("Por favor, preencha os dados básicos na Etapa 1.");
      router.push("/obras/novo");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrcamento({
        nome: data.nome,
        cliente: data.cliente,
        data: data.dataInicio || new Date().toISOString().split("T")[0],
        base_referencia: data.baseReferencia,
        tipo_composicao: data.tipoComposicao || "Sem Desoneração",
        estado: data.estado,
        fonte: "SINAPI",
        bdi: data.bdi,
        status: data.status,
      });
      alert("Projeto criado com sucesso!");
      router.push("/obras");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Ocorreu um erro ao salvar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Dados Gerais", active: false, done: true },
    { num: 2, label: "Equipe e Acessos", active: true, done: false },
  ];

  return (
    <div className="flex flex-col h-full -mx-8 -mb-8 -mt-8">
      {/* Stepper Header */}
      <div className="bg-white border-b border-[#d1d5db] px-16 py-6">
        <div className="max-w-[896px] flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-[8px] flex items-center justify-center shadow-[0_1px_1px_rgba(0,0,0,0.05)] ${
                    step.done || step.active
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
                <span
                  className={`font-['Inter'] font-bold text-[10px] uppercase tracking-[1px] ${
                    step.active ? "text-[#001b3c]" : "text-[rgba(0,27,60,0.4)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-4 h-1 rounded-full bg-[rgba(159,211,0,0.2)] min-w-[60px]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 bg-[#f4f7f9] overflow-y-auto">
        <div className="px-16 pt-[32px] pb-[145px]">
          <div className="grid grid-cols-[5fr_7fr] gap-8 max-w-full">
            {/* Left Column: Search & Selection */}
            <div>
              <div className="bg-white border border-[#d1d5db] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-[33px] flex flex-col gap-1">
                <h2 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] uppercase tracking-[-0.5px] leading-[28px]">
                  Adicionar Membros
                </h2>
                <div className="w-12 h-1 bg-[#9fd300] mb-5" />
                <p className="font-['Inter'] font-medium text-[14px] text-[#64748b] leading-[20px] mb-5">
                  Busque por nome ou cargo na sua rede de profissionais.
                </p>

                {/* Search */}
                <div className="relative mb-6">
                  <div className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none">
                    <MagnifyingGlass size={14} className="text-[#6b7280]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar profissional..."
                    className="w-full bg-[#f8fafc] border border-[#d1d5db] rounded-[8px] pl-[41px] pr-4 pt-[10px] pb-[11px] font-['Inter'] text-[14px] text-[#6b7280] placeholder:text-[#6b7280] outline-none focus:border-[#9fd300] transition-colors"
                  />
                </div>

                {/* List */}
                <div className="flex flex-col gap-2">
                  {MOCK_PROFESSIONALS.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => setSelectedMember(person.id)}
                      className={`flex items-center gap-3 p-3 rounded-[8px] cursor-pointer transition-colors ${
                        selectedMember === person.id
                          ? "border border-[#9fd300] bg-[rgba(159,211,0,0.06)]"
                          : "border border-transparent hover:bg-[#f8fafc]"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white font-['Manrope'] font-bold text-sm shrink-0 overflow-hidden"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.initials ? (
                          <span className="text-[#001b3d]">{person.initials}</span>
                        ) : (
                          <User size={18} weight="fill" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-['Manrope'] font-bold text-[14px] text-[#001b3c] truncate">
                          {person.name}
                        </div>
                        <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                          {person.role}
                        </div>
                      </div>
                      {selectedMember === person.id && (
                        <div className="w-5 h-5 rounded-full bg-[#9fd300] flex items-center justify-center shrink-0">
                          <Check size={11} weight="bold" className="text-[#001b3d]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Team Table */}
            <div>
              <div className="bg-white border border-[#d1d5db] rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-[33px]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3c] uppercase tracking-[-0.5px] leading-[28px]">
                      Equipe do Projeto
                    </h2>
                    <div className="w-12 h-1 bg-[#9fd300] mt-1" />
                  </div>
                  <span className="px-3 py-1 bg-[rgba(159,211,0,0.1)] text-[#5a7f00] font-['JetBrains_Mono'] font-medium text-[10px] uppercase tracking-[0.5px] rounded-full">
                    {TEAM_MEMBERS.length} membros
                  </span>
                </div>
                <p className="font-['Inter'] font-medium text-[14px] text-[#64748b] mb-6 mt-4">
                  Defina funções e permissões para cada membro.
                </p>

                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      {["Membro", "Função", "Permissões", "Ações"].map((h) => (
                        <th
                          key={h}
                          className="pb-3 font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px] border-b border-[#f1f5f9]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TEAM_MEMBERS.map((member) => (
                      <tr key={member.id} className="border-b border-[#f1f5f9] last:border-b-0">
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[8px] bg-[#001b3d] text-white font-['Manrope'] font-bold text-xs flex items-center justify-center shrink-0">
                              {member.id}
                            </div>
                            <div>
                              <div className="font-['Manrope'] font-semibold text-[13px] text-[#001b3c]">
                                {member.name}
                              </div>
                              <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                                {member.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-3">
                          {member.fixed ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-[#001b3d] text-white font-['JetBrains_Mono'] font-medium text-[10px] uppercase tracking-[0.5px] rounded-[6px]">
                              {member.badge}
                            </span>
                          ) : (
                            <select className="px-2 py-[6px] border border-[#e2e8f0] rounded-[6px] font-['Manrope'] text-[13px] text-[#001b3c] bg-white outline-none cursor-pointer focus:border-[#9fd300] transition-colors">
                              <option>{member.badge}</option>
                            </select>
                          )}
                        </td>
                        <td className="py-4 pr-3">
                          {member.fixed ? (
                            <span className="font-['Manrope'] font-semibold text-[13px] text-[#001b3c]">
                              Acesso Total
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              <div className="w-7 h-7 rounded-[6px] border border-[#001b3d] bg-[#001b3d] text-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                <ListChecks size={14} />
                              </div>
                              <div className="w-7 h-7 rounded-[6px] border border-[#e2e8f0] bg-white text-[#64748b] flex items-center justify-center cursor-pointer hover:border-[#9fd300] transition-colors">
                                <Camera size={14} />
                              </div>
                              <div className="w-7 h-7 rounded-[6px] border border-[#001b3d] bg-[#001b3d] text-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                <FileText size={14} />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {member.fixed ? (
                            <Lock size={18} className="mx-auto text-[#e2e8f0]" weight="fill" />
                          ) : (
                            <Trash
                              size={18}
                              className="mx-auto text-[#94a3b8] cursor-pointer hover:text-[#ef4444] transition-colors"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary box */}
                <div className="mt-6 p-4 bg-[rgba(159,211,0,0.06)] border border-[rgba(159,211,0,0.3)] rounded-[8px] flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#9fd300] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} weight="bold" className="text-[#001b3d]" />
                  </div>
                  <div>
                    <h4 className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#5a7f00] uppercase tracking-[0.5px] mb-1">
                      Resumo de Responsabilidades
                    </h4>
                    <p className="font-['Inter'] text-[12px] text-[#5a7f00] leading-relaxed">
                      Engenheiro e Arquiteto têm permissão para aprovar medições.
                      O Mestre de Obras tem acesso restrito ao Diário de Obra.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-16 py-6 bg-white border-t border-[#d1d5db] flex justify-between items-center">
        <Link
          href="/obras/novo"
          className="font-['Manrope'] font-bold text-[14px] text-[#001b3c] flex items-center gap-2 no-underline hover:underline"
        >
          <ArrowLeft size={14} weight="bold" />
          Anterior: Dados da Obra
        </Link>
        <button
          onClick={handleFinish}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-[#9fd300] text-[#001b3d] rounded-[8px] font-['Manrope'] font-bold text-[14px] transition-all hover:opacity-90 disabled:opacity-50 border-none cursor-pointer shadow-[0_10px_15px_-3px_rgba(159,211,0,0.2)]"
        >
          {isSubmitting ? (
            "Criando projeto..."
          ) : (
            <>
              <Check size={16} weight="bold" />
              Concluir e Criar Projeto
            </>
          )}
        </button>
      </div>
    </div>
  );
}
