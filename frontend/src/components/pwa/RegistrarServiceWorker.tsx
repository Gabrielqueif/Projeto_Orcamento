"use client";

import { useEffect } from "react";

/**
 * Registra o service worker mínimo (public/sw.js) que torna o app instalável.
 * Só em produção: em desenvolvimento ele atrapalharia o recarregamento a quente.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((erro) => {
      console.warn("Não foi possível registrar o service worker", erro);
    });
  }, []);

  return null;
}
