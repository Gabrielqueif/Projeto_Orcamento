"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DownloadSimple,
  TrendUp,
  Money,
  Funnel,
  List,
  SquaresFour,
  Trash,
  Users,
  Info,
  FilePdf,
  FileText,
  UserPlus,
  Plus,
  MagnifyingGlass,
  CaretDown,
} from "@phosphor-icons/react";

interface Member {
  id: number;
  nome: string;
  code: string;
  cargo: string;
  projeto: string;
  remuneracao: string;
  status: "ATIVO" | "INATIVO";
  dataInicio?: string;
  descricao?: string;
}

const DEFAULT_MEMBERS: Member[] = [
  { id: 1, nome: "Ricardo Silva", code: "#GP-0421", cargo: "Engenheiro Civil Sênior", projeto: "Residencial Aurora", remuneracao: "R$ 14.500,00", status: "ATIVO" },
  { id: 2, nome: "Ana Paula Martins", code: "#GP-0892", cargo: "Mestre de Obras", projeto: "Edifício Skyline", remuneracao: "R$ 7.800,00", status: "ATIVO" },
  { id: 3, nome: "Marcos Oliveira", code: "#GP-1102", cargo: "Pedreiro Especialista", projeto: "Ponte Central", remuneracao: "R$ 4.200,00", status: "ATIVO" },
  { id: 4, nome: "Juliana Costa", code: "#GP-0331", cargo: "Auxiliar Administrativo", projeto: "—", remuneracao: "R$ 2.800,00", status: "INATIVO" },
];

