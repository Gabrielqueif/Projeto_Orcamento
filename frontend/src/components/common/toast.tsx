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

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message };
    
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-[360px] w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-left transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-color-white border-color-success-dark/30 text-color-heading"
                : toast.type === "error"
                ? "bg-color-white border-color-danger-dark/30 text-color-heading"
                : toast.type === "warning"
                ? "bg-color-white border-color-warning-dark/30 text-color-heading"
                : "bg-color-white border-color-border text-color-heading"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle size={20} className="text-color-success-dark shrink-0 mt-0.5" />
            )}
            {toast.type === "error" && (
              <Warning size={20} className="text-color-danger shrink-0 mt-0.5" />
            )}
            {toast.type === "warning" && (
              <Warning size={20} className="text-color-warning-dark shrink-0 mt-0.5" />
            )}
            {toast.type === "info" && (
              <Info size={20} className="text-color-teal shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-bold leading-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-[11px] text-color-text-muted mt-1 leading-snug">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-color-text-muted hover:text-color-heading transition-colors border-none bg-transparent cursor-pointer p-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
