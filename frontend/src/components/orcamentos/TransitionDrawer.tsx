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

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white z-50 shadow-2xl flex flex-col transition-all duration-300 animate-slide-left">
        {/* Header */}
        <div className="p-6 bg-[#001730] text-white flex items-start justify-between relative overflow-hidden">
          <div className="z-10 flex-1 pr-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#b9f61d] text-[#141f00] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Transição
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Inicializar Nova Obra</h2>
            <p className="text-xs text-[#9eb6cc] mt-1.5 leading-relaxed">
              Você está transformando o Orçamento <span className="text-white font-bold">#{orcamentoId.substring(0, 8).toUpperCase()}</span> em uma Obra Ativa.
            </p>
          </div>
          <button
            onClick={onClose}
            className="z-10 shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors border-none cursor-pointer"
          >
            <X size={16} className="text-white" />
          </button>

          {/* Decorative Background Pattern */}
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Content Area */}
        <form onSubmit={handleConfirmar} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Card Resumo Financeiro */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
              Meta de Custo do Orçamento
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-[#001730]">
                {formatCurrency(valorTotal)}
              </h3>
              <span className="text-xs font-semibold text-[#16a34a]">BDI de {bdi}%</span>
            </div>
            <p className="text-xs text-[#64748b]">
              Este valor será congelado e servirá como a baseline original do planejamento executivo.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-xs text-red-600 flex items-start gap-2.5">
              <Warning size={16} className="shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bloco 1: Dados Operacionais */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-sm text-[#001730] border-b border-[#f1f5f9] pb-2 flex items-center gap-2">
              <Calendar size={16} />
              Dados de Execução da Obra
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="data_inicio" className="text-xs font-bold text-[#475569]">
                  Data de Início Prevista *
                </label>
                <input
                  type="date"
                  id="data_inicio"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                  className="border border-[#cbd5e1] rounded-lg px-3 py-2 text-sm font-medium text-[#1e293b] focus:border-[#001730] focus:ring-1 focus:ring-[#001730] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prazo" className="text-xs font-bold text-[#475569]">
                  Prazo Estimado (Dias) *
                </label>
                <input
                  type="number"
                  id="prazo"
                  min={1}
                  value={prazoEstimado}
                  onChange={(e) => setPrazoEstimado(Math.max(1, parseInt(e.target.value) || 0))}
                  required
                  className="border border-[#cbd5e1] rounded-lg px-3 py-2 text-sm font-medium text-[#1e293b] focus:border-[#001730] focus:ring-1 focus:ring-[#001730] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="engenheiro" className="text-xs font-bold text-[#475569] flex items-center justify-between">
                <span>Engenheiro Residente Responsável *</span>
                {loadingMembers && <Spinner size={12} className="animate-spin text-[#64748b]" />}
              </label>
              <select
                id="engenheiro"
                value={selectedEngenheiroId}
                onChange={(e) => setSelectedEngenheiroId(e.target.value)}
                required
                disabled={loadingMembers}
                className="border border-[#cbd5e1] bg-white rounded-lg px-3 py-2 text-sm font-medium text-[#1e293b] focus:border-[#001730] focus:ring-1 focus:ring-[#001730] outline-none cursor-pointer disabled:bg-slate-50"
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
          </div>

          {/* Bloco 2: Parâmetros de Controle Técnico */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-sm text-[#001730] border-b border-[#f1f5f9] pb-2 flex items-center gap-2">
              <Shield size={16} />
              Controles Técnicos (Leitura)
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3">
                <span className="text-[10px] text-[#64748b] font-bold block uppercase mb-1">
                  Bases de Referência
                </span>
                <span className="text-sm font-bold text-[#334155]">{baseReferencia}</span>
              </div>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3">
                <span className="text-[10px] text-[#64748b] font-bold block uppercase mb-1">
                  Margem Congelada (BDI)
                </span>
                <span className="text-sm font-bold text-[#334155]">{bdi}%</span>
              </div>
            </div>
          </div>

          {/* Bloco 3: Configurações de Módulos */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-sm text-[#001730] border-b border-[#f1f5f9] pb-2 flex items-center gap-2">
              <ShoppingCart size={16} />
              Integrações e Bloqueios
            </h4>

            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 p-3 hover:bg-[#f8fafc] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#e2e8f0]">
                <input
                  type="checkbox"
                  checked={gerarCompraABC}
                  onChange={(e) => setGerarCompraABC(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#001730] focus:ring-[#001730]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1e293b]">
                    Enviar Curva ABC para suprimentos
                  </span>
                  <span className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">
                    Importa automaticamente os insumos do orçamento para o controle de almoxarifado como limite de requisição.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 hover:bg-[#f8fafc] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#e2e8f0]">
                <input
                  type="checkbox"
                  checked={bloquearPlanilha}
                  onChange={(e) => setBloquearPlanilha(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#001730] focus:ring-[#001730]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1e293b]">
                    Bloquear planilha de orçamento base
                  </span>
                  <span className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">
                    Bloqueia futuras edições na planilha do orçamento para manter a meta de custos íntegra com a obra.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-auto border-t border-[#f1f5f9] pt-5 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#334155] font-bold text-sm py-3 rounded-lg transition-all border-solid cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#b9f61d] hover:bg-[#a5dd15] text-[#141f00] font-bold text-sm py-3 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-80"
            >
              {submitting ? (
                <>
                  <Spinner size={14} className="animate-spin" />
                  <span>Inicializando...</span>
                </>
              ) : (
                <span>Confirmar e Iniciar</span>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-slide-left {
          animation: slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
