"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleNotch, ArrowRight } from "@phosphor-icons/react";
import { createOrcamento, getSinapiBases, SinapiBase } from "@/lib/api/orcamentos";
import { PageHeader } from "@/components/layout/PageHeader";

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

const FONTES = ["SINAPI", "SEINFRA"];

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

  // A SEINFRA só tem preços do Ceará: a base fica disponível apenas quando o estado é CE
  const seinfraHabilitada = estado === "ce";

  const handleEstadoChange = (novoEstado: string) => {
    setEstado(novoEstado);
    if (novoEstado !== "ce") {
      if (baseReferencia === "SEINFRA") setBaseReferencia("SINAPI");
      setMesesEscolhidos((prev) => ({ ...prev, SEINFRA: [] }));
    }
  };

  // Todas as tabelas importadas, agrupadas por fonte (a fonte do orçamento vem primeiro)
  const gruposMeses = useMemo(() => {
    // SINAPI usa MM/AAAA: ordena por ano e mês, do mais recente ao mais antigo
    const chave = (m: string) => m.split("/").reverse().join("");
    const fontes = [
      baseReferencia,
      ...FONTES.filter((f) => f !== baseReferencia && (f !== "SEINFRA" || seinfraHabilitada)),
    ];
    return fontes.map((fonte) => {
      const meses = bases.filter((b) => b.fonte === fonte).map((b) => b.mes_referencia);
      return {
        fonte,
        meses: Array.from(new Set(meses)).sort((a, b) => chave(b).localeCompare(chave(a))),
      };
    });
  }, [bases, baseReferencia, seinfraHabilitada]);

  const mesesDisponiveis = gruposMeses[0].meses;

  // Sem escolha explícita, pré-marca só o mês mais recente da fonte do orçamento
  const selecionadosDe = (fonte: string, meses: string[]) =>
    mesesEscolhidos[fonte] ?? (fonte === baseReferencia ? meses.slice(0, 1) : []);

  const mesesSelecionados = gruposMeses.flatMap((g) => selecionadosDe(g.fonte, g.meses));

  const toggleMes = (fonte: string, mes: string) => {
    const grupo = gruposMeses.find((g) => g.fonte === fonte);
    setMesesEscolhidos((prev) => {
      const atual = prev[fonte] ?? selecionadosDe(fonte, grupo?.meses ?? []);
      return {
        ...prev,
        [fonte]: atual.includes(mes) ? atual.filter((m) => m !== mes) : [...atual, mes],
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

  const legend = (n: number, titulo: string) => (
    <legend style={{ float: "left", width: "100%", padding: 0, marginBottom: 4, gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 800 }}>
      <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 10, background: "#001b3d", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{n}</span>
      {titulo}
    </legend>
  );
  const fieldset: React.CSSProperties = { margin: 0, padding: 24, border: 0, minWidth: 0 };
  const req = <span className="gp-req"> (obrigatório)</span>;

  return (
    <>
      <PageHeader
        back="/orcamentos"
        backLabel="Voltar para orçamentos"
        crumb={<><Link href="/orcamentos">Orçamentos</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>Novo orçamento</span></>}
        title="Novo orçamento"
        subtitle={<>Campos com <span className="gp-req" style={{ fontWeight: 700 }}>(obrigatório)</span> precisam ser preenchidos para criar.</>}
      />

      {error && (
        <div role="alert" style={{ padding: "12px 16px", borderRadius: 14, background: "#FEE2E2", color: "#B91C1C", fontSize: 14, fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div className="gp-split" style={{ gap: 24 }}>
        <form onSubmit={(e) => handleSubmit(e)} className="gp-main" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <fieldset className="gp-card" style={{ ...fieldset, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 16 }}>
            {legend(1, "Obra")}
            <div className="gp-fld" style={{ gridColumn: "span 4" }}>
              <label htmlFor="n-nome" className="gp-lb">Nome do orçamento{req}</label>
              <input id="n-nome" className="gp-in" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Residencial Vila Verde — etapa 1" required aria-required="true" />
            </div>
            <div className="gp-fld" style={{ gridColumn: "span 2" }}>
              <label htmlFor="n-tipo" className="gp-lb">Tipo de construção</label>
              <select id="n-tipo" className="gp-in" value={tipoConstrucao} onChange={(e) => setTipoConstrucao(e.target.value)}>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Infraestrutura">Infraestrutura</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="gp-fld" style={{ gridColumn: "span 3" }}>
              <label htmlFor="n-end" className="gp-lb">Endereço da obra</label>
              <input id="n-end" className="gp-in" type="text" autoComplete="street-address" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>
            <div className="gp-fld" style={{ gridColumn: "span 2" }}>
              <label htmlFor="n-uf" className="gp-lb">Estado (UF)</label>
              <select id="n-uf" className="gp-in" value={estado} onChange={(e) => handleEstadoChange(e.target.value)}>
                {ESTADOS.map((est) => (
                  <option key={est.value} value={est.value}>{est.label}</option>
                ))}
              </select>
            </div>
            <div className="gp-fld" style={{ gridColumn: "span 1" }}>
              <label htmlFor="n-area" className="gp-lb">Área</label>
              <div className="gp-affix">
                <input id="n-area" type="number" step="any" inputMode="decimal" value={areaTotal || ""} onChange={(e) => setAreaTotal(Number(e.target.value))} placeholder="0" />
                <span>m²</span>
              </div>
            </div>
          </fieldset>

          <fieldset className="gp-card" style={{ ...fieldset, display: "flex", flexDirection: "column", gap: 16 }}>
            {legend(2, "Bases e referência")}
            <div className="gp-grid">
              <div className="gp-fld">
                <label htmlFor="n-base" className="gp-lb">Base de referência</label>
                <select id="n-base" className="gp-in" value={baseReferencia} onChange={(e) => setBaseReferencia(e.target.value)}>
                  <option value="SINAPI">SINAPI</option>
                  <option value="SEINFRA" disabled={!seinfraHabilitada}>
                    {seinfraHabilitada ? "SEINFRA" : "SEINFRA (disponível apenas para CE)"}
                  </option>
                </select>
              </div>
              <div className="gp-fld">
                <label htmlFor="n-des" className="gp-lb">Desoneração (SINAPI)</label>
                <select id="n-des" className="gp-in" value={tipoComposicao} onChange={(e) => setTipoComposicao(e.target.value)}>
                  <option value="Sem Desoneração">Com Encargos (Sem Desoneração)</option>
                  <option value="Com Desoneração">Desonerado (Com Desoneração)</option>
                </select>
              </div>
            </div>

            <div className="gp-fld">
              <span className="gp-lb" id="n-meses">Meses de referência</span>
              {loadingBases ? (
                <p className="gp-hint" style={{ margin: 0 }}>Carregando meses disponíveis...</p>
              ) : erroBases ? (
                <p role="alert" style={{ margin: 0, fontSize: 14, color: "#B91C1C" }}>
                  Não foi possível carregar os meses de referência. Verifique se o servidor da API está ativo e configurado.
                </p>
              ) : (
                <div role="group" aria-labelledby="n-meses" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {gruposMeses.map(({ fonte, meses }) => {
                    const selecionados = selecionadosDe(fonte, meses);
                    return (
                      <div key={fonte} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                          {fonte}
                          {fonte === baseReferencia && (
                            <span className="gp-hint" style={{ marginLeft: 8, fontWeight: 600 }}>(base do orçamento)</span>
                          )}
                        </h3>
                        {meses.length === 0 ? (
                          <p className="gp-hint" style={{ margin: 0 }}>Nenhuma tabela importada para a base {fonte}.</p>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                            {meses.map((mes) => {
                              const checked = selecionados.includes(mes);
                              return (
                                <label
                                  key={mes}
                                  className="gp-mono"
                                  style={{
                                    display: "flex", alignItems: "center", gap: 10, minHeight: 48, padding: "0 14px", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#001b3d",
                                    border: checked ? "2px solid #001b3d" : "1px solid #CBD5E1",
                                    background: checked ? "#F7FCE9" : "#fff",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleMes(fonte, mes)}
                                    style={{ width: 18, height: 18, accentColor: "#001b3d", cursor: "pointer" }}
                                  />
                                  {mes}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className="gp-card" style={{ ...fieldset, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {legend(3, "Cliente e responsável")}
            <div className="gp-fld">
              <label htmlFor="n-cli" className="gp-lb">Cliente{req}</label>
              <input id="n-cli" className="gp-in" type="text" autoComplete="organization" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex.: João da Silva Construções LTDA" required aria-required="true" />
            </div>
            <div className="gp-fld">
              <label htmlFor="n-doc" className="gp-lb">CPF ou CNPJ</label>
              <input id="n-doc" className="gp-in gp-mono" type="text" inputMode="numeric" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div className="gp-fld">
              <label htmlFor="n-mail" className="gp-lb">E-mail do cliente</label>
              <input id="n-mail" className="gp-in" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" />
            </div>
            <div className="gp-fld">
              <label htmlFor="n-tel" className="gp-lb">Telefone</label>
              <input id="n-tel" className="gp-in" type="tel" autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 98888-7777" />
            </div>
            <div className="gp-fld">
              <label htmlFor="n-rt" className="gp-lb">Responsável técnico</label>
              <input id="n-rt" className="gp-in" type="text" value={responsavelTecnico} onChange={(e) => setResponsavelTecnico(e.target.value)} placeholder="Engenheiro ou arquiteto responsável" />
            </div>
            <div className="gp-fld">
              <label htmlFor="n-crea" className="gp-lb">CREA / CAU</label>
              <input id="n-crea" className="gp-in gp-mono" type="text" value={numeroConselho} onChange={(e) => setNumeroConselho(e.target.value)} placeholder="Ex.: 123456/D" />
            </div>
          </fieldset>

          <fieldset className="gp-card" style={{ ...fieldset, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {legend(4, "Financeiro")}
            <div className="gp-fld">
              <label htmlFor="n-bdi" className="gp-lb">BDI</label>
              <div className="gp-affix">
                <input id="n-bdi" type="number" step="any" inputMode="decimal" value={bdi} onChange={(e) => setBdi(Number(e.target.value))} placeholder="0.00" aria-describedby="n-bdi-h" />
                <span>%</span>
              </div>
              <span id="n-bdi-h" className="gp-hint">Detalhe o analítico depois, na planilha.</span>
            </div>
            <div className="gp-fld">
              <label htmlFor="n-mg" className="gp-lb">Margem de negociação</label>
              <div className="gp-affix">
                <span>R$</span>
                <input id="n-mg" type="number" step="any" min="0" inputMode="decimal" value={margem} onChange={(e) => setMargem(Number(e.target.value))} placeholder="0,00" />
              </div>
            </div>
          </fieldset>
        </form>

        <aside aria-labelledby="h-resumo" className="gp-side" style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <section className="gp-card gp-dark gp-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 id="h-resumo" style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Resumo</h2>
            <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <dt style={{ color: "#cbd5e1" }}>Base</dt>
                <dd style={{ margin: 0, fontWeight: 700, textAlign: "right" }}>{baseReferencia}</dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <dt style={{ color: "#cbd5e1" }}>UF / referência</dt>
                <dd style={{ margin: 0, fontWeight: 700, textAlign: "right" }}>
                  {estado.toUpperCase()}{mesesSelecionados.length > 0 ? ` · ${mesesSelecionados.join(", ")}` : ""}
                </dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <dt style={{ color: "#cbd5e1" }}>Encargos</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>{tipoComposicao}</dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <dt style={{ color: "#cbd5e1" }}>BDI</dt>
                <dd className="gp-mono" style={{ margin: 0, fontWeight: 600 }}>{Number(bdi).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</dd>
              </div>
            </dl>
            {seinfraHabilitada && (
              <p style={{ margin: 0, padding: "10px 12px", borderRadius: 12, background: "rgba(159,211,0,0.14)", color: "#d9f99d", fontSize: 13, lineHeight: 1.45 }}>
                SEINFRA liberada: a obra é no Ceará.
              </p>
            )}
            <button type="button" onClick={(e) => handleSubmit(e)} disabled={loading} className="gp-btn gp-bp" style={{ minHeight: 52, opacity: loading ? 0.6 : 1 }}>
              {loading ? (
                <>
                  <CircleNotch size={18} weight="bold" className="animate-spin" aria-hidden="true" />
                  Criando...
                </>
              ) : (
                <>
                  Criar orçamento
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "em_elaboracao")}
              disabled={loading}
              className="gp-btn"
              style={{ border: "1px solid rgba(255,255,255,0.24)", background: "transparent", color: "#fff" }}
            >
              Salvar como rascunho
            </button>
          </section>
          <Link href="#" className="gp-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 18px", borderRadius: 16, color: "#001b3d", textDecoration: "none" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Dúvidas sobre bases e BDI?</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#007a85" }}>Guia técnico</span>
          </Link>
        </aside>
      </div>
    </>
  );
}
