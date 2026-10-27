"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle, Warning, Info, X } from "@phosphor-icons/react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextData {
  showToast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const ICONE: Record<ToastType, { bg: string; fg: string; Icon: typeof Info }> = {
  success: { bg: "#9fd300", fg: "#001b3d", Icon: CheckCircle },
  error: { bg: "#FEE2E2", fg: "#B91C1C", Icon: Warning },
  warning: { bg: "#FEF3C7", fg: "#92400E", Icon: Warning },
  info: { bg: "#00a3b1", fg: "#001b3d", Icon: Info },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Erro fica até o usuário fechar; os demais somem em 5 s.
    if (type !== "error") {
      setTimeout(() => removeToast(id), 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="gp-toasts"
      >
        {toasts.map((toast) => {
          const { bg, fg, Icon } = ICONE[toast.type];
          return (
            <div
              key={toast.id}
              className="gp-toast"
              style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 12, padding: "10px 8px 10px 16px", borderRadius: 16, background: "#00102a", color: "#fff", boxShadow: "0 18px 36px -14px rgba(0,16,42,.7)" }}
            >
              <span aria-hidden="true" style={{ width: 28, height: 28, flex: "0 0 28px", borderRadius: 9, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} weight="bold" />
              </span>
              <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{toast.title}</span>
                {toast.message && (
                  <span style={{ display: "block", fontSize: 13, color: "#cbd5e1", marginTop: 2 }}>{toast.message}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Fechar aviso"
                style={{ width: 40, height: 40, border: 0, background: "transparent", color: "#cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
