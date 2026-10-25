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
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            carregar(busca);
          }}
          className="gp-srch"
          style={{ flex: "1 1 240px", maxWidth: 360 }}
        >
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" color="#475569" />
          <input
            type="search"
            aria-label="Buscar insumos"
            placeholder="Buscar por código ou descrição"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="submit" aria-label="Buscar" className="gp-btn gp-bs gp-sm" style={{ minHeight: 32, padding: "0 10px" }}>
            Buscar
          </button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginLeft: "auto" }}>
          <button type="button" onClick={baixarModelo} className="gp-btn gp-bs gp-sm">
            <DownloadSimple size={16} weight="bold" aria-hidden="true" /> Baixar modelo
          </button>
          <button
            type="button"
            disabled={importando}
            onClick={() => arquivoRef.current?.click()}
            className="gp-btn gp-bd gp-sm"
            style={importando ? { opacity: 0.5 } : undefined}
          >
            <UploadSimple size={16} weight="bold" aria-hidden="true" /> {importando ? "Importando..." : "Importar .xlsx"}
          </button>
          <input ref={arquivoRef} type="file" accept=".xlsx" className="gp-sr" tabIndex={-1} aria-hidden="true" data-testid="input-importar" onChange={importar} />
          <button type="button" onClick={abrirNovo} className="gp-btn gp-bp gp-sm">
            <Plus size={16} weight="bold" aria-hidden="true" /> Novo insumo
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
          <caption className="gp-sr">Insumos da base própria</caption>
          <thead>
            <tr>
              <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Código</th>
              <th scope="col" className="gp-th">Descrição</th>
              <th scope="col" className="gp-th">Un.</th>
              <th scope="col" className="gp-th">Tipo</th>
              <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Preço</th>
              <th scope="col" className="gp-th" style={{ paddingRight: 22 }}><span className="gp-sr">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((i) => (
              <tr key={i.id} className="gp-row">
                <td className="gp-td gp-mono" style={{ paddingLeft: 22, color: "#00626b", fontWeight: 600 }}>{i.codigo}</td>
                <th scope="row" className="gp-td" style={{ textAlign: "left", fontWeight: 700 }}>{i.descricao}</th>
                <td className="gp-td">{i.unidade}</td>
                <td className="gp-td" style={{ color: "#475569" }}>{rotuloTipoInsumo(i.tipo)}</td>
                <td className="gp-td gp-mono" style={{ textAlign: "right", fontWeight: 600 }}>{formatarMoeda(i.preco)}</td>
                <td className="gp-td" style={{ paddingRight: 22, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button type="button" aria-label={`Editar ${i.codigo}`} onClick={() => abrirEdicao(i)} className="gp-ib" style={{ width: 40, height: 40 }}>
                    <PencilSimple size={18} weight="bold" aria-hidden="true" />
                  </button>{" "}
                  <button type="button" aria-label={`Excluir ${i.codigo}`} onClick={() => excluir(i)} className="gp-ib" style={{ width: 40, height: 40, color: "#B91C1C" }}>
                    <Trash size={18} weight="bold" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="gp-sub" style={{ padding: 16, margin: 0 }}>Carregando insumos...</p>}
        {!loading && insumos.length === 0 && (
          <p className="gp-sub" style={{ padding: 24, margin: 0, textAlign: "center" }} data-testid="insumos-vazio">
            Nenhum insumo encontrado. Crie um ou importe uma planilha.
          </p>
        )}
      </div>

      <Modal isOpen={modalAberto} onClose={fechar} title={editando ? "Editar insumo" : "Novo insumo"}>
        <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="gp-fld">
            <label htmlFor="ins-codigo" className="gp-lb">Código</label>
            <input id="ins-codigo" value={form.codigo} onChange={set("codigo")} required maxLength={50} disabled={!!editando} className="gp-in gp-mono" />
          </div>
          <div className="gp-fld">
            <label htmlFor="ins-desc" className="gp-lb">Descrição</label>
            <input id="ins-desc" value={form.descricao} onChange={set("descricao")} required className="gp-in" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="gp-fld">
              <label htmlFor="ins-un" className="gp-lb">Unidade</label>
              <input id="ins-un" value={form.unidade} onChange={set("unidade")} required maxLength={20} className="gp-in" />
            </div>
            <div className="gp-fld">
              <label htmlFor="ins-tipo" className="gp-lb">Tipo</label>
              <select id="ins-tipo" value={form.tipo} onChange={set("tipo")} className="gp-in">
                {TIPOS_INSUMO.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.rotulo}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="gp-fld">
            <label htmlFor="ins-preco" className="gp-lb">Preço (R$)</label>
            <input id="ins-preco" value={form.preco} onChange={set("preco")} inputMode="decimal" className="gp-in gp-mono" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={fechar} className="gp-btn gp-bs">Cancelar</button>
            <button type="submit" disabled={salvando} className="gp-btn gp-bp" style={salvando ? { opacity: 0.5 } : undefined}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
