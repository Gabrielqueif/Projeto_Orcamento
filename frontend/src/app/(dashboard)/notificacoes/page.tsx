"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Clock, Cube, Money } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import type { SeveridadeRisco, TipoRisco } from "@/lib/api/dashboard";
import {
  getNotificacoes,
  marcarNotificacoesLidas,
  type Notificacao,
} from "@/lib/api/notificacoes";

const ICONES_RISCO: Record<TipoRisco, ReactNode> = {
  ATRASO: <Clock weight="bold" />,
  ORCAMENTO: <Money weight="bold" />,
  ESTOQUE: <Cube weight="bold" />,
  DIARIO: <BookOpen weight="bold" />,
};

const GRUPOS: { severidade: SeveridadeRisco; titulo: string }[] = [
  { severidade: "critical", titulo: "Críticas" },
  { severidade: "moderate", titulo: "Moderadas" },
  { severidade: "info", titulo: "Informativas" },
];

type Estado = "carregando" | "erro" | "pronto";

export default function NotificacoesPage() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const carregar = useCallback(() => {
    getNotificacoes()
      .then((dados) => {
        setItens(dados.itens);
        setNaoLidas(dados.nao_lidas);
        setEstado("pronto");
      })
      .catch(() => setEstado("erro"));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function marcarTodas() {
    setMarcandoTodas(true);
    try {
      const resposta = await marcarNotificacoesLidas();
      setItens((atuais) => atuais.map((item) => ({ ...item, lida: true })));
      setNaoLidas(resposta.nao_lidas);
    } catch {
      // Sem resposta do servidor a lista fica como estava; o botão continua disponível.
    } finally {
      setMarcandoTodas(false);
    }
  }

  function abrirItem(item: Notificacao) {
    if (item.lida) return;
    setItens((atuais) => atuais.map((i) => (i.chave === item.chave ? { ...i, lida: true } : i)));
    marcarNotificacoesLidas([item.chave])
      .then((resposta) => setNaoLidas(resposta.nao_lidas))
      .catch(() => carregar());
  }

  const acoes =
    estado === "pronto" && naoLidas > 0 ? (
      <button type="button" className="gp-btn gp-bs" onClick={marcarTodas} disabled={marcandoTodas}>
        Marcar todas como lidas
      </button>
    ) : undefined;

  return (
    <div className="gp-6b-pagina">
      <PageHeader
        title="Notificações"
        back="/"
        subtitle="Riscos ativos das suas obras. Ao abrir um item, ele é marcado como lido."
        actions={acoes}
      />

      {estado === "carregando" && (
        <p className="gp-sub" role="status" style={{ margin: 0 }}>
          Carregando notificações…
        </p>
      )}

      {estado === "erro" && (
        <div role="alert" className="gp-card gp-pad gp-6b-erro">
          <p className="gp-sub" style={{ margin: 0 }}>
            Não foi possível carregar as notificações.
          </p>
          <button type="button" className="gp-btn gp-bs" onClick={carregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado === "pronto" && itens.length === 0 && (
        <div className="gp-card gp-pad gp-6b-vazio">
          <p className="gp-h2" style={{ margin: 0 }}>
            Nenhuma notificação
          </p>
          <p className="gp-sub" style={{ margin: 0 }}>
            Quando um risco aparecer no painel, ele será listado aqui.
          </p>
        </div>
      )}

      {estado === "pronto" &&
        GRUPOS.map(({ severidade, titulo }) => {
          const grupo = itens.filter((item) => item.severidade === severidade);
          if (grupo.length === 0) return null;
          const idTitulo = `h-notif-${severidade}`;
          return (
            <section key={severidade} aria-labelledby={idTitulo} className="gp-6b-grupo">
              <h2 id={idTitulo} className="gp-h2">
                {titulo}
              </h2>
              <ul className="gp-6b-lista">
                {grupo.map((item) => (
                  <li key={item.chave}>
                    <Link
                      href={item.href}
                      onClick={() => abrirItem(item)}
                      className={`gp-card gp-6b-item${item.lida ? "" : " gp-6b-nao-lida"}`}
                    >
                      <span className={`gp-6b-icone gp-6b-sev-${item.severidade}`} aria-hidden="true">
                        {ICONES_RISCO[item.tipo]}
                      </span>
                      <span className="gp-6b-corpo">
                        <strong className="gp-6b-titulo">{item.titulo}</strong>
                        <span className="gp-6b-desc">{item.descricao}</span>
                      </span>
                      {!item.lida && (
                        <>
                          <span className="gp-6b-ponto" aria-hidden="true" />
                          <span className="gp-sr">não lida</span>
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
