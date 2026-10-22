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

const campo = "border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 bg-white";

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

  if (erro) return <p className="text-red-600 text-sm">{erro}</p>;
  if (!comp) return <p className="text-sm text-slate-500">Carregando composição...</p>;

  const semPreco = preco ? preco.itens_sem_preco : 0;

  return (
    <div className="space-y-6">
      <form onSubmit={salvarCabecalho} className="space-y-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-bold text-slate-800">Composição</h3>
          <span className="font-mono text-sm text-slate-500">{comp.codigo}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_160px_auto] gap-2 items-end">
          <div>
            <label htmlFor="ed-desc" className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
            <input id="ed-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className={`${campo} w-full`} />
          </div>
          <div>
            <label htmlFor="ed-un" className="block text-xs font-medium text-slate-600 mb-1">Unidade</label>
            <input id="ed-un" value={unidade} onChange={(e) => setUnidade(e.target.value)} required className={`${campo} w-full`} />
          </div>
          <div>
            <label htmlFor="ed-grupo" className="block text-xs font-medium text-slate-600 mb-1">Grupo</label>
            <input id="ed-grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} className={`${campo} w-full`} />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-bold rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            Salvar dados
          </button>
        </div>
      </form>

      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="pr-uf" className="block text-xs font-medium text-slate-600 mb-1">UF</label>
          <select id="pr-uf" value={uf} onChange={(e) => setUf(e.target.value)} className={campo}>
            {UFS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pr-mes" className="block text-xs font-medium text-slate-600 mb-1">Mês de referência</label>
          <input
            id="pr-mes"
            list="pr-meses"
            placeholder="MM/AAAA"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className={`${campo} w-32`}
          />
          <datalist id="pr-meses">
            {meses.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="pr-tipo" className="block text-xs font-medium text-slate-600 mb-1">Desoneração</label>
          <select id="pr-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
            {TIPOS_PRECO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-slate-500">Total ({unidade})</div>
          <div className="text-xl font-bold text-slate-800" data-testid="preco-total">
            {calculando ? "Calculando..." : preco ? formatarMoeda(preco.preco_total) : "—"}
          </div>
        </div>
      </div>
      {!mes.trim() && (
        <p className="text-xs text-slate-500 -mt-3">Informe o mês de referência para calcular o preço com a UF e a desoneração escolhidas.</p>
      )}
      {semPreco > 0 && (
        <p className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2" role="alert">
          <Warning size={16} />
          {semPreco} {semPreco === 1 ? "item sem preço" : "itens sem preço"} para {uf} em {preco?.mes}. O total os considera como zero.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 pr-3">Referência</th>
              <th className="py-2 pr-3">Descrição</th>
              <th className="py-2 pr-3">Un.</th>
              <th className="py-2 pr-3 w-28">Coef.</th>
              <th className="py-2 pr-3 text-right">Preço unit.</th>
              <th className="py-2 pr-3 text-right">Subtotal</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {comp.itens.map((i) => {
              const p = precoPorRef.get(chaveRef(i));
              const semPrecoItem = preco !== null && (!p || !p.encontrado || p.preco_unitario == null);
              return (
                <tr key={i.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3">
                    <span className="font-mono text-xs">{i.ref_codigo}</span>
                    <span className="block text-[10px] text-slate-400">
                      {i.ref_fonte} · {i.ref_tipo === "INSUMO" ? "Insumo" : "Composição"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{p?.descricao ?? "—"}</td>
                  <td className="py-2 pr-3">{p?.unidade ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <input
                      aria-label={`Coeficiente de ${i.ref_codigo}`}
                      defaultValue={String(i.coeficiente)}
                      inputMode="decimal"
                      onBlur={(e) => mudarCoeficiente(i.id, e.target.value, i.coeficiente)}
                      className={`${campo} w-24 py-1`}
                    />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {semPrecoItem ? (
                      <span className="text-amber-700 font-medium">Sem preço</span>
                    ) : (
                      formatarMoeda(p?.preco_unitario)
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right">{p && !semPrecoItem ? formatarMoeda(p.subtotal) : "—"}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      aria-label={`Remover ${i.ref_codigo}`}
                      onClick={() => remover(i.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {comp.itens.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">Esta composição ainda não tem itens.</p>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h4 className="text-sm font-bold text-slate-700">Adicionar item</h4>
        <BuscaReferencia baseId={baseId} composicaoId={composicaoId} onEscolher={setEscolhida} />
        {escolhida && (
          <div className="flex flex-wrap items-end gap-2 bg-slate-50 border border-slate-200 rounded p-3">
            <div className="flex-1 min-w-[200px] text-sm">
              <span className="font-mono text-xs text-slate-500 mr-2">{escolhida.ref_codigo}</span>
              {escolhida.descricao}
              <span className="block text-[10px] text-slate-400">
                {escolhida.ref_fonte} · {escolhida.ref_tipo === "INSUMO" ? "Insumo" : "Composição"} · {escolhida.unidade}
              </span>
            </div>
            <div>
              <label htmlFor="novo-coef" className="block text-xs font-medium text-slate-600 mb-1">Coeficiente</label>
              <input id="novo-coef" value={coefNovo} onChange={(e) => setCoefNovo(e.target.value)} inputMode="decimal" className={`${campo} w-28`} />
            </div>
            <button
              type="button"
              onClick={adicionar}
              className="px-4 py-2 text-sm font-bold text-white bg-brand-primary rounded hover:bg-brand-navy"
            >
              Adicionar à composição
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
