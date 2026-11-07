"use client";

import { use, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ObraTabs } from "@/components/obras/ObraTabs";
import { QrConvite } from "@/components/canteiro/QrConvite";
import { useToast } from "@/components/common/toast";
import {
  criarConvite,
  getConvites,
  getMembros,
  linkDoConvite,
  removerMembro,
  revogarConvite,
  type Convite,
  type ConviteCriado,
  type Membro,
  type PapelCanteiro,
} from "@/lib/api/acesso";

const ROTULO: Record<PapelCanteiro, string> = { MESTRE: "Mestre de obras", SUPERVISOR: "Supervisor" };

export default function EquipeCanteiroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useToast();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [novo, setNovo] = useState<ConviteCriado | null>(null);
  const [papel, setPapel] = useState<PapelCanteiro>("MESTRE");
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([getMembros(id), getConvites(id)]);
      setMembros(m);
      setConvites(c);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const gerar = async () => {
    try {
      setNovo(await criarConvite(id, papel));
      await carregar();
    } catch (e) {
      showToast("Não foi possível gerar o convite", e instanceof Error ? e.message : undefined, "error");
    }
  };

  const copiar = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Link copiado", undefined, "success");
    } catch {
      showToast("Copie o link manualmente", undefined, "warning");
    }
  };

  const revogar = async (convite: Convite) => {
    try {
      await revogarConvite(id, convite.id);
      if (novo?.id === convite.id) setNovo(null);
      await carregar();
    } catch (e) {
      showToast("Erro ao revogar", e instanceof Error ? e.message : undefined, "error");
    }
  };

  const remover = async (membro: Membro) => {
    if (!window.confirm(`Remover ${membro.nome ?? "este membro"} do canteiro?`)) return;
    try {
      await removerMembro(id, membro.user_id);
      await carregar();
    } catch (e) {
      showToast("Erro ao remover", e instanceof Error ? e.message : undefined, "error");
    }
  };

  const link = novo ? linkDoConvite(novo.token) : null;

  return (
    <>
      <PageHeader title="Equipe do canteiro" back={`/obras/${id}`} backLabel="Obra" crumb="Obras / Equipe do canteiro" />
      <ObraTabs id={id} atual="canteiro" />
      {erro && <p role="alert">{erro}</p>}

      <section className="gp-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 className="gp-h2" style={{ margin: 0 }}>Convidar</h2>
        <p className="gp-hint" style={{ margin: 0 }}>
          Gere um link de uso único, válido por 7 dias. Quem abrir entra ou cria conta e passa a registrar o diário desta obra.
        </p>
        <div role="radiogroup" aria-label="Papel" className="gp-seg">
          {(Object.keys(ROTULO) as PapelCanteiro[]).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={papel === p} onClick={() => setPapel(p)}>{ROTULO[p]}</button>
          ))}
        </div>
        <button type="button" className="gp-btn gp-bp" onClick={gerar}>Gerar link de convite</button>
        {link && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input readOnly aria-label="Link do convite" className="gp-in" value={link} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="gp-btn gp-bs" onClick={() => copiar(link)}>Copiar link</button>
            <QrConvite valor={link} />
            <p className="gp-hint" style={{ margin: 0 }}>O link só aparece agora. Se perder, revogue e gere outro.</p>
          </div>
        )}
      </section>

      <section className="gp-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 className="gp-h2" style={{ margin: 0 }}>Membros</h2>
        {membros.length === 0 && <p className="gp-hint" style={{ margin: 0 }}>Ninguém vinculado ainda.</p>}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {membros.map((m) => (
            <li key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{m.nome ?? m.email ?? "Usuário"}</strong>
                <span className="gp-hint" style={{ display: "block" }}>{ROTULO[m.papel]}{m.email && m.nome ? ` · ${m.email}` : ""}</span>
              </span>
              <button type="button" className="gp-btn gp-sm gp-bs" style={{ color: "#B91C1C" }} onClick={() => remover(m)}>Remover</button>
            </li>
          ))}
        </ul>
        {convites.length > 0 && (
          <>
            <h3 className="gp-lb" style={{ margin: "8px 0 0" }}>Convites pendentes</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {convites.map((c) => (
                <li key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1 }}>
                    {ROTULO[c.papel]}
                    <span className="gp-hint" style={{ display: "block" }}>expira em {new Date(c.expira_em).toLocaleDateString("pt-BR")}</span>
                  </span>
                  <button type="button" className="gp-btn gp-sm gp-bs" onClick={() => revogar(c)}>Revogar</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
