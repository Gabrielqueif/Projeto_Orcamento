"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Database, 
  User, 
  Coins, 
  Info,
  CircleNotch,
  ArrowRight
} from "@phosphor-icons/react";
import { createOrcamento } from "@/lib/api/orcamentos";

const ESTADOS = [
  { value: "ac", label: "AC - Acre" },
  { value: "al", label: "AL - Alagoas" },
  { value: "ap", label: "AP - Amapá" },
  { value: "am", label: "AM - Amazonas" },
  { value: "ba", label: "BA - Bahia" },
  { value: "ce", label: "CE - Ceará" },
  { value: "df", label: "DF - Distrito Federal" },
  { value: "es", label: "ES - Espírito Santo" },
  { value: "go", label: "GO - Goiás" },
  { value: "ma", label: "MA - Maranhão" },
  { value: "mt", label: "MT - Mato Grosso" },
  { value: "ms", label: "MS - Mato Grosso do Sul" },
  { value: "mg", label: "MG - Minas Gerais" },
  { value: "pa", label: "PA - Pará" },
  { value: "pb", label: "PB - Paraíba" },
  { value: "pr", label: "PR - Paraná" },
  { value: "pe", label: "PE - Pernambuco" },
  { value: "pi", label: "PI - Piauí" },
  { value: "rj", label: "RJ - Rio de Janeiro" },
  { value: "rn", label: "RN - Rio Grande do Norte" },
  { value: "rs", label: "RS - Rio Grande do Sul" },
  { value: "ro", label: "RO - Rondônia" },
  { value: "rr", label: "RR - Roraima" },
  { value: "sc", label: "SC - Santa Catarina" },
  { value: "sp", label: "SP - São Paulo" },
  { value: "se", label: "SE - Sergipe" },
  { value: "to", label: "TO - Tocantins" },
];

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [endereco, setEndereco] = useState("");
  const [tipoConstrucao, setTipoConstrucao] = useState("Residencial");
  const [estado, setEstado] = useState("sp");
  const [areaTotal, setAreaTotal] = useState<number>(0);
  const [baseReferencia, setBaseReferencia] = useState("SINAPI");
  const [tipoComposicao, setTipoComposicao] = useState("Sem Desoneração");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [bdi, setBdi] = useState<number>(25.0);
  const [margem, setMargem] = useState<number>(10.0);
  const [prazo, setPrazo] = useState<number>(90);
  const [status, setStatus] = useState("em_elaboracao");

  // Calculated Values for Summary Card
  const [custoBase, setCustoBase] = useState(0);
  const [incidenciaBdi, setIncidenciaBdi] = useState(0);
  const [impostosTaxas, setImpostosTaxas] = useState(0);
  const [valorEstimado, setValorEstimado] = useState(0);

  useEffect(() => {
    // Simulação de estimativa de custo de construção (Ex: R$ 2.000,00 por M²)
    const base = areaTotal * 2000.00;
    const bdiVal = base * (bdi / 100.0);
    const impostos = base * (margem / 100.0);
    const total = base + bdiVal + impostos;

    setCustoBase(base);
    setIncidenciaBdi(bdiVal);
    setImpostosTaxas(impostos);
    setValorEstimado(total);
  }, [areaTotal, bdi, margem]);

  const handleSubmit = async (e: React.FormEvent, statusOverride?: string) => {
    e.preventDefault();
    if (!nome) {
      setError("Por favor, preencha o nome do orçamento.");
      return;
    }
    if (!cliente) {
      setError("Por favor, preencha o nome do cliente.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const activeStatus = statusOverride || status;
      const variaveisGlobais = [
        { nome: "ENDERECO", valor: endereco },
        { nome: "TIPO_CONSTRUCAO", valor: tipoConstrucao },
        { nome: "AREA_TOTAL", valor: Number(areaTotal) },
        { nome: "CPF_CNPJ", valor: cpfCnpj },
        { nome: "TELEFONE", valor: telefone },
        { nome: "EMAIL", valor: email },
        { nome: "MARGEM", valor: Number(margem) },
        { nome: "PRAZO", valor: Number(prazo) }
      ];

      const orcamentoData = {
        nome,
        cliente,
        data: new Date().toISOString().split("T")[0],
        base_referencia: baseReferencia,
        tipo_composicao: tipoComposicao,
        estado: estado.toUpperCase(),
        fonte: baseReferencia,
        bdi: Number(bdi),
        status: activeStatus,
        variaveis_globais: variaveisGlobais,
        locais: []
      };

      const res = await createOrcamento(orcamentoData);
      router.push(`/orcamentos/${res.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao criar o orçamento.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#44474e] font-['Hanken_Grotesk'] tracking-wider uppercase">
          <Link href="/orcamentos" className="hover:text-black transition-colors flex items-center gap-1">
            <ArrowLeft size={12} weight="bold" /> Orçamentos
          </Link>
          <span className="text-[#c4c6cf]">&gt;</span>
          <span className="text-black">Novo Orçamento</span>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-['Inter'] font-bold text-3xl text-black tracking-tight">
              Novo Orçamento
            </h1>
            <p className="text-[#44474e] text-sm mt-1">
              Preencha os dados abaixo para gerar uma estimativa técnica preliminar.
            </p>
          </div>
          <div className="bg-[rgba(185,246,29,0.1)] border border-[rgba(185,246,29,0.2)] px-4 py-1.5 rounded-full text-xs font-bold text-[#4b6700] tracking-wide">
            Modo: Completo
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Side: Form */}
        <form onSubmit={(e) => handleSubmit(e)} className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: Informações da Obra */}
          <div className="bg-white border border-[#c4c6cf]/30 rounded-[12px] p-6 shadow-xs relative overflow-hidden">
            <div className="absolute bg-[#b9f61d] left-0 top-0 bottom-0 w-[4px]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#f1f4f6] rounded-lg text-[#001b3d]">
                <FileText size={20} weight="bold" />
              </div>
              <h2 className="font-['Inter'] font-semibold text-lg text-black">
                Informações da Obra
              </h2>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Nome do Orçamento / Projeto *
                </label>
                <input 
                  type="text" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Orçamento Inicial - Edifício Horizonte"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                  required
                />
              </div>

              <div className="col-span-12 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Endereço Completo
                </label>
                <input 
                  type="text" 
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Tipo de Construção
                </label>
                <select 
                  value={tipoConstrucao}
                  onChange={(e) => setTipoConstrucao(e.target.value)}
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all cursor-pointer"
                >
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Estado (UF)
                </label>
                <select 
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all cursor-pointer"
                >
                  {ESTADOS.map((est) => (
                    <option key={est.value} value={est.value}>
                      {est.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Área Total (M²)
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={areaTotal || ""}
                  onChange={(e) => setAreaTotal(Number(e.target.value))}
                  placeholder="0,00"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bases e Referências */}
          <div className="bg-white border border-[#c4c6cf]/30 rounded-[12px] p-6 shadow-xs relative overflow-hidden">
            <div className="absolute bg-[#b9f61d] left-0 top-0 bottom-0 w-[4px]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#f1f4f6] rounded-lg text-[#001b3d]">
                <Database size={20} weight="bold" />
              </div>
              <h2 className="font-['Inter'] font-semibold text-lg text-black">
                Bases e Referências
              </h2>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Bases de Referência
                </label>
                <select 
                  value={baseReferencia}
                  onChange={(e) => setBaseReferencia(e.target.value)}
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all cursor-pointer"
                >
                  <option value="SINAPI">SINAPI</option>
                  <option value="SEINFRA">SEINFRA</option>
                </select>
              </div>

              <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Desoneração (SINAPI)
                </label>
                <select 
                  value={tipoComposicao}
                  onChange={(e) => setTipoComposicao(e.target.value)}
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all cursor-pointer"
                >
                  <option value="Sem Desoneração">Com Encargos (Sem Desoneração)</option>
                  <option value="Com Desoneração">Desonerado (Com Desoneração)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Dados do Cliente */}
          <div className="bg-white border border-[#c4c6cf]/30 rounded-[12px] p-6 shadow-xs relative overflow-hidden">
            <div className="absolute bg-[#b9f61d] left-0 top-0 bottom-0 w-[4px]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#f1f4f6] rounded-lg text-[#001b3d]">
                <User size={20} weight="bold" />
              </div>
              <h2 className="font-['Inter'] font-semibold text-lg text-black">
                Dados do Cliente
              </h2>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Cliente / Proprietário *
                </label>
                <input 
                  type="text" 
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ex: João da Silva Construções LTDA"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                  required
                />
              </div>

              <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  CPF / CNPJ
                </label>
                <input 
                  type="text" 
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Telefone
                </label>
                <input 
                  type="text" 
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-12 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  E-mail
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Configurações Financeiras */}
          <div className="bg-white border border-[#c4c6cf]/30 rounded-[12px] p-6 shadow-xs relative overflow-hidden">
            <div className="absolute bg-[#b9f61d] left-0 top-0 bottom-0 w-[4px]" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#f1f4f6] rounded-lg text-[#001b3d]">
                <Coins size={20} weight="bold" />
              </div>
              <h2 className="font-['Inter'] font-semibold text-lg text-black">
                Configurações Financeiras
              </h2>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 sm:col-span-3 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  BDI Aplicado (%)
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={bdi}
                  onChange={(e) => setBdi(Number(e.target.value))}
                  placeholder="25.00"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-6 sm:col-span-3 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Margem (%)
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={margem}
                  onChange={(e) => setMargem(Number(e.target.value))}
                  placeholder="10.0"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-6 sm:col-span-3 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Prazo (Dias)
                </label>
                <input 
                  type="number" 
                  value={prazo}
                  onChange={(e) => setPrazo(Number(e.target.value))}
                  placeholder="90"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-6 sm:col-span-3 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Status Inicial
                </label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all cursor-pointer"
                >
                  <option value="em_elaboracao">Em Elaboração</option>
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Right Side: Summary Card */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#c4c6cf]/30 rounded-[12px] p-6 shadow-md relative overflow-hidden flex flex-col gap-6">
            <div className="absolute bg-[#b9f61d]/10 blur-[32px] right-[-64px] top-[-64px] rounded-full w-32 h-32" />
            
            <div className="border-b border-[#c4c6cf]/20 pb-4">
              <h3 className="font-['Hanken_Grotesk'] font-bold text-xs text-[#6f84ac] tracking-wider uppercase">
                Resumo do Orçamento
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#001b3d]/70">Custo Base (Previsto)</span>
                <span className="font-bold text-[#001b3d]">{formatCurrency(custoBase)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-[#001b3d]/70">Incidência de BDI</span>
                <span className="font-bold text-[#001b3d]">{formatCurrency(incidenciaBdi)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-[#001b3d]/70">Impostos & Taxas</span>
                <span className="font-bold text-[#001b3d]">{formatCurrency(impostosTaxas)}</span>
              </div>

              <div className="border-t border-[#c4c6cf]/20 pt-4 flex flex-col gap-1">
                <span className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#b9f61d] tracking-wider uppercase">
                  Valor Estimado Inicial
                </span>
                <div className="font-['Inter'] font-black text-3xl text-[#4b6700] tracking-tight transition-all">
                  {formatCurrency(valorEstimado)}
                </div>
              </div>
            </div>

            <div className="bg-[#f1f4f6] p-4 rounded-lg flex gap-3 text-[#6f84ac] text-xs leading-relaxed">
              <Info size={16} className="shrink-0 text-[#001b3d]/60 mt-0.5" />
              <p>
                Este valor é uma estimativa baseada nos parâmetros globais e pode variar após o detalhamento da planilha de insumos.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={(e) => handleSubmit(e)}
                disabled={loading}
                className="bg-[#b9f61d] hover:bg-[#a6de14] disabled:opacity-50 text-[#141f00] font-['Inter'] font-bold text-base py-4 rounded-[12px] transition-all flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(185,246,29,0.2)] w-full cursor-pointer"
              >
                {loading ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    Criar Orçamento
                    <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </button>

              <button 
                type="button"
                onClick={(e) => handleSubmit(e, "em_elaboracao")}
                disabled={loading}
                className="border border-[#c4c6cf] hover:bg-[#f1f4f6]/50 text-[#001b3d] font-semibold py-3.5 rounded-[12px] transition-all w-full text-sm cursor-pointer flex items-center justify-center"
              >
                Salvar como Rascunho
              </button>
            </div>
          </div>

          {/* Help Action Card */}
          <div className="bg-white border border-[#c4c6cf]/30 rounded-[12px] px-6 py-4 flex items-center justify-between shadow-xs">
            <span className="text-sm text-[#44474e]">Precisa de ajuda?</span>
            <Link 
              href="#"
              className="font-semibold text-sm text-[#4b6700] hover:underline flex items-center gap-1.5"
            >
              Ver Guia Técnico
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
