"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DownloadSimple,
  PencilSimple,
  Copy,
  FileText,
  UploadSimple,
  Plus,
  Trash,
  HardHat,
  CaretDown,
  Calculator,
  CalendarBlank,
} from "@phosphor-icons/react";
import { getObras } from "@/lib/api/obras";
import { getOrcamento, getEtapas, downloadOrcamentoPDF, updateOrcamento, type Orcamento, type Etapa } from "@/lib/api/orcamentos";
import { STATUS_INFO, STATUS_ORDER, getStatusDisplay, normalizeStatus } from "@/lib/orcamentoStatus";
import { PlanilhaView } from "@/components/orcamentos/PlanilhaView";
import { CurvaAbcView } from "@/components/orcamentos/CurvaAbcView";
import { CronogramaFinanceiroView } from "@/components/orcamentos/CronogramaFinanceiroView";
import { BdiConfigModal } from "@/components/orcamentos/BdiConfigModal";
import { Modal } from "@/components/ui/Modal";
import { TransitionDrawer } from "@/components/orcamentos/TransitionDrawer";
import { useToast } from "@/components/common/toast";

type TabType = "planilha" | "abc" | "cronograma" | "anexos";

// Prazo total = do início da primeira etapa ao fim da última (inclusive), conforme o cronograma
const calcularDiasExecucao = (etapas: Etapa[]): number | null => {
  const inicios = etapas.filter((e) => e.data_inicio).map((e) => new Date(e.data_inicio as string).getTime());
  const fins = etapas.filter((e) => e.data_fim).map((e) => new Date(e.data_fim as string).getTime());
  if (inicios.length === 0 || fins.length === 0) return null;
  const dias = Math.round((Math.max(...fins) - Math.min(...inicios)) / 86400000) + 1;
  return dias > 0 ? dias : null;
};

