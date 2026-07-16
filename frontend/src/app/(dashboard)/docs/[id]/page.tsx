"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CaretRight,
  Funnel,
  UploadSimple,
  FilePdf,
  File,
  DotsThreeVertical,
  Camera,
  Plus,
  FileText,
  ShieldCheck,
  Clock,
  ArrowLeft,
  DownloadSimple
} from "@phosphor-icons/react";

interface DocumentFile {
  name: string;
  category: string;
  revision?: string;
  date: string;
  size: string;
  type: "pdf" | "dwg";
}

const mainFiles: DocumentFile[] = [
  {
    name: "Planta_Baixa_Pav01_V4.pdf",
    category: "Arquitetônico",
    revision: "Rev.04",
    date: "15 Out 2023",
    size: "4.2 MB",
    type: "pdf",
  },
  {
    name: "Calculo_Estrutural_Final.dwg",
    category: "Engenharia Civil",
    date: "12 Out 2023",
    size: "18.7 MB",
    type: "dwg",
  },
  {
    name: "Projeto_Eletrico_Rev01.pdf",
    category: "Instalações",
    date: "08 Out 2023",
    size: "2.1 MB",
    type: "pdf",
  },
];

interface ContractFile {
  name: string;
  statusText: string;
  date: string;
  size: string;
}

const contractFiles: ContractFile[] = [
  {
    name: "Contrato_Fornecedor_Aço.pdf",
    statusText: "Assinado via DocuSign",
    date: "12 Set 2023",
    size: "1.2 MB",
  },
  {
    name: "Aditivo_Prazo_Obra_01.pdf",
    statusText: "Pendente Assinatura",
    date: "05 Out 2023",
    size: "0.8 MB",
  },
];

interface LicenseFile {
  name: string;
  expiration: string;
  status: "valido" | "expira";
  statusText: string;
}

const licenseFiles: LicenseFile[] = [
  {
    name: "Alvara_Construcao_2023_045.pdf",
    expiration: "12 Dez 2024",
    status: "valido",
    statusText: "Válido",
  },
  {
    name: "Licenca_Ambiental_Previa.pdf",
    expiration: "30 Out 2023",
    status: "expira",
    statusText: "Expira em breve",
  },
];

