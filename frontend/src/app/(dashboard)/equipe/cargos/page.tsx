"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash, Lock } from "@phosphor-icons/react";
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

const inputCls =
  "w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#9fd300] rounded-[8px] px-3 py-2 font-['Manrope'] text-[14px] text-[#0f172a] outline-none transition-colors";
const labelCls = "font-['JetBrains_Mono'] text-[10px] font-medium text-[#94a3b8] uppercase tracking-[0.5px]";

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

  return (
    <div className="flex flex-col gap-6 max-w-[1024px] mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/equipe"
          className="flex items-center justify-center w-9 h-9 border border-[#e2e8f0] bg-white text-[#64748b] rounded-[8px] hover:text-[#001b3d] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-['Manrope'] font-extrabold text-[28px] text-[#001b3d] tracking-[-0.6px]">Cargos</h1>
        <button
          onClick={() => setRascunho(vazio)}
          className="ml-auto flex items-center gap-2 px-5 py-3 bg-[#9fd300] text-[#001b3d] rounded-[8px] text-sm font-extrabold"
        >
          <Plus size={16} weight="bold" /> Novo Cargo
        </button>
      </div>

      {rascunho && (
        <form
          onSubmit={salvar}
          className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-sm p-6 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="cargo-nome" className={labelCls}>
              Nome do cargo <span className="text-red-500">*</span>
            </label>
            <input
              id="cargo-nome"
              required
              maxLength={100}
              value={rascunho.nome}
              onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
              className={inputCls}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className={labelCls}>Campos pedidos no cadastro (Nome e Cargo são sempre pedidos)</legend>
            <div className="flex flex-wrap gap-4">
              {CAMPOS_BASE.map((c) => (
                <label key={c.chave} className="flex items-center gap-2 font-['Manrope'] text-[14px] text-[#001b3d]">
                  <input
                    type="checkbox"
                    checked={!rascunho.campos_ocultos.includes(c.chave)}
                    onChange={() => alternarBase(c.chave)}
                  />
                  {c.rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3">
            <span className={labelCls}>Campos extras deste cargo</span>
            {rascunho.campos_extras.map((c, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto_auto] gap-3 items-center">
                <input
                  aria-label="Rótulo do campo"
                  placeholder="Ex: Registro CREA"
                  required
                  maxLength={60}
                  value={c.rotulo}
                  onChange={(e) => mudarExtra(i, { rotulo: e.target.value })}
                  className={inputCls}
                />
                <select
                  aria-label="Tipo do campo"
                  value={c.tipo}
                  onChange={(e) => mudarExtra(i, { tipo: e.target.value as CampoExtra["tipo"] })}
                  className={inputCls}
                >
                  <option value="texto">Texto</option>
                  <option value="numero">Número</option>
                  <option value="data">Data</option>
                </select>
                <label className="flex items-center gap-2 font-['Manrope'] text-[13px] text-[#64748b]">
                  <input
                    type="checkbox"
                    checked={c.obrigatorio}
                    onChange={(e) => mudarExtra(i, { obrigatorio: e.target.checked })}
                  />
                  Obrigatório
                </label>
                <button
                  type="button"
                  aria-label="Remover campo"
                  onClick={() =>
                    setRascunho({ ...rascunho, campos_extras: rascunho.campos_extras.filter((_, j) => j !== i) })
                  }
                  className="text-[#64748b] hover:text-red-500 p-1"
                >
                  <Trash size={18} />
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
              className="self-start text-[13px] font-bold text-[#00a3b1] hover:underline"
            >
              + Adicionar campo extra
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRascunho(null)}
              className="px-6 py-2 border border-[#e2e8f0] rounded-[8px] font-bold text-[14px] text-[#001b3d]"
            >
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-[#9fd300] rounded-[8px] font-extrabold text-[14px] text-[#001b3d]">
              Salvar Cargo
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#f1f5f9] rounded-[8px] shadow-sm divide-y divide-[#f1f5f9]">
        {cargos.map((c) => (
          <div key={c.id} className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="font-['Manrope'] font-bold text-[14px] text-[#001b3d] flex items-center gap-2">
                {c.nome}
                {c.user_id === null && <Lock size={12} className="text-[#94a3b8]" aria-label="Pré-montado" />}
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#94a3b8]">
                {c.campos_ocultos.length > 0 && `Sem: ${c.campos_ocultos.join(", ")}. `}
                {c.campos_extras.length > 0 && `Extras: ${c.campos_extras.map((e) => e.rotulo).join(", ")}`}
              </span>
            </div>
            <div className="ml-auto flex gap-3 text-[13px] font-bold">
              {c.user_id !== null && (
                <button onClick={() => editar(c)} className="text-[#00a3b1] hover:underline">
                  Editar
                </button>
              )}
              <button onClick={() => editar(c, true)} className="text-[#00a3b1] hover:underline">
                Duplicar
              </button>
              {c.user_id !== null && (
                <button onClick={() => remover(c)} className="text-red-500 hover:underline">
                  Excluir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
