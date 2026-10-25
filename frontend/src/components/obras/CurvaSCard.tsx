"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { getCurvaS, type CurvaS, type SituacaoCurva } from "@/lib/api/medicoes";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const SITUACAO: Record<SituacaoCurva, { rotulo: string; classe: string; texto: string }> = {
  NO_PRAZO: { rotulo: "No prazo", classe: "gp-ok", texto: "Obra no prazo" },
  ATRASADA: { rotulo: "Atrasada", classe: "gp-da", texto: "Obra atrasada" },
  ADIANTADA: { rotulo: "Adiantada", classe: "gp-te", texto: "Obra adiantada" },
  SEM_CRONOGRAMA: { rotulo: "Sem cronograma", classe: "gp-ne", texto: "Sem cronograma" },
};

function formatarDia(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function formatarPontos(valor?: number | null): string {
  return valor == null ? "—" : `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function CurvaSCard({ obraId }: { obraId: string }) {
  const [curva, setCurva] = useState<CurvaS | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    getCurvaS(obraId)
      .then((c) => ativo && setCurva(c))
      .catch((e) => ativo && setErro(e instanceof Error ? e.message : "Erro ao carregar a Curva S"))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [obraId]);

  const sit = curva ? SITUACAO[curva.situacao] : null;
  const comCurva = curva && curva.situacao !== "SEM_CRONOGRAMA";
  const desvio = curva?.desvio == null ? "—" : `${curva.desvio > 0 ? "+" : ""}${curva.desvio.toLocaleString("pt-BR")} p.p.`;
  const corDesvio = curva?.situacao === "ATRASADA" ? "#B91C1C" : curva?.situacao === "NO_PRAZO" || curva?.situacao === "ADIANTADA" ? "#3F6604" : undefined;
  const fundoDesvio = curva?.situacao === "ATRASADA" ? "#FEE2E2" : curva?.situacao === "NO_PRAZO" || curva?.situacao === "ADIANTADA" ? "#E6F6D0" : undefined;

  return (
    <div className="gp-split">
      <section className="gp-card gp-pad gp-main" aria-labelledby="h-cs" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h2 id="h-cs" className="gp-h2">Curva S: planejado × realizado</h2>
            <p className="gp-hint" style={{ margin: "4px 0 0" }}>Avanço físico ponderado pelo custo orçado de cada etapa.</p>
          </div>
          {sit && (
            <span className={`gp-bg ${sit.classe}`}>
              <span className="gp-dot" aria-hidden="true" />
              {sit.rotulo}
            </span>
          )}
        </div>

        {carregando && <p className="gp-hint">Carregando Curva S…</p>}
        {erro && <p style={{ margin: 0, fontSize: 14, color: "#B91C1C" }}>{erro}</p>}

        {curva && curva.situacao === "SEM_CRONOGRAMA" && (
          <p className="gp-hint" style={{ margin: 0 }}>
            Defina as datas de início e fim das etapas em Editar Prazos para ver a Curva S.
          </p>
        )}

        {comCurva && curva && (
          <>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: 16, fontSize: 13, fontWeight: 700 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden="true" style={{ width: 18, height: 0, borderTop: "3px dashed #94a3b8" }} />Planejado
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden="true" style={{ width: 18, height: 3, background: "#00a3b1" }} />Realizado
              </li>
            </ul>
            <div style={{ height: 280 }} role="img" aria-label={`Curva S: planejado ${formatarPontos(curva.planejado_hoje)} e realizado ${formatarPontos(curva.realizado_hoje)} hoje. ${sit?.texto}.`}>
              <Line
                data={{
                  labels: curva.pontos.map((p) => formatarDia(p.data)),
                  datasets: [
                    {
                      label: "Planejado",
                      data: curva.pontos.map((p) => p.planejado),
                      borderColor: "#94a3b8",
                      borderDash: [7, 6],
                      borderWidth: 3,
                      pointRadius: 0,
                      tension: 0.3,
                    },
                    {
                      label: "Realizado",
                      data: curva.pontos.map((p) => p.realizado ?? null),
                      borderColor: "#00a3b1",
                      backgroundColor: "rgba(0,163,177,0.12)",
                      borderWidth: 4,
                      fill: true,
                      pointRadius: 3,
                      tension: 0.3,
                      spanGaps: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } },
                }}
              />
            </div>
            {curva.etapas_sem_cronograma > 0 && (
              <p className="gp-hint" style={{ margin: 0 }}>
                {curva.etapas_sem_cronograma} etapa(s) sem datas não entram no cálculo.
              </p>
            )}
          </>
        )}
      </section>

      {comCurva && curva && (
        <div className="gp-side" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="gp-card gp-met gp-dark">
            <span className="gp-ml">Realizado hoje</span>
            <span className="gp-mv">{formatarPontos(curva.realizado_hoje)}</span>
          </div>
          <div className="gp-card gp-met">
            <span className="gp-ml">Planejado hoje</span>
            <span className="gp-mv">{formatarPontos(curva.planejado_hoje)}</span>
          </div>
          <div className="gp-card gp-met" style={{ background: fundoDesvio }}>
            <span className="gp-ml" style={{ color: corDesvio }}>Desvio</span>
            <span className="gp-mv" style={{ color: corDesvio }}>{desvio}</span>
            <span className="gp-ms" style={{ color: corDesvio }}>{sit?.texto}</span>
          </div>
        </div>
      )}
    </div>
  );
}
