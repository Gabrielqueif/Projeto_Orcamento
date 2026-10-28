"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash, Warning } from "@phosphor-icons/react";
import { useToast } from "@/components/common/toast";
import {
  adicionarItem,
  atualizarComposicao,
  atualizarItem,
  calcularPrecoComposicao,
  obterComposicao,
  removerItem,
  type ComposicaoDetalhe,
  type ItemPreco,
  type PrecoComposicao,
} from "@/lib/api/basesProprias";
import { getSinapiBases } from "@/lib/api/orcamentos";
import { chaveRef, formatarMoeda, lerNumero, TIPOS_PRECO, UFS } from "@/lib/basesPropriasUtils";
import { BuscaReferencia, type ReferenciaEscolhida } from "./BuscaReferencia";

export function ComposicaoEditor({
  baseId,
  composicaoId,
  ufPadrao,
  onAlterada,
}: {
  baseId: string;
  composicaoId: string;
  ufPadrao?: string;
  onAlterada: () => void;
}) {
  const { showToast } = useToast();
  const [comp, setComp] = useState<ComposicaoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("");
  const [grupo, setGrupo] = useState("");

  const [escolhida, setEscolhida] = useState<ReferenciaEscolhida | null>(null);
  const [coefNovo, setCoefNovo] = useState("1");

  const [uf, setUf] = useState(ufPadrao && UFS.includes(ufPadrao) ? ufPadrao : "CE");
  const [mes, setMes] = useState("");
  const [tipo, setTipo] = useState(TIPOS_PRECO[0]);
  const [meses, setMeses] = useState<string[]>([]);
  const [preco, setPreco] = useState<PrecoComposicao | null>(null);
  const [calculando, setCalculando] = useState(false);

  const aplicar = useCallback((c: ComposicaoDetalhe) => {
    setComp(c);
    setDescricao(c.descricao);
    setUnidade(c.unidade);
    setGrupo(c.grupo ?? "");
  }, []);

  useEffect(() => {
    obterComposicao(baseId, composicaoId)
      .then(aplicar)
      .catch(() => setErro("Não foi possível carregar a composição."));
  }, [baseId, composicaoId, aplicar]);

  useEffect(() => {
    getSinapiBases()
      .then((bases) => setMeses(Array.from(new Set(bases.map((b) => b.mes_referencia)))))
      .catch(() => setMeses([]));
  }, []);

  const recarregar = useCallback(async () => {
    aplicar(await obterComposicao(baseId, composicaoId));
  }, [baseId, composicaoId, aplicar]);

  // Recalcula o preço sempre que os itens ou o contexto (UF/mês/tipo) mudam.
  const assinaturaItens = comp?.itens.map((i) => `${i.id}:${i.coeficiente}:${chaveRef(i)}`).join(",") ?? "";
  useEffect(() => {
    if (!comp || !mes.trim()) {
      setPreco(null);
      return;
    }
    let cancelado = false;
    setCalculando(true);
    calcularPrecoComposicao(baseId, composicaoId, uf, mes.trim(), tipo)
      .then((p) => !cancelado && setPreco(p))
      .catch((err) => {
        if (cancelado) return;
        setPreco(null);
        showToast("Erro ao calcular o preço", err instanceof Error ? err.message : undefined, "error");
      })
      .finally(() => !cancelado && setCalculando(false));
    return () => {
      cancelado = true;
    };
    // comp?.id e assinaturaItens cobrem as mudanças relevantes de comp
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, composicaoId, uf, mes, tipo, assinaturaItens]);

  const precoPorRef = useMemo(() => {
    const m = new Map<string, ItemPreco>();
    preco?.itens.forEach((i) => m.set(chaveRef(i), i));
    return m;
  }, [preco]);

  function falha(titulo: string, err: unknown) {
    showToast(titulo, err instanceof Error ? err.message : undefined, "error");
  }

  async function salvarCabecalho(e: React.FormEvent) {
    e.preventDefault();
    try {
      await atualizarComposicao(baseId, composicaoId, {
        descricao: descricao.trim(),
        unidade: unidade.trim(),
        grupo: grupo.trim() || null,
      });
      showToast("Composição atualizada", undefined, "success");
      onAlterada();
    } catch (err) {
      falha("Erro ao atualizar a composição", err);
    }
  }

  async function adicionar() {
    if (!escolhida) return;
    const coeficiente = lerNumero(coefNovo);
    if (Number.isNaN(coeficiente) || coeficiente <= 0) {
      showToast("Coeficiente inválido", "Informe um número maior que zero.", "warning");
      return;
    }
    try {
      await adicionarItem(baseId, composicaoId, {
        ref_fonte: escolhida.ref_fonte,
        ref_tipo: escolhida.ref_tipo,
        ref_codigo: escolhida.ref_codigo,
        coeficiente,
      });
      setEscolhida(null);
      setCoefNovo("1");
      await recarregar();
    } catch (err) {
      falha("Erro ao adicionar o item", err);
    }
  }

  async function mudarCoeficiente(itemId: string, texto: string, atual: number) {
    const coeficiente = lerNumero(texto);
    if (Number.isNaN(coeficiente) || coeficiente <= 0) {
      showToast("Coeficiente inválido", "Informe um número maior que zero.", "warning");
      await recarregar();
      return;
    }
    if (coeficiente === atual) return;
    try {
      await atualizarItem(baseId, composicaoId, itemId, { coeficiente });
      await recarregar();
    } catch (err) {
      falha("Erro ao atualizar o item", err);
      await recarregar();
    }
  }

  async function remover(itemId: string) {
    try {
      await removerItem(baseId, composicaoId, itemId);
      await recarregar();
    } catch (err) {
      falha("Erro ao remover o item", err);
    }
  }

  if (erro) return <p style={{ margin: 0, color: "#B91C1C" }}>{erro}</p>;
  if (!comp) return <p className="gp-sub" style={{ margin: 0 }}>Carregando composição...</p>;

  const semPreco = preco ? preco.itens_sem_preco : 0;

  return (
    <div className="gp-split">
      <div className="gp-main" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <form onSubmit={salvarCabecalho} aria-label="Dados da composição" className="gp-card gp-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 className="gp-h2">
            Editar composição <span className="gp-mono" style={{ fontSize: 14, fontWeight: 600, color: "#00626b" }}>{comp.codigo}</span>
          </h2>
          <div className="gp-4e-edgrid">
            <div className="gp-fld">
              <label htmlFor="ed-desc" className="gp-lb">Descrição <span className="gp-req">(obrigatório)</span></label>
              <input id="ed-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} required aria-required="true" className="gp-in" />
            </div>
            <div className="gp-fld">
              <label htmlFor="ed-un" className="gp-lb">Unidade</label>
              <input id="ed-un" value={unidade} onChange={(e) => setUnidade(e.target.value)} required className="gp-in" />
            </div>
            <div className="gp-fld">
              <label htmlFor="ed-grupo" className="gp-lb">Grupo</label>
              <input id="ed-grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} className="gp-in" />
            </div>
          </div>
          <button type="submit" className="gp-btn gp-bs gp-4e-start">Salvar dados</button>
        </form>

        <section className="gp-card gp-pad" aria-label="Contexto de preço" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16 }}>
          <div className="gp-fld" style={{ flex: "0 1 110px" }}>
            <label htmlFor="pr-uf" className="gp-lb">UF</label>
            <select id="pr-uf" value={uf} onChange={(e) => setUf(e.target.value)} className="gp-in">
              {UFS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="gp-fld" style={{ flex: "0 1 150px" }}>
            <label htmlFor="pr-mes" className="gp-lb">Mês de referência</label>
            <input id="pr-mes" list="pr-meses" placeholder="MM/AAAA" value={mes} onChange={(e) => setMes(e.target.value)} className="gp-in gp-mono" />
            <datalist id="pr-meses">
              {meses.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div className="gp-fld" style={{ flex: "1 1 200px" }}>
            <label htmlFor="pr-tipo" className="gp-lb">Desoneração</label>
            <select id="pr-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="gp-in">
              {TIPOS_PRECO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {!mes.trim() && (
            <p className="gp-hint" style={{ margin: 0, flexBasis: "100%" }}>
              Informe o mês de referência para calcular o preço com a UF e a desoneração escolhidas.
            </p>
          )}
        </section>

        {semPreco > 0 && (
          <p className="gp-bg gp-wa" role="alert" style={{ margin: 0, whiteSpace: "normal", borderRadius: 14, padding: "10px 14px", alignItems: "flex-start" }}>
            <Warning size={16} weight="bold" aria-hidden="true" style={{ flex: "0 0 auto", marginTop: 2 }} />
            {semPreco} {semPreco === 1 ? "item sem preço" : "itens sem preço"} para {uf} em {preco?.mes}. O total os considera como zero.
          </p>
        )}

        <section className="gp-card" aria-labelledby="h-ins" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #E6EBF2" }}>
            <h2 id="h-ins" className="gp-h2">Insumos por {unidade || "unidade"}</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="gp-4e-ptab gp-4e-itens" style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}>
              <caption className="gp-sr">Itens da composição</caption>
              <thead>
                <tr>
                  <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Item</th>
                  <th scope="col" className="gp-th">Un.</th>
                  <th scope="col" className="gp-th" style={{ width: 130 }}>Coeficiente</th>
                  <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Preço unit.</th>
                  <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Subtotal</th>
                  <th scope="col" className="gp-th" style={{ paddingRight: 22 }}><span className="gp-sr">Remover</span></th>
                </tr>
              </thead>
              <tbody>
                {comp.itens.map((i) => {
                  const p = precoPorRef.get(chaveRef(i));
                  const semPrecoItem = preco !== null && (!p || !p.encontrado || p.preco_unitario == null);
                  return (
                    <tr key={i.id} className="gp-row">
                      {/* gridArea só tem efeito no mobile, onde cada item vira cartão (.gp-4e-ptab) */}
                      <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left", gridArea: "item" }}>
                        <span style={{ display: "block", fontWeight: 800 }}>{p?.descricao ?? "—"}</span>
                        <span className="gp-mono" style={{ fontSize: 12, color: "#475569", fontWeight: 400 }}>
                          {i.ref_codigo} · {i.ref_fonte} · {i.ref_tipo === "INSUMO" ? "Insumo" : "Composição"}
                        </span>
                      </th>
                      <td className="gp-td gp-4e-iun" style={{ gridArea: "un" }}>{p?.unidade ?? "—"}</td>
                      <td className="gp-td" style={{ gridArea: "coef" }}>
                        <input
                          aria-label={`Coeficiente de ${i.ref_codigo}`}
                          defaultValue={String(i.coeficiente)}
                          inputMode="decimal"
                          onBlur={(e) => mudarCoeficiente(i.id, e.target.value, i.coeficiente)}
                          className="gp-in gp-mono"
                          style={{ height: 40, width: 110 }}
                        />
                      </td>
                      <td className="gp-td gp-mono gp-4e-ipu" style={{ textAlign: "right", gridArea: "pu" }}>
                        {semPrecoItem ? <span style={{ color: "#9A3412", fontWeight: 700, fontFamily: "inherit" }}>Sem preço</span> : formatarMoeda(p?.preco_unitario)}
                      </td>
                      <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: 600, gridArea: "sub" }}>
                        {p && !semPrecoItem ? formatarMoeda(p.subtotal) : "—"}
                      </td>
                      <td className="gp-td" style={{ paddingRight: 22, textAlign: "right", gridArea: "rm" }}>
                        <button type="button" aria-label={`Remover ${i.ref_codigo}`} onClick={() => remover(i.id)} className="gp-ib" style={{ width: 40, height: 40, color: "#B91C1C" }}>
                          <Trash size={18} weight="bold" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {comp.itens.length === 0 && (
            <p className="gp-sub" style={{ padding: 20, margin: 0, textAlign: "center" }}>Esta composição ainda não tem itens.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 22px", borderTop: "1px solid #E6EBF2" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Adicionar item</h3>
            <BuscaReferencia baseId={baseId} composicaoId={composicaoId} onEscolher={setEscolhida} />
            {escolhida && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12, padding: 14, borderRadius: 14, background: "#F4F6FA" }}>
                <div style={{ flex: "1 1 200px", fontSize: 14 }}>
                  <span className="gp-mono" style={{ fontSize: 12, color: "#475569", marginRight: 8 }}>{escolhida.ref_codigo}</span>
                  {escolhida.descricao}
                  <span style={{ display: "block", fontSize: 12, color: "#475569" }}>
                    {escolhida.ref_fonte} · {escolhida.ref_tipo === "INSUMO" ? "Insumo" : "Composição"} · {escolhida.unidade}
                  </span>
                </div>
                <div className="gp-fld">
                  <label htmlFor="novo-coef" className="gp-lb">Coeficiente</label>
                  <input id="novo-coef" value={coefNovo} onChange={(e) => setCoefNovo(e.target.value)} inputMode="decimal" className="gp-in gp-mono" style={{ width: 130 }} />
                </div>
                <button type="button" onClick={adicionar} className="gp-btn gp-bp">
                  Adicionar à composição
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* No mobile vira o rodapé fixo com o custo unitário (artefato "Editar composição") */}
      <aside className="gp-card gp-pad gp-dark gp-side gp-4e-tot" aria-labelledby="h-tot" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 id="h-tot" className="gp-h2" style={{ color: "#fff" }}>Custo unitário</h2>
        <p role="status" className="gp-mono" style={{ margin: 0, fontWeight: 600 }} data-testid="preco-total">
          {calculando ? "Calculando..." : preco ? formatarMoeda(preco.preco_total) : "—"}
          <span style={{ fontFamily: "Manrope, sans-serif", fontSize: 15, color: "#cbd5e1" }}> / {unidade}</span>
        </p>
        <p className="gp-only-d" style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
          Orçamentos que usam esta composição recebem o novo custo só quando você atualizar os preços neles.
        </p>
      </aside>
    </div>
  );
}
