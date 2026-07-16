"use client";

import Link from "next/link";
import { FolderPlus, Folder, ArrowRight, FilePdf, FileText, DownloadSimple } from "@phosphor-icons/react";

interface ProjectRepo {
  id: string;
  name: string;
  client: string;
  status: "conformidade" | "vencidos" | "pendencias";
  statusText: string;
  metricLabel: string;
  metricValue: string;
  metricMax: string;
  progressPercent: number;
  storageUsed: string;
}

const projects: ProjectRepo[] = [
  {
    id: "aurora",
    name: "Residencial Aurora Sky",
    client: "Construtora Horizonte Sul",
    status: "conformidade",
    statusText: "Em Conformidade",
    metricLabel: "Documentos Técnicos",
    metricValue: "142",
    metricMax: "142",
    progressPercent: 100,
    storageUsed: "1.2GB",
  },
  {
    id: "viracopos",
    name: "Complexo Logístico Viracopos",
    client: "LogisTrans S.A.",
    status: "vencidos",
    statusText: "Documentos Vencidos",
    metricLabel: "Alvarás e Licenças",
    metricValue: "12",
    metricMax: "15",
    progressPercent: 80,
    storageUsed: "845MB",
  },
  {
    id: "retrofit",
    name: "Retrofit Edifício Central",
    client: "Investimentos Imob.",
    status: "pendencias",
    statusText: "Pendências Críticas",
    metricLabel: "Segurança do Trabalho",
    metricValue: "08",
    metricMax: "24",
    progressPercent: 33.3,
    storageUsed: "2.1GB",
  },
  {
    id: "parque-flores",
    name: "Urbanização Parque das Flores",
    client: "Prefeitura Municipal",
    status: "conformidade",
    statusText: "Em Conformidade",
    metricLabel: "Projetos Executivos",
    metricValue: "89",
    metricMax: "89",
    progressPercent: 100,
    storageUsed: "456MB",
  },
];

interface RecentDoc {
  id: string;
  name: string;
  project: string;
  date: string;
  type: "pdf" | "doc";
}

const recentDocs: RecentDoc[] = [
  {
    id: "1",
    name: "Planta_Baixa_Pav01_V4.pdf",
    project: "Residencial Aurora Sky",
    date: "Hoje, 10:45",
    type: "pdf",
  },
  {
    id: "2",
    name: "Calculo_Estrutural_Final.dwg",
    project: "Complexo Logístico Viracopos",
    date: "Ontem, 16:20",
    type: "doc",
  },
  {
    id: "3",
    name: "Projeto_Eletrico_Rev01.pdf",
    project: "Retrofit Edifício Central",
    date: "08 Out 2023",
    type: "pdf",
  },
];

