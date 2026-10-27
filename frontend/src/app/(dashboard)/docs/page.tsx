"use client";

import Link from "next/link";
import { FolderPlus, Folder, ArrowRight, FilePdf, FileText, DownloadSimple } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";

type Situacao = "conformidade" | "vencidos" | "pendencias";

interface ProjectRepo {
  id: string;
  name: string;
  client: string;
  status: Situacao;
  metricLabel: string;
  metricValue: number;
  metricMax: number;
  storageUsed: string;
}

const projects: ProjectRepo[] = [
  { id: "aurora", name: "Residencial Aurora Sky", client: "Construtora Horizonte Sul", status: "conformidade", metricLabel: "Documentos técnicos", metricValue: 142, metricMax: 142, storageUsed: "1,2 GB" },
  { id: "viracopos", name: "Complexo Logístico Viracopos", client: "LogisTrans S.A.", status: "vencidos", metricLabel: "Alvarás e licenças", metricValue: 12, metricMax: 15, storageUsed: "845 MB" },
  { id: "retrofit", name: "Retrofit Edifício Central", client: "Investimentos Imob.", status: "pendencias", metricLabel: "Segurança do trabalho", metricValue: 8, metricMax: 24, storageUsed: "2,1 GB" },
  { id: "parque-flores", name: "Urbanização Parque das Flores", client: "Prefeitura Municipal", status: "conformidade", metricLabel: "Projetos executivos", metricValue: 89, metricMax: 89, storageUsed: "456 MB" },
];

// Mesmas famílias de cor do artefato: ok (verde), wa (laranja), da (vermelho).
const SIT: Record<Situacao, { texto: string; cls: string; barra: string }> = {
  conformidade: { texto: "Em conformidade", cls: "gp-ok", barra: "#65A30D" },
  vencidos: { texto: "Documentos vencidos", cls: "gp-wa", barra: "#F97316" },
  pendencias: { texto: "Pendências críticas", cls: "gp-da", barra: "#DC2626" },
};

const recentDocs = [
  { id: "1", name: "Planta_Baixa_Pav01_V4.pdf", project: "Residencial Aurora Sky", date: "Hoje, 10:45", type: "pdf" },
  { id: "2", name: "Calculo_Estrutural_Final.dwg", project: "Complexo Logístico Viracopos", date: "Ontem, 16:20", type: "dwg" },
  { id: "3", name: "Projeto_Eletrico_Rev01.pdf", project: "Retrofit Edifício Central", date: "08 out 2026", type: "pdf" },
];

export default function DocsPage() {
  return (
    <>
      <PageHeader
        crumb={<>Gestão / <span aria-current="page" style={{ color: "#001b3d" }}>Documentos</span></>}
        eyebrow="Gestão"
        back="/mais"
        title="Repositório de projetos"
        subtitle="Conformidade técnica e legal das obras ativas."
        actions={
          <button type="button" className="gp-btn gp-bp">
            <FolderPlus size={18} weight="bold" aria-hidden="true" /> Novo repositório
          </button>
        }
      />

      <section aria-label="Indicadores" className="gp-grid">
        <div className="gp-card gp-met gp-dark"><span className="gp-ml">Total de arquivos</span><span className="gp-mv">2.842</span><span className="gp-ms">em 4 repositórios</span></div>
        <div className="gp-card gp-met"><span className="gp-ml">Em conformidade</span><span className="gp-mv">18</span><span className="gp-ms">obras</span></div>
        <div className="gp-card gp-met"><span className="gp-ml">Pendências críticas</span><span className="gp-mv" style={{ color: "#9A3412" }}>04</span><span className="gp-ms">exigem ação</span></div>
        <div className="gp-card gp-met"><span className="gp-ml">Vencidos</span><span className="gp-mv" style={{ color: "#B91C1C" }}>07</span><span className="gp-ms">documentos</span></div>
      </section>

      <section aria-labelledby="h-rep" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="h-rep" className="gp-h2">Repositórios</h2>
        <div className="gp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {projects.map((p) => {
            const s = SIT[p.status];
            const pct = Math.round((p.metricValue / p.metricMax) * 100);
            return (
              <article key={p.id} className="gp-card gp-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: "#F4F6FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Folder size={24} weight="fill" color={s.barra} />
                  </span>
                  <span className={`gp-bg ${s.cls}`}><span className="gp-dot" aria-hidden="true" />{s.texto}</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{p.name}</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 14, color: "#475569" }}>Cliente: {p.client}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
                    <span>{p.metricLabel}</span>
                    <span className="gp-mono" style={{ fontWeight: 600, color: "#001b3d" }}>{p.metricValue}/{p.metricMax}</span>
                  </div>
                  <span className="gp-bar" role="progressbar" aria-label={`${p.metricLabel} de ${p.name}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${pct}%`, background: s.barra }} />
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #E6EBF2" }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>{p.storageUsed} armazenados</span>
                  <Link href={`/docs/${p.id}`} className="gp-btn gp-bs gp-sm">Acessar pasta <ArrowRight size={14} weight="bold" aria-hidden="true" /></Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="gp-split">
        <section className="gp-card gp-main" aria-labelledby="h-rec" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #E6EBF2" }}>
            <h2 id="h-rec" className="gp-h2">Documentos recentes</h2>
            <button type="button" className="gp-btn gp-bs gp-sm">Ver todos</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
              <caption className="gp-sr">Documentos recentes</caption>
              <thead><tr><th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Documento</th><th scope="col" className="gp-th">Projeto</th><th scope="col" className="gp-th">Data</th><th scope="col" className="gp-th" style={{ paddingRight: 22 }}><span className="gp-sr">Baixar</span></th></tr></thead>
              <tbody>
                {recentDocs.map((d) => (
                  <tr key={d.id} className="gp-row">
                    <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, background: d.type === "pdf" ? "#FEE2E2" : "#e0f5f7", color: d.type === "pdf" ? "#B91C1C" : "#00626b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {d.type === "pdf" ? <FilePdf size={20} weight="bold" /> : <FileText size={20} weight="bold" />}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>{d.name}</span>
                      </span>
                    </th>
                    <td className="gp-td" style={{ color: "#475569" }}>{d.project}</td>
                    <td className="gp-td" style={{ color: "#475569" }}>{d.date}</td>
                    <td className="gp-td" style={{ paddingRight: 22, textAlign: "right" }}>
                      <button type="button" className="gp-ib" aria-label={`Baixar ${d.name}`} style={{ width: 40, height: 40 }}><DownloadSimple size={18} weight="bold" aria-hidden="true" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="gp-card gp-pad gp-side" aria-labelledby="h-arm" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 id="h-arm" className="gp-h2">Armazenamento</h2>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span className="gp-mv">74%</span><span className="gp-ms">de 22 GB</span>
          </div>
          <span className="gp-bar" role="progressbar" aria-label="Capacidade usada" aria-valuenow={74} aria-valuemin={0} aria-valuemax={100}><span style={{ width: "74%", background: "#00a3b1" }} /></span>
          <div className="gp-li"><span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}><span className="gp-dot" aria-hidden="true" style={{ background: "#001b3d" }} />Arquivos de desenho</span><span className="gp-mono" style={{ fontWeight: 600 }}>12,4 GB</span></div>
          <div className="gp-li"><span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}><span className="gp-dot" aria-hidden="true" style={{ background: "#9fd300" }} />Relatórios e docs</span><span className="gp-mono" style={{ fontWeight: 600 }}>4,2 GB</span></div>
        </aside>
      </div>
    </>
  );
}
