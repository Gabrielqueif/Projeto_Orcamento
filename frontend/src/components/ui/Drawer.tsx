"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Largura do painel (CSS). */
  width?: string;
}

/**
 * Janela de sobreposição lateral. No mobile ocupa toda a largura (.gp-drw).
 * Fecha com Esc ou clicando fora do painel.
 */
export function Drawer({ isOpen, onClose, title, children, width = "min(760px, 100%)" }: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div className="gp-ov" onClick={onClose} aria-hidden="true" style={{ padding: 0 }} />
      <aside className="gp-drw" role="dialog" aria-modal="true" aria-label={title} style={{ width }}>
        <div className="gp-dh" style={{ alignItems: "flex-start" }}>
          <h2 className="gp-h2" style={{ margin: 0 }}>{title}</h2>
          <button type="button" onClick={onClose} className="gp-ib" aria-label="Fechar">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <div className="gp-db" style={{ overflowY: "auto" }}>{children}</div>
      </aside>
    </>,
    document.body,
  );
}
