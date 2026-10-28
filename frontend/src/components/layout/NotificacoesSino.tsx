"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react";
import { getNotificacoes } from "@/lib/api/notificacoes";

/**
 * Sino do cabeçalho: leva a /notificacoes e mostra uma bolinha quando há riscos não lidos.
 * Se a contagem falhar, o sino continua aparecendo, sem bolinha.
 */
export function NotificacoesSino({ className }: { className?: string }) {
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    let ativo = true;
    getNotificacoes()
      .then((dados) => {
        if (ativo) setNaoLidas(dados.nao_lidas);
      })
      .catch(() => {
        // Sem contagem o sino fica sem bolinha.
      });
    return () => {
      ativo = false;
    };
  }, []);

  const rotulo = naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : "Notificações";

  return (
    <Link href="/notificacoes" className={className ? `gp-ib ${className}` : "gp-ib"} aria-label={rotulo}>
      <Bell size={20} weight="bold" aria-hidden="true" />
      {naoLidas > 0 && <span className="gp-6b-bolinha" aria-hidden="true" />}
    </Link>
  );
}
