const sk = (style: React.CSSProperties) => <span className="gp-sk" style={style} />;

export function RouteLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando" aria-busy="true" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <span className="gp-sr">Carregando...</span>
      <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sk({ width: 140, height: 14 })}
        {sk({ width: 280, height: 32 })}
        {sk({ width: 360, height: 16, maxWidth: "100%" })}
      </div>
      <div aria-hidden="true" className="gp-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="gp-card gp-met">
            {sk({ width: "50%", height: 14 })}
            {sk({ width: "70%", height: 30 })}
            {sk({ width: "40%", height: 12 })}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="gp-card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
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
  );
}
