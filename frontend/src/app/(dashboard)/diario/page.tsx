"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Buildings, Cloud, CloudRain, Sun, Warning } from "@phosphor-icons/react";
import {
  getResumoDiario,
  type Clima,
  type ResumoDiario,
  type SituacaoDiario,
} from "@/lib/api/diario";

const SITUACOES: Record<SituacaoDiario, { rotulo: string; fundo: string; ponto: string; texto: string }> = {
  ENVIADO: { rotulo: "ENVIADO", fundo: "bg-[rgba(159,211,0,0.2)]", ponto: "bg-[#4c6700]", texto: "text-[#405700]" },
  RASCUNHO: { rotulo: "RASCUNHO", fundo: "bg-[#f1f5f9]", ponto: "bg-[#64748b]", texto: "text-[#475569]" },
  PENDENTE: { rotulo: "PENDENTE", fundo: "bg-[rgba(161,196,255,0.3)]", ponto: "bg-[#3a5f94]", texto: "text-[#2a5085]" },
  ALERTA: { rotulo: "ALERTA", fundo: "bg-[rgba(255,218,214,0.4)]", ponto: "bg-[#ba1a1a]", texto: "text-[#93000a]" },
};

function IconeClima({ clima }: { clima?: Clima | null }) {
  if (clima === "SOL") return <Sun weight="fill" className="text-[#F59E0B] text-[24px]" aria-label="Sol" />;
  if (clima === "NUBLADO") return <Cloud weight="fill" className="text-[#94a3b8] text-[24px]" aria-label="Nublado" />;
  if (clima === "CHUVA") return <CloudRain weight="fill" className="text-[#2a5085] text-[24px]" aria-label="Chuva" />;
  return <span className="text-[#cbd5e1]">—</span>;
}

function descreverUltimoRegistro(data?: string | null): string {
  if (!data) return "Sem registros";
  const [ano, mes, dia] = data.split("-").map(Number);
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((hoje.getTime() - alvo.getTime()) / 86_400_000);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  return `Há ${dias} dias`;
}

export default function DiarioVisaoPage() {
  const router = useRouter();
  const [resumo, setResumo] = useState<ResumoDiario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [soAlertas, setSoAlertas] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      setResumo(await getResumoDiario());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o diário");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return <p className="p-12 text-center text-[14px] text-[#94a3b8] font-manrope">Carregando diário de obra…</p>;
  }

  if (erro || !resumo) {
    return (
      <div className="p-12 text-center font-manrope">
        <p className="text-[14px] text-[#93000a]">{erro ?? "Não foi possível carregar o diário."}</p>
        <button onClick={carregar} className="mt-4 px-4 py-2 rounded-[8px] bg-[#f0f3ff] text-[13px] font-bold text-[#001b3c]">
          Tentar novamente
        </button>
      </div>
    );
  }

  const obras = soAlertas ? resumo.obras.filter((o) => o.situacao === "ALERTA") : resumo.obras;

  return (
    <div className="flex flex-col h-full font-manrope">
      <div className="mb-8">
        <h1 className="text-[24px] font-extrabold text-[#001b3c] tracking-tight">Visão Geral</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-[12px] p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="absolute bg-[rgba(159,211,0,0.15)] blur-[32px] right-[-48px] rounded-full w-[192px] h-[192px] top-[-48px] pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">Preenchimento (7 dias)</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[48px] font-extrabold text-[#001b3c] leading-none">{resumo.taxa_preenchimento_7d}%</span>
              <span className="text-[20px] font-bold text-[#4c6700]">dos dias com diário</span>
            </div>
            <p className="mt-4 text-[15px] text-[#434935] max-w-[480px] leading-[24px]">
              {resumo.total_obras === 0
                ? "Nenhuma obra ativa no momento."
                : `${resumo.enviados_hoje} de ${resumo.total_obras} obras ativas já enviaram o diário de hoje.`}
            </p>
          </div>
        </div>

        <div className="bg-[#ffdad6] rounded-[12px] p-8 flex flex-col justify-between min-h-[220px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[#93000a]">
          <div>
            <Warning weight="fill" className="text-[#93000a] text-[28px] mb-4" />
            <h3 className="text-[30px] font-extrabold tracking-tight leading-none">
              {String(resumo.alertas).padStart(2, "0")} {resumo.alertas === 1 ? "Alerta" : "Alertas"}
            </h3>
            <p className="mt-2 text-[14px] text-[rgba(147,0,10,0.8)] leading-[20px]">
              Obras há dois dias ou mais sem diário.
            </p>
          </div>
          {resumo.alertas > 0 && (
            <button
              onClick={() => setSoAlertas((v) => !v)}
              className="text-left text-[14px] font-bold text-[#93000a] hover:underline mt-6"
            >
              {soAlertas ? "Mostrar todas as obras" : "Ver só as obras em alerta"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 px-1">
        <h2 className="text-[24px] font-extrabold text-[#001b3c] tracking-tight">Projetos Ativos</h2>
        <p className="text-[14px] text-[#434935] mt-1">Situação do diário de cada obra em andamento.</p>
      </div>

      {obras.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-12 text-center">
          <p className="text-[15px] text-[#434935]">
            {resumo.total_obras === 0 ? "Você ainda não tem obras em andamento." : "Nenhuma obra em alerta."}
          </p>
          {resumo.total_obras === 0 && (
            <Link href="/obras/novo" className="inline-block mt-4 text-[14px] font-bold text-[#4c6700] hover:underline">
              Criar uma obra
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#e2e8f0] overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f0f3ff]/40 border-b border-[#e2e8f0]">
                <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">Projeto</th>
                <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">Gestor</th>
                <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px]">Último registro</th>
                <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px] text-center">Clima</th>
                <th className="py-4 px-6 text-[12px] font-bold text-[#747a62] uppercase tracking-[1.2px] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/50">
              {obras.map((obra) => {
                const estilo = SITUACOES[obra.situacao];
                return (
                  <tr
                    key={obra.obra_id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/diario/${obra.obra_id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[8px] bg-[#e7eeff] text-[#001b3c] flex items-center justify-center shrink-0">
                          <Buildings weight="fill" size={20} />
                        </div>
                        <div>
                          <Link
                            href={`/diario/${obra.obra_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[16px] font-bold text-[#001b3c] no-underline"
                          >
                            {obra.nome}
                          </Link>
                          {obra.local && <div className="text-[12px] text-[#434935] mt-0.5">{obra.local}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[14px] font-medium text-[#001b3c]">{obra.responsavel ?? "—"}</td>
                    <td className="py-4 px-6 text-[14px] text-[#434935]">{descreverUltimoRegistro(obra.ultimo_registro)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        <IconeClima clima={obra.ultimo_clima} />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${estilo.fundo} ${estilo.texto}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${estilo.ponto}`}></span> {estilo.rotulo}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
