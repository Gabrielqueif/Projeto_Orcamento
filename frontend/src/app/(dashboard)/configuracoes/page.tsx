"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/components/common/toast";
import { atualizarPerfil, getPerfil } from "@/lib/api/perfil";
import { createClient } from "@/utils/supabase/client";

const SENHA_MINIMA = 8;

const estiloErro = { margin: 0, fontSize: 14, fontWeight: 700, color: "#B91C1C" } as const;

interface ErrosSenha {
  nova?: string;
  confirmacao?: string;
}

function validarSenhas(nova: string, confirmacao: string): ErrosSenha {
  const erros: ErrosSenha = {};
  if (nova.length < SENHA_MINIMA) {
    erros.nova = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  }
  if (confirmacao !== nova) {
    erros.confirmacao = "As senhas não coincidem.";
  }
  return erros;
}

export default function ConfiguracoesPage() {
  const { showToast } = useToast();

  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(false);
  const [email, setEmail] = useState("");
  // Último valor salvo no servidor: base para enviar só o que mudou.
  const [salvo, setSalvo] = useState({ full_name: "", cargo: "" });
  const [fullName, setFullName] = useState("");
  const [cargo, setCargo] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errosSenha, setErrosSenha] = useState<ErrosSenha>({});
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    let ativo = true;
    getPerfil()
      .then((perfil) => {
        if (!ativo) return;
        const valores = { full_name: perfil.full_name ?? "", cargo: perfil.cargo ?? "" };
        setEmail(perfil.email ?? "");
        setSalvo(valores);
        setFullName(valores.full_name);
        setCargo(valores.cargo);
      })
      .catch(() => {
        if (ativo) setErroCarregar(true);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const perfilAlterado = fullName.trim() !== salvo.full_name || cargo.trim() !== salvo.cargo;

  async function salvarPerfil(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const dados: { full_name?: string; cargo?: string } = {};
    if (fullName.trim() !== salvo.full_name) dados.full_name = fullName.trim();
    if (cargo.trim() !== salvo.cargo) dados.cargo = cargo.trim();
    if (Object.keys(dados).length === 0) return;

    setSalvandoPerfil(true);
    try {
      const atualizado = await atualizarPerfil(dados);
      const valores = { full_name: atualizado.full_name ?? "", cargo: atualizado.cargo ?? "" };
      setSalvo(valores);
      setFullName(valores.full_name);
      setCargo(valores.cargo);
      showToast("Perfil salvo", undefined, "success");
    } catch {
      showToast(
        "Não foi possível salvar o perfil",
        "Nome: de 2 a 120 caracteres. Cargo: de 2 a 80 caracteres.",
        "error"
      );
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function salvarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const erros = validarSenhas(novaSenha, confirmarSenha);
    setErrosSenha(erros);
    if (erros.nova || erros.confirmacao) return;

    setSalvandoSenha(true);
    try {
      const { error } = await createClient().auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setNovaSenha("");
      setConfirmarSenha("");
      showToast("Senha alterada", undefined, "success");
    } catch {
      showToast("Não foi possível alterar a senha", "Tente novamente em instantes.", "error");
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <>
      <PageHeader title="Configurações" back="/mais" />

      <section
        className="gp-card gp-pad"
        aria-labelledby="cfg-perfil"
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
      >
        <h2 id="cfg-perfil" className="gp-h2">
          Seu perfil
        </h2>

        {carregando && (
          <p role="status" className="gp-sub">
            Carregando perfil…
          </p>
        )}

        {!carregando && erroCarregar && (
          <p role="alert" style={estiloErro}>
            Não foi possível carregar o seu perfil. Tente novamente mais tarde.
          </p>
        )}

        {!carregando && !erroCarregar && (
          <form onSubmit={salvarPerfil} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="gp-fld">
              <label htmlFor="cfg-nome" className="gp-lb">
                Nome completo
              </label>
              <input
                id="cfg-nome"
                name="full_name"
                type="text"
                className="gp-in"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="gp-fld">
              <label htmlFor="cfg-cargo" className="gp-lb">
                Cargo
              </label>
              <input
                id="cfg-cargo"
                name="cargo"
                type="text"
                className="gp-in"
                minLength={2}
                maxLength={80}
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
              />
            </div>

            <div className="gp-fld">
              <span className="gp-lb">E-mail</span>
              <p style={{ margin: 0, fontSize: 16, color: "#475569", overflowWrap: "anywhere" }}>{email || "—"}</p>
            </div>

            <button
              type="submit"
              className="gp-btn gp-bp"
              disabled={salvandoPerfil || !perfilAlterado}
              style={{ alignSelf: "flex-start" }}
            >
              {salvandoPerfil ? "Salvando…" : "Salvar"}
            </button>
          </form>
        )}
      </section>

      <section
        className="gp-card gp-pad"
        aria-labelledby="cfg-senha"
        style={{ display: "flex", flexDirection: "column", gap: 18 }}
      >
        <h2 id="cfg-senha" className="gp-h2">
          Alterar senha
        </h2>

        <form noValidate onSubmit={salvarSenha} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="gp-fld">
            <label htmlFor="cfg-nova-senha" className="gp-lb">
              Nova senha
            </label>
            <input
              id="cfg-nova-senha"
              name="nova_senha"
              type="password"
              className="gp-in"
              autoComplete="new-password"
              aria-invalid={errosSenha.nova ? true : undefined}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
            {errosSenha.nova && (
              <p role="alert" style={estiloErro}>
                {errosSenha.nova}
              </p>
            )}
          </div>

          <div className="gp-fld">
            <label htmlFor="cfg-confirmar-senha" className="gp-lb">
              Confirmar nova senha
            </label>
            <input
              id="cfg-confirmar-senha"
              name="confirmar_senha"
              type="password"
              className="gp-in"
              autoComplete="new-password"
              aria-invalid={errosSenha.confirmacao ? true : undefined}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            {errosSenha.confirmacao && (
              <p role="alert" style={estiloErro}>
                {errosSenha.confirmacao}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="gp-btn gp-bp"
            disabled={salvandoSenha}
            style={{ alignSelf: "flex-start" }}
          >
            {salvandoSenha ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      </section>
    </>
  );
}
