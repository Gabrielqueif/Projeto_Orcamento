"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

type PageHeaderProps = {
  title: ReactNode;
  /** Trilha do desktop (ex.: "Operação / Obras"). */
  crumb?: ReactNode;
  /** Rótulo curto acima do título no mobile. */
  eyebrow?: string;
  subtitle?: ReactNode;
  /** Selo ao lado do título (status). */
  badge?: ReactNode;
  /** Destino do botão voltar, mostrado só no mobile. */
  back?: string;
  backLabel?: string;
  actions?: ReactNode;
  /** No mobile, o conteúdo seguinte sobe sobre o cabeçalho escuro. */
  lift?: boolean;
  /** Conteúdo extra do cabeçalho (busca, indicadores). */
  children?: ReactNode;
};

/**
 * Cabeçalho de página: no desktop, trilha + título + ações à direita;
 * abaixo de 1024px vira o cabeçalho escuro do app mobile (classe gp-ph em globals.css).
 */
export function PageHeader({
  title,
  crumb,
  eyebrow,
  subtitle,
  badge,
  back,
  backLabel = "Voltar",
  actions,
  lift,
  children,
}: PageHeaderProps) {
  return (
    <header className="gp-ph" data-lift={lift ? "" : undefined}>
      {back && (
        <Link href={back} className="gp-ph-back" aria-label={backLabel}>
          <ArrowLeft size={20} weight="bold" aria-hidden="true" />
        </Link>
      )}
      <div className="gp-ph-row">
        <div className="gp-ph-txt">
          {crumb && (
            <nav aria-label="Trilha" className="gp-crumb">
              {crumb}
            </nav>
          )}
          {eyebrow && <span className="gp-ph-eb">{eyebrow}</span>}
          <div className="gp-ph-title">
            <h1 className="gp-h1">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="gp-sub">{subtitle}</p>}
        </div>
        {actions && <div className="gp-ph-act">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
