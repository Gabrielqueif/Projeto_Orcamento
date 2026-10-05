"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Database, 
  User, 
  Coins,
  CircleNotch,
  ArrowRight
} from "@phosphor-icons/react";
import { createOrcamento, getSinapiBases, SinapiBase } from "@/lib/api/orcamentos";

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
  const [responsavelTecnico, setResponsavelTecnico] = useState("");
  const [numeroConselho, setNumeroConselho] = useState("");
  const [bdi, setBdi] = useState<number>(0);
  const [margem, setMargem] = useState<number>(0);

  // Meses de referência disponíveis na base de dados
  const [bases, setBases] = useState<SinapiBase[]>([]);
  const [mesesEscolhidos, setMesesEscolhidos] = useState<Record<string, string[]>>({});
  const [loadingBases, setLoadingBases] = useState(true);
  const [erroBases, setErroBases] = useState(false);

  useEffect(() => {
    getSinapiBases()
      .then(setBases)
      .catch((err) => {
        console.error(err);
        setErroBases(true);
      })
      .finally(() => setLoadingBases(false));
  }, []);

  const mesesDisponiveis = useMemo(() => {
    const meses = bases
      .filter((b) => b.fonte === baseReferencia)
      .map((b) => b.mes_referencia);
    // mes_referencia vem como MM/AAAA: ordena por ano e mês, do mais recente ao mais antigo
    const chave = (m: string) => m.split("/").reverse().join("");
    return Array.from(new Set(meses)).sort((a, b) => chave(b).localeCompare(chave(a)));
  }, [bases, baseReferencia]);

  // Sem escolha explícita para a fonte, pré-marca o mês mais recente
  const mesesSelecionados = mesesEscolhidos[baseReferencia] ?? mesesDisponiveis.slice(0, 1);

  const toggleMes = (mes: string) => {
    setMesesEscolhidos((prev) => {
      const atual = prev[baseReferencia] ?? mesesDisponiveis.slice(0, 1);
      return {
        ...prev,
        [baseReferencia]: atual.includes(mes) ? atual.filter((m) => m !== mes) : [...atual, mes],
      };
    });
  };

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

    if (mesesDisponiveis.length > 0 && mesesSelecionados.length === 0) {
      setError("Selecione ao menos um mês de referência.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const activeStatus = statusOverride || "em_elaboracao";

      const orcamentoData = {
        nome,
        cliente,
        data: new Date().toISOString().split("T")[0],
        base_referencia: mesesSelecionados.join(",") || baseReferencia,
        tipo_composicao: tipoComposicao,
        estado: estado.toUpperCase(),
        fonte: baseReferencia,
        tipo_bdi: "SINTETICO" as const,
        bdi: Number(bdi),
        margem_valor: Number(margem),
        responsavel_tecnico: responsavelTecnico || undefined,
        numero_conselho: numeroConselho || undefined,
        status: activeStatus,
        variaveis_globais: [],
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

          <div className="flex flex-col gap-1">
            <h1 className="font-['Inter'] font-bold text-3xl text-black tracking-tight">
              Novo Orçamento
            </h1>
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

              <div className="col-span-12 flex flex-col gap-2">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Meses de Referência
                </label>
                {loadingBases ? (
                  <p className="text-sm text-[#44474e]">Carregando meses disponíveis...</p>
                ) : erroBases ? (
                  <p className="text-sm text-red-600">
                    Não foi possível carregar os meses de referência. Verifique se o servidor da API está ativo e configurado.
                  </p>
                ) : mesesDisponiveis.length === 0 ? (
                  <p className="text-sm text-[#44474e]">
                    Nenhum mês importado para a base {baseReferencia}.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mesesDisponiveis.map((mes) => {
                      const checked = mesesSelecionados.includes(mes);
                      return (
                        <label
                          key={mes}
                          className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border text-sm cursor-pointer transition-all ${
                            checked
                              ? "border-[#b9f61d] bg-[#b9f61d]/10 text-black"
                              : "border-[#c4c6cf]/40 bg-[#f1f4f6] text-[#44474e]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMes(mes)}
                            className="accent-[#4b6700] cursor-pointer"
                          />
                          {mes}
                        </label>
                      );
                    })}
                  </div>
                )}
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

              <div className="col-span-12 sm:col-span-8 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Responsável Técnico
                </label>
                <input
                  type="text"
                  value={responsavelTecnico}
                  onChange={(e) => setResponsavelTecnico(e.target.value)}
                  placeholder="Nome do engenheiro / arquiteto responsável"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-12 sm:col-span-4 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Nº do Conselho (CREA/CAU)
                </label>
                <input
                  type="text"
                  value={numeroConselho}
                  onChange={(e) => setNumeroConselho(e.target.value)}
                  placeholder="Ex: 123456/D"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
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
                  placeholder="0.00"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>

              <div className="col-span-6 sm:col-span-3 flex flex-col gap-1.5">
                <label className="font-['Hanken_Grotesk'] font-bold text-[10px] text-[#44474e] tracking-wider uppercase">
                  Margem (R$)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={margem}
                  onChange={(e) => setMargem(Number(e.target.value))}
                  placeholder="0,00"
                  className="bg-[#f1f4f6] border border-[#c4c6cf]/40 rounded-[8px] px-4 py-2.5 outline-none focus:border-[#b9f61d] focus:ring-1 focus:ring-[#b9f61d] text-sm transition-all"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Right Side: Ações */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#c4c6cf]/30 rounded-[12px] p-6 shadow-md flex flex-col gap-3">
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
