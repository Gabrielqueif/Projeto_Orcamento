"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Wallet,
  ChartBar,
  PiggyBank,
  Warning,
  Plus,
  Funnel,
  CaretRight,
  CircleNotch,
  ArrowLeft,
  Trash,
  CheckCircle,
  Clock,
  XCircle,
  X,
  FileText,
  MagnifyingGlass,
  ArrowUpRight,
  ArrowDownRight,
} from "@phosphor-icons/react";
import {
  getConsolidadoFinanceiro,
  getDespesas,
  criarDespesa,
  atualizarStatusDespesa,
  deletarDespesa,
  ConsolidadoFinanceiro,
  Despesa,
  DespesaCreate,
} from "@/lib/api/financeiro";

export default function GestaoCustosObraPage() {
  const params = useParams();
  const obraId = params?.id as string;

  const [consolidado, setConsolidado] = useState<ConsolidadoFinanceiro | null>(null);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("TODAS");
  const [busca, setBusca] = useState<string>("");

  // Modal Lançamento
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState<DespesaCreate>({
    descricao: "",
    valor: 0,
    categoria: "Materiais",
    status: "EM_ANALISE",
    data_competencia: new Date().toISOString().split("T")[0],
    responsavel: "",
    origem: "MANUAL",
  });

  // Modal Confirmação Exclusão
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(null);

  async function carregarDados() {
    if (!obraId) return;
    try {
      setLoading(true);
      setError(null);
      const [consData, despData] = await Promise.all([
        getConsolidadoFinanceiro(obraId),
        getDespesas(obraId),
      ]);
      setConsolidado(consData);
      setDespesas(despData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados financeiros da obra");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [obraId]);

  const handleCriarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId || novaDespesa.valor <= 0 || !novaDespesa.descricao.trim()) return;

    try {
      setSalvando(true);
      await criarDespesa(obraId, novaDespesa);
      setModalAberto(false);
      setNovaDespesa({
        descricao: "",
        valor: 0,
        categoria: "Materiais",
        status: "EM_ANALISE",
        data_competencia: new Date().toISOString().split("T")[0],
        responsavel: "",
        origem: "MANUAL",
      });
      await carregarDados();
    } catch (err: any) {
      alert(err.message || "Erro ao registrar despesa");
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarStatus = async (
    despesaId: string,
    novoStatus: "EM_ANALISE" | "APROVADO" | "PAGO" | "RECUSADO"
  ) => {
    try {
      await atualizarStatusDespesa(obraId, despesaId, novoStatus);
      await carregarDados();
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar status");
    }
  };

  const handleDeletarDespesa = async (despesaId: string) => {
    try {
      await deletarDespesa(obraId, despesaId);
      setDespesaParaExcluir(null);
      await carregarDados();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir despesa");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAGO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={12} weight="fill" /> Pago
          </span>
        );
      case "APROVADO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle size={12} /> Aprovado
          </span>
        );
      case "RECUSADO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle size={12} weight="fill" /> Recusado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Em Análise
          </span>
        );
    }
  };

  const despesasFiltradas = despesas.filter((d) => {
    const matchCat = categoriaFiltro === "TODAS" || d.categoria === categoriaFiltro;
    const matchBusca =
      !busca.trim() ||
      d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      d.responsavel.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-color-text-muted">
        <CircleNotch size={32} className="animate-spin text-color-brand-accent" />
        <p className="text-[13px] font-semibold">Carregando gestão de custos da obra...</p>
      </div>
    );
  }

  if (error || !consolidado) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-color-danger">
        <Warning size={36} />
        <p className="text-[14px] font-bold">{error || "Não foi possível carregar os dados"}</p>
        <button
          onClick={() => carregarDados()}
          className="px-4 py-2 bg-color-primary-dark text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { total_orcado, total_realizado, saldo_restante, desvio_percentual, gasto_por_categoria } =
    consolidado;

  const percentualUtilizado =
    total_orcado > 0 ? Math.round((total_realizado / total_orcado) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-color-bg-soft p-6 gap-6">
      {/* ── Top Bar / Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-color-text-muted mb-1">
            <Link
              href="/financeiro"
              className="hover:text-color-heading transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              Financeiro
            </Link>
            <CaretRight size={10} />
            <span>Gestão de Custos</span>
          </div>
          <h1 className="text-[24px] font-bold text-color-heading leading-tight">
            Detalhamento de Custos da Obra
          </h1>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-color-brand-accent text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} weight="bold" />
          Lançar Nova Despesa
        </button>
      </div>

      {/* ── Cards de KPI ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Orçado */}
        <div className="bg-color-surface border border-color-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-color-text-muted mb-2">
            <span className="text-xs font-semibold">Total Orçado</span>
            <div className="p-2 rounded-xl bg-color-primary-dark/5 text-color-primary-dark">
              <Wallet size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-color-heading">
              {formatCurrency(total_orcado)}
            </h3>
            <p className="text-[11px] text-color-text-muted mt-1">Orçamento aprovado</p>
          </div>
        </div>

        {/* Total Realizado */}
        <div className="bg-color-surface border border-color-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-color-text-muted mb-2">
            <span className="text-xs font-semibold">Total Realizado</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ChartBar size={20} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-color-heading">
              {formatCurrency(total_realizado)}
            </h3>
            <p className="text-[11px] text-color-text-muted mt-1 flex items-center gap-1">
              <span>{percentualUtilizado}% do orçamento executado</span>
            </p>
          </div>
        </div>

        {/* Saldo Restante */}
        <div className="bg-color-surface border border-color-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-color-text-muted mb-2">
            <span className="text-xs font-semibold">Saldo Restante</span>
            <div
              className={`p-2 rounded-xl ${
                saldo_restante >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <PiggyBank size={20} />
            </div>
          </div>
          <div>
            <h3
              className={`text-2xl font-bold ${
                saldo_restante >= 0 ? "text-color-heading" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatCurrency(saldo_restante)}
            </h3>
            <p className="text-[11px] text-color-text-muted mt-1">
              {saldo_restante >= 0 ? "Margem disponível" : "Orçamento estourado"}
            </p>
          </div>
        </div>

        {/* Desvio Orçamentário */}
        <div className="bg-color-surface border border-color-border-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-color-text-muted mb-2">
            <span className="text-xs font-semibold">Desvio Orçamentário</span>
            <div
              className={`p-2 rounded-xl ${
                desvio_percentual <= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {desvio_percentual > 0 ? (
                <ArrowUpRight size={20} className="text-amber-500" />
              ) : (
                <ArrowDownRight size={20} className="text-emerald-500" />
              )}
            </div>
          </div>
          <div>
            <h3
              className={`text-2xl font-bold ${
                desvio_percentual > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {desvio_percentual > 0 ? `+${desvio_percentual.toFixed(1)}%` : `${desvio_percentual.toFixed(1)}%`}
            </h3>
            <p className="text-[11px] text-color-text-muted mt-1">Variação frente ao planejado</p>
          </div>
        </div>
      </div>

      {/* ── Distribuição de Gastos por Categoria ── */}
      <div className="bg-color-surface border border-color-border-subtle rounded-2xl p-5 shadow-xs">
        <h2 className="text-base font-bold text-color-heading mb-4">
          Comparativo por Categoria (Orçado vs Realizado)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {gasto_por_categoria.map((cat) => {
            const pctCat =
              cat.orcado > 0 ? Math.min(Math.round((cat.realizado / cat.orcado) * 100), 100) : 0;
            const sobreAviso = cat.realizado > cat.orcado && cat.orcado > 0;

            return (
              <div
                key={cat.categoria}
                className="bg-color-bg-soft border border-color-border-subtle p-4 rounded-xl flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-color-heading">{cat.categoria}</span>
                    {sobreAviso && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        Acima
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-color-text-muted flex flex-col gap-0.5 mt-2">
                    <div className="flex justify-between">
                      <span>Orçado:</span>
                      <span className="font-semibold text-color-heading">
                        {formatCurrency(cat.orcado)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Realizado:</span>
                      <span className="font-semibold text-color-heading">
                        {formatCurrency(cat.realizado)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-color-text-muted mb-1">
                    <span>Progresso</span>
                    <span className="font-bold">{pctCat}%</span>
                  </div>
                  <div className="w-full h-2 bg-color-border-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        sobreAviso
                          ? "bg-rose-500"
                          : pctCat > 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${pctCat}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabela e Filtros de Despesas ── */}
      <div className="bg-color-surface border border-color-border-subtle rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base font-bold text-color-heading flex items-center gap-2">
            <FileText size={18} />
            Lançamentos de Despesas
          </h2>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Campo Busca */}
            <div className="relative flex-1 sm:w-64">
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-color-text-muted"
              />
              <input
                type="text"
                placeholder="Buscar despesa ou responsável..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-color-bg-soft border border-color-border-subtle rounded-xl text-xs text-color-heading placeholder:text-color-text-muted focus:outline-none focus:border-color-brand-accent"
              />
            </div>

            {/* Filtro Categoria */}
            <div className="flex items-center gap-1.5 bg-color-bg-soft border border-color-border-subtle px-3 py-1.5 rounded-xl text-xs">
              <Funnel size={14} className="text-color-text-muted" />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="bg-transparent text-color-heading focus:outline-none cursor-pointer text-xs"
              >
                <option value="TODAS">Todas Categorias</option>
                <option value="Materiais">Materiais</option>
                <option value="Mão de Obra">Mão de Obra</option>
                <option value="Equipamentos">Equipamentos</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-color-heading">
            <thead className="bg-color-bg-soft border-b border-color-border-subtle uppercase text-[10px] text-color-text-muted font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Data Competência</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-color-border-subtle">
              {despesasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-color-text-muted text-xs">
                    Nenhuma despesa encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                despesasFiltradas.map((despesa) => (
                  <tr
                    key={despesa.id}
                    className="hover:bg-color-bg-soft/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-color-text-muted">
                      {despesa.data_competencia}
                    </td>
                    <td className="py-3 px-4 font-semibold">{despesa.descricao}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-color-bg-soft border border-color-border-subtle text-[11px]">
                        {despesa.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-color-text-muted">{despesa.responsavel}</td>
                    <td className="py-3 px-4 font-bold">{formatCurrency(despesa.valor)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={despesa.status}
                        onChange={(e) =>
                          handleAtualizarStatus(
                            despesa.id,
                            e.target.value as "EM_ANALISE" | "APROVADO" | "PAGO" | "RECUSADO"
                          )
                        }
                        className="bg-transparent cursor-pointer focus:outline-none"
                      >
                        <option value="EM_ANALISE">Em Análise</option>
                        <option value="APROVADO">Aprovado</option>
                        <option value="PAGO">Pago</option>
                        <option value="RECUSADO">Recusado</option>
                      </select>
                      <div className="mt-1">{getStatusBadge(despesa.status)}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDespesaParaExcluir(despesa.id)}
                        className="p-1.5 rounded-lg text-color-text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title="Excluir despesa"
                      >
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Nova Despesa (Modelo Padrão do Projeto) ── */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAberto(false);
          }}
        >
          <div className="bg-white border border-color-border-subtle rounded-2xl w-full max-w-md p-6 shadow-xl flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setModalAberto(false)}
              className="absolute top-5 right-5 text-color-text-muted hover:text-color-heading p-1 rounded-lg hover:bg-color-bg-soft transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="border-b border-color-border-subtle pb-3">
              <h3 className="font-extrabold text-[18px] text-color-heading flex items-center gap-2 tracking-tight">
                <Plus size={18} className="text-color-brand-accent" weight="bold" />
                <span>Nova Despesa Financeira</span>
              </h3>
              <p className="text-[13px] text-color-text-muted mt-0.5">
                Preencha os dados do lançamento para integrar aos custos da obra
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCriarDespesa} className="flex flex-col gap-3.5">
              {/* Descrição */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-color-text-muted uppercase tracking-wider">
                  Descrição da Despesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de cimento e agregados"
                  value={novaDespesa.descricao}
                  onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })}
                  className="w-full border border-color-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-color-heading bg-color-bg-soft outline-none focus:border-color-brand-accent transition-colors"
                />
              </div>

              {/* Valor & Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-color-text-muted uppercase tracking-wider">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={novaDespesa.valor || ""}
                    onChange={(e) =>
                      setNovaDespesa({ ...novaDespesa, valor: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-color-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-color-heading bg-color-bg-soft outline-none focus:border-color-brand-accent transition-colors font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-color-text-muted uppercase tracking-wider">
                    Categoria
                  </label>
                  <select
                    value={novaDespesa.categoria}
                    onChange={(e) =>
                      setNovaDespesa({
                        ...novaDespesa,
                        categoria: e.target.value as any,
                      })
                    }
                    className="w-full border border-color-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-color-heading bg-color-bg-soft outline-none focus:border-color-brand-accent cursor-pointer transition-colors"
                  >
                    <option value="Materiais">Materiais</option>
                    <option value="Mão de Obra">Mão de Obra</option>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              {/* Data & Responsável */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-color-text-muted uppercase tracking-wider">
                    Data Competência
                  </label>
                  <input
                    type="date"
                    required
                    value={novaDespesa.data_competencia}
                    onChange={(e) =>
                      setNovaDespesa({ ...novaDespesa, data_competencia: e.target.value })
                    }
                    className="w-full border border-color-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-color-heading bg-color-bg-soft outline-none focus:border-color-brand-accent transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-color-text-muted uppercase tracking-wider">
                    Responsável
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do responsável"
                    value={novaDespesa.responsavel}
                    onChange={(e) =>
                      setNovaDespesa({ ...novaDespesa, responsavel: e.target.value })
                    }
                    className="w-full border border-color-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-color-heading bg-color-bg-soft outline-none focus:border-color-brand-accent transition-colors"
                  />
                </div>
              </div>

              {/* Status Inicial */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-color-text-muted uppercase tracking-wider">
                  Status Inicial
                </label>
                <select
                  value={novaDespesa.status}
                  onChange={(e) =>
                    setNovaDespesa({
                      ...novaDespesa,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full border border-color-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-color-heading bg-color-bg-soft outline-none focus:border-color-brand-accent cursor-pointer transition-colors"
                >
                  <option value="EM_ANALISE">Em Análise</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="PAGO">Pago</option>
                </select>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-color-border-subtle mt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-color-bg-soft text-color-heading border border-color-border-subtle rounded-xl text-xs font-bold hover:bg-color-border-subtle transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-1.5 px-5 py-2 bg-color-brand-accent text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {salvando && <CircleNotch size={14} className="animate-spin" />}
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmação Exclusão ── */}
      {despesaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-color-surface border border-color-border-subtle rounded-2xl w-full max-w-sm p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-color-heading">Confirmar Exclusão</h3>
            <p className="text-xs text-color-text-muted">
              Tem certeza que deseja excluir esta despesa? Esta ação atualizará os consolidados da obra e não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setDespesaParaExcluir(null)}
                className="px-4 py-2 bg-color-bg-soft text-color-heading rounded-xl text-xs font-semibold hover:bg-color-border-subtle"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletarDespesa(despesaParaExcluir)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
