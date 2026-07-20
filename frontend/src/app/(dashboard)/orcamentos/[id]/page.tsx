"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DownloadSimple,
  PencilSimple,
  Copy,
  FileText,
  CaretRight,
  DotsThreeVertical,
  UploadSimple
} from "@phosphor-icons/react";
import { getOrcamento, downloadOrcamentoPDF, updateOrcamento, type Orcamento } from "@/lib/api/orcamentos";
import { PlanilhaView } from "@/components/orcamentos/PlanilhaView";
import { CurvaAbcView } from "@/components/orcamentos/CurvaAbcView";
import { CronogramaFinanceiroView } from "@/components/orcamentos/CronogramaFinanceiroView";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash, X, HardHat, CaretDown } from "@phosphor-icons/react";
import { TransitionDrawer } from "@/components/orcamentos/TransitionDrawer";

type TabType = "planilha" | "abc" | "cronograma" | "anexos";

export default function OrcamentoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("planilha");

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editCliente, setEditCliente] = useState("");
  const [editBdi, setEditBdi] = useState(0);
  const [editVariaveis, setEditVariaveis] = useState<{ nome: string; valor: number }[]>([]);
  const [editLocais, setEditLocais] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isTransitionDrawerOpen, setIsTransitionDrawerOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const STATUS_DETAILS: Record<string, { label: string; style: string; dot: string }> = {
    em_elaboracao: {
      label: "EM ELABORAÇÃO",
      style: "bg-slate-100 border border-slate-200 text-slate-700",
      dot: "bg-slate-500"
    },
    pendente: {
      label: "PENDENTE",
      style: "bg-[#fef3c7] border border-[#fde68a] text-[#b45309]",
      dot: "bg-[#d97706]"
    },
    aprovado: {
      label: "APROVADO",
      style: "bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d]",
      dot: "bg-[#16a34a]"
    },
    recusado: {
      label: "RECUSADO",
      style: "bg-[#fee2e2] border border-[#fecaca] text-[#b91c1c]",
      dot: "bg-[#dc2626]"
    },
    cancelado: {
      label: "CANCELADO",
      style: "bg-gray-100 border border-gray-200 text-gray-500",
      dot: "bg-gray-400"
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsStatusDropdownOpen(false);
    if (!orcamento) return;
    try {
      setLoading(true);
      await updateOrcamento(orcamento.id, { status: newStatus });
      await recarregarOrcamento();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Erro ao atualizar o status do orçamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!orcamento) return;
    setEditNome(orcamento.nome);
    setEditCliente(orcamento.cliente || "");
    setEditBdi(orcamento.bdi || 0);
    setEditVariaveis(orcamento.variaveis_globais || []);
    setEditLocais(orcamento.locais || []);
    setIsEditModalOpen(true);
  };

  const handleSaveOrcamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orcamento) return;
    setSaving(true);
    try {
      await updateOrcamento(orcamento.id, {
        nome: editNome,
        cliente: editCliente,
        bdi: editBdi,
        variaveis_globais: editVariaveis,
        locais: editLocais,
      });
      setIsEditModalOpen(false);
      recarregarOrcamento();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações do orçamento.");
    } finally {
      setSaving(false);
    }
  };

  const addVariavel = () => {
    setEditVariaveis([...editVariaveis, { nome: `VAR_${editVariaveis.length + 1}`, valor: 0 }]);
  };

  const updateVariavel = (index: number, field: "nome" | "valor", value: string | number) => {
    setEditVariaveis(
      editVariaveis.map((v, idx) => {
        if (idx === index) {
          if (field === "nome") {
            return { ...v, nome: (value as string).toUpperCase().replace(/[^A-Z0-9_]/g, "_") };
          } else {
            return { ...v, valor: parseFloat(value as string) || 0 };
          }
        }
        return v;
      })
    );
  };

  const removeVariavel = (index: number) => {
    setEditVariaveis(editVariaveis.filter((_, idx) => idx !== index));
  };

  const addLocal = () => {
    setEditLocais([...editLocais, `Local ${editLocais.length + 1}`]);
  };

  const updateLocal = (index: number, value: string) => {
    setEditLocais(editLocais.map((loc, idx) => (idx === index ? value : loc)));
  };

  const removeLocal = (index: number) => {
    setEditLocais(editLocais.filter((_, idx) => idx !== index));
  };

  const recarregarOrcamento = async () => {
    if (!id) return;
    try {
      const data = await getOrcamento(id);
      setOrcamento(data);
    } catch (err) {
      console.error("Erro ao carregar detalhes do orçamento:", err);
    }
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      await recarregarOrcamento();
      setLoading(false);
    };
    load();
  }, [id]);

  const handleExportPDF = async () => {
    if (!orcamento) return;
    try {
      const blob = await downloadOrcamentoPDF(orcamento.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Orcamento_${orcamento.nome.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao exportar PDF.");
      console.error(err);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-2 font-['Inter'] text-[14px] text-[#64748b]">
          <div className="w-4 h-4 border-2 border-t-transparent border-[#4b6700] rounded-full animate-spin" />
          <span>Carregando detalhes do orçamento...</span>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <span className="font-['Inter'] text-[14px] text-[#64748b]">
          Orçamento não encontrado.
        </span>
        <Link href="/orcamentos" className="text-[#4b6700] hover:underline font-bold text-[14px]">
          Voltar para listagem
        </Link>
      </div>
    );
  }

  // Estilo de status dinâmico
  const mappedStatus = orcamento.status.toUpperCase();
  const isAprovado = mappedStatus.includes("APROVADO") || mappedStatus.includes("CONCLUIDO");

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumbs & Title bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1 text-[12px] font-bold text-[#44474e] tracking-wider uppercase font-['Hanken_Grotesk']">
          <Link href="/orcamentos" className="hover:text-black">
            ORÇAMENTOS
          </Link>
          <span className="text-[#c4c6cf]">&gt;</span>
          <span className="text-[#6b7280]">#{orcamento.id.substring(0, 8).toUpperCase()}</span>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-1.5 max-w-[550px]">
            <div className="flex items-center gap-3">
              <h1 className="font-['Inter'] font-bold text-[32px] text-[#181c1e] tracking-tight leading-tight">
                Detalhes do Orçamento: #{orcamento.id.substring(0, 8).toUpperCase()}
              </h1>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-['Inter'] font-bold text-[10px] uppercase tracking-[0.5px] border border-solid cursor-pointer hover:brightness-95 transition-all ${
                    STATUS_DETAILS[orcamento.status.toLowerCase()]?.style || "bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DETAILS[orcamento.status.toLowerCase()]?.dot || "bg-slate-500"}`} />
                  {STATUS_DETAILS[orcamento.status.toLowerCase()]?.label || orcamento.status.toUpperCase()}
                  <CaretDown size={10} weight="bold" />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10 bg-transparent" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1 w-44 bg-white border border-solid border-[#c4c6cf] rounded-lg shadow-lg py-1 z-20">
                      {Object.entries(STATUS_DETAILS).map(([key, val]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleUpdateStatus(key)}
                          className="w-full text-left px-3 py-2 text-[11px] font-['Inter'] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-none bg-transparent cursor-pointer"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${val.dot}`} />
                          {val.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="font-['Inter'] font-normal text-[16px] text-[#44474e]">
              {orcamento.nome} — {orcamento.cliente || "Cliente não informado"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 border border-black border-solid bg-white text-black font-['Inter'] font-bold text-[14px] px-5 py-2.5 rounded-[8px] transition-all hover:bg-[#f8fafc]"
            >
              <DownloadSimple size={16} weight="bold" />
              Exportar PDF
            </button>
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-2 border border-black border-solid bg-white text-black font-['Inter'] font-bold text-[14px] px-5 py-2.5 rounded-[8px] transition-all hover:bg-[#f8fafc]"
            >
              <PencilSimple size={16} weight="bold" />
              Editar
            </button>
            <button className="flex items-center gap-2 border border-black border-solid bg-white text-black font-['Inter'] font-bold text-[14px] px-5 py-2.5 rounded-[8px] transition-all hover:bg-[#f8fafc]">
              <Copy size={16} weight="bold" />
              Duplicar
            </button>
            {isAprovado ? (
              <button
                onClick={() => setIsTransitionDrawerOpen(true)}
                className="flex items-center gap-2 bg-[#b9f61d] text-[#141f00] font-['Inter'] font-bold text-[14px] px-6 py-2.5 rounded-[8px] transition-all hover:bg-[#a5dd15] shadow-[0px_4px_12px_rgba(185,246,29,0.2)] border-none cursor-pointer"
              >
                <HardHat size={16} weight="bold" />
                Gerar Obra
              </button>
            ) : (
              <button className="flex items-center gap-2 bg-[#e2e8f0] text-[#94a3b8] font-['Inter'] font-bold text-[14px] px-6 py-2.5 rounded-[8px] cursor-not-allowed border-none" disabled>
                <FileText size={16} weight="bold" />
                Gerar Contrato
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: VALOR TOTAL */}
        <div className="bg-white border border-[#c4c6cf] border-l-4 border-l-[#6f84ac] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            VALOR TOTAL (COM BDI)
          </span>
          <h2 className="font-['Inter'] font-bold text-[28px] text-[#181c1e] mt-2">
            {formatCurrency(orcamento.valor_total)}
          </h2>
        </div>

        {/* Card 2: BDI APLICADO */}
        <div className="bg-white border border-[#c4c6cf] border-l-4 border-l-[#b9f61d] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            BDI APLICADO
          </span>
          <div className="flex items-end justify-between mt-2">
            <h2 className="font-['Inter'] font-bold text-[28px] text-[#181c1e] leading-none">
              {orcamento.bdi ? `${orcamento.bdi}%` : "25%"}
            </h2>
            <span className="font-['Inter'] font-bold text-[12px] text-[#16a34a] mb-0.5">
              +0.5%
            </span>
          </div>
        </div>

        {/* Card 3: MARGEM PREVISTA */}
        <div className="bg-white border border-[#c4c6cf] border-l-4 border-l-[#44d8f1] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            MARGEM PREVISTA
          </span>
          <h2 className="font-['Inter'] font-bold text-[28px] text-[#181c1e] mt-2">
            {formatCurrency((orcamento.valor_total || 1240000) * 0.15)}
          </h2>
          <div className="bg-[#ebeef0] h-[6px] rounded-[9999px] w-full overflow-hidden mt-3">
            <div className="bg-[#b9f61d] h-full" style={{ width: "15%" }} />
          </div>
        </div>

        {/* Card 4: DIAS DE EXECUÇÃO */}
        <div className="bg-white border border-[#c4c6cf] border-l-4 border-l-[#181c1e] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <span className="font-['Hanken_Grotesk'] font-bold text-[11px] text-[#44474e] uppercase tracking-[0.5px]">
            DIAS DE EXECUÇÃO
          </span>
          <h2 className="font-['Inter'] font-bold text-[28px] text-[#181c1e] mt-2">
            180 Dias
          </h2>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-[#c4c6cf] flex items-center gap-6 overflow-x-auto">
        {[
          { id: "planilha", label: "Planilha Orçamentária" },
          { id: "abc", label: "Curva ABC" },
          { id: "cronograma", label: "Cronograma Financeiro" },
          { id: "anexos", label: "Anexos" }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-4 px-1 font-['Inter'] text-[15px] font-semibold transition-all border-none bg-transparent cursor-pointer whitespace-nowrap relative ${
                isSelected ? "text-black" : "text-[#44474e] hover:text-black"
              }`}
            >
              {tab.label}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View Rendering */}
      <div className="min-h-[400px]">
        {activeTab === "planilha" && (
          <PlanilhaView 
            orcamentoId={orcamento.id} 
            estadoOrcamento={orcamento.estado}
            fonteOrcamento={orcamento.fonte}
            onTotalChanged={recarregarOrcamento}
          />
        )}

        {activeTab === "abc" && (
          <CurvaAbcView orcamentoId={orcamento.id} />
        )}

        {activeTab === "cronograma" && (
          <CronogramaFinanceiroView orcamentoId={orcamento.id} />
        )}

        {activeTab === "anexos" && (
          <div className="bg-white border border-[#c4c6cf] rounded-[12px] p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm border-dashed">
            <div className="w-12 h-12 rounded-full bg-[#f1f4f6] flex items-center justify-center text-[#6b7280]">
              <UploadSimple size={24} />
            </div>
            <div>
              <h4 className="font-['Inter'] font-semibold text-[16px] text-[#181c1e] mb-1">
                Nenhum anexo adicionado
              </h4>
              <p className="font-['Inter'] font-normal text-[14px] text-[#6b7280]">
                Faça o upload de contratos, imagens do canteiro ou documentos de suporte.
              </p>
            </div>
            <button className="mt-2 border border-solid border-[#c4c6cf] rounded-[8px] bg-white text-black font-['Inter'] font-bold text-[13px] px-4 py-2 hover:bg-[#f8fafc] transition-all">
              Selecionar Arquivos
            </button>
          </div>
        )}
      </div>

      {/* Modal de Configuração do Orçamento (BDI, Variáveis, Locais) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Configurações do Orçamento"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveOrcamento} className="flex flex-col gap-6 text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Nome do Orçamento</label>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                required
                className="border border-[#c4c6cf] rounded-lg p-2.5 outline-none focus:border-[#9fd300] bg-[#f8fafc] text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Cliente</label>
              <input
                type="text"
                value={editCliente}
                onChange={(e) => setEditCliente(e.target.value)}
                required
                className="border border-[#c4c6cf] rounded-lg p-2.5 outline-none focus:border-[#9fd300] bg-[#f8fafc] text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">BDI (%)</label>
              <input
                type="number"
                step="0.01"
                value={editBdi}
                onChange={(e) => setEditBdi(parseFloat(e.target.value) || 0)}
                required
                className="border border-[#c4c6cf] rounded-lg p-2.5 outline-none focus:border-[#9fd300] bg-[#f8fafc] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#c4c6cf] pt-4">
            {/* Variáveis Globais Section */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[13px] text-slate-700 uppercase tracking-wide font-mono">
                  Variáveis Globais da Obra
                </h3>
                <button
                  type="button"
                  onClick={addVariavel}
                  className="text-[10px] font-bold text-[#001b3d] bg-[#9fd300] hover:bg-[#9fd300]/90 px-3 py-1.5 rounded-lg flex items-center gap-1 border-none cursor-pointer uppercase tracking-wider font-mono"
                >
                  <Plus size={12} weight="bold" /> Add Variável
                </button>
              </div>

              <div className="border border-[#c4c6cf] rounded-lg overflow-hidden bg-white max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-[#c4c6cf]">
                      <th className="px-3 py-2">Variável (Nome)</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2 w-10 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c6cf]">
                    {editVariaveis.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-xs text-slate-400 italic">
                          Nenhuma variável cadastrada.
                        </td>
                      </tr>
                    ) : (
                      editVariaveis.map((v, index) => (
                        <tr key={index}>
                          <td className="px-3 py-1">
                            <input
                              type="text"
                              value={v.nome}
                              onChange={(e) => updateVariavel(index, "nome", e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#9fd300] outline-none text-xs font-mono font-bold py-1"
                              placeholder="EX: PE_DIREITO"
                            />
                          </td>
                          <td className="px-3 py-1 text-right">
                            <input
                              type="number"
                              step="any"
                              value={v.valor}
                              onChange={(e) => updateVariavel(index, "valor", e.target.value)}
                              className="w-20 bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-right text-xs outline-none focus:border-[#9fd300]"
                            />
                          </td>
                          <td className="px-3 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariavel(index)}
                              className="text-slate-400 hover:text-red-500 p-1 bg-transparent border-none cursor-pointer"
                            >
                              <Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Locais Section */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[13px] text-slate-700 uppercase tracking-wide font-mono">
                  Locais da Obra
                </h3>
                <button
                  type="button"
                  onClick={addLocal}
                  className="text-[10px] font-bold text-[#001b3d] bg-[#9fd300] hover:bg-[#9fd300]/90 px-3 py-1.5 rounded-lg flex items-center gap-1 border-none cursor-pointer uppercase tracking-wider font-mono"
                >
                  <Plus size={12} weight="bold" /> Add Local
                </button>
              </div>

              <div className="border border-[#c4c6cf] rounded-lg overflow-hidden bg-white max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-[#c4c6cf]">
                      <th className="px-3 py-2">Local (Nome)</th>
                      <th className="px-3 py-2 w-10 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c6cf]">
                    {editLocais.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-6 text-xs text-slate-400 italic">
                          Nenhum local cadastrado.
                        </td>
                      </tr>
                    ) : (
                      editLocais.map((loc, index) => (
                        <tr key={index}>
                          <td className="px-3 py-1">
                            <input
                              type="text"
                              value={loc}
                              onChange={(e) => updateLocal(index, e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#9fd300] outline-none text-xs py-1"
                              placeholder="EX: Cozinha"
                            />
                          </td>
                          <td className="px-3 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeLocal(index)}
                              className="text-slate-400 hover:text-red-500 p-1 bg-transparent border-none cursor-pointer"
                            >
                              <Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#c4c6cf] pt-4 mt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold border-none bg-transparent cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#001b3d] text-white hover:bg-[#00102a] px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 border-none cursor-pointer"
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </Modal>

      {isTransitionDrawerOpen && orcamento && (
        <TransitionDrawer
          orcamentoId={orcamento.id}
          orcamentoNome={orcamento.nome}
          cliente={orcamento.cliente}
          valorTotal={orcamento.valor_total || 0}
          bdi={orcamento.bdi || 0}
          baseReferencia={`${orcamento.fonte || "SINAPI"} - ${orcamento.estado?.toUpperCase() || "PE"} - ${orcamento.base_referencia || "Julho/2026"}`}
          onClose={() => setIsTransitionDrawerOpen(false)}
          onSuccess={() => {
            setIsTransitionDrawerOpen(false);
            recarregarOrcamento();
          }}
        />
      )}
    </div>
  );
}
