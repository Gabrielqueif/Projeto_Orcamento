"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/common/toast";
import { criarBase, listarBases, type BasePropria } from "@/lib/api/basesProprias";
import { UFS } from "@/lib/basesPropriasUtils";

const campo = "w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 bg-white";

export function MinhasBases() {
  const { showToast } = useToast();
  const [bases, setBases] = useState<BasePropria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [uf, setUf] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setBases(await listarBases());
      setErro(null);
    } catch {
      setErro("Não foi possível carregar suas bases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fechar = useCallback(() => setModalAberto(false), []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const criada = await criarBase({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        uf: uf || null,
      });
      setBases((atual) => [...atual, criada]);
      setNome("");
      setDescricao("");
      setUf("");
      setModalAberto(false);
      showToast("Base criada", criada.nome, "success");
    } catch (err) {
      showToast("Erro ao criar a base", err instanceof Error ? err.message : undefined, "error");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="minhas-bases-titulo">
      <div className="flex items-center justify-between gap-4">
        <h2 id="minhas-bases-titulo" className="text-xl font-bold text-slate-800">
          Minhas bases
        </h2>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-brand-navy transition"
        >
          <Plus size={16} weight="bold" /> Nova base
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Carregando suas bases...</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {!loading && !erro && bases.length === 0 && (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-6 text-center" data-testid="minhas-bases-vazio">
          <p className="text-slate-700 font-medium">Você ainda não tem bases próprias.</p>
          <p className="text-sm text-slate-500 mt-1">
            Crie uma base para cadastrar insumos e composições com preços seus.
          </p>
        </div>
      )}

      {bases.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bases.map((b) => (
            <li key={b.id}>
              <Link
                href={`/bases/propria/${b.id}`}
                className="block bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow h-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800">{b.nome}</h3>
                  {b.uf && (
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-600 rounded px-2 py-0.5">{b.uf}</span>
                  )}
                </div>
                {b.descricao && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{b.descricao}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={modalAberto} onClose={fechar} title="Nova base">
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label htmlFor="base-nome" className="block text-sm font-medium text-slate-700 mb-1">
              Nome
            </label>
            <input
              id="base-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={150}
              required
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="base-descricao" className="block text-sm font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <textarea
              id="base-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="base-uf" className="block text-sm font-medium text-slate-700 mb-1">
              UF
            </label>
            <select id="base-uf" value={uf} onChange={(e) => setUf(e.target.value)} className={campo}>
              <option value="">Não informada</option>
              {UFS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={fechar} className="px-4 py-2 text-sm text-slate-600 rounded hover:bg-slate-100">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !nome.trim()}
              className="px-4 py-2 text-sm font-bold text-white bg-brand-primary rounded hover:bg-brand-navy disabled:opacity-50"
            >
              {salvando ? "Criando..." : "Criar base"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
