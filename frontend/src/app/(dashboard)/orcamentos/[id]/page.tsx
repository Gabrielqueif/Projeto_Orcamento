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
  UploadSimple,
  Plus, 
  Trash, 
  X, 
  HardHat, 
  CaretDown,
  Calculator,
  CalendarBlank
} from "@phosphor-icons/react";
import { getOrcamento, downloadOrcamentoPDF, updateOrcamento, type Orcamento } from "@/lib/api/orcamentos";
import { STATUS_INFO, STATUS_ORDER, getStatusDisplay, normalizeStatus } from "@/lib/orcamentoStatus";
import { PlanilhaView } from "@/components/orcamentos/PlanilhaView";
import { CurvaAbcView } from "@/components/orcamentos/CurvaAbcView";
import { CronogramaFinanceiroView } from "@/components/orcamentos/CronogramaFinanceiroView";
import { BdiConfigModal } from "@/components/orcamentos/BdiConfigModal";
import { Modal } from "@/components/ui/Modal";
import { TransitionDrawer } from "@/components/orcamentos/TransitionDrawer";

type TabType = "planilha" | "abc" | "cronograma" | "anexos";

export default function OrcamentoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("planilha");

  // BDI Modal State
  const [isBdiModalOpen, setIsBdiModalOpen] = useState(false);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editCliente, setEditCliente] = useState("");
  const [editBdi, setEditBdi] = useState(0);
  const [editLocais, setEditLocais] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isTransitionDrawerOpen, setIsTransitionDrawerOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

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
        <span className="font-['Manrope'] text-[14px] text-[#94a3b8]">
          Carregando detalhes do orçamento...
        </span>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <span className="font-['Manrope'] text-[14px] text-[#94a3b8]">
          Orçamento não encontrado.
        </span>
        <Link href="/orcamentos" className="text-[#00a3b1] hover:underline font-bold text-[14px] font-['Manrope']">
          Voltar para listagem
        </Link>
      </div>
    );
  }

  // Estilo de status dinâmico
  const statusDisplay = getStatusDisplay(orcamento.status);
  const isAprovado = normalizeStatus(orcamento.status) === "aprovado";

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] font-medium text-[#00a3b1] uppercase tracking-[0.5px]">
          <Link href="/orcamentos" className="hover:underline text-[#00a3b1] no-underline">
            ORÇAMENTOS
          </Link>
          <span className="text-[#94a3b8]">&gt;</span>
          <span className="text-[#64748b]">{orcamento.nome}</span>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-1 max-w-[650px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['Manrope'] font-extrabold text-[32px] lg:text-[36px] text-[#001b3d] tracking-[-0.9px] leading-[40px]">
                {orcamento.nome}
              </h1>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] font-['JetBrains_Mono'] font-semibold text-[10px] uppercase tracking-[0.5px] cursor-pointer hover:brightness-95 transition-all border-none ${statusDisplay.style}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.dot}`} />
                  {statusDisplay.label}
                  <CaretDown size={10} weight="bold" />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10 bg-transparent" onClick={() => setIsStatusDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1 w-44 bg-white border border-[#f1f5f9] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] py-1 z-20">
                      {STATUS_ORDER.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleUpdateStatus(key)}
                          className="w-full text-left px-3 py-2 text-[11px] font-['JetBrains_Mono'] font-semibold text-[#001b3d] hover:bg-[#f8fafc] flex items-center gap-2 border-none bg-transparent cursor-pointer"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_INFO[key].dot}`} />
                          {STATUS_INFO[key].label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="font-['JetBrains_Mono'] font-normal text-[11px] text-[#94a3b8] mt-0.5">
              #{`ORC-${orcamento.id.substring(0, 8).toUpperCase()}`} — {orcamento.cliente || "Cliente não informado"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-white border border-[#f1f5f9] text-[#001b3d] font-['Manrope'] font-bold text-[14px] px-4 py-2.5 rounded-[8px] transition-all hover:bg-[#f8fafc] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
            >
              <DownloadSimple size={16} weight="bold" className="text-[#00a3b1]" />
              Exportar PDF
            </button>
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-2 bg-white border border-[#f1f5f9] text-[#001b3d] font-['Manrope'] font-bold text-[14px] px-4 py-2.5 rounded-[8px] transition-all hover:bg-[#f8fafc] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
            >
              <PencilSimple size={16} weight="bold" className="text-[#00a3b1]" />
              Editar
            </button>
            <Link
              href={`/prazo/${orcamento.id}`}
              className="flex items-center gap-2 bg-white border border-[#f1f5f9] text-[#001b3d] font-['Manrope'] font-bold text-[14px] px-4 py-2.5 rounded-[8px] transition-all hover:bg-[#f8fafc] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer no-underline"
            >
              <CalendarBlank size={16} weight="bold" className="text-[#00a3b1]" />
              Cronograma
            </Link>
            <button className="flex items-center gap-2 bg-white border border-[#f1f5f9] text-[#001b3d] font-['Manrope'] font-bold text-[14px] px-4 py-2.5 rounded-[8px] transition-all hover:bg-[#f8fafc] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer">
              <Copy size={16} weight="bold" className="text-[#00a3b1]" />
              Duplicar
            </button>
            {isAprovado ? (
              <button
                onClick={() => setIsTransitionDrawerOpen(true)}
                className="flex items-center gap-2 bg-[#001b3d] text-white font-['Manrope'] font-bold text-[14px] px-5 py-2.5 rounded-[8px] transition-all hover:bg-[#00102a] shadow-[0_10px_15px_-3px_rgba(0,27,61,0.1),0_4px_6px_-4px_rgba(0,27,61,0.1)] border-none cursor-pointer"
              >
                <HardHat size={16} weight="bold" />
                Gerar Obra
              </button>
            ) : (
              <button className="flex items-center gap-2 bg-[#f1f5f9] text-[#94a3b8] font-['Manrope'] font-bold text-[14px] px-5 py-2.5 rounded-[8px] cursor-not-allowed border-none" disabled>
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
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
            VALOR TOTAL (COM BDI)
          </span>
          <h2 className="font-['Manrope'] font-extrabold text-[24px] lg:text-[28px] text-[#001b3d] mt-2 truncate" title={formatCurrency(orcamento.valor_total)}>
            {formatCurrency(orcamento.valor_total)}
          </h2>
          <div className="bg-[#f1f5f9] h-[4px] rounded-full w-full overflow-hidden mt-3">
            <div className="bg-[#00a3b1] h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Card 2: BDI APLICADO */}
        <div 
          onClick={() => setIsBdiModalOpen(true)}
          className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer hover:border-[#00a3b1] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
              BDI APLICADO
            </span>
            <span className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#00a3b1] bg-[rgba(0,163,177,0.1)] px-2 py-0.5 rounded group-hover:bg-[rgba(0,163,177,0.15)] transition-colors flex items-center gap-1">
              <Calculator size={12} /> {orcamento.tipo_bdi === "SINTETICO" ? "Sintético" : "Analítico TCU"}
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <h2 className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d] leading-none">
              {orcamento.bdi ? `${orcamento.bdi}%` : "0%"}
            </h2>
            {orcamento.bdi_config?.bdi_diferenciado ? (
              <span className="font-['JetBrains_Mono'] font-semibold text-[10px] text-[#00a3b1] bg-[rgba(0,163,177,0.1)] px-1.5 py-0.5 rounded">
                Dif: {orcamento.bdi_config.bdi_diferenciado}%
              </span>
            ) : null}
          </div>
          <div className="bg-[#f1f5f9] h-[4px] rounded-full w-full overflow-hidden mt-3">
            <div className="bg-[#9fd300] h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Card 3: MARGEM PREVISTA */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
            MARGEM PREVISTA
          </span>
          <h2 className="font-['Manrope'] font-extrabold text-[24px] lg:text-[28px] text-[#001b3d] mt-2 truncate">
            {formatCurrency((orcamento.valor_total || 1240000) * 0.15)}
          </h2>
          <div className="bg-[#f1f5f9] h-[4px] rounded-full w-full overflow-hidden mt-3">
            <div className="bg-[#00a3b1] h-full rounded-full" style={{ width: "15%" }} />
          </div>
        </div>

        {/* Card 4: DIAS DE EXECUÇÃO */}
        <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#64748b] uppercase tracking-[0.5px]">
            DIAS DE EXECUÇÃO
          </span>
          <h2 className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d] mt-2">
            180 Dias
          </h2>
          <div className="bg-[#f1f5f9] h-[4px] rounded-full w-full overflow-hidden mt-3">
            <div className="bg-[#00a3b1] h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="bg-white border-b border-[#f1f5f9] flex items-center gap-6 overflow-x-auto px-2">
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
              className={`pb-4 pt-1 px-1 font-['Manrope'] text-[14px] font-bold transition-all border-none bg-transparent cursor-pointer whitespace-nowrap relative ${
                isSelected ? "text-[#001b3d]" : "text-[#64748b] hover:text-[#001b3d]"
              }`}
            >
              {tab.label}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00a3b1]" />
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
            bdiOrcamento={orcamento.bdi || 0}
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
          <div className="bg-white border border-[#f1f5f9] rounded-[8px] p-12 text-center flex flex-col items-center justify-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-dashed">
            <div className="w-12 h-12 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#00a3b1]">
              <UploadSimple size={24} />
            </div>
            <div>
              <h4 className="font-['Manrope'] font-extrabold text-[18px] text-[#001b3d] mb-1">
                Nenhum anexo adicionado
              </h4>
              <p className="font-['Manrope'] font-medium text-[14px] text-[#64748b]">
                Faça o upload de contratos, imagens do canteiro ou documentos de suporte.
              </p>
            </div>
            <button className="mt-2 border border-[#f1f5f9] rounded-[8px] bg-white text-[#001b3d] font-['Manrope'] font-bold text-[13px] px-5 py-2.5 hover:bg-[#f8fafc] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer">
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
        <form onSubmit={handleSaveOrcamento} className="flex flex-col gap-6 text-[#001b3d]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-['JetBrains_Mono']">Nome do Orçamento</label>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                required
                className="border border-[#f1f5f9] rounded-[8px] p-2.5 outline-none focus:border-[#00a3b1] bg-[#f8fafc] text-sm font-['Manrope'] text-[#001b3d]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-['JetBrains_Mono']">Cliente</label>
              <input
                type="text"
                value={editCliente}
                onChange={(e) => setEditCliente(e.target.value)}
                required
                className="border border-[#f1f5f9] rounded-[8px] p-2.5 outline-none focus:border-[#00a3b1] bg-[#f8fafc] text-sm font-['Manrope'] text-[#001b3d]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-['JetBrains_Mono']">BDI (%)</label>
              <input
                type="number"
                step="0.01"
                value={editBdi}
                onChange={(e) => setEditBdi(parseFloat(e.target.value) || 0)}
                required
                className="border border-[#f1f5f9] rounded-[8px] p-2.5 outline-none focus:border-[#00a3b1] bg-[#f8fafc] text-sm font-['Manrope'] text-[#001b3d]"
              />
            </div>
          </div>

          <div className="border-t border-[#f1f5f9] pt-4">
            {/* Locais Section */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[13px] text-[#001b3d] uppercase tracking-wide font-['JetBrains_Mono']">
                  Locais da Obra
                </h3>
                <button
                  type="button"
                  onClick={addLocal}
                  className="text-[10px] font-bold text-[#001b3d] bg-[#9fd300] hover:bg-[#9fd300]/90 px-3 py-1.5 rounded-[8px] flex items-center gap-1 border-none cursor-pointer uppercase tracking-wider font-['JetBrains_Mono']"
                >
                  <Plus size={12} weight="bold" /> Add Local
                </button>
              </div>

              <div className="border border-[#f1f5f9] rounded-[8px] overflow-hidden bg-white max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#64748b] font-medium text-[10px] uppercase border-b border-[#f1f5f9] font-['JetBrains_Mono']">
                      <th className="px-3 py-2">Local (Nome)</th>
                      <th className="px-3 py-2 w-10 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {editLocais.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-6 text-xs text-[#94a3b8] italic font-['Manrope']">
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
                              className="w-full bg-transparent border-b border-transparent hover:border-[#f1f5f9] focus:border-[#00a3b1] outline-none text-xs py-1 font-['Manrope'] text-[#001b3d]"
                              placeholder="EX: Cozinha"
                            />
                          </td>
                          <td className="px-3 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeLocal(index)}
                              className="text-[#94a3b8] hover:text-red-500 p-1 bg-transparent border-none cursor-pointer"
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

          <div className="flex justify-end gap-3 border-t border-[#f1f5f9] pt-4 mt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-5 py-2 text-[#64748b] hover:bg-[#f8fafc] rounded-[8px] text-sm font-bold border-none bg-transparent cursor-pointer font-['Manrope']"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#001b3d] text-white hover:bg-[#00102a] px-6 py-2.5 rounded-[8px] text-sm font-bold disabled:opacity-50 border-none cursor-pointer font-['Manrope']"
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </Modal>

      {isBdiModalOpen && orcamento && (
        <BdiConfigModal
          isOpen={isBdiModalOpen}
          onClose={() => setIsBdiModalOpen(false)}
          orcamento={orcamento}
          onUpdated={recarregarOrcamento}
        />
      )}

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

