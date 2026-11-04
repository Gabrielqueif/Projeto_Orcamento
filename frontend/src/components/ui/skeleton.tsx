import type { CSSProperties, ReactNode } from "react";

type Medida = number | string;

export interface SkeletonProps {
  width?: Medida;
  height?: Medida;
  radius?: Medida;
  /** Usa a variante para fundos azul-marinho (`.gp-4e-skd`). */
  escuro?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Bloco de esqueleto com o shimmer da identidade (`.gp-sk`). Sempre decorativo. */
export function Skeleton({ width, height = 14, radius, escuro, className, style }: SkeletonProps) {
  const base = escuro ? "gp-4e-skd" : "gp-sk";
  return (
    <span
      aria-hidden="true"
      className={className ? `${base} ${className}` : base}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

const LARGURAS_PADRAO = ["92%", "96%", "88%", "80%", "94%"];

/** Linhas de texto com larguras variadas, para não parecer um bloco uniforme. */
export function SkeletonText({
  linhas = 3,
  altura = 14,
  gap = 10,
  larguras = LARGURAS_PADRAO,
}: {
  linhas?: number;
  altura?: Medida;
  gap?: number;
  larguras?: Medida[];
}) {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} height={altura} width={larguras[i % larguras.length]} />
      ))}
    </div>
  );
}

/**
 * Invólucro acessível de um estado de carregamento: anuncia `texto` para leitores
 * de tela e deixa as peças visuais com `aria-hidden`. Mantém `role="status"` e o
 * texto "Carregando…" que os testes e as tecnologias assistivas já esperam.
 */
export function SkeletonStatus({
  texto = "Carregando…",
  children,
  className,
  style,
}: {
  texto?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className} style={style}>
      <span className="gp-sr">{texto}</span>
      {/* display: contents deixa as peças como filhas diretas do layout definido em `style`. */}
      <div aria-hidden="true" style={{ display: "contents" }}>{children}</div>
    </div>
  );
}
