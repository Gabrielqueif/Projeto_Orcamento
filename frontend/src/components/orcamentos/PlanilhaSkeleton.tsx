import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto da planilha orçamentária (só visual, aria-hidden): no desktop, o
 * cabeçalho "Etapas e itens" e etapas com linhas de item e valor à direita; no
 * mobile, etapas em acordeão com a primeira aberta.
 */
export function PlanilhaSkeleton({ etapas = 3 }: { etapas?: number }) {
  return (
    <div aria-hidden="true">
      <div className="gp-only-d">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width={160} height={20} />
              <Skeleton width={320} height={12} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Skeleton width={300} height={40} radius={12} />
              <Skeleton width={120} height={36} radius={8} />
            </div>
          </div>
          {Array.from({ length: etapas }, (_, e) => (
            <div key={e} className="gp-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "#F8FAFC" }}>
                <Skeleton width={28} height={28} radius={8} />
                <Skeleton width={e % 2 ? 180 : 240} height={16} />
                <Skeleton width={120} height={16} style={{ marginLeft: "auto" }} />
              </div>
              {Array.from({ length: e === 0 ? 4 : 2 }, (_, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr 60px 80px 110px 120px", gap: 16, alignItems: "center", padding: "14px 20px", borderTop: "1px solid #E6EBF2" }}>
                  <Skeleton width={70} height={12} />
                  <Skeleton width={i % 2 ? "70%" : "90%"} height={14} />
                  <Skeleton width={36} height={12} />
                  <Skeleton width={56} height={12} />
                  <Skeleton width={90} height={12} />
                  <Skeleton width={100} height={14} style={{ justifySelf: "end" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="gp-only-m">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
            <Skeleton width={110} height={20} />
            <Skeleton width={96} height={20} />
          </div>
          <Skeleton height={44} radius={12} />
          {Array.from({ length: etapas }, (_, e) => (
            <div key={e} className="gp-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Skeleton width="55%" height={16} />
                <Skeleton width={80} height={14} style={{ marginLeft: "auto" }} />
              </div>
              {e === 0 && (
                <>
                  <Skeleton width="90%" height={12} />
                  <Skeleton width="75%" height={12} />
                  <Skeleton width="85%" height={12} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
