"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadSimple, MagnifyingGlass, PencilSimple, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/common/toast";
import {
  atualizarInsumo,
  baixarModeloImportacao,
  criarInsumo,
  excluirInsumo,
  importarPlanilha,
  listarInsumos,
  TIPOS_INSUMO,
  type InsumoProprio,
  type TipoInsumo,
} from "@/lib/api/basesProprias";
import { formatarMoeda, lerNumero, rotuloTipoInsumo } from "@/lib/basesPropriasUtils";

const campo = "w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 bg-white";

interface FormInsumo {
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: TipoInsumo;
  preco: string;
}

const FORM_VAZIO: FormInsumo = { codigo: "", descricao: "", unidade: "", tipo: "MATERIAL", preco: "0" };

export function InsumosTab({ baseId }: { baseId: string }) {
  const { showToast } = useToast();
  const [insumos, setInsumos] = useState<InsumoProprio[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<InsumoProprio | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormInsumo>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        setInsumos(await listarInsumos(baseId, { q: q.trim() || undefined, limite: 200 }));
      } catch (err) {
        showToast("Erro ao listar os insumos", err instanceof Error ? err.message : undefined, "error");
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

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(i: InsumoProprio) {
    setEditando(i);
    setForm({ codigo: i.codigo, descricao: i.descricao, unidade: i.unidade, tipo: i.tipo, preco: String(i.preco) });
    setModalAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const preco = lerNumero(form.preco);
    if (Number.isNaN(preco) || preco < 0) {
      showToast("Preço inválido", "Informe um valor maior ou igual a zero.", "warning");
      return;
    }
    setSalvando(true);
    try {
      if (editando) {
        await atualizarInsumo(baseId, editando.id, {
          descricao: form.descricao.trim(),
          unidade: form.unidade.trim(),
          tipo: form.tipo,
          preco,
        });
        showToast("Insumo atualizado", undefined, "success");
      } else {
        await criarInsumo(baseId, {
          codigo: form.codigo.trim(),
          descricao: form.descricao.trim(),
          unidade: form.unidade.trim(),
          tipo: form.tipo,
          preco,
        });
        showToast("Insumo criado", undefined, "success");
      }
      setModalAberto(false);
      await carregar(busca);
    } catch (err) {
      showToast("Erro ao salvar o insumo", err instanceof Error ? err.message : undefined, "error");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(i: InsumoProprio) {
    if (!window.confirm(`Excluir o insumo ${i.codigo} - ${i.descricao}?`)) return;
    try {
      await excluirInsumo(baseId, i.id);
      setInsumos((atual) => atual.filter((x) => x.id !== i.id));
      showToast("Insumo excluído", undefined, "success");
    } catch (err) {
      showToast("Erro ao excluir o insumo", err instanceof Error ? err.message : undefined, "error");
    }
  }

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    if (!arquivo.name.toLowerCase().endsWith(".xlsx")) {
      showToast("Arquivo inválido", "Envie uma planilha .xlsx.", "warning");
      return;
    }
    setImportando(true);
    try {
      const r = await importarPlanilha(baseId, arquivo);
      showToast(
        "Planilha importada",
        `${r.insumos_importados} insumos, ${r.composicoes_importadas} composições, ${r.itens_importados} itens.`,
        "success",
      );
      await carregar(busca);
    } catch (err) {
      showToast("Erro ao importar", err instanceof Error ? err.message : undefined, "error");
    } finally {
      setImportando(false);
    }
  }

  async function baixarModelo() {
    try {
      const blob = await baixarModeloImportacao();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modelo_base_propria.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast("Erro ao baixar o modelo", err instanceof Error ? err.message : undefined, "error");
    }
  }

  const set = (k: keyof FormInsumo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            carregar(busca);
          }}
          className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md"
        >
          <input
            aria-label="Buscar insumos"
            placeholder="Buscar por código ou descrição"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={campo}
          />
          <button type="submit" aria-label="Buscar" className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">
            <MagnifyingGlass size={18} />
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={baixarModelo}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <DownloadSimple size={16} /> Baixar modelo
          </button>
          <button
            type="button"
            disabled={importando}
            onClick={() => arquivoRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <UploadSimple size={16} /> {importando ? "Importando..." : "Importar .xlsx"}
          </button>
          <input
            ref={arquivoRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            data-testid="input-importar"
            onChange={importar}
          />
          <button
            type="button"
            onClick={abrirNovo}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded bg-brand-primary text-white hover:bg-brand-navy"
          >
            <Plus size={16} weight="bold" /> Novo insumo
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 pr-3">Código</th>
              <th className="py-2 pr-3">Descrição</th>
              <th className="py-2 pr-3">Un.</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3 text-right">Preço</th>
              <th className="py-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {insumos.map((i) => (
              <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 pr-3 font-mono text-xs">{i.codigo}</td>
                <td className="py-2 pr-3">{i.descricao}</td>
                <td className="py-2 pr-3">{i.unidade}</td>
                <td className="py-2 pr-3">{rotuloTipoInsumo(i.tipo)}</td>
                <td className="py-2 pr-3 text-right">{formatarMoeda(i.preco)}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    aria-label={`Editar ${i.codigo}`}
                    onClick={() => abrirEdicao(i)}
                    className="p-1 text-slate-500 hover:text-brand-primary"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${i.codigo}`}
                    onClick={() => excluir(i)}
                    className="p-1 text-slate-500 hover:text-red-600"
                  >
                    <Trash size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="text-sm text-slate-500 py-4">Carregando insumos...</p>}
        {!loading && insumos.length === 0 && (
          <p className="text-sm text-slate-500 py-6 text-center" data-testid="insumos-vazio">
            Nenhum insumo encontrado. Crie um ou importe uma planilha.
          </p>
        )}
      </div>

      <Modal isOpen={modalAberto} onClose={fechar} title={editando ? "Editar insumo" : "Novo insumo"}>
        <form onSubmit={salvar} className="space-y-3">
          <div>
            <label htmlFor="ins-codigo" className="block text-sm font-medium text-slate-700 mb-1">Código</label>
            <input id="ins-codigo" value={form.codigo} onChange={set("codigo")} required maxLength={50} disabled={!!editando} className={campo} />
          </div>
          <div>
            <label htmlFor="ins-desc" className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input id="ins-desc" value={form.descricao} onChange={set("descricao")} required className={campo} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ins-un" className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
              <input id="ins-un" value={form.unidade} onChange={set("unidade")} required maxLength={20} className={campo} />
            </div>
            <div>
              <label htmlFor="ins-tipo" className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select id="ins-tipo" value={form.tipo} onChange={set("tipo")} className={campo}>
                {TIPOS_INSUMO.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.rotulo}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="ins-preco" className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
            <input id="ins-preco" value={form.preco} onChange={set("preco")} inputMode="decimal" className={campo} />
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
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
