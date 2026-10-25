"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WifiSlash } from "@phosphor-icons/react";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error("Erro na rota:", error);
  }, [error]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 560 }}>
      <div role="alert" style={{ maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span aria-hidden="true" style={{ width: 112, height: 112, borderRadius: 34, background: "#FEE2E2", color: "#B91C1C", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <WifiSlash size={52} weight="bold" />
        </span>
        <h1 className="gp-h1" style={{ margin: "8px 0 0" }}>Não conseguimos carregar esta página</h1>
        <p className="gp-sub" style={{ margin: 0, lineHeight: 1.6 }}>
          Pode ser a conexão ou uma instabilidade nossa. Seus dados estão salvos. Tente de novo em alguns segundos.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button type="button" onClick={reset} className="gp-btn gp-bp">Tentar de novo</button>
          <Link href="/" className="gp-btn gp-bs">Voltar ao início</Link>
        </div>
        {error.digest && (
          <details style={{ width: "100%", marginTop: 10, textAlign: "left", fontSize: 14, color: "#475569" }}>
            <summary style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700 }}>
              Detalhes para o suporte
            </summary>
            <p className="gp-mono" style={{ margin: 0, padding: "12px 14px", borderRadius: 12, background: "#fff", fontSize: 13, lineHeight: 1.6 }}>
              Ref.: {error.digest}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
