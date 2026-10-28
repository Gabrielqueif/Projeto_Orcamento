import Link from "next/link";
import Image from "next/image";
import logo from "@/../public/logo.png";

const ghost = { color: "#fff", border: "1px solid rgba(255,255,255,.3)" };

/** 404. No mobile (artefato "Página não encontrada") tudo vira uma coluna com botões empilhados (.gp-4e-nf*). */
export default function NotFound() {
  return (
    <div
      className="gp-4e-nf"
      style={{
        minHeight: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column",
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
      <main className="gp-4e-nfm" style={{ flex: "1 1 auto", display: "flex", flexWrap: "wrap", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div aria-hidden="true" className="gp-4e-nfa" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span className="gp-mono gp-4e-nf404" style={{ fontWeight: 600, lineHeight: 1, color: "#9fd300" }}>404</span>
          <span className="gp-4e-nfbar" style={{ display: "block", borderRadius: 4, background: "repeating-linear-gradient(-45deg, #9fd300 0 22px, #001b3d 22px 40px)" }} />
          <span className="gp-4e-nfpes" style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ width: 10, height: 34, background: "#cbd5e1" }} />
            <span style={{ width: 10, height: 34, background: "#cbd5e1" }} />
          </span>
        </div>
        <div style={{ flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 16 }}>
          <h1 className="gp-4e-nft" style={{ margin: 0, fontWeight: 800, lineHeight: 1.15 }}>Esta página não existe ou mudou de lugar</h1>
          <p className="gp-4e-nfp" style={{ margin: 0, lineHeight: 1.6, color: "#cbd5e1" }}>
            O link pode estar incompleto, ou o orçamento ou a obra foi excluído. Use um dos caminhos abaixo.
          </p>
          <div className="gp-4e-stack" style={{ flexWrap: "wrap", marginTop: 8 }}>
            <Link href="/" className="gp-btn gp-bp">Ir para o início</Link>
            <Link href="/orcamentos" className="gp-btn" style={ghost}>Ver orçamentos</Link>
            <Link href="/obras" className="gp-btn" style={ghost}>Ver obras</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