export default function OrcamentoDetalhePage() {
  const { showToast } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasExecucao, setDiasExecucao] = useState<number | null>(null);
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
  const [jaTemObra, setJaTemObra] = useState(false);

  useEffect(() => {
    if (!id) return;
    getObras()
      .then((obras) => setJaTemObra(obras.some((o) => o.orcamento_id === id)))
      .catch(() => setJaTemObra(false));
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsStatusDropdownOpen(false);
    if (!orcamento) return;
    try {
      setLoading(true);
      await updateOrcamento(orcamento.id, { status: newStatus });
      await recarregarOrcamento();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      showToast("Erro ao atualizar o status do orçamento.", undefined, "error");
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
      showToast("Erro ao salvar configurações do orçamento.", undefined, "error");
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
      const [data, etapas] = await Promise.all([
        getOrcamento(id),
        getEtapas(id).catch(() => [] as Etapa[]),
      ]);
      setOrcamento(data);
      setDiasExecucao(calcularDiasExecucao(etapas));
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
      showToast("Erro ao exportar PDF.", undefined, "error");
      console.error(err);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (loading) {
    return (
      <p role="status" className="gp-sub" style={{ textAlign: "center", padding: 48 }}>
        Carregando detalhes do orçamento...
      </p>
    );
  }

  if (!orcamento) {
    return (
      <div style={{ textAlign: "center", padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <p className="gp-sub" style={{ margin: 0 }}>Orçamento não encontrado.</p>
        <Link href="/orcamentos" className="gp-btn gp-bs gp-sm">Voltar para listagem</Link>
      </div>
    );
  }

  // Estilo de status dinâmico
  const statusDisplay = getStatusDisplay(orcamento.status);
  const statusNorm = normalizeStatus(orcamento.status);
  const isAprovado = statusNorm === "aprovado";
  const badgeClass = (n: ReturnType<typeof normalizeStatus>) =>
    n === "em_elaboracao" ? "gp-te" : n === "pendente" ? "gp-wa" : n === "aprovado" ? "gp-ok" : n === "recusado" ? "gp-da" : "gp-ne";
  const custoDireto = (orcamento.valor_total ?? 0) / (1 + (orcamento.bdi || 0) / 100);
  const valorBdi = (orcamento.valor_total ?? 0) - custoDireto;
  const totalCell = (dark: boolean): React.CSSProperties => ({
    padding: "18px 20px",
    background: dark ? "#001b3d" : "#fff",
    color: dark ? "#fff" : undefined,
  });

  const TABS: { id: TabType; label: string }[] = [
    { id: "planilha", label: "Planilha orçamentária" },
    { id: "abc", label: "Curva ABC" },
    { id: "cronograma", label: "Cronograma financeiro" },
    { id: "anexos", label: "Anexos" },
  ];

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <nav aria-label="Trilha" className="gp-crumb">
            <Link href="/orcamentos">Orçamentos</Link> /{" "}
            <span aria-current="page" style={{ color: "#001b3d" }}>{`ORC-${orcamento.id.substring(0, 8).toUpperCase()}`}</span>
          </nav>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 4 }}>
            <h1 className="gp-h1" style={{ margin: 0 }}>{orcamento.nome}</h1>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                aria-haspopup="true"
                aria-expanded={isStatusDropdownOpen}
                className={`gp-bg ${badgeClass(statusNorm)}`}
                style={{ border: 0, cursor: "pointer", fontWeight: 800 }}
              >
                <span aria-hidden="true" className="gp-dot"></span>
                {statusDisplay.label}
                <CaretDown size={12} weight="bold" aria-hidden="true" />
              </button>

              {isStatusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10 bg-transparent" onClick={() => setIsStatusDropdownOpen(false)} />
                  <div className="gp-card absolute left-0 mt-1 w-48 py-1 z-20" style={{ borderRadius: 14, border: "1px solid #E6EBF2", boxShadow: "0 10px 24px -12px rgba(0,27,61,0.35)" }}>
                    {STATUS_ORDER.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleUpdateStatus(key)}
                        className="gp-row w-full text-left px-3 flex items-center gap-2 border-none bg-transparent cursor-pointer"
                        style={{ minHeight: 40, fontSize: 14, fontWeight: 700, color: "#001b3d" }}
                      >
                        <span aria-hidden="true" className={`gp-bg ${badgeClass(key)}`} style={{ padding: 0, background: "transparent" }}>
                          <span className="gp-dot"></span>
                        </span>
                        {STATUS_INFO[key].label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="gp-ms" style={{ margin: "6px 0 0" }}>
            {orcamento.cliente || "Cliente não informado"} · {orcamento.fonte}
            {orcamento.estado ? ` ${orcamento.estado.toUpperCase()}` : ""} {orcamento.base_referencia} · {orcamento.tipo_composicao}
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={handleExportPDF} className="gp-btn gp-bs">
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            Exportar PDF
          </button>
          <button type="button" onClick={handleOpenEditModal} className="gp-btn gp-bs">
            <PencilSimple size={16} weight="bold" aria-hidden="true" />
            Editar
          </button>
          <Link href={`/prazo/${orcamento.id}`} className="gp-btn gp-bs">
            <CalendarBlank size={16} weight="bold" aria-hidden="true" />
            Cronograma
          </Link>
          <button type="button" className="gp-btn gp-bs">
            <Copy size={16} weight="bold" aria-hidden="true" />
            Duplicar
          </button>
          {isAprovado ? (
            <button
              type="button"
              onClick={() => setIsTransitionDrawerOpen(true)}
              disabled={jaTemObra}
              title={jaTemObra ? "Este orçamento já está vinculado a uma obra" : undefined}
              className="gp-btn gp-bd"
              style={jaTemObra ? { background: "#EDF1F6", color: "#64748b", cursor: "not-allowed" } : undefined}
            >
              <HardHat size={16} weight="bold" aria-hidden="true" />
              {jaTemObra ? "Obra já gerada" : "Gerar Obra"}
            </button>
          ) : (
            <button type="button" className="gp-btn" style={{ background: "#EDF1F6", color: "#64748b", cursor: "not-allowed" }} disabled>
              <FileText size={16} weight="bold" aria-hidden="true" />
              Gerar Contrato
            </button>
          )}
        </div>
      </div>

      <section
        aria-label="Totais"
        className="gp-card"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, overflow: "hidden", background: "#E6EBF2" }}
      >
        <div style={totalCell(true)}>
          <p className="gp-ml" style={{ margin: 0, color: "#cbd5e1" }}>Total com BDI</p>
          <p className="gp-mono" title={formatCurrency(orcamento.valor_total)} style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 600 }}>
            {formatCurrency(orcamento.valor_total)}
          </p>
        </div>
        <div style={totalCell(false)}>
          <p className="gp-ml" style={{ margin: 0 }}>Custo direto</p>
          <p className="gp-mono" style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 600 }}>{formatCurrency(custoDireto)}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsBdiModalOpen(true)}
          aria-label="Configurar BDI aplicado"
          style={{ ...totalCell(false), border: 0, textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}
        >
          <p className="gp-ml" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            BDI {orcamento.bdi ? `${orcamento.bdi}%` : "0%"}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#00626b" }}>
              <Calculator size={12} weight="bold" aria-hidden="true" />
              {orcamento.tipo_bdi === "SINTETICO" ? "Sintético" : "Analítico TCU"}
            </span>
            {orcamento.bdi_config?.bdi_diferenciado ? (
              <span style={{ fontSize: 12, color: "#9A3412" }}>Dif: {orcamento.bdi_config.bdi_diferenciado}%</span>
            ) : null}
          </p>
          <p className="gp-mono" style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 600 }}>{formatCurrency(valorBdi)}</p>
        </button>
        <div style={totalCell(false)}>
          <p className="gp-ml" style={{ margin: 0 }}>Dias de execução</p>
          <p className="gp-mono" style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 600 }}>
            {diasExecucao !== null ? `${diasExecucao} ${diasExecucao === 1 ? "dia" : "dias"}` : "Não definido"}
          </p>
        </div>
      </section>

      <div className="gp-tabs" role="tablist" aria-label="Seções do orçamento">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="gp-tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab View Rendering */}
      <div className="min-h-[400px]" role="tabpanel">
        {activeTab === "planilha" && (
          <PlanilhaView
            orcamentoId={orcamento.id}
            estadoOrcamento={orcamento.estado}
            fonteOrcamento={orcamento.fonte}
            bdiOrcamento={orcamento.bdi || 0}
            onTotalChanged={recarregarOrcamento}
          />
        )}

        {activeTab === "abc" && <CurvaAbcView orcamentoId={orcamento.id} />}

        {activeTab === "cronograma" && <CronogramaFinanceiroView orcamentoId={orcamento.id} />}

        {activeTab === "anexos" && (
          <div className="gp-card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, border: "1px dashed #CBD5E1" }}>
            <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 14, background: "#e0f5f7", color: "#00626b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UploadSimple size={24} weight="bold" />
            </span>
            <div>
              <h3 className="gp-h2" style={{ marginBottom: 4 }}>Nenhum anexo adicionado</h3>
              <p className="gp-sub" style={{ margin: 0 }}>
                Faça o upload de contratos, imagens do canteiro ou documentos de suporte.
              </p>
            </div>
            <button type="button" className="gp-btn gp-bs gp-sm">Selecionar arquivos</button>
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
        <form onSubmit={handleSaveOrcamento} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div className="gp-fld">
              <label htmlFor="e-nome" className="gp-lb">Nome do orçamento</label>
              <input id="e-nome" className="gp-in" type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
            </div>
            <div className="gp-fld">
              <label htmlFor="e-cli" className="gp-lb">Cliente</label>
              <input id="e-cli" className="gp-in" type="text" value={editCliente} onChange={(e) => setEditCliente(e.target.value)} required />
            </div>
            <div className="gp-fld">
              <label htmlFor="e-bdi" className="gp-lb">BDI (%)</label>
              <input id="e-bdi" className="gp-in gp-mono" type="number" step="0.01" value={editBdi} onChange={(e) => setEditBdi(parseFloat(e.target.value) || 0)} required />
            </div>
          </div>

          <div style={{ borderTop: "1px solid #E6EBF2", paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="gp-h2" style={{ fontSize: 16 }}>Locais da obra</h3>
              <button type="button" onClick={addLocal} className="gp-btn gp-bp gp-sm">
                <Plus size={14} weight="bold" aria-hidden="true" /> Adicionar local
              </button>
            </div>

            <div style={{ border: "1px solid #E6EBF2", borderRadius: 14, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <caption className="gp-sr">Locais da obra</caption>
                <thead>
                  <tr>
                    <th scope="col" className="gp-th">Local (nome)</th>
                    <th scope="col" className="gp-th" style={{ width: 56, textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {editLocais.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="gp-td" style={{ textAlign: "center", color: "#475569" }}>
                        Nenhum local cadastrado.
                      </td>
                    </tr>
                  ) : (
                    editLocais.map((loc, index) => (
                      <tr key={index}>
                        <td className="gp-td" style={{ padding: "6px 12px" }}>
                          <input
                            type="text"
                            value={loc}
                            onChange={(e) => updateLocal(index, e.target.value)}
                            aria-label={`Nome do local ${index + 1}`}
                            className="gp-in"
                            style={{ height: 40 }}
                            placeholder="Ex.: Cozinha"
                          />
                        </td>
                        <td className="gp-td" style={{ textAlign: "center", padding: "6px 12px" }}>
                          <button
                            type="button"
                            onClick={() => removeLocal(index)}
                            aria-label={`Remover local ${index + 1}`}
                            className="gp-ib"
                            style={{ width: 36, height: 36, borderRadius: 10, color: "#B91C1C" }}
                          >
                            <Trash size={16} weight="bold" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #E6EBF2", paddingTop: 16 }}>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="gp-btn gp-bs">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="gp-btn gp-bd" style={{ opacity: saving ? 0.6 : 1 }}>
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
    </>
  );
}
