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
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { createOrcamento } from "@/lib/api/orcamentos";
import { getMembrosEquipe, alocarMembrosAoOrcamento, type MembroEquipe } from "@/lib/api/membros_equipe";
import { getEquipes, type Equipe } from "@/lib/api/equipes";
import { useRouter } from "next/navigation";

export default function NovaObraEtapa2Page() {
  const { data } = useWizard();
  const [professionals, setProfessionals] = useState<MembroEquipe[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState<string>("—");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      getMembrosEquipe().then((res) => res.filter((m) => m.status === "ATIVO")),
      getEquipes(),
    ])
      .then(([membrosActivos, equipesList]) => {
        setProfessionals(membrosActivos);
        setEquipes(equipesList);
      })
      .catch((err) => console.error("Erro ao carregar dados de equipe:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleFinish = async () => {
    if (!data.nome || !data.cliente) {
      alert("Por favor, preencha os dados básicos na Etapa 1.");
      router.push("/obras/novo");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Criar o orçamento (obra) no backend
      const newOrcamento = await createOrcamento({
        nome: data.nome,
        cliente: data.cliente,
        data: data.dataInicio || new Date().toISOString().split("T")[0],
        base_referencia: data.baseReferencia,
        tipo_composicao: data.tipoComposicao || "Sem Desoneração",
        estado: data.estado,
        fonte: "SINAPI",
        bdi: data.bdi,
        status: data.status || "em_elaboracao",
      });

      // 2. Alocar os membros selecionados ao novo orçamento criado
      if (selectedMemberIds.length > 0 && newOrcamento?.id) {
        await alocarMembrosAoOrcamento(selectedMemberIds, newOrcamento.id);
      }

      alert("Projeto criado com sucesso!");
      router.push("/obras");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Ocorreu um erro ao salvar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSelectEquipe = (equipeId: string) => {
    setSelectedEquipeId(equipeId);
    if (equipeId === "—") {
      setSelectedMemberIds([]);
      return;
    }
    // Seleciona todos os profissionais ativos que pertencem a esta equipe
    const teamMemberIds = professionals
      .filter((p) => p.equipe_id === equipeId)
      .map((p) => p.id);
    setSelectedMemberIds(teamMemberIds);
  };

  const filteredProfessionals = professionals.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lista para renderizar na tabela à direita (incluindo o Criador fixo)
  const rightSideMembers = [
    { id: "VP", nome: "Você (Gestor)", cargo: "Criador", badge: "GERENTE", fixed: true },
    ...professionals
      .filter((p) => selectedMemberIds.includes(p.id))
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        cargo: p.cargo,
        badge: p.cargo.split(" ")[0].toUpperCase(),
        fixed: false,
      })),
  ];

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

                 {/* Selecionar Equipe Pronta */}
                 <div className="mb-4">
                  <label htmlFor="equipe-select" className="block font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] mb-2">
                    Selecionar por Equipe/Grupo
                  </label>
                  <select
                    id="equipe-select"
                    value={selectedEquipeId}
                    onChange={(e) => handleSelectEquipe(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#d1d5db] rounded-[8px] px-4 py-2.5 font-['Inter'] text-[14px] text-[#001b3c] outline-none focus:border-[#9fd300] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-10"
                  >
                    <option value="—">Selecione uma equipe para auto-alocar...</option>
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                  <div className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none">
                    <MagnifyingGlass size={14} className="text-[#6b7280]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar profissional..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#d1d5db] rounded-[8px] pl-[41px] pr-4 pt-[10px] pb-[11px] font-['Inter'] text-[14px] text-[#6b7280] placeholder:text-[#6b7280] outline-none focus:border-[#9fd300] transition-colors"
                  />
                </div>

                {/* List */}
                {loading ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-[#001b3d] border-t-[#9fd300] rounded-full animate-spin mx-auto mb-2" />
                    <span className="font-['Inter'] text-xs text-[#64748b]">Carregando profissionais...</span>
                  </div>
                ) : filteredProfessionals.length === 0 ? (
                  <div className="text-center py-6 font-['Inter'] text-xs text-[#94a3b8]">
                    Nenhum profissional cadastrado ou ativo encontrado.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {filteredProfessionals.map((person) => {
                      const isSelected = selectedMemberIds.includes(person.id);
                      const initials = person.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                      return (
                        <div
                          key={person.id}
                          onClick={() => toggleMemberSelection(person.id)}
                          className={`flex items-center gap-3 p-3 rounded-[8px] cursor-pointer transition-colors ${
                            isSelected
                              ? "border border-[#9fd300] bg-[rgba(159,211,0,0.06)]"
                              : "border border-transparent hover:bg-[#f8fafc]"
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white font-['Manrope'] font-bold text-sm shrink-0 overflow-hidden bg-[#001b3d]"
                          >
                            <span className="text-[#9fd300]">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-['Manrope'] font-bold text-[14px] text-[#001b3c] truncate">
                              {person.nome}
                            </div>
                            <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                              {person.cargo}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#9fd300] flex items-center justify-center shrink-0">
                              <Check size={11} weight="bold" className="text-[#001b3d]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    {rightSideMembers.length} membros
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
                    {rightSideMembers.map((member) => {
                      const initials = member.nome === "Você (Gestor)" ? "VC" : member.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
                      return (
                        <tr key={member.id} className="border-b border-[#f1f5f9] last:border-b-0">
                          <td className="py-4 pr-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-[8px] bg-[#001b3d] text-[#9fd300] font-['Manrope'] font-bold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="font-['Manrope'] font-semibold text-[13px] text-[#001b3c] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={member.nome}>
                                  {member.nome}
                                </div>
                                <div className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] uppercase tracking-[0.5px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={member.cargo}>
                                  {member.cargo}
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
                                onClick={() => toggleMemberSelection(member.id)}
                                className="mx-auto text-[#94a3b8] cursor-pointer hover:text-[#ef4444] transition-colors"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
