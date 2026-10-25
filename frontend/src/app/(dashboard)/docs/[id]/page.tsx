"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Funnel, UploadSimple, FilePdf, File, DotsThreeVertical, Camera, FileText, ShieldCheck } from "@phosphor-icons/react";

const NOMES: Record<string, string> = {
  aurora: "Residencial Aurora",
  viracopos: "Complexo Logístico",
  retrofit: "Retrofit Central",
  "parque-flores": "Parque das Flores",
};

const mainFiles = [
  { name: "Planta_Baixa_Pav01_V4.pdf", category: "Arquitetônico", revision: "Rev.04", date: "15 out 2026", size: "4,2 MB", type: "pdf" },
  { name: "Calculo_Estrutural_Final.dwg", category: "Engenharia civil", revision: "", date: "12 out 2026", size: "18,7 MB", type: "dwg" },
  { name: "Projeto_Eletrico_Rev01.pdf", category: "Instalações", revision: "", date: "08 out 2026", size: "2,1 MB", type: "pdf" },
];

const contractFiles = [
  { name: "Contrato_Fornecedor_Aço.pdf", statusText: "Assinado via DocuSign", date: "12 set 2026", size: "1,2 MB", cls: "gp-ok" },
  { name: "Aditivo_Prazo_Obra_01.pdf", statusText: "Pendente de assinatura", date: "05 out 2026", size: "0,8 MB", cls: "gp-wa" },
];

const licenseFiles = [
  { name: "Alvara_Construcao_2026_045.pdf", expiration: "12 dez 2027", statusText: "Válido", cls: "gp-ok" },
  { name: "Licenca_Ambiental_Previa.pdf", expiration: "30 out 2026", statusText: "Expira em breve", cls: "gp-wa" },
];

const fotos = ["Fundação · Setor A", "Equipe em campo", "Fachada Norte"];

const atividades = [
  { quem: "Ricardo M.", acao: "fez o upload de", alvo: "Planta_Baixa_Pav01_V4.pdf", quando: "Hoje, 14:32" },
  { quem: "Ana R.", acao: "assinou", alvo: "Contrato_Fornecedor_Aço.pdf", quando: "Ontem, 09:10" },
  { quem: "Sistema", acao: "avisou o vencimento de", alvo: "Licenca_Ambiental_Previa.pdf", quando: "08 out, 08:00" },
];

