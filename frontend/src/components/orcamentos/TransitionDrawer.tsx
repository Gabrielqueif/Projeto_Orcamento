"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Spinner, Calendar, Users, Shield, ShoppingCart, Warning } from "@phosphor-icons/react";
import { getMembrosEquipe, type MembroEquipe } from "@/lib/api/membros_equipe";
import { gerarObra } from "@/lib/api/obras";

interface TransitionDrawerProps {
  orcamentoId: string;
  orcamentoNome: string;
  cliente: string;
  valorTotal: number;
  bdi: number;
  baseReferencia: string;
  onClose: () => void;
  onSuccess?: (obraId: string) => void;
}

export function TransitionDrawer({
  orcamentoId,
  orcamentoNome,
  cliente,
  valorTotal,
  bdi,
  baseReferencia,
  onClose,
  onSuccess,
}: TransitionDrawerProps) {
  const router = useRouter();
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [engenheiros, setEngenheiros] = useState<MembroEquipe[]>([]);

  // Form states
  const [dataInicio, setDataInicio] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [prazoEstimado, setPrazoEstimado] = useState(180);
  const [selectedEngenheiroId, setSelectedEngenheiroId] = useState("");
  const [gerarCompraABC, setGerarCompraABC] = useState(true);
  const [bloquearPlanilha, setBloquearPlanilha] = useState(true);

  useEffect(() => {
    async function carregarEngenheiros() {
      try {
        setLoadingMembers(true);
        // Busca membros ativos
        const membros = await getMembrosEquipe({ status: "ATIVO" });
        // Filtra membros que são Engenheiros
        const engs = membros.filter((m) =>
          m.cargo.toLowerCase().includes("eng") || m.cargo.toLowerCase().includes("resident")
        );
        setEngenheiros(engs.length > 0 ? engs : membros); // Fallback para todos os membros se não houver engs específicos
        if (engs.length > 0) {
          setSelectedEngenheiroId(engs[0].id);
        } else if (membros.length > 0) {
          setSelectedEngenheiroId(membros[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar engenheiros:", err);
      } finally {
        setLoadingMembers(false);
      }
    }
    carregarEngenheiros();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngenheiroId) {
      setErrorMsg("Selecione um engenheiro responsável.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      
      const payload = {
        data_inicio_real: dataInicio,
        prazo_estimado_dias: prazoEstimado,
        engenheiro_responsavel_id: selectedEngenheiroId,
        enviar_curva_abc_almoxarifado: gerarCompraABC,
        bloquear_planilha_base: bloquearPlanilha,
      };

      const obraCriada = await gerarObra(orcamentoId, payload);
      
      if (onSuccess) {
        onSuccess(obraCriada.id);
      }
      
      router.push(`/obras`);
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro ao gerar a obra.");
    } finally {
      setSubmitting(false);
    }
  };

  const bloco = (icone: React.ReactNode, titulo: string) => (
    <h3 className="gp-h2" style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1px solid #E6EBF2" }}>
      {icone}
      {titulo}
    </h3>
  );

  const opcao = (
    id: string,
    checked: boolean,
    onChange: (v: boolean) => void,
    titulo: string,
    desc: string
  ) => (
    <label
      htmlFor={id}
      style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, border: "1px solid #E6EBF2", cursor: "pointer" }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3, width: 18, height: 18, accentColor: "#001b3d" }}
      />
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{titulo}</span>
        <span className="gp-hint">{desc}</span>
      </span>
    </label>
  );

  return (
    <>
      {/* Overlay */}
      <div className="gp-ov" onClick={onClose} aria-hidden="true" style={{ padding: 0 }} />

      {/* Drawer Panel */}
      <aside className="gp-drw" role="dialog" aria-modal="true" aria-labelledby="tr-titulo">
        <div className="gp-dh" style={{ alignItems: "flex-start" }}>
          <div>
            <span className="gp-bg gp-ok">Transição</span>
            <h2 id="tr-titulo" className="gp-h2" style={{ marginTop: 8 }}>Inicializar Nova Obra</h2>
            <p className="gp-hint" style={{ margin: "4px 0 0" }}>
              Você está transformando o orçamento{" "}
              <strong className="gp-mono" style={{ color: "#001b3d" }}>#{orcamentoId.substring(0, 8).toUpperCase()}</strong>{" "}
              em uma obra ativa.
            </p>
          </div>
          <button type="button" onClick={onClose} className="gp-ib" aria-label="Fechar">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleConfirmar} style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div className="gp-db">
            {/* Card Resumo Financeiro */}
            <div className="gp-card gp-pad gp-dark" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="gp-ml">Meta de custo do orçamento</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <strong className="gp-mono" style={{ fontSize: 28, fontWeight: 600 }}>{formatCurrency(valorTotal)}</strong>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#9fd300" }}>BDI de {bdi}%</span>
              </div>
              <p className="gp-ms" style={{ margin: 0 }}>
                Este valor será congelado e servirá como a baseline original do planejamento executivo.
              </p>
            </div>

            {errorMsg && (
              <div role="alert" className="gp-da" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 14, fontSize: 14, fontWeight: 700 }}>
                <Warning size={18} weight="bold" aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Bloco 1: Dados Operacionais */}
            {bloco(<Calendar size={18} weight="bold" aria-hidden="true" />, "Dados de execução da obra")}
            <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
              <div className="gp-fld">
                <label htmlFor="data_inicio" className="gp-lb">
                  Data de início prevista <span className="gp-req">*</span>
                </label>
                <input
                  type="date"
                  id="data_inicio"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                  className="gp-in"
                />
              </div>
              <div className="gp-fld">
                <label htmlFor="prazo" className="gp-lb">
                  Prazo estimado (dias) <span className="gp-req">*</span>
                </label>
                <input
                  type="number"
                  id="prazo"
                  min={1}
                  value={prazoEstimado}
                  onChange={(e) => setPrazoEstimado(Math.max(1, parseInt(e.target.value) || 0))}
                  required
                  className="gp-in"
                />
              </div>
            </div>

            <div className="gp-fld">
              <label htmlFor="engenheiro" className="gp-lb" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Engenheiro residente responsável <span className="gp-req">*</span></span>
                {loadingMembers && <Spinner size={14} weight="bold" className="animate-spin" aria-hidden="true" />}
              </label>
              <select
                id="engenheiro"
                value={selectedEngenheiroId}
                onChange={(e) => setSelectedEngenheiroId(e.target.value)}
                required
                disabled={loadingMembers}
                className="gp-in"
              >
                {engenheiros.length === 0 ? (
                  <option value="">Nenhum engenheiro disponível</option>
                ) : (
                  engenheiros.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.nome} ({eng.cargo})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Bloco 2: Parâmetros de Controle Técnico */}
            {bloco(<Shield size={18} weight="bold" aria-hidden="true" />, "Controles técnicos (leitura)")}
            <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
              <div style={{ padding: 14, borderRadius: 14, background: "#F4F6FA" }}>
                <span className="gp-ml">Bases de referência</span>
                <p style={{ margin: "4px 0 0", fontWeight: 800 }}>{baseReferencia}</p>
              </div>
              <div style={{ padding: 14, borderRadius: 14, background: "#F4F6FA" }}>
                <span className="gp-ml">Margem congelada (BDI)</span>
                <p className="gp-mono" style={{ margin: "4px 0 0", fontWeight: 600 }}>{bdi}%</p>
              </div>
            </div>

            {/* Bloco 3: Configurações de Módulos */}
            {bloco(<ShoppingCart size={18} weight="bold" aria-hidden="true" />, "Integrações e bloqueios")}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {opcao(
                "tr-curva-abc",
                gerarCompraABC,
                setGerarCompraABC,
                "Enviar Curva ABC para suprimentos",
                "Importa automaticamente os insumos do orçamento para o controle de almoxarifado como limite de requisição."
              )}
              {opcao(
                "tr-bloquear",
                bloquearPlanilha,
                setBloquearPlanilha,
                "Bloquear planilha de orçamento base",
                "Bloqueia futuras edições na planilha do orçamento para manter a meta de custos íntegra com a obra."
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="gp-df">
            <button type="button" onClick={onClose} disabled={submitting} className="gp-btn gp-bs disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="gp-btn gp-bp disabled:opacity-80">
              {submitting ? (
                <>
                  <Spinner size={16} weight="bold" className="animate-spin" aria-hidden="true" />
                  <span>Inicializando...</span>
                </>
              ) : (
                <span>Confirmar e Iniciar</span>
              )}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
