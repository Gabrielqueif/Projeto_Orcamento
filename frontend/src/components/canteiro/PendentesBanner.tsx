"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/toast";
import { listarPendentes, sincronizar, type EnvioPendente } from "@/lib/offline/fila";

/** Aviso de diários guardados no aparelho. Tenta enviar ao abrir e quando o sinal volta. */
export function PendentesBanner() {
  const { showToast } = useToast();
  const [pendentes, setPendentes] = useState<EnvioPendente[]>([]);

  const atualizar = useCallback(async () => {
    const feitos = await sincronizar().catch(() => 0);
    if (feitos > 0) showToast(feitos === 1 ? "Diário pendente enviado" : `${feitos} diários pendentes enviados`, undefined, "success");
    setPendentes(await listarPendentes().catch(() => []));
  }, [showToast]);

  useEffect(() => {
    atualizar();
    window.addEventListener("online", atualizar);
    return () => window.removeEventListener("online", atualizar);
  }, [atualizar]);

  if (pendentes.length === 0) return null;
  const comErro = pendentes.find((p) => p.erro);
  return (
    <p role="status" style={{ fontSize: 14, fontWeight: 600, color: "#9A3412", background: "#FFEDD5", borderRadius: 12, padding: "10px 14px", margin: "0 0 12px" }}>
      {pendentes.length === 1 ? "1 diário aguarda envio" : `${pendentes.length} diários aguardam envio`}
      {comErro ? `: ${comErro.erro}` : ". Será enviado quando houver sinal."}
    </p>
  );
}