export default function ProjectDocsPage() {
  const id = useParams().id as string;
  const projectName = NOMES[id] ?? "Residencial Aurora";

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <nav aria-label="Trilha" className="gp-crumb"><Link href="/docs">Documentos</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>{projectName}</span></nav>
          <h1 className="gp-h1">{projectName}</h1>
          <p className="gp-sub">Arquivo técnico centralizado · atualizado há 2 horas</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="gp-btn gp-bs"><Funnel size={16} weight="bold" aria-hidden="true" />Filtrar</button>
          <button type="button" className="gp-btn gp-bp"><UploadSimple size={16} weight="bold" aria-hidden="true" />Enviar arquivos</button>
        </div>
      </div>

      <div className="gp-split">
        <section className="gp-card gp-main" aria-labelledby="h-pl" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #E6EBF2" }}>
            <h2 id="h-pl" className="gp-h2">Plantas e projetos</h2>
            <span className="gp-bg gp-ne">12 arquivos</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
              <caption className="gp-sr">Plantas e projetos</caption>
              <thead><tr><th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Arquivo</th><th scope="col" className="gp-th">Data</th><th scope="col" className="gp-th" style={{ textAlign: "right" }}>Tamanho</th><th scope="col" className="gp-th" style={{ paddingRight: 22 }}><span className="gp-sr">Ações</span></th></tr></thead>
              <tbody>
                {mainFiles.map((f) => (
                  <tr key={f.name} className="gp-row">
                    <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span aria-hidden="true" style={{ width: 38, height: 38, flex: "0 0 38px", borderRadius: 12, background: f.type === "pdf" ? "#FEE2E2" : "#e0f5f7", color: f.type === "pdf" ? "#B91C1C" : "#00626b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {f.type === "pdf" ? <FilePdf size={20} weight="bold" /> : <File size={20} weight="bold" />}
                        </span>
                        <span><span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{f.name}</span><span style={{ fontSize: 13, color: "#475569" }}>{f.category}{f.revision ? ` · ${f.revision}` : ""}</span></span>
                      </span>
                    </th>
                    <td className="gp-td" style={{ color: "#475569" }}>{f.date}</td>
                    <td className="gp-td gp-mono" style={{ textAlign: "right" }}>{f.size}</td>
                    <td className="gp-td" style={{ paddingRight: 22, textAlign: "right" }}><button type="button" className="gp-ib" aria-label={`Ações de ${f.name}`} style={{ width: 40, height: 40 }}><DotsThreeVertical size={18} weight="bold" aria-hidden="true" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="gp-card gp-pad gp-side" aria-labelledby="h-fo" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 id="h-fo" className="gp-h2">Fotos de campo</h2>
            <button type="button" className="gp-ib" aria-label="Adicionar foto" style={{ width: 40, height: 40 }}><Camera size={18} weight="bold" aria-hidden="true" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {fotos.map((t) => (
              <figure key={t} style={{ margin: 0, aspectRatio: "1", borderRadius: 14, background: "linear-gradient(135deg, #001b3d, #00a3b1)", color: "#fff", display: "flex", alignItems: "flex-end", padding: 10, boxSizing: "border-box" }}>
                <figcaption style={{ fontSize: 13, fontWeight: 800 }}>{t}</figcaption>
              </figure>
            ))}
            <button type="button" className="gp-btn gp-bs" style={{ aspectRatio: "1", height: "auto", flexDirection: "column", borderStyle: "dashed", borderRadius: 14 }}><Camera size={20} weight="bold" aria-hidden="true" />Ver mais</button>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 6 }}><span>Armazenamento</span><span className="gp-mono" style={{ fontWeight: 600, color: "#001b3d" }}>45%</span></div>
            <span className="gp-bar" role="progressbar" aria-label="Armazenamento usado" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100}><span style={{ width: "45%", background: "#00a3b1" }} /></span>
          </div>
        </aside>
      </div>

      <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
        <section className="gp-card gp-pad" aria-labelledby="h-co">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><h2 id="h-co" className="gp-h2">Contratos</h2><button type="button" className="gp-btn gp-bs gp-sm">Ver tudo</button></div>
          {contractFiles.map((c) => (
            <div key={c.name} className="gp-li">
              <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span aria-hidden="true" style={{ width: 38, height: 38, flex: "0 0 38px", borderRadius: 12, background: "#EDF1F6", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={20} weight="bold" /></span>
                <span><span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{c.name}</span><span style={{ fontSize: 13, color: "#475569" }}>{c.date} · {c.size}</span></span>
              </span>
              <span className={`gp-bg ${c.cls}`}><span className="gp-dot" aria-hidden="true" />{c.statusText}</span>
            </div>
          ))}
        </section>
        <section className="gp-card gp-pad" aria-labelledby="h-li">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><h2 id="h-li" className="gp-h2">Licenças e alvarás</h2><button type="button" className="gp-btn gp-bs gp-sm">Ver tudo</button></div>
          {licenseFiles.map((l) => (
            <div key={l.name} className="gp-li">
              <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span aria-hidden="true" style={{ width: 38, height: 38, flex: "0 0 38px", borderRadius: 12, background: "#EDF1F6", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={20} weight="bold" /></span>
                <span><span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{l.name}</span><span style={{ fontSize: 13, color: "#475569" }}>Vencimento: {l.expiration}</span></span>
              </span>
              <span className={`gp-bg ${l.cls}`}><span className="gp-dot" aria-hidden="true" />{l.statusText}</span>
            </div>
          ))}
        </section>
      </div>

      <section className="gp-card gp-pad" aria-labelledby="h-at">
        <h2 id="h-at" className="gp-h2">Atividades recentes</h2>
        <p className="gp-sub" style={{ marginBottom: 8 }}>Acessos e modificações nos documentos do projeto.</p>
        {atividades.map((a) => (
          <div key={a.alvo + a.quando} className="gp-li">
            <span style={{ fontSize: 15 }}><strong>{a.quem}</strong> {a.acao} <strong style={{ color: "#007a85" }}>{a.alvo}</strong></span>
            <span style={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>{a.quando}</span>
          </div>
        ))}
      </section>
    </>
  );
}
