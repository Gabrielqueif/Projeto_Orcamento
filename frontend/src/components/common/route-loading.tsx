const sk = (style: React.CSSProperties) => <span className="gp-sk" style={style} />;

/**
 * Esqueleto de carregamento das rotas. No desktop: título, indicadores e tabela;
 * abaixo de 1024px segue o artefato "Carregando": cabeçalho escuro (com o nome da
 * seção, quando informado), chips e cartões.
 */
export function RouteLoading({ titulo }: { titulo?: string }) {
  const texto = titulo ? `Carregando ${titulo.toLowerCase()}...` : "Carregando...";
  return (
    <div role="status" aria-live="polite" aria-label="Carregando" aria-busy="true">
      <span className="gp-sr">{texto}</span>

      <div aria-hidden="true" className="gp-only-d">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sk({ width: 140, height: 14 })}
            {sk({ width: 280, height: 32 })}
            {sk({ width: 360, height: 16, maxWidth: "100%" })}
          </div>
          <div className="gp-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="gp-card gp-met">
                {sk({ width: "50%", height: 14 })}
                {sk({ width: "70%", height: 30 })}
                {sk({ width: "40%", height: 12 })}
              </div>
            ))}
          </div>
          <div className="gp-card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {sk({ width: 80, height: 40, borderRadius: 12 })}
              {sk({ width: 130, height: 40, borderRadius: 12 })}
              {sk({ width: 260, height: 44, borderRadius: 12, marginLeft: "auto" })}
            </div>
            {sk({ height: 18 })}
            {sk({ height: 18, width: "92%" })}
            {sk({ height: 18, width: "96%" })}
            {sk({ height: 18, width: "88%" })}
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="gp-only-m">
        <div className="gp-4e-col" style={{ gap: 12 }}>
          <div className="gp-ph">
            {titulo ? <p className="gp-h1" style={{ margin: 0 }}>{titulo}</p> : <span className="gp-4e-skd" style={{ width: 180, height: 26 }} />}
            <span className="gp-4e-skd" style={{ height: 50 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {sk({ width: 72, height: 40, borderRadius: 999 })}
            {sk({ width: 96, height: 40, borderRadius: 999 })}
            {sk({ width: 84, height: 40, borderRadius: 999 })}
          </div>
          {[["40%", "85%", "60%"], ["30%", "75%", "50%"], ["45%", "80%", "55%"]].map(([a, b, c]) => (
            <div key={a} className="gp-card" style={{ padding: 18, borderRadius: 22, display: "flex", flexDirection: "column", gap: 12 }}>
              {sk({ width: a, height: 14 })}
              {sk({ width: b, height: 20 })}
              {sk({ width: c, height: 14 })}
              {sk({ height: 8, borderRadius: 4 })}
            </div>
          ))}
          <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: 13, color: "#475569" }}>{texto}</p>
        </div>
      </div>
    </div>
  );
}
