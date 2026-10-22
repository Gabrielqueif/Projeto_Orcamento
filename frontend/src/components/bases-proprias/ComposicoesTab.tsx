"use client";

import { useCallback, useEffect, useState } from "react";
import { MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/common/toast";
import {
  criarComposicao,
  excluirComposicao,
  listarComposicoes,
  type ComposicaoPropria,
} from "@/lib/api/basesProprias";
import { ComposicaoEditor } from "./ComposicaoEditor";

const campo = "w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 bg-white";

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
      setSelecionada(nova.id);
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
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              carregar(busca);
            }}
            className="flex items-center gap-1 flex-1"
          >
            <input
              aria-label="Buscar composições"
              placeholder="Buscar composição"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={campo}
            />
            <button type="submit" aria-label="Buscar composições" className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">
              <MagnifyingGlass size={18} />
            </button>
          </form>
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-bold rounded bg-brand-primary text-white hover:bg-brand-navy whitespace-nowrap"
          >
            <Plus size={16} weight="bold" /> Nova
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Carregando composições...</p>}
        {!loading && lista.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center" data-testid="composicoes-vazio">
            Nenhuma composição ainda.
          </p>
        )}
        <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
          {lista.map((c) => (
            <li
              key={c.id}
              className={`flex items-start gap-1 rounded border ${
                selecionada === c.id ? "border-brand-primary bg-slate-50" : "border-slate-100"
              }`}
            >
              <button type="button" onClick={() => setSelecionada(c.id)} className="flex-1 text-left p-2 min-w-0">
                <span className="block font-mono text-xs text-slate-500">{c.codigo}</span>
                <span className="block text-sm text-slate-800 truncate">{c.descricao}</span>
              </button>
              <button
                type="button"
                aria-label={`Excluir ${c.codigo}`}
                onClick={() => excluir(c)}
                className="p-2 text-slate-400 hover:text-red-600"
              >
                <Trash size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {selecionada ? (
          <ComposicaoEditor
            key={selecionada}
            baseId={baseId}
            composicaoId={selecionada}
            ufPadrao={ufPadrao}
            onAlterada={() => carregar(busca)}
          />
        ) : (
          <p className="text-sm text-slate-500 py-10 text-center">Selecione uma composição para editar seus itens.</p>
        )}
      </div>

      <Modal isOpen={modalAberto} onClose={fechar} title="Nova composição">
        <form onSubmit={criar} className="space-y-3">
          <div>
            <label htmlFor="comp-codigo" className="block text-sm font-medium text-slate-700 mb-1">Código</label>
            <input id="comp-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} required maxLength={50} className={campo} />
          </div>
          <div>
            <label htmlFor="comp-desc" className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input id="comp-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} required className={campo} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="comp-un" className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
              <input id="comp-un" value={unidade} onChange={(e) => setUnidade(e.target.value)} required maxLength={20} className={campo} />
            </div>
            <div>
              <label htmlFor="comp-grupo" className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
              <input id="comp-grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} maxLength={100} className={campo} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={fechar} className="px-4 py-2 text-sm text-slate-600 rounded hover:bg-slate-100">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 text-sm font-bold text-white bg-brand-primary rounded hover:bg-brand-navy disabled:opacity-50"
            >
              {salvando ? "Criando..." : "Criar composição"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
