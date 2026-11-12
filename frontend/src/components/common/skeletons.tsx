import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/**
 * Esqueletos compostos com o formato das telas do GPObras. São só visuais
 * (aria-hidden): envolva-os em `SkeletonStatus`, exceto `TableRowsSkeleton`,
 * que já anuncia o carregamento por conta própria por viver dentro de `<tbody>`.
 */

/** Grade de cards de métrica (rótulo, valor e rodapé). */
export function MetricCardsSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="gp-grid" aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="gp-card gp-met">
          <Skeleton width="50%" height={12} />
          <Skeleton width="70%" height={30} />
          <Skeleton width="40%" height={12} />
        </div>
      ))}
    </div>
  );
}

/**
 * Linhas `<tr>` para colocar direto no `<tbody>` de uma tabela existente.
 * A primeira célula carrega o texto para leitores de tela.
 */
export function TableRowsSkeleton({
  colunas,
  linhas = 5,
  texto = "Carregando…",
  anunciar = true,
}: {
  colunas: number;
  linhas?: number;
  texto?: string;
  /** false quando já está dentro de um `SkeletonStatus`, para não anunciar duas vezes. */
  anunciar?: boolean;
}) {
  const larguras = ["70%", "85%", "55%", "60%", "45%", "65%", "40%"];
  return (
    <>
      {Array.from({ length: linhas }, (_, l) => (
        <tr key={l}>
          {Array.from({ length: colunas }, (_, c) => (
            <td key={c} className="gp-td">
              {anunciar && l === 0 && c === 0 && <span role="status" aria-busy="true" className="gp-sr">{texto}</span>}
              <Skeleton height={14} width={larguras[(c + l) % larguras.length]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Lista de cartões (versão mobile de tabelas e listas). */
export function CardListSkeleton({ quantidade = 3, comBarra = false }: { quantidade?: number; comBarra?: boolean }) {
  const variacoes: [string, string, string][] = [
    ["40%", "85%", "60%"],
    ["30%", "75%", "50%"],
    ["45%", "80%", "55%"],
  ];
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: quantidade }, (_, i) => {
        const [a, b, c] = variacoes[i % variacoes.length];
        return (
          <div key={i} className="gp-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton width={a} height={14} />
            <Skeleton width={b} height={20} />
            <Skeleton width={c} height={14} />
            {comBarra && <Skeleton height={8} radius={4} />}
          </div>
        );
      })}
    </div>
  );
}

/** Cabeçalho de tela de detalhe: trilha, título, subtítulo, badge e abas. */
export function DetailHeaderSkeleton({ abas = 0 }: { abas?: number }) {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Skeleton width={140} height={14} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={280} height={32} style={{ maxWidth: "70%" }} />
        <Skeleton width={90} height={24} radius={999} />
      </div>
      <Skeleton width={360} height={16} style={{ maxWidth: "100%" }} />
      {abas > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {Array.from({ length: abas }, (_, i) => (
            <Skeleton key={i} width={i === 0 ? 110 : 90} height={36} radius={999} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Formulário: pares de rótulo e campo de 44px, com botão ao fim. */
export function FormSkeleton({ campos = 4, colunas = 1 }: { campos?: number; colunas?: 1 | 2 }) {
  return (
    <div className="gp-card gp-pad" aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: colunas === 2 ? "repeat(auto-fit,minmax(240px,1fr))" : "1fr", gap: 18 }}>
        {Array.from({ length: campos }, (_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width={i % 2 ? 90 : 120} height={12} />
            <Skeleton height={44} radius={8} />
          </div>
        ))}
      </div>
      <Skeleton width={140} height={44} radius={8} style={{ alignSelf: "flex-end" }} />
    </div>
  );
}

/** Área de gráfico com título, barras e legenda. */
export function ChartSkeleton({ altura = 240, comCard = true }: { altura?: number; comCard?: boolean }) {
  const barras = [45, 60, 38, 72, 55, 80, 66, 90];
  const corpo = (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Skeleton width={180} height={16} />
      <div style={{ height: altura, display: "flex", alignItems: "flex-end", gap: 10, borderBottom: "1px solid #E6EBF2", paddingBottom: 4 }}>
        {barras.map((h, i) => (
          <Skeleton key={i} height={`${h}%`} radius={6} style={{ flex: 1 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Skeleton width={80} height={12} />
        <Skeleton width={100} height={12} />
      </div>
    </div>
  );
  return comCard ? <div className="gp-card gp-pad">{corpo}</div> : corpo;
}

/** Itens de lista com ícone ou avatar, duas linhas e data à direita. */
export function ListItemSkeleton({ quantidade = 4, avatar = true }: { quantidade?: number; avatar?: boolean }) {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="gp-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          {avatar && <Skeleton width={40} height={40} radius={999} style={{ flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <SkeletonText linhas={2} larguras={[i % 2 ? "55%" : "65%", "85%"]} gap={8} />
          </div>
          <Skeleton width={56} height={12} style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

/** Painel genérico com linhas de texto, para blocos sem formato próprio. */
export function PanelSkeleton({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="gp-card gp-pad" aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Skeleton width={160} height={16} />
      <SkeletonText linhas={linhas} altura={16} />
    </div>
  );
}
