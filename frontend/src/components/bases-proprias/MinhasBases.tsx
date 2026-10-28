"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CaretRight, Database, Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/common/toast";
import { criarBase, listarBases, type BasePropria } from "@/lib/api/basesProprias";
import { UFS } from "@/lib/basesPropriasUtils";

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
    <section aria-labelledby="minhas-bases-titulo" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 id="minhas-bases-titulo" className="gp-h2">
          Minhas bases
        </h2>
        <button type="button" onClick={() => setModalAberto(true)} className="gp-btn gp-bp gp-sm gp-4a-alvo gp-4e-tap">
          <Plus size={16} weight="bold" aria-hidden="true" /> Nova base
        </button>
      </div>

      {loading && <p className="gp-sub">Carregando suas bases...</p>}
      {erro && <p style={{ color: "#B91C1C", margin: 0 }}>{erro}</p>}

      {!loading && !erro && bases.length === 0 && (
        <div className="gp-card gp-pad gp-4a-tracejado" style={{ textAlign: "center" }} data-testid="minhas-bases-vazio">
          <p style={{ margin: 0, fontWeight: 700 }}>Você ainda não tem bases próprias.</p>
          <p className="gp-hint" style={{ margin: "4px 0 0" }}>
            Crie uma base para cadastrar insumos e composições com preços seus.
          </p>
        </div>
      )}

      {bases.length > 0 && (
        <ul className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", listStyle: "none", margin: 0, padding: 0 }}>
          {bases.map((b) => (
            <li key={b.id}>
              <Link
                href={`/bases/propria/${b.id}`}
                className="gp-card gp-pad gp-4e-bcard"
                style={{ display: "flex", flexDirection: "column", gap: 10, color: "#001b3d", textDecoration: "none", height: "100%", boxSizing: "border-box" }}
              >
                {/* No mobile a linha ganha ícone e seta (artefato "Minhas bases") */}
                <span className="gp-4e-brow">
                  <span className="gp-only-m" aria-hidden="true">
                    <span className="gp-4e-bico"><Database size={22} weight="bold" /></span>
                  </span>
                  <span className="gp-4e-btxt">
                    <strong style={{ fontSize: 17 }}>{b.nome}</strong>
                    {b.descricao && <span style={{ fontSize: 14, color: "#475569" }}>{b.descricao}</span>}
                    {b.updated_at && (
                      <span className="gp-only-m" style={{ fontSize: 13, color: "#475569" }}>
                        Atualizada em {new Date(b.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </span>
                  <span className="gp-only-m" aria-hidden="true" style={{ marginLeft: "auto", color: "#475569" }}>
                    <CaretRight size={18} weight="bold" />
                  </span>
                </span>
                {b.uf && (
                  <span style={{ display: "flex", gap: 8 }}>
                    <span className="gp-bg gp-ne">{b.uf}</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={modalAberto} onClose={fechar} title="Nova base">
        <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="gp-fld">
            <label htmlFor="base-nome" className="gp-lb">Nome</label>
            <input id="base-nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} required aria-required="true" placeholder="Ex.: Preços de Fortaleza" className="gp-in" />
          </div>
          <div className="gp-fld">
            <label htmlFor="base-descricao" className="gp-lb">Descrição</label>
            <textarea id="base-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="gp-in" style={{ height: "auto", padding: 14 }} />
          </div>
          <div className="gp-fld">
            <label htmlFor="base-uf" className="gp-lb">UF</label>
            <select id="base-uf" value={uf} onChange={(e) => setUf(e.target.value)} className="gp-in">
              <option value="">Não informada</option>
              {UFS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="gp-4e-dlgacts">
            <button type="button" onClick={fechar} className="gp-btn gp-bs">Cancelar</button>
            <button type="submit" disabled={salvando || !nome.trim()} className="gp-btn gp-bp" style={salvando || !nome.trim() ? { opacity: 0.5 } : undefined}>
              {salvando ? "Criando..." : "Criar base"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