export default function ProjectDocsPage() {
  const params = useParams();
  const id = params.id as string;

  // Formatting project name dynamically from id
  const projectName = id
    ? id === "aurora"
      ? "Residencial Aurora"
      : id === "viracopos"
      ? "Complexo Logístico"
      : id === "retrofit"
      ? "Retrofit Central"
      : "Parque das Flores"
    : "Residencial Aurora";

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] -m-8 p-8 min-h-[calc(100vh-64px)] font-['Inter']">
      {/* Breadcrumbs Nav */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/docs"
          className="text-[10px] font-bold text-[#737685] tracking-[1px] uppercase hover:text-[#001848] transition-colors"
        >
          Documentos
        </Link>
        <CaretRight size={10} className="text-[#737685]" weight="bold" />
        <span className="text-[10px] font-bold text-[#191c1e] tracking-[1px] uppercase">
          {projectName.toUpperCase()}
        </span>
      </div>

      {/* Header and Action Buttons */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="p-1.5 bg-white border border-[#e1e2e4] rounded-[8px] text-[#434654] hover:bg-[#f8f9fb] transition-colors"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <h1 className="text-[36px] font-extrabold text-[#191c1e] tracking-[-0.9px] font-['Manrope']">
              {projectName}
            </h1>
          </div>
          <p className="text-[14px] text-[#737685] italic mt-1 font-['Inter'] pl-9">
            Arquivo Técnico Centralizado • Atualizado há 2 horas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-[9px] bg-white border border-[#e1e2e4] text-[#434654] rounded-[8px] text-[14px] font-semibold transition-all hover:bg-[#f8f9fb] cursor-pointer">
            <Funnel size={16} weight="bold" /> Filtrar
          </button>
          <button className="flex items-center gap-2 px-6 py-[9px] bg-[#9fd300] text-[#001e00] rounded-[8px] text-[14px] font-bold transition-all hover:opacity-90 shadow-[0px_4px_6px_rgba(159,211,0,0.2)] cursor-pointer">
            <UploadSimple size={16} weight="bold" /> Upload de Arquivos
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Section 1: Plantas e Projetos (Large 8/12 grid) */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-[#e1e2e4] rounded-[16px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header row */}
            <div className="border-b border-[#e1e2e4]/50 px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-[18px] w-[11px] bg-[#006492] rounded-[2px]" />
                <h3 className="text-[20px] font-bold text-[#191c1e] font-['Manrope']">
                  Plantas e Projetos
                </h3>
              </div>
              <div className="bg-[#f8f9fb] border border-[#e1e2e4] px-[13px] py-[7px] rounded-full text-[10px] font-bold text-[#737685] tracking-[-0.5px]">
                12 ARQUIVOS
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[rgba(248,249,251,0.5)] border-b border-[#e1e2e4]/30">
                  <th className="px-6 py-4 text-[10px] font-bold text-[#737685] tracking-[0.5px] uppercase">
                    Nome do Arquivo
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-[#737685] tracking-[0.5px] uppercase">
                    Data
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-[#737685] tracking-[0.5px] uppercase">
                    Tamanho
                  </th>
                  <th className="px-6 py-4 text-right border-none"></th>
                </tr>
              </thead>
              <tbody>
                {mainFiles.map((file, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#f8f9fb] transition-colors duration-150 border-b border-[#e1e2e4]/30 last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-[8px] ${
                            file.type === "pdf" ? "bg-[#fef2f2]" : "bg-[#c9e6ff]"
                          }`}
                        >
                          {file.type === "pdf" ? (
                            <FilePdf size={20} className="text-[#ba1a1a]" />
                          ) : (
                            <File size={20} className="text-[#006492]" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#191c1e] hover:text-[#006492] cursor-pointer transition-colors">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-[#737685] mt-0.5">
                            {file.category} {file.revision ? `• ${file.revision}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[12px] text-[#737685] font-medium">
                      {file.date}
                    </td>
                    <td className="px-6 py-4 text-right text-[12px] text-[#737685] font-medium">
                      {file.size}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-[#e1e2e4]/50 rounded-full transition-colors cursor-pointer text-[#737685]">
                        <DotsThreeVertical size={18} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer bar */}
          <div className="bg-[rgba(248,249,251,0.3)] border-t border-[#e1e2e4]/30 px-6 py-4 flex justify-center">
            <button className="text-[12px] font-bold text-[#006492] tracking-[1.2px] uppercase hover:underline">
              Ver todos os projetos
            </button>
          </div>
        </div>

        {/* Section 2: Fotos de Campo (Small 4/12 grid) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-[#e1e2e4] rounded-[16px] p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Camera size={20} className="text-[#191c1e]" />
                <h3 className="text-[20px] font-bold text-[#191c1e] font-['Manrope']">
                  Fotos de Campo
                </h3>
              </div>
              <button className="p-1 hover:bg-[#f8f9fb] rounded-full transition-colors text-[#191c1e]">
                <Plus size={20} weight="bold" />
              </button>
            </div>

            {/* Visual Grid of photos */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Photo 1 */}
              <div className="relative group overflow-hidden rounded-[16px] aspect-square bg-gradient-to-tr from-slate-700 to-slate-400 flex items-end p-3 shadow-inner">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-200" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white tracking-[0.25px] uppercase leading-[15px]">
                    Fundação -<br />Setor A
                  </p>
                </div>
              </div>

              {/* Photo 2 */}
              <div className="relative group overflow-hidden rounded-[16px] aspect-square bg-gradient-to-tr from-cyan-800 to-cyan-500 flex items-end p-3 shadow-inner">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-200" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white tracking-[0.25px] uppercase leading-[15px]">
                    Equipe em<br />campo
                  </p>
                </div>
              </div>

              {/* Photo 3 */}
              <div className="relative group overflow-hidden rounded-[16px] aspect-square bg-gradient-to-tr from-[#001848] to-[#006492] flex items-end p-3 shadow-inner">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-200" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white tracking-[0.25px] uppercase leading-[15px]">
                    Fachada Norte
                  </p>
                </div>
              </div>

              {/* Dotted slots "Ver Mais" */}
              <div className="border-2 border-[#e1e2e4] border-dashed rounded-[16px] aspect-square flex flex-col items-center justify-center gap-1 group hover:border-[#006492] hover:bg-[#f8f9fb] transition-all cursor-pointer">
                <Camera size={20} className="text-[#737685] group-hover:text-[#006492]" />
                <span className="text-[10px] font-bold text-[#737685] tracking-[-0.5px] uppercase group-hover:text-[#006492]">
                  Ver mais
                </span>
              </div>
            </div>
          </div>

          {/* Progress storage */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12px] font-bold text-[#191c1e]">
              <span className="flex items-center gap-1.5 uppercase tracking-[-0.3px]">
                <FileText size={16} /> Armazenamento
              </span>
              <span className="text-[#006492]">45%</span>
            </div>
            <div className="h-[8px] bg-[#f8f9fb] border border-[#e1e2e4]/30 rounded-full overflow-hidden w-full">
              <div className="h-full bg-[#006492] rounded-full w-[45%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Section 3: Contratos (col-span-6) */}
        <div className="bg-white border border-[#e1e2e4] rounded-[16px] p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[#191c1e]" />
              <h3 className="text-[20px] font-bold text-[#191c1e] font-['Manrope']">
                Contratos
              </h3>
            </div>
            <button className="text-[12px] font-bold text-[#006492] tracking-[1.2px] uppercase hover:underline">
              Acessar Tudo
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {contractFiles.map((doc, idx) => (
              <div
                key={idx}
                className="bg-[#f9fafb] border border-[rgba(0,0,0,0)] p-4 rounded-[16px] flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#c9e6ff] p-3 rounded-[8px] flex items-center justify-center shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                    <File size={20} className="text-[#006492]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-[#191c1e] hover:text-[#006492] cursor-pointer">
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-[#737685] mt-1">
                      {doc.statusText} • {doc.date}
                    </span>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#737685]">{doc.size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Licenças e Alvarás (col-span-6) */}
        <div className="bg-white border border-[#e1e2e4] rounded-[16px] p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#191c1e]" />
              <h3 className="text-[20px] font-bold text-[#191c1e] font-['Manrope']">
                Licenças e Alvarás
              </h3>
            </div>
            <button className="text-[12px] font-bold text-[#006492] tracking-[1.2px] uppercase hover:underline">
              Acessar Tudo
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {licenseFiles.map((doc, idx) => {
              const isValido = doc.status === "valido";
              return (
                <div
                  key={idx}
                  className="bg-[#f9fafb] border border-[rgba(0,0,0,0)] p-4 rounded-[16px] flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-[8px] flex items-center justify-center shadow-[0px_1px_2px_rgba(0,0,0,0.05)] ${
                        isValido ? "bg-[rgba(183,244,49,0.2)]" : "bg-[#fffbeb]"
                      }`}
                    >
                      <ShieldCheck
                        size={20}
                        className={isValido ? "text-[#001e00]" : "text-[#92400e]"}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#191c1e] hover:text-[#006492] cursor-pointer">
                        {doc.name}
                      </span>
                      <span className="text-[10px] text-[#737685] mt-1 font-medium">
                        Vencimento: {doc.expiration}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-[8px] text-[9px] font-bold tracking-[0.45px] uppercase ${
                      isValido ? "bg-[#9fd300] text-[#001e00]" : "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]"
                    }`}
                  >
                    {doc.statusText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 5: Atividades Recentes (col-span-12 - Spans full width) */}
      <div className="bg-[#e8f0fe] border border-[rgba(201,230,255,0.3)] rounded-[16px] p-8 relative overflow-hidden flex flex-col lg:flex-row justify-between items-start gap-8 shadow-inner">
        {/* Glow detail */}
        <div className="absolute bg-[rgba(0,100,146,0.05)] blur-[32px] right-[-128px] top-[-128px] rounded-full w-80 h-80 pointer-events-none" />

        <div className="max-w-xs relative z-10">
          <div className="bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] w-12 h-12 rounded-[16px] flex items-center justify-center mb-6">
            <Clock size={20} className="text-[#006492]" />
          </div>
          <h4 className="text-[24px] font-extrabold text-[#191c1e] tracking-tight mb-2 font-['Manrope']">
            Atividades Recentes
          </h4>
          <p className="text-[14px] text-[#737685] leading-[22px] font-['Inter']">
            Auditoria em tempo real de acessos e modificações nos documentos do projeto.
          </p>
        </div>

        {/* Timeline */}
        <div className="flex-1 w-full lg:pl-16 relative z-10 flex flex-col gap-6">
          {/* Timeline Item 1 */}
          <div className="flex gap-5 items-start relative">
            {/* Dot */}
            <div className="pt-1.5 z-10">
              <div className="w-4 h-4 bg-[#9fd300] border-4 border-white rounded-full shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
            </div>
            {/* Vert Line connecting to item 2 */}
            <div className="absolute top-[22px] left-[7px] bottom-[-24px] w-[2px] bg-[rgba(0,100,146,0.1)]" />

            <div className="flex flex-col">
              <p className="text-[16px] text-[#191c1e]">
                <span className="font-bold">Ricardo M.</span> fez o upload de{" "}
                <span className="font-bold text-[#006492] hover:underline cursor-pointer">
                  Planta_Baixa_Pav01_V4.pdf
                </span>
              </p>
              <span className="text-[10px] font-bold text-[#737685] tracking-[1px] uppercase mt-1">
                Hoje às 14:32
              </span>
            </div>
          </div>

          {/* Timeline Item 2 */}
          <div className="flex gap-5 items-start relative">
            {/* Dot */}
            <div className="pt-1.5 z-10">
              <div className="w-4 h-4 bg-[#e1e2e4] border-4 border-white rounded-full shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" />
            </div>

            <div className="flex flex-col">
              <p className="text-[16px] text-[#191c1e]">
                <span className="font-bold">Ana Silva</span> visualizou{" "}
                <span className="font-bold text-[#191c1e] hover:underline cursor-pointer">
                  Calculo_Estrutural_Final.dwg
                </span>
              </p>
              <span className="text-[10px] font-bold text-[#737685] tracking-[1px] uppercase mt-1">
                Hoje às 10:15
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
