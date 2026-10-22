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

const SITUACAO: Record<SituacaoCurva, { rotulo: string; classe: string }> = {
  NO_PRAZO: { rotulo: "No prazo", classe: "bg-[rgba(159,211,0,0.2)] text-[#405700]" },
  ATRASADA: { rotulo: "Atrasada", classe: "bg-[#ffdad6] text-[#93000a]" },
  ADIANTADA: { rotulo: "Adiantada", classe: "bg-[rgba(161,196,255,0.3)] text-[#2a5085]" },
  SEM_CRONOGRAMA: { rotulo: "Sem cronograma", classe: "bg-[#f1f5f9] text-[#475569]" },
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

  return (
    <section className="bg-white border border-[#f1f5f9] rounded-[8px] p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-['Manrope'] font-extrabold text-[20px] text-[#001b3d] tracking-[-0.5px]">
            Curva S: planejado × realizado
          </h2>
          <p className="font-['Manrope'] text-[13px] text-[#64748b] mt-1">
            Avanço físico ponderado pelo custo orçado de cada etapa.
          </p>
        </div>
        {curva && (
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${SITUACAO[curva.situacao].classe}`}>
            {SITUACAO[curva.situacao].rotulo}
          </span>
        )}
      </div>

      {carregando && <p className="text-[14px] text-[#94a3b8]">Carregando Curva S…</p>}
      {erro && <p className="text-[14px] text-[#93000a]">{erro}</p>}

      {curva && curva.situacao === "SEM_CRONOGRAMA" && (
        <p className="text-[14px] text-[#64748b]">
          Defina as datas de início e fim das etapas em Editar Prazos para ver a Curva S.
        </p>
      )}

      {curva && curva.situacao !== "SEM_CRONOGRAMA" && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              ["Planejado hoje", formatarPontos(curva.planejado_hoje)],
              ["Realizado hoje", formatarPontos(curva.realizado_hoje)],
              ["Desvio", curva.desvio == null ? "—" : `${curva.desvio > 0 ? "+" : ""}${curva.desvio.toLocaleString("pt-BR")} p.p.`],
            ].map(([titulo, valor]) => (
              <div key={titulo} className="border border-[#f1f5f9] rounded-[8px] p-4">
                <div className="font-['JetBrains_Mono'] text-[10px] text-[#94a3b8] uppercase tracking-[0.5px]">{titulo}</div>
                <div className="font-['Manrope'] font-extrabold text-[22px] text-[#001b3d] mt-1">{valor}</div>
              </div>
            ))}
          </div>

          <div className="h-[280px]" role="img" aria-label="Gráfico da Curva S de planejado e realizado">
            <Line
              data={{
                labels: curva.pontos.map((p) => formatarDia(p.data)),
                datasets: [
                  {
                    label: "Planejado",
                    data: curva.pontos.map((p) => p.planejado),
                    borderColor: "#94a3b8",
                    borderDash: [6, 4],
                    pointRadius: 0,
                    tension: 0.3,
                  },
                  {
                    label: "Realizado",
                    data: curva.pontos.map((p) => p.realizado ?? null),
                    borderColor: "#9fd300",
                    backgroundColor: "rgba(159,211,0,0.15)",
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
                plugins: { legend: { position: "bottom" } },
                scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } },
              }}
            />
          </div>

          {curva.etapas_sem_cronograma > 0 && (
            <p className="text-[12px] text-[#94a3b8] mt-3">
              {curva.etapas_sem_cronograma} etapa(s) sem datas não entram no cálculo.
            </p>
          )}
        </>
      )}
    </section>
  );
}
