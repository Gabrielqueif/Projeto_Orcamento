"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Sun, 
  Cloud, 
  CloudRain, 
  User, 
  Plus, 
  Funnel,
  CheckCircle,
  Clock,
  Warning
} from "@phosphor-icons/react";

interface TimelineEntry {
  date: string;
  weekday: string;
  title: string;
  description: string;
  status: "APROVADO" | "PENDENTE" | "ALERTA";
  clima: string;
  weatherIcon: React.ElementType;
  responsible: string;
  images: string[];
}

interface ProjectData {
  name: string;
  duration: string;
  location: string;
  progress: number;
  lastUpdate: string;
  timeline: TimelineEntry[];
}

const projectsData: Record<string, ProjectData> = {
  aurora: {
    name: "Residencial Aurora",
    duration: "142 Dias",
    location: "Curitiba, PR",
    progress: 32,
    lastUpdate: "hoje às 08:45",
    timeline: [
      {
        date: "24 JAN, 2024",
        weekday: "Terça-feira",
        title: "Concretagem da Laje L2",
        description: "Execução do bombeamento de concreto fck 30MPa conforme projeto estrutural.",
        status: "APROVADO",
        clima: "Sol / 28°C",
        weatherIcon: Sun,
        responsible: "Eng. Ricardo S.",
        images: [
          "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=300&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=300&auto=format&fit=crop"
        ]
      },
      {
        date: "23 JAN, 2024",
        weekday: "Segunda-feira",
        title: "Montagem de Armação",
        description: "Finalização do posicionamento de ferragens e conferência de espaçadores.",
        status: "APROVADO",
        clima: "Nublado / 22°C",
        weatherIcon: Cloud,
        responsible: "Mestre Antônio",
        images: []
      },
      {
        date: "22 JAN, 2024",
        weekday: "Domingo",
        title: "Instalações Elétricas e Hidráulicas",
        description: "Passagem de conduítes e tubulações de esgoto secundário embutidos em laje.",
        status: "APROVADO",
        clima: "Sol / 26°C",
        weatherIcon: Sun,
        responsible: "Eng. Ricardo S.",
        images: []
      }
    ]
  },
  logx: {
    name: "Complexo Logístico LogX",
    duration: "210 Dias",
    location: "Distrito Industrial, SC",
    progress: 68,
    lastUpdate: "ontem às 17:00",
    timeline: [
      {
        date: "24 JAN, 2024",
        weekday: "Terça-feira",
        title: "Montagem da Estrutura Metálica",
        description: "Instalação das vigas principais do galpão A com suporte de guindastes.",
        status: "PENDENTE",
        clima: "Nublado / 21°C",
        weatherIcon: Cloud,
        responsible: "Engª Ana Paula",
        images: []
      }
    ]
  },
  global: {
    name: "Centro Executivo Global",
    duration: "365 Dias",
    location: "Av. Paulista, 1200 - SP",
    progress: 15,
    lastUpdate: "há 2 dias às 16:30",
    timeline: [
      {
        date: "23 JAN, 2024",
        weekday: "Segunda-feira",
        title: "Escavação de Fundações",
        description: "Início da escavação mecânica para sapatas do bloco central.",
        status: "ALERTA",
        clima: "Chuva / 18°C",
        weatherIcon: CloudRain,
        responsible: "Eng. Roberto Costa",
        images: []
      }
    ]
  }
};

