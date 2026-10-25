import Link from "next/link";
import Image from "next/image";
import logo from "@/../public/logo.png";

const ghost = { color: "#fff", border: "1px solid rgba(255,255,255,.3)" };

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh", boxSizing: "border-box", padding: "40px 56px", display: "flex", flexDirection: "column",
        backgroundColor: "#001b3d", backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)",
        backgroundSize: "22px 22px", color: "#fff",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", textDecoration: "none", alignSelf: "flex-start" }}>
        <span style={{ width: 44, height: 44, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image src={logo} alt="" width={28} height={34} style={{ objectFit: "contain" }} />
        </span>
        <span style={{ fontSize: 20, fontWeight: 800 }}>GP<span style={{ color: "#9fd300" }}>Obras</span></span>
      </Link>
      <main style={{ flex: "1 1 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 56, maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div aria-hidden="true" style={{ flex: "0 1 380px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span className="gp-mono" style={{ fontSize: 160, fontWeight: 600, lineHeight: 1, letterSpacing: -8, color: "#9fd300" }}>404</span>
          <span style={{ display: "block", width: 300, height: 22, borderRadius: 4, background: "repeating-linear-gradient(-45deg, #9fd300 0 22px, #001b3d 22px 40px)" }} />
          <span style={{ display: "flex", justifyContent: "space-between", width: 260 }}>
            <span style={{ width: 10, height: 34, background: "#cbd5e1" }} />
            <span style={{ width: 10, height: 34, background: "#cbd5e1" }} />
          </span>
        </div>
        <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: -1, lineHeight: 1.15 }}>Esta página não existe ou mudou de lugar</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "#cbd5e1" }}>
            O link pode estar incompleto, ou o orçamento ou a obra foi excluído. Use um dos caminhos abaixo.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            <Link href="/" className="gp-btn gp-bp">Ir para o início</Link>
            <Link href="/orcamentos" className="gp-btn" style={ghost}>Ver orçamentos</Link>
            <Link href="/obras" className="gp-btn" style={ghost}>Ver obras</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