export default function DocsPage() {
  // Radial Chart configuration
  const pct = 74;
  const radius = 56;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fb]">
      {/* Top Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-[12px] font-bold text-[#001848] uppercase tracking-[1.2px] font-['Manrope'] mb-1">
            Gestão Documental
          </p>
          <h1 className="text-[30px] font-extrabold text-[#191c1e] tracking-[-0.75px] font-['Manrope']">
            Repositório de Projetos
          </h1>
          <p className="text-[14px] text-[#434654] font-['Manrope'] mt-1">
            Acompanhamento de conformidade técnica e legal das obras ativas.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-[10px] bg-[#001848] text-white rounded-[8px] text-[14px] font-bold transition-all hover:bg-[#002878] shadow-[0px_4px_6px_rgba(0,24,72,0.15)] cursor-pointer">
          <FolderPlus size={18} weight="bold" /> Novo Repositório
        </button>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-white border-[#9fd300] border-b-4 border-solid rounded-[8px] p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-[12px] font-bold text-[#64748b] uppercase tracking-[-0.6px] mb-1 font-['Manrope']">
            Total de Arquivos
          </p>
          <p className="text-[30px] font-extrabold text-[#191c1e] font-['Manrope']">
            2,842
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border-[#001848] border-b-4 border-solid rounded-[8px] p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-[12px] font-bold text-[#64748b] uppercase tracking-[-0.6px] mb-1 font-['Manrope']">
            Em Conformidade
          </p>
          <p className="text-[30px] font-extrabold text-[#191c1e] font-['Manrope'] flex items-baseline gap-1">
            18 <span className="text-[14px] font-medium text-[#94a3b8]">obras</span>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border-[#7b2600] border-b-4 border-solid rounded-[8px] p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-[12px] font-bold text-[#64748b] uppercase tracking-[-0.6px] mb-1 font-['Manrope']">
            Pendências Críticas
          </p>
          <p className="text-[30px] font-extrabold text-[#7b2600] font-['Manrope']">
            04
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border-[#ba1a1a] border-b-4 border-solid rounded-[8px] p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-[12px] font-bold text-[#64748b] uppercase tracking-[-0.6px] mb-1 font-['Manrope']">
            Vencidos
          </p>
          <p className="text-[30px] font-extrabold text-[#ba1a1a] font-['Manrope']">
            07
          </p>
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {projects.map((project) => {
          // Color schemes according to status
          let folderColor = "text-[#001848]";
          let badgeBg = "bg-[rgba(159,211,0,0.2)]";
          let badgeText = "text-[#001848]";
          let progressColor = "bg-[#9fd300]";
          let progressValueColor = "text-[#191c1e]";

          if (project.status === "vencidos") {
            folderColor = "text-[#7b2600]";
            badgeBg = "bg-[#ffedd5]";
            badgeText = "text-[#7b2600]";
            progressColor = "bg-[#7b2600]";
            progressValueColor = "text-[#7b2600]";
          } else if (project.status === "pendencias") {
            folderColor = "text-[#ba1a1a]";
            badgeBg = "bg-[#fee2e2]";
            badgeText = "text-[#ba1a1a]";
            progressColor = "bg-[#ba1a1a]";
            progressValueColor = "text-[#ba1a1a]";
          }

          return (
            <div
              key={project.id}
              className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Card Main Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-[#f8fafc] p-2.5 rounded-[8px] flex items-center justify-center">
                    <Folder weight="fill" size={24} className={folderColor} />
                  </div>
                  <div className={`px-[12px] py-[4px] rounded-full text-[10px] font-bold tracking-[0.5px] uppercase ${badgeBg} ${badgeText}`}>
                    {project.statusText}
                  </div>
                </div>

                <h3 className="text-[18px] font-bold text-[#191c1e] leading-[28px] mb-1 font-['Manrope']">
                  {project.name}
                </h3>
                <p className="text-[12px] font-medium text-[#434654] mb-6 font-['Manrope']">
                  Cliente: {project.client}
                </p>

                {/* Progress bar */}
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex justify-between text-[12px] font-medium text-[#64748b]">
                    <span>{project.metricLabel}</span>
                    <span className={`font-bold ${progressValueColor}`}>
                      {project.metricValue}/{project.metricMax}
                    </span>
                  </div>
                  <div className="h-[8px] bg-[#f1f5f9] rounded-full overflow-hidden w-full">
                    <div
                      className={`h-full ${progressColor} transition-all duration-300`}
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-[#f8fafc] border-t border-[#f1f5f9] px-6 py-4 flex justify-between items-center">
                <span className="text-[12px] font-bold text-[#64748b]">
                  {project.storageUsed} Armazenados
                </span>
                <Link
                  href={`/docs/${project.id}`}
                  className="text-[12px] font-bold text-[#001848] hover:text-[#002878] transition-colors flex items-center gap-1 font-['Manrope']"
                >
                  Acessar Pasta <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Empty state card */}
        <div className="bg-[#f8fafc] border-2 border-dashed border-[#e2e8f0] rounded-[8px] flex flex-col items-center justify-center p-8 min-h-[290px] group hover:border-[#9fd300] hover:bg-white transition-all duration-200 cursor-pointer">
          <div className="bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
            <FolderPlus size={28} className="text-[#94a3b8] group-hover:text-[#9fd300]" />
          </div>
          <h4 className="text-[16px] font-bold text-[#64748b] mb-1 font-['Manrope'] group-hover:text-[#001848] transition-colors">
            Novo Projeto
          </h4>
          <p className="text-[10px] font-bold text-[#94a3b8] tracking-[1px] uppercase font-['Manrope']">
            Iniciar Repositório
          </p>
        </div>
      </div>

      {/* Bottom Layout - Recent Activity and Storage stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents Table (Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-bold text-[#191c1e] font-['Manrope']">
              Documentos Recentes
            </h3>
            <button className="text-[12px] font-bold text-[#001848] uppercase tracking-[0.6px] hover:underline font-['Manrope']">
              Ver todos
            </button>
          </div>

          <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] tracking-[1px] uppercase border-b border-[#f1f5f9]">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] tracking-[1px] uppercase border-b border-[#f1f5f9]">
                    Projeto
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] tracking-[1px] uppercase border-b border-[#f1f5f9]">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-[#64748b] tracking-[1px] uppercase border-b border-[#f1f5f9]">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#f8fafc] transition-colors duration-150">
                    <td className="px-6 py-4 border-b border-[#f1f5f9]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#f8fafc] rounded-[6px]">
                          {doc.type === "pdf" ? (
                            <FilePdf size={20} className="text-[#ba1a1a]" />
                          ) : (
                            <FileText size={20} className="text-[#006492]" />
                          )}
                        </div>
                        <span className="text-[14px] font-bold text-[#191c1e] hover:text-[#001848] transition-colors cursor-pointer">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#f1f5f9] text-[12px] text-[#434654] font-medium">
                      {doc.project}
                    </td>
                    <td className="px-6 py-4 border-b border-[#f1f5f9] text-[12px] text-[#64748b]">
                      {doc.date}
                    </td>
                    <td className="px-6 py-4 border-b border-[#f1f5f9] text-right">
                      <button className="p-2 hover:bg-[#f1f5f9] rounded-full transition-colors cursor-pointer text-[#001848]">
                        <DownloadSimple size={18} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storage Stats Card */}
        <div className="bg-white border border-[#f1f5f9] rounded-[16px] p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col">
          <h3 className="text-[18px] font-bold text-[#191c1e] mb-6 font-['Manrope']">
            Estatísticas de Armazenamento
          </h3>

          {/* Radial circular progress bar */}
          <div className="flex justify-center items-center relative my-4">
            <svg className="w-[140px] h-[140px] transform -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#001848"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[28px] font-extrabold text-[#191c1e] leading-none">
                {pct}%
              </span>
              <span className="text-[9px] font-bold text-[#64748b] tracking-[0.5px] uppercase mt-1">
                Capacidade
              </span>
            </div>
          </div>

          {/* Breakdown items */}
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#64748b] font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#001848] inline-block" />
                Arquivos de Desenho
              </span>
              <span className="font-bold text-[#191c1e]">12.4 GB</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#64748b] font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9fd300] inline-block" />
                Relatórios & Docs
              </span>
              <span className="font-bold text-[#191c1e]">4.2 GB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