export default function DiarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "aurora";

  const project = projectsData[id] || projectsData.aurora;

  return (
    <div className="flex flex-col h-full font-manrope">
      {/* Back link & Title */}
      <div className="mb-8">
        <Link 
          href="/diario" 
          className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#001b3c] font-bold transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para Visão Geral
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#001b3c] tracking-tight">Diário de Obra</h1>
            <p className="text-sm text-[#64748b] mt-1">{project.name}</p>
          </div>
        </div>
      </div>

      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Project Card Info (8 columns) */}
        <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-[12px] p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Subtle Glow */}
          <div 
            className="absolute bg-[rgba(159,211,0,0.08)] blur-[24px] right-[-32px] rounded-full w-[140px] h-[140px] top-[-32px] pointer-events-none" 
          />

          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[1px] bg-[#9fd300]/25 text-[#4c6700]">
              Em Execução
            </span>
            <h2 className="text-[32px] font-extrabold text-[#001b3c] tracking-tight mt-3">
              {project.name}
            </h2>
            <p className="text-[15px] text-[#434935] mt-2 max-w-[500px] leading-[22px]">
              Monitoramento detalhado de progresso e ocorrências diárias do canteiro de obras.
            </p>
          </div>

          <div className="flex gap-12 mt-6 border-t border-[#e2e8f0] pt-4">
            <div>
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px]">Duração Total</span>
              <div className="text-[20px] font-extrabold text-[#001b3c] mt-0.5 flex items-baseline gap-1">
                {project.duration.split(" ")[0]} <span className="text-sm font-semibold text-[#94a3b8]">Dias</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px]">Localização</span>
              <div className="text-[15px] font-bold text-[#001b3c] mt-1 flex items-center gap-1.5">
                <MapPin size={16} className="text-[#64748b]" weight="bold" />
                {project.location}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card (4 columns) */}
        <div className="lg:col-span-4 bg-[#003061] text-white rounded-[12px] p-8 flex flex-col items-center justify-between shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] min-h-[220px]">
          <div className="w-full text-center">
            <span className="text-[12px] font-bold text-slate-300 uppercase tracking-[1px]">
              Progresso da Obra
            </span>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center my-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-500/30"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#9fd300]"
                strokeWidth="3"
                strokeDasharray={`${project.progress}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
              <span className="text-[26px] font-extrabold text-white">{project.progress}%</span>
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.8px] mt-0.5">Completo</span>
            </div>
          </div>

          <div className="w-full text-center">
            <span className="text-[10px] text-slate-300">
              Atualizado {project.lastUpdate}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="mt-4">
        {/* Timeline Header */}
        <div className="flex justify-between items-center mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="w-[8px] h-[32px] rounded-full bg-gradient-to-b from-[#4c6700] to-[#9fd300]" />
            <h3 className="text-[20px] font-extrabold text-[#001b3c] tracking-tight">Linha do Tempo</h3>
          </div>
          <div className="flex gap-2">
            <button className="bg-[#f0f3ff] hover:bg-slate-200 text-[#434935] text-[12px] font-bold px-4 py-2.5 rounded-[12px] transition-colors cursor-pointer flex items-center gap-1.5">
              <Funnel size={14} weight="bold" /> Filtrar
            </button>
            <button className="bg-gradient-to-r from-[#4c6700] to-[#9fd300] hover:opacity-95 text-white text-[12px] font-bold px-4 py-2.5 rounded-[12px] transition-all shadow-[0px_10px_15px_-3px_rgba(76,103,0,0.2)] cursor-pointer flex items-center gap-1.5">
              <Plus size={14} weight="bold" /> Novo Registro
            </button>
          </div>
        </div>

        {/* Timeline Entries */}
        <div className="relative border-l-2 border-[#e2e8f0] ml-6 pl-8 flex flex-col gap-10">
          {project.timeline.map((entry, index) => {
            const WeatherIcon = entry.weatherIcon;

            return (
              <div key={index} className="relative">
                {/* Node marker */}
                <div 
                  className={`absolute left-[-41px] top-1.5 w-[20px] h-[20px] rounded-full border-4 border-[#f8fafc] flex items-center justify-center ${
                    index === 0 ? "bg-[#9fd300]" : "bg-[#94a3b8]"
                  }`} 
                />

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Left Side: Date */}
                  <div className="w-[128px] shrink-0 pt-1">
                    <span className="block text-[12px] font-bold text-[#434935]">{entry.date}</span>
                    <span className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[-0.5px] mt-0.5">
                      {entry.weekday}
                    </span>
                  </div>

                  {/* Right Side: Content Card */}
                  <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-[18px] font-bold text-[#001b3c] tracking-tight">
                          {entry.title}
                        </h4>
                        <p className="text-[14px] text-[#64748b] mt-1.5 leading-[20px]">
                          {entry.description}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span 
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.5px] uppercase ${
                          entry.status === "APROVADO"
                            ? "bg-[rgba(159,211,0,0.2)] text-[#405700]"
                            : entry.status === "PENDENTE"
                            ? "bg-[rgba(161,196,255,0.3)] text-[#2a5085]"
                            : "bg-[rgba(255,218,214,0.4)] text-[#93000a]"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>

                    {/* Image Attachment Grid */}
                    {entry.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        {entry.images.map((src, imgIdx) => (
                          <div 
                            key={imgIdx} 
                            className="aspect-video w-full rounded-[8px] overflow-hidden border border-[#e2e8f0] shadow-sm relative group cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={src} 
                              alt={`Anexo ${imgIdx + 1}`}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card Footer: Metadata */}
                    <div className="border-t border-[#f1f5f9] mt-6 pt-4 flex gap-6 items-center">
                      <div className="flex items-center gap-1.5 text-[#94a3b8]">
                        <WeatherIcon size={16} weight="bold" />
                        <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]">
                          {entry.clima}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#94a3b8]">
                        <User size={16} weight="bold" />
                        <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]">
                          {entry.responsible}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
