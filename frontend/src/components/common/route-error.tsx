"use client";

import { useEffect } from "react";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error("Erro na rota:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-10 bg-color-bg-soft rounded-xl border border-color-border my-4 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-color-danger-bg flex items-center justify-center mb-3">
        <Warning size={24} className="text-color-danger" />
      </div>
      <h2 className="text-[18px] font-bold text-color-heading mb-1">
        Algo deu errado
      </h2>
      <p className="text-[13px] text-color-text-muted max-w-[420px] mb-5">
        Não foi possível carregar esta página. Verifique sua conexão e tente novamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-color-primary-dark text-white rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all cursor-pointer border-none"
      >
        <ArrowClockwise size={14} />
        Tentar novamente
      </button>
    </div>
  );
}
