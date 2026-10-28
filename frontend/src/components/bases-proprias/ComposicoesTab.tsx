"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/common/toast";
import {
  criarComposicao,
  excluirComposicao,
  listarComposicoes,
  type ComposicaoPropria,
} from "@/lib/api/basesProprias";
import { ComposicaoEditor } from "./ComposicaoEditor";

export function ComposicoesTab({ baseId, ufPadrao }: { baseId: string; ufPadrao?: string }) {
  const { showToast } = useToast();
  const [lista, setLista] = useState<ComposicaoPropria[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("");
  const [grupo, setGrupo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        setLista(await listarComposicoes(baseId, { q: q.trim() || undefined, limite: 200 }));
      } catch (err) {
        showToast("Erro ao listar as composições", err instanceof Error ? err.message : undefined, "error");
      } finally {
        setLoading(false);
      }
    },
    [baseId, showToast],
  );

  useEffect(() => {
    carregar("");
    // carga inicial apenas; a busca é disparada pelo formulário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId]);

  const fechar = useCallback(() => setModalAberto(false), []);

  function abrirEditor(id: string) {
    setSelecionada(id);
    // No mobile o editor substitui a lista: volta ao topo para começar pelos dados da composição.
    if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 1023px)").matches) {
      window.scrollTo({ top: 0 });
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const nova = await criarComposicao(baseId, {
        codigo: codigo.trim(),
        descricao: descricao.trim(),
        unidade: unidade.trim(),
        grupo: grupo.trim() || null,
      });
      setCodigo("");
      setDescricao("");
      setUnidade("");
      setGrupo("");
      setModalAberto(false);
      showToast("Composição criada", undefined, "success");
      await carregar(busca);
      abrirEditor(nova.id);
    } catch (err) {
      showToast("Erro ao criar a composição", err instanceof Error ? err.message : undefined, "error");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(c: ComposicaoPropria) {
    if (!window.confirm(`Excluir a composição ${c.codigo} - ${c.descricao}?`)) return;
    try {
      await excluirComposicao(baseId, c.id);
      setLista((atual) => atual.filter((x) => x.id !== c.id));
      if (selecionada === c.id) setSelecionada(null);
      showToast("Composição excluída", undefined, "success");
    } catch (err) {
      showToast("Erro ao excluir a composição", err instanceof Error ? err.message : undefined, "error");
    }
  }

  return (
    // No mobile, com uma composição aberta, a lista some e o editor ocupa a tela (globals.css).
    <div className="gp-4e-comps" data-editando={selecionada ? "" : undefined}>
      <div className="gp-4e-tb">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            carregar(busca);
          }}
          className="gp-srch gp-4e-tbq"
        >
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" color="#475569" />
          <input
            type="search"
            aria-label="Buscar composições"
            placeholder="Buscar composição"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="submit" aria-label="Buscar composições" className="gp-btn gp-bs gp-sm" style={{ minHeight: 32, padding: "0 10px" }}>
            Buscar
          </button>
        </form>
        <button type="button" onClick={() => setModalAberto(true)} className="gp-btn gp-bp gp-sm gp-only-d" style={{ marginLeft: "auto" }}>
          <Plus size={16} weight="bold" aria-hidden="true" /> Nova composição
        </button>
      </div>

      {/* Mobile: "Nova composição" vira o botão flutuante; some enquanto o editor está aberto */}
      {!selecionada && (
        <button type="button" onClick={() => setModalAberto(true)} className="gp-fab gp-4e-fab">
          <Plus size={22} weight="bold" aria-hidden="true" /> Nova composição
        </button>
      )}

      <div className="gp-4e-lista" style={{ overflowX: "auto" }}>
        <table className="gp-4e-ptab gp-4e-cmp" style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
          <caption className="gp-sr">Composições da base própria</caption>
          <thead>
            <tr>
              <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Código</th>
              <th scope="col" className="gp-th">Descrição</th>
              <th scope="col" className="gp-th">Un.</th>
              <th scope="col" className="gp-th" style={{ paddingRight: 22 }}><span className="gp-sr">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => {
              const on = selecionada === c.id;
              return (
                <tr key={c.id} className="gp-row" style={on ? { background: "#F7FCE9" } : undefined}>
                  {/* gridArea só tem efeito no mobile, onde a linha vira grade (.gp-4e-ptab) */}
                  <td className="gp-td gp-mono" style={{ paddingLeft: 22, color: "#00626b", fontWeight: 600, gridArea: "cod" }}>{c.codigo}</td>
                  <th scope="row" className="gp-td" style={{ textAlign: "left", fontWeight: 700, gridArea: "desc" }}>{c.descricao}</th>
                  <td className="gp-td" style={{ gridArea: "un" }}>{c.unidade}</td>
                  <td className="gp-td" style={{ paddingRight: 22, textAlign: "right", whiteSpace: "nowrap", gridArea: "acts" }}>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`Editar ${c.codigo}`}
                      onClick={() => abrirEditor(c.id)}
                      className="gp-btn gp-bs gp-sm"
                    >
                      Editar
                    </button>{" "}
                    <button type="button" aria-label={`Excluir ${c.codigo}`} onClick={() => excluir(c)} className="gp-ib" style={{ width: 40, height: 40, color: "#B91C1C" }}>
                      <Trash size={18} weight="bold" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <p className="gp-sub" style={{ padding: 16, margin: 0 }}>Carregando composições...</p>}
        {!loading && lista.length === 0 && (
          <p className="gp-sub" style={{ padding: 24, margin: 0, textAlign: "center" }} data-testid="composicoes-vazio">
            Nenhuma composição ainda.
          </p>
        )}
      </div>

      <div className="gp-4e-edw">
        {selecionada && (
          <div className="gp-only-m">
            <button type="button" onClick={() => setSelecionada(null)} className="gp-btn gp-bs gp-4e-voltar">
              <ArrowLeft size={18} weight="bold" aria-hidden="true" /> Voltar para composições
            </button>
          </div>
        )}
        {selecionada ? (
          <ComposicaoEditor
            key={selecionada}
            baseId={baseId}
            composicaoId={selecionada}
            ufPadrao={ufPadrao}
            onAlterada={() => carregar(busca)}
          />
        ) : (
          <p className="gp-hint gp-only-d" style={{ margin: 0, textAlign: "center", padding: "12px 0" }}>
            Selecione uma composição para editar seus itens.
          </p>
        )}
      </div>

      <Modal isOpen={modalAberto} onClose={fechar} title="Nova composição">
        <form onSubmit={criar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="gp-fld">
            <label htmlFor="comp-codigo" className="gp-lb">Código</label>
            <input id="comp-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} required maxLength={50} className="gp-in gp-mono" />
          </div>
          <div className="gp-fld">
            <label htmlFor="comp-desc" className="gp-lb">Descrição</label>
            <input id="comp-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className="gp-in" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="gp-fld">
              <label htmlFor="comp-un" className="gp-lb">Unidade</label>
              <input id="comp-un" value={unidade} onChange={(e) => setUnidade(e.target.value)} required maxLength={20} className="gp-in" />
            </div>
            <div className="gp-fld">
              <label htmlFor="comp-grupo" className="gp-lb">Grupo</label>
              <input id="comp-grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} maxLength={100} className="gp-in" />
            </div>
          </div>
          <div className="gp-4e-dlgacts">
            <button type="button" onClick={fechar} className="gp-btn gp-bs">Cancelar</button>
            <button type="submit" disabled={salvando} className="gp-btn gp-bp" style={salvando ? { opacity: 0.5 } : undefined}>
              {salvando ? "Criando..." : "Criar composição"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
