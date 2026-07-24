"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MagnifyingGlass,
  Funnel,
  Download,
  ShoppingCart,
  Cube,
  Warning,
  ArrowsHorizontal,
  DotsThreeVertical,
  Warehouse,
  Plus,
  Minus,
  QrCode,
  Wrench,
  Coins,
  TrendUp,
  X,
  CheckCircle,
  Trash,
} from "@phosphor-icons/react";
import {
  getOrcamento,
  getItens,
  type Orcamento,
  type OrcamentoItem,
} from "@/lib/api/orcamentos";
import {
  getEstoqueInsumos,
  criarInsumo,
  registrarMovimentacao,
  getLocacoes,
  registrarLocacao,
  atualizarStatusLocacao,
  deletarInsumo,
  deletarLocacao,
  type InsumoAlmoxarifado,
  type Locacao,
} from "@/lib/api/almoxarifado";

export default function AlmoxarifadoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [insumos, setInsumos] = useState<InsumoAlmoxarifado[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");

  // Estados para Modal de Movimentação de Estoque
  const [modalTipo, setModalTipo] = useState<"ENTRADA" | "SAIDA" | null>(null);
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>("");
  const [movQtd, setMovQtd] = useState<string>("");
  const [movResponsavel, setMovResponsavel] = useState("");
  const [movObs, setMovObs] = useState("");
  const [movError, setMovError] = useState<string | null>(null);
  const [movSuccess, setMovSuccess] = useState(false);

  // Estados para Modal de Nova Locação
  const [showLocacaoModal, setShowLocacaoModal] = useState(false);
  const [locEquipamento, setLocEquipamento] = useState("");
  const [locLocadora, setLocLocadora] = useState("");
  const [locDevolucao, setLocDevolucao] = useState("");
  const [locResponsavel, setLocResponsavel] = useState("");
  const [locError, setLocError] = useState<string | null>(null);

  // Estados para Modal de Novo Material
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMatCodigo, setNewMatCodigo] = useState("");
  const [newMatDescricao, setNewMatDescricao] = useState("");
  const [newMatCategoria, setNewMatCategoria] = useState("ESTRUTURA");
  const [newMatQtdAtual, setNewMatQtdAtual] = useState("");
  const [newMatQtdMinima, setNewMatQtdMinima] = useState("");
  const [newMatUnidade, setNewMatUnidade] = useState("");
  const [newMatPrecoUnitario, setNewMatPrecoUnitario] = useState("");
  const [addMatError, setAddMatError] = useState<string | null>(null);

  const carregarDados = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [orcData, itensData, dbInsumos, dbLocacoes] = await Promise.all([
        getOrcamento(id),
        getItens(id),
        getEstoqueInsumos(id).catch(() => []),
        getLocacoes(id).catch(() => []),
      ]);
      setOrcamento(orcData);
      setItens(itensData);

      // Se o banco de dados do estoque de insumos estiver vazio para esta obra,
      // inicializamos automaticamente a partir dos itens de orçamento ou fallbacks!
      if (dbInsumos.length === 0) {
        const insumosParaCriar =
          itensData.length > 0
            ? itensData.map((item) => {
                const desc = item.descricao.toLowerCase();
                let categoria = "ESTRUTURA";
                if (desc.includes("cimento") || desc.includes("concreto") || desc.includes("argamassa")) {
                  categoria = "ESTRUTURA";
                } else if (desc.includes("aço") || desc.includes("ferro")) {
                  categoria = "ESTRUTURA";
                } else if (desc.includes("capacete") || desc.includes("luva") || desc.includes("epi")) {
                  categoria = "EPI";
                } else if (desc.includes("pá") || desc.includes("martelo") || desc.includes("enxada")) {
                  categoria = "FERRAMENTAS";
                }

                return {
                  codigo_insumo: item.codigo_composicao,
                  descricao: item.descricao,
                  categoria,
                  quantidade_atual: Math.round(item.quantidade * 0.85),
                  quantidade_minima: Math.max(1, Math.round(item.quantidade * 0.2)),
                  unidade: item.unidade,
                  preco_unitario: item.preco_unitario || 0.0,
                };
              })
            : [
                {
                  codigo_insumo: "SINAPI-1245",
                  descricao: "Cimento CP-II",
                  categoria: "ESTRUTURA",
                  quantidade_atual: 450,
                  quantidade_minima: 100,
                  unidade: "sacos",
                  preco_unitario: 32.5,
                },
                {
                  codigo_insumo: "PR-8821",
                  descricao: "Aço CA-50 10mm",
                  categoria: "ESTRUTURA",
                  quantidade_atual: 12,
                  quantidade_minima: 15,
                  unidade: "toneladas",
                  preco_unitario: 5200.0,
                },
                {
                  codigo_insumo: "EPI-500",
                  descricao: "Capacete de Proteção EPI",
                  categoria: "EPI",
                  quantidade_atual: 25,
                  quantidade_minima: 10,
                  unidade: "unid",
                  preco_unitario: 18.9,
                },
              ];

        const criados = await Promise.all(
          insumosParaCriar.map((insumo) => criarInsumo(id, insumo))
        );
        setInsumos(criados);
      } else {
        setInsumos(dbInsumos);
      }

      // Se o banco de dados de locações de equipamentos estiver vazio,
      // inicializamos com as locações mockadas padrão do canteiro.
      if (dbLocacoes.length === 0) {
        const locacoesParaCriar = [
          {
            nome_equipamento: "Betoneira 400L",
            locadora: "Rental Tech",
            status: "EM_USO" as const,
            devolucao_prevista: "2024-05-28",
            responsavel: "Mestre Antônio",
          },
          {
            nome_equipamento: "Martelete Elétrico 15kg",
            locadora: "Tools Express",
            status: "AGUARDANDO_RETIRADA" as const,
            devolucao_prevista: "2024-05-25",
          },
          {
            nome_equipamento: "Gerador 10kVA",
            locadora: "Rental Tech",
            status: "FINALIZADO" as const,
            devolucao_prevista: "2024-05-20",
          },
        ];

        const criadas = await Promise.all(
          locacoesParaCriar.map((loc) => registrarLocacao(id, loc))
        );
        setLocacoes(criadas);
      } else {
        setLocacoes(dbLocacoes);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do almoxarifado:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [id]);

  const handleDeleteInsumo = async (insumoId: string) => {
    if (!window.confirm("Tem certeza que deseja remover este material do estoque físico? Isso também apagará o histórico de movimentações associado.")) {
      return;
    }
    try {
      await deletarInsumo(id, insumoId);
      setInsumos(insumos.filter(i => i.id !== insumoId));
    } catch (err: any) {
      alert(err.message || "Erro ao deletar material.");
    }
  };

  const handleDeleteLocacao = async (locacaoId: string) => {
    if (!window.confirm("Tem certeza que deseja remover esta locação de equipamento?")) {
      return;
    }
    try {
      await deletarLocacao(id, locacaoId);
      setLocacoes(locacoes.filter((l) => l.id !== locacaoId));
    } catch (err: any) {
      alert(err.message || "Erro ao deletar locação.");
    }
  };

  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMatError(null);

    if (!newMatCodigo.trim() || !newMatDescricao.trim() || !newMatUnidade.trim()) {
      setAddMatError("Preencha todos os campos obrigatórios (*).");
      return;
    }

    const qtdMin = Number(newMatQtdMinima || 0);
    const qtdAtual = Number(newMatQtdAtual || 0);
    const preco = Number(newMatPrecoUnitario || 0);

    if (isNaN(qtdMin) || qtdMin < 0 || isNaN(qtdAtual) || qtdAtual < 0 || isNaN(preco) || preco < 0) {
      setAddMatError("Os valores numéricos não podem ser negativos.");
      return;
    }

    try {
      const novoInsumo = await criarInsumo(id, {
        codigo_insumo: newMatCodigo.trim(),
        descricao: newMatDescricao.trim(),
        categoria: newMatCategoria,
        quantidade_atual: qtdAtual,
        quantidade_minima: qtdMin,
        unidade: newMatUnidade.trim(),
        preco_unitario: preco,
      });

      // Recarrega todos os insumos para re-calcular status do banco de dados e formatar
      const dbInsumos = await getEstoqueInsumos(id);
      setInsumos(dbInsumos);
      setShowAddMaterialModal(false);
      
      // Limpar campos
      setNewMatCodigo("");
      setNewMatDescricao("");
      setNewMatCategoria("ESTRUTURA");
      setNewMatQtdAtual("");
      setNewMatQtdMinima("");
      setNewMatUnidade("");
      setNewMatPrecoUnitario("");
    } catch (err: any) {
      setAddMatError(err.message || "Erro ao adicionar material.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[500px]">
        <span className="font-manrope text-[14px] text-text-muted animate-pulse">
          Carregando informações do almoxarifado...
        </span>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[500px] gap-4">
        <span className="font-manrope text-[14px] text-text-muted">
          Obra não encontrada.
        </span>
        <button
          onClick={() => router.push("/obras")}
          className="px-4 py-2 bg-bg-dark text-white rounded-lg font-manrope text-[14px] font-bold cursor-pointer"
        >
          Voltar para Obras
        </button>
      </div>
    );
  }

  // Filtros aplicados na listagem de estoque físico
  const insumosFiltrados = insumos.filter((insumo) => {
    const matchesSearch =
      insumo.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insumo.codigo_insumo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "TODOS"
        ? true
        : selectedCategory === "CRITICO"
        ? insumo.status === "Crítico" || Number(insumo.quantidade_atual) <= Number(insumo.quantidade_minima)
        : insumo.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // KPIs dinâmicos baseados no banco
  const totalPatrimonio = insumos.reduce(
    (acc, insumo) => acc + Number(insumo.quantidade_atual) * Number(insumo.preco_unitario),
    0
  );
  const valorEstoqueExibido = totalPatrimonio.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const totalInsumos = insumos.length;
  const totalCriticos = insumos.filter((i) => i.status === "Crítico").length;

  // Lógica para submissão de movimentações (Dar Baixa / Entrada)
  const handleMovimentacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovError(null);
    setMovSuccess(false);

    if (!selectedInsumoId) {
      setMovError("Selecione um insumo.");
      return;
    }
    const qtd = Number(movQtd);
    if (isNaN(qtd) || qtd <= 0) {
      setMovError("Insira uma quantidade válida maior que zero.");
      return;
    }
    if (!movResponsavel.trim()) {
      setMovError("Preencha o nome do responsável.");
      return;
    }

    try {
      await registrarMovimentacao(id, selectedInsumoId, {
        tipo_movimentacao: modalTipo!,
        quantidade: qtd,
        responsavel: movResponsavel,
        observacoes: movObs || undefined,
      });

      setMovSuccess(true);
      // Recarregar os dados do banco atualizados
      const novosInsumos = await getEstoqueInsumos(id);
      setInsumos(novosInsumos);

      // Limpar campos
      setTimeout(() => {
        setModalTipo(null);
        setSelectedInsumoId("");
        setMovQtd("");
        setMovResponsavel("");
        setMovObs("");
        setMovSuccess(false);
      }, 1500);
    } catch (err: any) {
      setMovError(err.message || "Ocorreu um erro ao registrar a movimentação.");
    }
  };

  // Lógica para submissão de locação
  const handleLocacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocError(null);

    if (!locEquipamento.trim() || !locLocadora.trim() || !locDevolucao) {
      setLocError("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const novaLoc = await registrarLocacao(id, {
        nome_equipamento: locEquipamento,
        locadora: locLocadora,
        status: "AGUARDANDO_RETIRADA",
        devolucao_prevista: locDevolucao,
        responsavel: locResponsavel.trim() || undefined,
      });

      setLocacoes([...locacoes, novaLoc]);
      setShowLocacaoModal(false);
      setLocEquipamento("");
      setLocLocadora("");
      setLocDevolucao("");
      setLocResponsavel("");
    } catch (err: any) {
      setLocError(err.message || "Erro ao registrar locação.");
    }
  };

  // Altera status da locação de forma dinâmica
  const handleToggleLocStatus = async (locId: string, currentStatus: string) => {
    let novoStatus: "EM_USO" | "AGUARDANDO_RETIRADA" | "FINALIZADO" = "EM_USO";
    if (currentStatus === "AGUARDANDO_RETIRADA") {
      novoStatus = "EM_USO";
    } else if (currentStatus === "EM_USO") {
      novoStatus = "FINALIZADO";
    } else {
      novoStatus = "AGUARDANDO_RETIRADA";
    }

    try {
      const atualizada = await atualizarStatusLocacao(id, locId, novoStatus);
      setLocacoes(locacoes.map((l) => (l.id === locId ? atualizada : l)));
    } catch (err) {
      console.error("Erro ao atualizar status do equipamento:", err);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/obras/${id}`}
            className="inline-flex items-center gap-2 text-text-muted no-underline hover:text-text-main transition-colors mb-2 font-manrope text-[13px] font-medium"
          >
            <ArrowLeft size={14} weight="bold" />
            Voltar para Cronograma
          </Link>
          <p className="font-mono text-[10px] font-medium text-teal uppercase tracking-[0.5px] leading-[15px]">
            Projetos / {orcamento.cliente || "Cliente"} / {orcamento.nome}
          </p>
          <h1 className="font-manrope font-extrabold text-[36px] text-text-main tracking-[-0.9px] leading-[40px]">
            Inventário & Almoxarifado
          </h1>
          <p className="font-manrope font-medium text-[14px] text-text-muted leading-[20px] max-w-[545px] mt-1">
            Gestão em tempo real do estoque físico e insumos em trânsito no canteiro.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setModalTipo("SAIDA")}
            className="flex items-center gap-2 bg-bg-dark text-white px-6 py-[13px] rounded-[8px] font-manrope font-bold text-[14px] hover:bg-bg-darker transition-colors border-none cursor-pointer"
          >
            <Minus size={16} weight="bold" />
            <span>Dar Baixa / Consumo</span>
          </button>
          <button
            onClick={() => setModalTipo("ENTRADA")}
            className="flex items-center gap-2 bg-brand-primary text-text-main px-6 py-[13px] rounded-[8px] font-manrope font-bold text-[14px] hover:bg-brand-primaryHover transition-colors border-none cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Entrada de NF / Material</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 - Valor total */}
        <div className="bg-surface border border-border rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-medium text-[10px] text-text-muted uppercase tracking-[0.5px]">
              VALOR TOTAL EM ESTOQUE
            </span>
            <Coins size={20} className="text-brand-primary" weight="fill" />
          </div>
          <p className="font-manrope font-extrabold text-[28px] text-text-main leading-tight">
            {valorEstoqueExibido}
          </p>
          <p className="font-manrope font-bold text-[11px] text-brand-primary flex items-center gap-1 mt-1">
            <TrendUp size={14} weight="bold" />
            Patrimônio no canteiro
          </p>
        </div>

        {/* KPI 2 - Itens Cadastrados */}
        <div className="bg-surface border border-border rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-medium text-[10px] text-text-muted uppercase tracking-[0.5px]">
              MATERIAIS CADASTRADOS
            </span>
            <Cube size={20} className="text-teal" />
          </div>
          <p className="font-manrope font-extrabold text-[28px] text-text-main leading-tight">
            {totalInsumos < 10 ? `0${totalInsumos}` : totalInsumos} Materiais
          </p>
          <p className="font-manrope font-medium text-[11px] text-text-muted mt-1">
            Listagem SINAPI e Própria
          </p>
        </div>

        {/* KPI 3 - Nível Crítico */}
        <div className="bg-surface border border-border rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-2 relative overflow-hidden">
          {totalCriticos > 0 && (
            <div className="absolute left-0 top-0 h-full w-1 bg-status-danger" />
          )}
          <div className="flex items-center justify-between">
            <span className="font-mono font-medium text-[10px] text-text-muted uppercase tracking-[0.5px]">
              MATERIAIS EM NÍVEL CRÍTICO
            </span>
            <Warning size={20} className={totalCriticos > 0 ? "text-status-danger" : "text-text-muted"} weight="fill" />
          </div>
          <p className={`font-manrope font-extrabold text-[28px] leading-tight ${totalCriticos > 0 ? "text-status-danger" : "text-text-main"}`}>
            {totalCriticos < 10 ? `0${totalCriticos}` : totalCriticos} Materiais
          </p>
          <p className="font-manrope font-medium text-[11px] text-text-muted mt-1">
            Requer atenção imediata
          </p>
        </div>

        {/* KPI 4 - Movimentações */}
        <div className="bg-surface border border-border rounded-[8px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-medium text-[10px] text-text-muted uppercase tracking-[0.5px]">
              MOVIMENTAÇÕES HOJE
            </span>
            <ArrowsHorizontal size={20} className="text-brand-primary" />
          </div>
          <p className="font-manrope font-extrabold text-[28px] text-text-main leading-tight">
            18 Entradas/Saídas
          </p>
          <p className="font-manrope font-medium text-[11px] text-text-muted mt-1">
            Última há 22 min
          </p>
        </div>
      </div>

      {/* Main Section - Tabela de Materiais */}
      <div className="bg-surface border border-border rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-manrope font-extrabold text-[18px] text-text-main">
            Tabela de Materiais
          </h3>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-[280px]">
              <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
                <MagnifyingGlass size={16} className="text-text-muted" />
              </div>
              <input
                type="text"
                placeholder="Buscar material, código ou localização..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8fafc] border border-border rounded-[6px] pl-[36px] pr-4 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-surface border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main outline-none focus:border-brand-primary cursor-pointer"
            >
              <option value="TODOS">Todas as Categorias</option>
              <option value="CRITICO">⚠️ Apenas Críticos / Reposição</option>
              <option value="ESTRUTURA">Estrutura</option>
              <option value="EPI">EPI</option>
              <option value="ELÉTRICA">Elétrica</option>
              <option value="HIDRÁULICA">Hidráulica</option>
              <option value="ACABAMENTO">Acabamento</option>
              <option value="FERRAMENTAS">Ferramentas</option>
            </select>

            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-[6px] font-manrope text-[13px] font-bold text-text-main hover:bg-[#f8fafc] transition-colors cursor-pointer bg-white">
              <Funnel size={14} />
              Filtrar
            </button>

            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-[6px] font-manrope text-[13px] font-bold text-text-main hover:bg-[#f8fafc] transition-colors cursor-pointer bg-white">
              <Download size={14} />
              Exportar CSV
            </button>

            <button
              onClick={() => setShowAddMaterialModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-primary hover:bg-brand-primaryHover text-text-main rounded-[6px] font-manrope text-[13px] font-bold transition-colors cursor-pointer border-none"
            >
              <Plus size={14} weight="bold" />
              <span>Adicionar Material</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-manrope">
            <thead className="bg-[#f8fafc] text-text-muted border-b border-border">
              <tr>
                <th className="px-6 py-3.5 font-mono font-medium text-[10px] uppercase tracking-[0.5px]">
                  MATERIAL / DESCRIÇÃO
                </th>
                <th className="px-4 py-3.5 font-mono font-medium text-[10px] uppercase tracking-[0.5px]">
                  CATEGORIA
                </th>
                <th className="px-4 py-3.5 font-mono font-medium text-[10px] uppercase tracking-[0.5px] text-right">
                  QTD. ATUAL
                </th>
                <th className="px-4 py-3.5 font-mono font-medium text-[10px] uppercase tracking-[0.5px] text-right">
                  MIN. ESTOQUE
                </th>
                <th className="px-4 py-3.5 font-mono font-medium text-[10px] uppercase tracking-[0.5px] text-center">
                  STATUS
                </th>
                <th className="px-6 py-3.5 font-mono font-medium text-[10px] uppercase tracking-[0.5px] text-right">
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {insumosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted font-manrope text-[14px]">
                    Nenhum material encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                insumosFiltrados.map((insumo) => (
                  <tr key={insumo.id} className="hover:bg-[#f8fafc] transition-colors">
                    {/* Descrição */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#f1f5f9] flex items-center justify-center shrink-0 text-text-main">
                          {insumo.categoria === "EPI" ? (
                            <Warehouse size={20} />
                          ) : insumo.categoria === "FERRAMENTAS" ? (
                            <Wrench size={20} />
                          ) : (
                            <Cube size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-text-main leading-tight">
                            {insumo.descricao}
                          </p>
                          <p className="font-mono text-[10px] text-text-muted mt-0.5">
                            Cód: {insumo.codigo_insumo} ({insumo.fonte || "Próprio"})
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-4.5">
                      <span className="inline-block bg-[#e2e8f0] text-text-main px-2 py-0.5 rounded-[4px] font-mono font-bold text-[9px]">
                        {insumo.categoria}
                      </span>
                    </td>

                    {/* Quantidade Atual */}
                    <td
                      className={`px-4 py-4.5 font-bold text-[13px] text-right ${
                        insumo.status === "Crítico" ? "text-status-danger" : "text-text-main"
                      }`}
                    >
                      {Number(insumo.quantidade_atual)} {insumo.unidade}
                    </td>

                    {/* Estoque Mínimo */}
                    <td className="px-4 py-4.5 text-text-muted text-[13px] text-right">
                      {Number(insumo.quantidade_minima)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4.5 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.5px] border ${
                          insumo.status === "Crítico"
                            ? "bg-red-50 text-status-danger border-red-200"
                            : "bg-green-50 text-brand-primary border-green-200"
                        }`}
                      >
                        {insumo.status}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4.5 text-right">
                      <button
                        onClick={() => handleDeleteInsumo(insumo.id)}
                        className="text-status-danger hover:text-red-700 transition-colors p-1.5 cursor-pointer bg-transparent border-none hover:bg-red-50 rounded-[4px] inline-flex items-center justify-center"
                        title="Remover material do estoque"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="px-6 py-4 bg-[#f8fafc] border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-text-muted text-[13px]">
          <span>
            Exibindo 1-{insumosFiltrados.length} de {insumosFiltrados.length} materiais
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="w-8 h-8 flex items-center justify-center rounded border border-border bg-white hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
              disabled
            >
              &lt;
            </button>
            <button className="w-8 h-8 bg-bg-dark text-white flex items-center justify-center rounded font-bold">
              1
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded border border-border bg-white hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
              disabled
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Widgets Inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumo vs Estoque */}
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-manrope font-extrabold text-[16px] text-text-main">
                Consumo Previsto vs. Estoque Atual
              </h4>
              <Cube size={18} className="text-text-muted" />
            </div>

            <div className="space-y-6">
              {/* Progresso Aço */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-manrope text-[13px]">
                  <span className="font-bold text-text-main">Aço CA-50 10mm</span>
                  <span className="text-status-danger font-bold">Faltam 3t</span>
                </div>
                <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                  <div className="bg-status-danger h-full" style={{ width: "80%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted font-mono">
                  <span>Estoque: 12t</span>
                  <span>Necessário: 15t</span>
                </div>
              </div>

              {/* Progresso Cimento */}
              <div className="space-y-2 pt-4 border-t border-[#f1f5f9]">
                <div className="flex items-center justify-between font-manrope text-[13px]">
                  <span className="font-bold text-text-main">Cimento CP-II</span>
                  <span className="text-brand-primary font-bold">Em Excesso (+350)</span>
                </div>
                <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full" style={{ width: "100%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted font-mono">
                  <span>Estoque: 450 sacos</span>
                  <span>Necessário: 100 sacos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button className="flex items-center gap-2 bg-brand-primary text-text-main px-4 py-2 rounded-[6px] font-manrope font-bold text-[12px] hover:bg-brand-primaryHover transition-colors border-none cursor-pointer">
              <ShoppingCart size={15} />
              Gerar Pedido de Compra
            </button>
          </div>
        </div>

        {/* Equipamentos Alugados */}
        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-manrope font-extrabold text-[16px] text-text-main">
              Equipamentos &amp; Ferramentas Alugadas
            </h4>
            <Wrench size={18} className="text-text-muted" />
          </div>

          <div className="space-y-3">
            {locacoes.map((eq) => (
              <div
                key={eq.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-[6px] bg-[#f8fafc] border border-border/50 gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-border shadow-sm text-text-muted">
                    <Wrench size={14} />
                  </div>
                  <div>
                    <p className="font-bold font-manrope text-[13px] text-text-main leading-tight">
                      {eq.nome_equipamento}
                    </p>
                    <p className="font-manrope text-[11px] text-text-muted mt-0.5">
                      Locadora: {eq.locadora}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLocStatus(eq.id, eq.status)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border hover:scale-102 transition-transform cursor-pointer bg-white ${
                        eq.status.startsWith("EM_USO")
                          ? "text-brand-primary border-green-200 bg-green-50/50"
                          : eq.status.startsWith("AGUARDANDO")
                          ? "text-teal border-blue-100 bg-blue-50/50"
                          : "text-text-muted border-gray-200 bg-gray-50"
                      }`}
                      title="Clique para alternar o status do equipamento"
                    >
                      {eq.status.replace("_", " ")}
                    </button>
                    <button
                      onClick={() => handleDeleteLocacao(eq.id)}
                      className="text-status-danger hover:text-red-700 transition-colors p-1 cursor-pointer bg-transparent border-none hover:bg-red-50 rounded"
                      title="Excluir locação"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                  <p className="font-manrope text-[10px] text-text-muted">
                    Devolução: {new Date(eq.devolucao_prevista).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowLocacaoModal(true)}
            className="w-full mt-4 py-3 border border-dashed border-border rounded-[6px] font-manrope font-bold text-[13px] text-text-muted hover:bg-[#f8fafc] hover:text-text-main transition-all flex items-center justify-center gap-2 cursor-pointer bg-white"
          >
            <Plus size={14} weight="bold" />
            Registrar Nova Locação
          </button>
        </div>
      </div>

      {/* Float Action Button (FAB) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-brand-primary text-text-main rounded-full shadow-[0_4px_14px_rgba(159,211,0,0.4)] flex items-center justify-center hover:scale-105 hover:bg-brand-primaryHover transition-transform z-50 border-none cursor-pointer">
        <QrCode size={24} weight="bold" />
      </button>

      {/* Modal Interativo de Entrada / Baixa */}
      {modalTipo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[12px] shadow-xl max-w-md w-full p-6 flex flex-col gap-4 relative">
            <button
              onClick={() => {
                setModalTipo(null);
                setMovError(null);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main cursor-pointer bg-transparent border-none"
            >
              <X size={20} />
            </button>

            <h3 className="font-manrope font-extrabold text-[18px] text-text-main flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
              {modalTipo === "ENTRADA" ? (
                <>
                  <Plus size={18} className="text-brand-primary" weight="bold" />
                  <span>Entrada de Material</span>
                </>
              ) : (
                <>
                  <Minus size={18} className="text-status-danger" weight="bold" />
                  <span>Dar Baixa / Consumo</span>
                </>
              )}
            </h3>

            {movSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                <CheckCircle size={48} className="text-brand-primary" weight="fill" />
                <h4 className="font-manrope font-bold text-text-main text-[16px]">
                  Movimentação registrada!
                </h4>
                <p className="font-manrope text-text-muted text-[13px]">
                  O saldo de estoque foi atualizado com sucesso no banco de dados.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMovimentacaoSubmit} className="flex flex-col gap-4">
                {movError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-status-danger text-[12px] rounded-[6px] font-manrope">
                    {movError}
                  </div>
                )}

                {/* Seleção do Insumo */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Material / Insumo *
                  </label>
                  <select
                    value={selectedInsumoId}
                    onChange={(e) => setSelectedInsumoId(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="">Selecione um item do estoque...</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.descricao} (Estoque: {Number(i.quantidade_atual)} {i.unidade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantidade */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={movQtd}
                    onChange={(e) => setMovQtd(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Responsável */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    placeholder="Mestre de Obras, Almoxarife, etc."
                    value={movResponsavel}
                    onChange={(e) => setMovResponsavel(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Observações */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Observações
                  </label>
                  <textarea
                    placeholder="NF de entrada, finalidade da baixa, etc."
                    value={movObs}
                    onChange={(e) => setMovObs(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary h-20 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-2 border-t border-[#f1f5f9] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTipo(null);
                      setMovError(null);
                    }}
                    className="px-4 py-2 border border-border rounded-[6px] font-manrope text-[13px] font-bold text-text-muted hover:bg-[#f8fafc] transition-colors cursor-pointer bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-[6px] font-manrope font-bold text-[13px] transition-colors cursor-pointer border-none text-white ${
                      modalTipo === "ENTRADA"
                        ? "bg-brand-primary text-text-main hover:bg-brand-primaryHover"
                        : "bg-bg-dark hover:bg-bg-darker"
                    }`}
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Registro de Nova Locação */}
      {showLocacaoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[12px] shadow-xl max-w-md w-full p-6 flex flex-col gap-4 relative">
            <button
              onClick={() => {
                setShowLocacaoModal(false);
                setLocError(null);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main cursor-pointer bg-transparent border-none"
            >
              <X size={20} />
            </button>

            <h3 className="font-manrope font-extrabold text-[18px] text-text-main flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
              <Wrench size={18} className="text-teal" />
              <span>Registrar Nova Locação</span>
            </h3>

            <form onSubmit={handleLocacaoSubmit} className="flex flex-col gap-4">
              {locError && (
                <div className="p-3 bg-red-50 border border-red-100 text-status-danger text-[12px] rounded-[6px] font-manrope">
                  {locError}
                </div>
              )}

              {/* Nome do Equipamento */}
              <div className="flex flex-col gap-1.5">
                <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                  Equipamento / Ferramenta *
                </label>
                <input
                  type="text"
                  placeholder="Betoneira, Andaime, etc."
                  value={locEquipamento}
                  onChange={(e) => setLocEquipamento(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                />
              </div>

              {/* Locadora */}
              <div className="flex flex-col gap-1.5">
                <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                  Locadora *
                </label>
                <input
                  type="text"
                  placeholder="Rental Tech, Tools Express, etc."
                  value={locLocadora}
                  onChange={(e) => setLocLocadora(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                />
              </div>

              {/* Devolução Prevista */}
              <div className="flex flex-col gap-1.5">
                <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                  Data de Devolução Prevista *
                </label>
                <input
                  type="date"
                  value={locDevolucao}
                  onChange={(e) => setLocDevolucao(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main outline-none focus:border-brand-primary"
                />
              </div>

              {/* Responsável */}
              <div className="flex flex-col gap-1.5">
                <label className="font-manrope text-[12px] font-bold text-text-main uppercase tracking-[0.5px]">
                  Responsável
                </label>
                <input
                  type="text"
                  placeholder="Colaborador responsável pelo uso..."
                  value={locResponsavel}
                  onChange={(e) => setLocResponsavel(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2 border-t border-[#f1f5f9] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLocacaoModal(false);
                    setLocError(null);
                  }}
                  className="px-4 py-2 border border-border rounded-[6px] font-manrope text-[13px] font-bold text-text-muted hover:bg-[#f8fafc] transition-colors cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-text-main hover:bg-brand-primaryHover rounded-[6px] font-manrope font-bold text-[13px] transition-colors cursor-pointer border-none"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Material */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[12px] shadow-xl max-w-md w-full p-6 flex flex-col gap-4 relative">
            <button
              onClick={() => {
                setShowAddMaterialModal(false);
                setAddMatError(null);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main cursor-pointer bg-transparent border-none"
            >
              <X size={20} />
            </button>

            <h3 className="font-manrope font-extrabold text-[18px] text-text-main flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
              <Plus size={18} className="text-brand-primary" weight="bold" />
              <span>Adicionar Novo Material</span>
            </h3>

            <form onSubmit={handleAddMaterialSubmit} className="flex flex-col gap-4">
              {addMatError && (
                <div className="p-3 bg-red-50 border border-red-100 text-status-danger text-[12px] rounded-[6px] font-manrope">
                  {addMatError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Código */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[11px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Código *
                  </label>
                  <input
                    type="text"
                    placeholder="SINAPI-XXXX"
                    value={newMatCodigo}
                    onChange={(e) => setNewMatCodigo(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Categoria */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[11px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Categoria *
                  </label>
                  <select
                    value={newMatCategoria}
                    onChange={(e) => setNewMatCategoria(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="ESTRUTURA">Estrutura</option>
                    <option value="EPI">EPI</option>
                    <option value="ELÉTRICA">Elétrica</option>
                    <option value="HIDRÁULICA">Hidráulica</option>
                    <option value="ACABAMENTO">Acabamento</option>
                    <option value="FERRAMENTAS">Ferramentas</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="font-manrope text-[11px] font-bold text-text-main uppercase tracking-[0.5px]">
                  Descrição / Nome *
                </label>
                <input
                  type="text"
                  placeholder="Cimento Portland, Barra de Ferro..."
                  value={newMatDescricao}
                  onChange={(e) => setNewMatDescricao(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                />
              </div>

              {/* Unidade */}
              <div className="flex flex-col gap-1.5">
                <label className="font-manrope text-[11px] font-bold text-text-main uppercase tracking-[0.5px]">
                  Unidade de Medida *
                </label>
                <input
                  type="text"
                  placeholder="sacos, kg, unid"
                  value={newMatUnidade}
                  onChange={(e) => setNewMatUnidade(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Qtd. Atual */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[11px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Qtd. Atual
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newMatQtdAtual}
                    onChange={(e) => setNewMatQtdAtual(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Qtd. Mínima */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[11px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Estoque Mín.
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newMatQtdMinima}
                    onChange={(e) => setNewMatQtdMinima(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Preço Unitário */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-manrope text-[11px] font-bold text-text-main uppercase tracking-[0.5px]">
                    Preço Unit. (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={newMatPrecoUnitario}
                    onChange={(e) => setNewMatPrecoUnitario(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-border rounded-[6px] px-3 py-2 font-manrope text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2 border-t border-[#f1f5f9] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMaterialModal(false);
                    setAddMatError(null);
                  }}
                  className="px-4 py-2 border border-border rounded-[6px] font-manrope text-[13px] font-bold text-text-muted hover:bg-[#f8fafc] transition-colors cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-primary text-text-main hover:bg-brand-primaryHover rounded-[6px] font-manrope font-bold text-[13px] transition-colors cursor-pointer border-none"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