export default function EquipePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObra, setSelectedObra] = useState("Todas as Obras");
  const [selectedCargo, setSelectedCargo] = useState("Todos os Cargos");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Load from localstorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("team_members");
    if (stored) {
      setMembers(JSON.parse(stored));
    } else {
      localStorage.setItem("team_members", JSON.stringify(DEFAULT_MEMBERS));
      setMembers(DEFAULT_MEMBERS);
    }
  }, []);

  // Parse remuneration string to float number (e.g. "R$ 14.500,00" -> 14500)
  const parseSalary = (val: string) => {
    const clean = val.replace(/[^\d]/g, "");
    return clean ? parseFloat(clean) / 100 : 0;
  };

  // Delete handler
  const handleDeleteMember = (id: number) => {
    if (confirm("Deseja realmente remover este colaborador da equipe?")) {
      const updated = members.filter((m) => m.id !== id);
      setMembers(updated);
      localStorage.setItem("team_members", JSON.stringify(updated));
    }
  };

  // Unique options for filters
  const uniqueObras = Array.from(
    new Set(members.map((m) => m.projeto).filter((p) => p && p !== "—"))
  );
  const uniqueCargos = Array.from(new Set(members.map((m) => m.cargo)));

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesObra =
      selectedObra === "Todas as Obras" || m.projeto === selectedObra;
    
    const matchesCargo =
      selectedCargo === "Todos os Cargos" || m.cargo === selectedCargo;

    return matchesSearch && matchesObra && matchesCargo;
  });

  // Calculate dynamic KPIs
  const activeMembers = members.filter((m) => m.status === "ATIVO");
  
  const totalCost = activeMembers.reduce(
    (sum, m) => sum + parseSalary(m.remuneracao),
    0
  );
  
  const activeCount = activeMembers.length;
  
  const activeProjectsCount = new Set(
    activeMembers.map((m) => m.projeto).filter((p) => p && p !== "—" && p !== "Sem Alocação")
  ).size;

  const averageSalary =
    members.length > 0
      ? members.reduce((sum, m) => sum + parseSalary(m.remuneracao), 0) /
        members.length
      : 0;

  // Pagination helper
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    // Reset page if it exceeds total pages after filtering
    if (page > totalPages) {
      setPage(1);
    }
  }, [filteredMembers.length, totalPages, page]);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Actions Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <p className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#00a3b1] uppercase tracking-[0.5px] mb-1">
            GESTÃO / RECURSOS HUMANOS
          </p>
          <h1 className="font-['Manrope'] font-extrabold text-[36px] text-[#001b3d] tracking-[-0.9px] leading-tight">
            Gestão de Equipe
          </h1>
          <p className="text-[14px] text-[#64748b] font-medium mt-1">
            Controle de profissionais, alocações e custos operacionais dos canteiros ativos.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/equipe/novo"
            className="flex items-center gap-2 px-5 py-3 bg-[#9fd300] hover:bg-[#9fd300]/90 text-[#001b3d] rounded-[8px] text-sm font-extrabold shadow-[0px_10px_15px_-3px_rgba(159,211,0,0.15)] transition-all"
          >
            <Plus size={16} weight="bold" />
            Novo Membro
          </Link>
          <button className="flex items-center gap-2 px-5 py-3 bg-[#001b3d] hover:bg-[#001b3d]/90 text-white rounded-[8px] text-sm font-bold shadow-[0px_10px_15px_-3px_rgba(0,27,61,0.1)] transition-all">
            <DownloadSimple size={16} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Custo Mensal Total */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px] mb-1">
              Custo Mensal Total
            </div>
            <div className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d] leading-none mb-2">
              {totalCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </div>
          <div className="font-['Manrope'] font-bold text-[10px] text-[#ef4444] flex items-center gap-1">
            <TrendUp size={14} weight="bold" /> +4.2% este mês
          </div>
          <Money
            weight="fill"
            className="absolute -right-4 -bottom-4 text-[70px] text-[#001b3d]/5 pointer-events-none"
          />
        </div>

        {/* KPI 2: Efetivo Ativo */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px] mb-1">
              Efetivo Ativo
            </div>
            <div className="font-['Manrope'] font-extrabold text-[32px] text-[#001b3d] leading-none">
              {activeCount}
            </div>
          </div>
          {/* Overlapping small avatar icons representing team members */}
          <div className="flex items-center mt-2 pl-2">
            <div className="w-[28px] h-[28px] rounded-full bg-[#e2e8f0] border-2 border-white -ml-2 overflow-hidden flex items-center justify-center font-bold text-[8px] text-[#001b3d]">
              RS
            </div>
            <div className="w-[28px] h-[28px] rounded-full bg-[#cbd5e1] border-2 border-white -ml-2 overflow-hidden flex items-center justify-center font-bold text-[8px] text-[#001b3d]">
              AP
            </div>
            <div className="w-[28px] h-[28px] rounded-full bg-[#94a3b8] border-2 border-white -ml-2 overflow-hidden flex items-center justify-center font-bold text-[8px] text-[#001b3d]">
              MO
            </div>
          </div>
        </div>

        {/* KPI 3: Projetos Ativos */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px] mb-1">
              Projetos Ativos
            </div>
            <div className="font-['Manrope'] font-extrabold text-[32px] text-[#00a3b1] leading-none flex items-baseline gap-2">
              {activeProjectsCount}{" "}
              <span className="font-['Manrope'] font-bold text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                Canteiros
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Média Salarial */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-between min-h-[125px]">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px] mb-1">
              Média Salarial
            </div>
            <div className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d] leading-none mb-2">
              {averageSalary.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </div>
          <div className="font-['Manrope'] font-bold text-[10px] text-[#9fd300] uppercase tracking-[0.5px]">
            Dentro do Orçamento
          </div>
        </div>
      </div>

      {/* Filters & Controls Bar */}
      <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-[8px] p-[13px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          <div className="flex items-center gap-2 px-3 text-[#64748b] whitespace-nowrap">
            <Funnel size={14} />
            <span className="font-['JetBrains_Mono'] text-[10px] font-medium uppercase tracking-[0.5px]">
              Filtrar por:
            </span>
          </div>

          <div className="relative flex-1 max-w-[220px]">
            <select
              value={selectedObra}
              onChange={(e) => setSelectedObra(e.target.value)}
              className="w-full bg-white border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] pl-4 pr-10 py-2 font-['Manrope'] font-bold text-[12px] text-[#001b3d] outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23001b3d%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
            >
              <option value="Todas as Obras">Todas as Obras</option>
              {uniqueObras.map((obra) => (
                <option key={obra} value={obra}>
                  {obra}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 max-w-[220px]">
            <select
              value={selectedCargo}
              onChange={(e) => setSelectedCargo(e.target.value)}
              className="w-full bg-white border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] pl-4 pr-10 py-2 font-['Manrope'] font-bold text-[12px] text-[#001b3d] outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23001b3d%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
            >
              <option value="Todos os Cargos">Todos os Cargos</option>
              {uniqueCargos.map((cargo) => (
                <option key={cargo} value={cargo}>
                  {cargo}
                </option>
              ))}
            </select>
          </div>

          {/* Local Search input */}
          <div className="relative flex-1 max-w-[240px]">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <MagnifyingGlass size={14} className="text-[#94a3b8]" />
            </div>
            <input
              type="text"
              placeholder="Buscar na equipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] pl-9 pr-4 py-2 font-['Manrope'] text-[12px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-colors"
            />
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex gap-1.5 self-end md:self-auto border-l border-[#e2e8f0] pl-4">
          <button
            onClick={() => setViewMode("list")}
            className={`w-[34px] h-[31px] rounded-[6px] flex items-center justify-center cursor-pointer transition-all border ${
              viewMode === "list"
                ? "bg-[#001b3d] text-white border-[#001b3d] shadow-[0px_4px_6px_rgba(0,27,61,0.15)]"
                : "bg-white text-[#94a3b8] border-[#e2e8f0] hover:text-[#001b3d]"
            }`}
            title="Visualização em Lista"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`w-[34px] h-[31px] rounded-[6px] flex items-center justify-center cursor-pointer transition-all border ${
              viewMode === "grid"
                ? "bg-[#001b3d] text-white border-[#001b3d] shadow-[0px_4px_6px_rgba(0,27,61,0.15)]"
                : "bg-white text-[#94a3b8] border-[#e2e8f0] hover:text-[#001b3d]"
            }`}
            title="Visualização em Grade"
          >
            <SquaresFour size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Table List or Cards Grid */}
      {viewMode === "list" ? (
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                  <th className="p-4 px-6 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                    Membro
                  </th>
                  <th className="p-4 px-6 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                    Cargo
                  </th>
                  <th className="p-4 px-6 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                    Projeto Alocado
                  </th>
                  <th className="p-4 px-6 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
                    Remuneração
                  </th>
                  <th className="p-4 px-6 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] text-center">
                    Status
                  </th>
                  <th className="p-4 px-6 font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px] text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc]">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center font-['Manrope'] text-[14px] text-[#94a3b8]"
                    >
                      Nenhum membro encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                    <tr
                      key={member.id}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        member.status === "INATIVO" ? "opacity-60" : ""
                      }`}
                    >
                      <td className="p-4 px-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              member.nome
                            )}&background=001b3d&color=9fd300`}
                            alt={member.nome}
                            className="w-[40px] h-[40px] rounded-[8px] border border-[#e2e8f0]"
                          />
                          <div>
                            <div className="font-['Manrope'] font-bold text-[14px] text-[#001b3d] leading-tight mb-0.5">
                              {member.nome}
                            </div>
                            <div className="font-['JetBrains_Mono'] font-normal text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                              ID: {member.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 px-6 font-['Manrope'] font-bold text-[12px] text-[#001b3d] uppercase">
                        {member.cargo}
                      </td>
                      <td className="p-4 px-6">
                        {member.projeto && member.projeto !== "—" ? (
                          <span className="inline-flex items-center px-[8px] py-[4px] rounded-[8px] font-['JetBrains_Mono'] font-medium text-[10px] text-[#00a3b1] uppercase tracking-[0.5px] bg-[rgba(0,163,177,0.05)]">
                            {member.projeto}
                          </span>
                        ) : (
                          <span className="font-['JetBrains_Mono'] text-[10px] text-[#cbd5e1] font-medium">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-4 px-6 font-['Manrope'] font-extrabold text-[14px] text-[#001b3d]">
                        {member.remuneracao}
                      </td>
                      <td className="p-4 px-6 text-center">
                        {member.status === "ATIVO" ? (
                          <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[8px] font-['Manrope'] font-bold text-[9px] text-[#001b3d] tracking-[0.45px] uppercase bg-[rgba(159,211,0,0.1)] border border-[rgba(159,211,0,0.2)]">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-[9px] py-[3px] rounded-[8px] font-['Manrope'] font-bold text-[9px] text-[#94a3b8] tracking-[0.45px] uppercase bg-[#f1f5f9] border border-[#e2e8f0]">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="p-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-[#94a3b8] hover:text-red-500 transition-colors p-1"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedMembers.length === 0 ? (
            <div className="col-span-full bg-white border border-[#f1f5f9] rounded-[8px] p-12 text-center font-['Manrope'] text-[14px] text-[#94a3b8]">
              Nenhum membro encontrado com os filtros atuais.
            </div>
          ) : (
            paginatedMembers.map((member) => (
              <div
                key={member.id}
                className={`bg-white border border-[#f1f5f9] rounded-[8px] p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-4 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] ${
                  member.status === "INATIVO" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.nome
                      )}&background=001b3d&color=9fd300`}
                      alt={member.nome}
                      className="w-[48px] h-[48px] rounded-[8px] border border-[#e2e8f0]"
                    />
                    <div>
                      <h4 className="font-['Manrope'] font-bold text-[15px] text-[#001b3d] leading-tight">
                        {member.nome}
                      </h4>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">
                        {member.code}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-[#94a3b8] hover:text-red-500 transition-colors p-1"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-[#f8fafc]">
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[9px] text-[#94a3b8] uppercase tracking-[0.5px]">
                      Cargo
                    </span>
                    <span className="font-['Manrope'] font-bold text-[12px] text-[#001b3d] uppercase">
                      {member.cargo}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[9px] text-[#94a3b8] uppercase tracking-[0.5px]">
                      Alocação
                    </span>
                    {member.projeto && member.projeto !== "—" ? (
                      <span className="px-2 py-0.5 rounded-[6px] font-['JetBrains_Mono'] font-medium text-[9px] text-[#00a3b1] bg-[rgba(0,163,177,0.05)] uppercase">
                        {member.projeto}
                      </span>
                    ) : (
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#cbd5e1] font-medium">
                        —
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-[9px] text-[#94a3b8] uppercase tracking-[0.5px]">
                      Remuneração
                    </span>
                    <span className="font-['Manrope'] font-extrabold text-[13px] text-[#001b3d]">
                      {member.remuneracao}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="font-['JetBrains_Mono'] text-[9px] text-[#94a3b8] uppercase tracking-[0.5px]">
                      Status
                    </span>
                    {member.status === "ATIVO" ? (
                      <span className="px-2 py-0.5 rounded-[6px] font-['Manrope'] font-bold text-[8px] text-[#001b3d] tracking-[0.4px] uppercase bg-[rgba(159,211,0,0.1)] border border-[rgba(159,211,0,0.2)]">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[6px] font-['Manrope'] font-bold text-[8px] text-[#94a3b8] tracking-[0.4px] uppercase bg-[#f1f5f9] border border-[#e2e8f0]">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="bg-[#f8fafc] border border-t-0 border-[#f1f5f9] rounded-b-[8px] p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-[-24px]">
        <div className="font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]">
          Exibindo {paginatedMembers.length} de {filteredMembers.length} membros
          registrados
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-white border border-[#e2e8f0] text-[#001b3d] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8fafc] font-bold text-xs"
          >
            &lt;
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center font-['JetBrains_Mono'] text-[10px] font-bold uppercase transition-all ${
                  page === pageNum
                    ? "bg-[#001b3d] text-white shadow-[0px_4px_6px_rgba(0,27,61,0.15)]"
                    : "bg-white border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-white border border-[#e2e8f0] text-[#001b3d] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8fafc] font-bold text-xs"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Contextual Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Insight de Alocação (Dark Blue, 1 column) */}
        <div className="bg-[#001b3d] col-span-1 text-white p-8 rounded-[8px] relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-[0px_10px_15px_-3px_rgba(0,27,61,0.1)]">
          <div className="flex items-center gap-3 mb-4 z-10">
            <Info size={24} className="text-[#9fd300]" />
            <h3 className="font-['Manrope'] font-extrabold text-[18px] text-white">
              Insight de Alocação
            </h3>
          </div>
          <p className="font-['Manrope'] font-medium text-[14px] text-[#cbd5e1] leading-[22px] z-10">
            A alocação atual na{" "}
            <strong className="text-[#9fd300] font-bold">Ponte Central</strong> está
            15% acima da média operacional. Considere redistribuir membros
            auxiliares para otimizar custos no próximo ciclo.
          </p>
          <div className="absolute right-[-10px] bottom-[-20px] text-[120px] text-white/5 font-bold pointer-events-none select-none">
            !
          </div>
        </div>

        {/* Relatório de Folha Mensal (White/Gray, 2 columns) */}
        <div className="bg-white border border-[#f1f5f9] col-span-1 lg:col-span-2 p-8 rounded-[8px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 min-h-[220px]">
          <div className="flex flex-col gap-4 flex-1">
            <h3 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3d]">
              Relatório de Folha Mensal
            </h3>
            <p className="font-['Manrope'] font-medium text-[14px] text-[#64748b] leading-[20px] max-w-[420px]">
              O demonstrativo detalhado de horas, encargos e benefícios por
              centro de custo está disponível para auditoria.
            </p>
            <button className="flex items-center gap-2 self-start bg-[#f8fafc] border border-[#e2e8f0] text-[#001b3d] font-['JetBrains_Mono'] font-medium text-[12px] tracking-[0.5px] uppercase px-5 py-3 rounded-[8px] hover:bg-[#f1f5f9] transition-colors">
              <FilePdf size={16} /> Gerar PDF Completo
            </button>
          </div>

          <div className="w-[128px] h-[128px] border-4 border-white bg-[#f8fafc] rounded-full flex items-center justify-center text-[#94a3b8] shrink-0 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)]">
            <FileText size={48} />
          </div>
        </div>
      </div>
    </div>
  );
}
