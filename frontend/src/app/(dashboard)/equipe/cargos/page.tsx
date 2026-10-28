"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash, Lock, X } from "@phosphor-icons/react";
import {
  CAMPOS_BASE,
  createCargo,
  deleteCargo,
  getCargos,
  updateCargo,
  type Cargo,
  type CampoBase,
  type CampoExtra,
} from "@/lib/api/cargos";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/layout/PageHeader";

// A chave do campo vira o nome salvo nos dados do membro; gerada do rótulo.
const chaveDe = (rotulo: string) =>
  rotulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "c$1")
    .slice(0, 40);

interface Rascunho {
  id: string | null;
  nome: string;
  campos_ocultos: CampoBase[];
  campos_extras: CampoExtra[];
}

const vazio: Rascunho = { id: null, nome: "", campos_ocultos: [], campos_extras: [] };

export default function CargosPage() {
  const { showToast } = useToast();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);

  const carregar = useCallback(() => {
    getCargos()
      .then(setCargos)
      .catch(() => showToast("Erro ao carregar cargos.", undefined, "error"));
  }, [showToast]);

  useEffect(carregar, [carregar]);

  const editar = (c: Cargo, copia = false) =>
    setRascunho({
      id: copia ? null : c.id,
      nome: copia ? `${c.nome} (cópia)` : c.nome,
      campos_ocultos: c.campos_ocultos,
      campos_extras: c.campos_extras,
    });

  const alternarBase = (campo: CampoBase) =>
    setRascunho((r) =>
      r && {
        ...r,
        campos_ocultos: r.campos_ocultos.includes(campo)
          ? r.campos_ocultos.filter((c) => c !== campo)
          : [...r.campos_ocultos, campo],
      }
    );

  const mudarExtra = (i: number, parcial: Partial<CampoExtra>) =>
    setRascunho((r) =>
      r && { ...r, campos_extras: r.campos_extras.map((e, j) => (j === i ? { ...e, ...parcial } : e)) }
    );

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rascunho) return;
    const extras = rascunho.campos_extras.map((c) => ({ ...c, chave: c.chave || chaveDe(c.rotulo) }));
    if (extras.some((c) => !c.chave) || new Set(extras.map((c) => c.chave)).size !== extras.length) {
      showToast("Cada campo extra precisa de um rótulo diferente.", undefined, "warning");
      return;
    }
    const dados = { nome: rascunho.nome.trim(), campos_ocultos: rascunho.campos_ocultos, campos_extras: extras };
    try {
      if (rascunho.id) await updateCargo(rascunho.id, dados);
      else await createCargo(dados);
      setRascunho(null);
      carregar();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao salvar o cargo.", undefined, "error");
    }
  };

  const remover = async (c: Cargo) => {
    if (!window.confirm(`Excluir o cargo "${c.nome}"? Os membros mantêm o nome do cargo.`)) return;
    try {
      await deleteCargo(c.id);
      carregar();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir o cargo.", undefined, "error");
    }
  };

  const tituloForm = rascunho?.id ? "Editar cargo" : "Novo cargo";

  return (
    <>
      <PageHeader
        back="/equipe"
        backLabel="Voltar para equipe"
        crumb={<>Operação / <Link href="/equipe">Equipe</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>Cargos</span></>}
        eyebrow="Equipe"
        title="Cargos"
        subtitle="Funções da equipe e os campos pedidos no cadastro de cada uma."
        actions={
          <button type="button" onClick={() => setRascunho(vazio)} className="gp-btn gp-bp gp-only-d">
            <Plus size={16} weight="bold" aria-hidden="true" /> Novo cargo
          </button>
        }
      />

      <button type="button" onClick={() => setRascunho(vazio)} className="gp-fab gp-4d-fabb">
        <Plus size={24} weight="bold" aria-hidden="true" />
        Novo cargo
      </button>

      {/* No desktop o formulário aparece no fluxo da página; no mobile, como folha inferior */}
      {rascunho && (
        <div
          className="gp-4d-shw"
          onClick={(e) => { if (e.target === e.currentTarget) setRascunho(null); }}
          onKeyDown={(e) => { if (e.key === "Escape") setRascunho(null); }}
        >
        <form onSubmit={salvar} aria-label={tituloForm} className="gp-card gp-pad" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="gp-4d-shh gp-only-m">
            <span className="gp-4d-hdl" aria-hidden="true"></span>
            <div>
              <h2>{tituloForm}</h2>
              <button type="button" className="gp-ib" aria-label="Fechar" onClick={() => setRascunho(null)} style={{ border: 0, background: "#F4F6FA" }}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="gp-fld">
            <label htmlFor="cargo-nome" className="gp-lb">
              Nome do cargo <span className="gp-req">(obrigatório)</span>
            </label>
            <input
              id="cargo-nome"
              required
              aria-required="true"
              maxLength={100}
              value={rascunho.nome}
              onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
              className="gp-in"
            />
          </div>

          <fieldset className="gp-fld" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="gp-lb" style={{ marginBottom: 8 }}>
              Campos pedidos no cadastro (Nome e Cargo são sempre pedidos)
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {CAMPOS_BASE.map((c) => (
                <label key={c.chave} className="gp-4d-ckl" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                  <input
                    type="checkbox"
                    checked={!rascunho.campos_ocultos.includes(c.chave)}
                    onChange={() => alternarBase(c.chave)}
                    className="gp-4d-ck"
                  />
                  {c.rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="gp-fld">
            <span className="gp-lb">Campos extras deste cargo</span>
            {rascunho.campos_extras.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, alignItems: "center" }}>
                <input
                  aria-label="Rótulo do campo"
                  placeholder="Ex: Registro CREA"
                  required
                  maxLength={60}
                  value={c.rotulo}
                  onChange={(e) => mudarExtra(i, { rotulo: e.target.value })}
                  className="gp-in"
                />
                <select
                  aria-label="Tipo do campo"
                  value={c.tipo}
                  onChange={(e) => mudarExtra(i, { tipo: e.target.value as CampoExtra["tipo"] })}
                  className="gp-in"
                >
                  <option value="texto">Texto</option>
                  <option value="numero">Número</option>
                  <option value="data">Data</option>
                </select>
                <label className="gp-4d-ckl" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={c.obrigatorio}
                    onChange={(e) => mudarExtra(i, { obrigatorio: e.target.checked })}
                    className="gp-4d-ck"
                  />
                  Obrigatório
                </label>
                <button
                  type="button"
                  aria-label="Remover campo"
                  onClick={() =>
                    setRascunho({ ...rascunho, campos_extras: rascunho.campos_extras.filter((_, j) => j !== i) })
                  }
                  className="gp-ib gp-4d-i40"
                  style={{ color: "#B91C1C" }}
                >
                  <Trash size={18} aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setRascunho({
                  ...rascunho,
                  campos_extras: [...rascunho.campos_extras, { chave: "", rotulo: "", tipo: "texto", obrigatorio: false }],
                })
              }
              className="gp-btn gp-bs gp-sm"
              style={{ alignSelf: "flex-start" }}
            >
              + Adicionar campo extra
            </button>
          </div>

          <div className="gp-4d-cgb" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={() => setRascunho(null)} className="gp-btn gp-bs">Cancelar</button>
            <button type="submit" className="gp-btn gp-bp">Salvar cargo</button>
          </div>
        </form>
        </div>
      )}

      <section className="gp-card gp-m-flat" aria-labelledby="h-cg" style={{ overflow: "hidden" }}>
        <h2 id="h-cg" className="gp-sr">Cargos cadastrados</h2>
        <p className="gp-only-m gp-4d-cnt" style={{ marginBottom: 10 }}>
          {cargos.length} {cargos.length === 1 ? "cargo" : "cargos"} ·{" "}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            <Lock size={12} weight="bold" aria-hidden="true" /> pré-montado
          </span>
        </p>
        <ul className="gp-4d-cgl" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {cargos.map((c) => (
            <li key={c.id} className="gp-4d-cgi">
              <div>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800 }}>
                  {c.nome}
                  {c.user_id === null && <Lock size={14} color="#475569" aria-label="Pré-montado" />}
                </span>
                <span className="gp-hint">
                  {c.campos_ocultos.length > 0 && `Sem: ${c.campos_ocultos.join(", ")}. `}
                  {c.campos_extras.length > 0 && `Extras: ${c.campos_extras.map((e) => e.rotulo).join(", ")}`}
                </span>
              </div>
              <div className="gp-4d-cga">
                {c.user_id !== null && (
                  <button onClick={() => editar(c)} className="gp-btn gp-bs gp-sm" aria-label={`Editar ${c.nome}`}>Editar</button>
                )}
                <button onClick={() => editar(c, true)} className="gp-btn gp-bs gp-sm" aria-label={`Duplicar ${c.nome}`}>Duplicar</button>
                {c.user_id !== null && (
                  <button onClick={() => remover(c)} className="gp-btn gp-bs gp-sm" style={{ color: "#B91C1C" }} aria-label={`Excluir ${c.nome}`}>Excluir</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
