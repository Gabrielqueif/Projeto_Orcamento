"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  UploadSimple,
  X,
  Lock,
  ArrowUpRight,
  ArrowLeft,
  FileText,
} from "@phosphor-icons/react";
import { createMembroEquipe } from "@/lib/api/membros_equipe";
import { getOrcamentos, type Orcamento } from "@/lib/api/orcamentos";

interface FileAttachment {
  name: string;
  size: string;
}

export default function NovoMembroPage() {
  const router = useRouter();

  // Form states
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [descricao, setDescricao] = useState("");
  const [orcamentoId, setOrcamentoId] = useState<string>("—");
  const [remuneracao, setRemuneracao] = useState("");
  
  // Real projects state
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  
  // Drag & drop file states
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    getOrcamentos()
      .then(setOrcamentos)
      .catch((err) => console.error("Erro ao carregar orçamentos:", err));
  }, []);

  // Mask CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      value = value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setCpf(value);
    }
  };

  // Mask Salary (R$ Money)
  const handleRemuneracaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setRemuneracao("");
      return;
    }
    const numberValue = parseFloat(value) / 100;
    const formatted = numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setRemuneracao(formatted);
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const addFiles = (files: File[]) => {
    const newAttachments = files.map((file) => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        name: file.name,
        size: `${sizeInMB} MB`,
      };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit / Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !cpf || !cargo || !dataInicio || !remuneracao) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const rawVal = remuneracao.replace(/\./g, "").replace(",", ".");
    const numRemuneracao = parseFloat(rawVal) || 0;

    try {
      await createMembroEquipe({
        nome,
        cpf,
        cargo,
        data_inicio: dataInicio,
        descricao,
        orcamento_id: orcamentoId === "—" ? null : orcamentoId,
        remuneracao: numRemuneracao,
        status: "ATIVO",
      });
      router.push("/equipe");
    } catch (err) {
      console.error("Erro ao salvar colaborador:", err);
      alert("Ocorreu um erro ao salvar o colaborador na equipe.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1024px] mx-auto pb-12">
      {/* Breadcrumb / Go Back Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/equipe"
          className="flex items-center justify-center w-9 h-9 border border-[#e2e8f0] bg-white text-[#64748b] rounded-[8px] hover:text-[#001b3d] hover:bg-[#f8fafc] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#00a3b1] uppercase tracking-[0.5px] leading-[15px]">
            Gestão / Recursos Humanos / Adicionar
          </p>
          <h1 className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d] tracking-[-0.6px] leading-tight">
            Adicionar Membro à Equipe
          </h1>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden"
      >
        <div className="p-8 flex flex-col gap-8">
          {/* Section 1: Informações Pessoais */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#9fd300] h-[24px] w-[6px] rounded-[9999px]" />
              <h3 className="font-['JetBrains_Mono'] font-medium text-[12px] text-[#001b3d] tracking-[0.6px] uppercase">
                Informações Pessoais
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="nome"
                  className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
                >
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome"
                  type="text"
                  required
                  placeholder="Ex: Roberto Silva Santos"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cpf"
                  className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
                >
                  CPF / Documento <span className="text-red-500">*</span>
                </label>
                <input
                  id="cpf"
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cargo"
                  className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
                >
                  Cargo <span className="text-red-500">*</span>
                </label>
                <select
                  id="cargo"
                  required
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-10"
                >
                  <option value="" disabled>Selecione uma função</option>
                  <option value="Engenheiro Civil Sênior">Engenheiro Civil Sênior</option>
                  <option value="Engenheira Civil">Engenheira Civil</option>
                  <option value="Gerente de Projetos">Gerente de Projetos</option>
                  <option value="Mestre de Obras">Mestre de Obras</option>
                  <option value="Pedreiro Especialista">Pedreiro Especialista</option>
                  <option value="Pedreiro">Pedreiro</option>
                  <option value="Auxiliar Administrativo">Auxiliar Administrativo</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="dataInicio"
                  className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
                >
                  Data de Início <span className="text-red-500">*</span>
                </label>
                <input
                  id="dataInicio"
                  type="date"
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Alocação e Atividades */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#9fd300] h-[24px] w-[6px] rounded-[9999px]" />
              <h3 className="font-['JetBrains_Mono'] font-medium text-[12px] text-[#001b3d] tracking-[0.6px] uppercase">
                Alocação e Atividades
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex flex-col gap-2">
                <label
                  htmlFor="descricao"
                  className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
                >
                  Descrição das Atividades / O que faz
                </label>
                <textarea
                  id="descricao"
                  rows={3}
                  placeholder="Descreva brevemente as responsabilidades e tarefas principais..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="projeto"
                  className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
                >
                  Projeto de Alocação
                </label>
                <select
                  id="projeto"
                  value={orcamentoId}
                  onChange={(e) => setOrcamentoId(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-10"
                >
                  <option value="—">Sem Alocação (Banco)</option>
                  {orcamentos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="remuneracao"
                  className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]"
                >
                  Valor da Remuneração (R$) <span className="text-red-500">*</span>
                </label>
                <div className="relative w-full">
                  <div className="absolute left-[16px] top-1/2 -translate-y-1/2 font-['Manrope'] font-bold text-[14px] text-[#94a3b8] pointer-events-none">
                    R$
                  </div>
                  <input
                    id="remuneracao"
                    type="text"
                    required
                    placeholder="0.000,00"
                    value={remuneracao}
                    onChange={handleRemuneracaoChange}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] pl-12 pr-4 py-3 font-['Manrope'] text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Documentos do Colaborador */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#9fd300] h-[24px] w-[6px] rounded-[9999px]" />
              <h3 className="font-['JetBrains_Mono'] font-medium text-[12px] text-[#001b3d] tracking-[0.6px] uppercase">
                Documentos do Colaborador
              </h3>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[8px] p-8 flex flex-col items-center justify-center gap-3 transition-colors bg-[#f8fafc] ${
                isDragging ? "border-[#9fd300] bg-[#f8fafc]/50" : "border-[#e2e8f0]"
              }`}
            >
              <div className="w-14 h-14 bg-white rounded-[8px] border border-[#f1f5f9] flex items-center justify-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                <UploadSimple size={24} className="text-[#64748b]" />
              </div>
              <div className="text-center">
                <label className="font-['Manrope'] font-bold text-[14px] text-[#001b3d] cursor-pointer hover:text-[#9fd300] transition-colors">
                  Clique para fazer upload
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </label>
                <span className="font-['Manrope'] font-medium text-[14px] text-[#001b3d]">
                  {" "}ou arraste arquivos
                </span>
              </div>
              <p className="font-['Manrope'] font-medium text-[11px] text-[#64748b] text-center">
                PDF, PNG ou JPG (Max. 10MB). Documentos de identidade, certificados e contratos.
              </p>
            </div>

            {/* List of files */}
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]">
                  Arquivos selecionados ({attachments.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={18} className="text-[#64748b] shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-['Manrope'] font-medium text-[13px] text-[#001b3d] truncate">
                            {file.name}
                          </span>
                          <span className="font-['JetBrains_Mono'] text-[10px] text-[#94a3b8]">
                            {file.size}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-[#64748b] hover:text-red-500 transition-colors p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#f8fafc] border-t border-[#f1f5f9] px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-[#94a3b8]" />
            <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#94a3b8] tracking-[0.5px] uppercase">
              Dados Sensíveis Criptografados
            </span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push("/equipe")}
              className="flex-1 sm:flex-initial bg-white border border-[#e2e8f0] text-[#001b3d] font-['Manrope'] font-bold text-[14px] px-8 py-3 rounded-[8px] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial bg-[#9fd300] hover:bg-[#9fd300]/90 text-[#001b3d] font-['Manrope'] font-extrabold text-[14px] px-8 py-3 rounded-[8px] transition-all shadow-[0px_10px_15px_-3px_rgba(159,211,0,0.15)]"
            >
              Salvar Colaborador
            </button>
          </div>
        </div>
      </form>

      {/* Contextual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Segurança */}
        <div className="bg-[#001b3d] text-white p-6 rounded-[8px] relative overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,27,61,0.05)] md:col-span-1 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-2 mb-4 z-10">
            <ShieldCheck size={24} className="text-[#9fd300]" />
            <h4 className="font-['JetBrains_Mono'] font-medium text-[10px] tracking-[0.5px] uppercase">
              Segurança Constructo
            </h4>
          </div>
          <p className="font-['Manrope'] font-medium text-[11px] text-[rgba(255,255,255,0.6)] leading-[18px] z-10 pr-2">
            As informações do colaborador seguem as normas de conformidade da LGPD e infraestrutura AWS.
          </p>
          <div className="absolute right-[-10px] bottom-[-15px] text-[80px] text-white/5 font-extrabold select-none pointer-events-none">
            AWS
          </div>
        </div>

        {/* Card 2: Suporte à Contratação */}
        <div className="bg-white border border-[#f1f5f9] p-6 rounded-[8px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] md:col-span-2 flex justify-between items-center min-h-[160px]">
          <div className="flex flex-col gap-2">
            <h4 className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#001b3d] tracking-[0.5px] uppercase">
              Suporte à Contratação
            </h4>
            <p className="font-['Manrope'] font-medium text-[12px] text-[#64748b] leading-[20px] max-w-[420px]">
              Consulte as tabelas sindicais atualizadas e o guia de cargos para garantir conformidade com a convenção coletiva local.
            </p>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1 font-['JetBrains_Mono'] font-medium text-[10px] text-[#00a3b1] tracking-[0.5px] uppercase hover:underline mt-2"
            >
              Ver Tabela Sindical
              <ArrowUpRight size={12} />
            </a>
          </div>
          
          <div className="w-[80px] h-[80px] bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] flex items-center justify-center text-[#94a3b8] shrink-0">
            <FileText size={32} />
          </div>
        </div>
      </div>
    </div>
  );
}
