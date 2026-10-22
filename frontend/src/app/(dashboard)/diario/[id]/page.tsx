"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Cloud, CloudRain, MapPin, Plus, Sun, User, Warning } from "@phosphor-icons/react";
import { DiarioFormModal } from "@/components/diario/DiarioFormModal";
import { useToast } from "@/components/common/toast";
import {
  alterarStatusDiario,
  excluirDiario,
  getDiarios,
  type Clima,
  type Diario,
  type DiarioListagem,
  type StatusDiario,
} from "@/lib/api/diario";

const CLIMAS: Record<Clima, { rotulo: string; Icone: typeof Sun }> = {
  SOL: { rotulo: "Sol", Icone: Sun },
  NUBLADO: { rotulo: "Nublado", Icone: Cloud },
  CHUVA: { rotulo: "Chuva", Icone: CloudRain },
};

const STATUS_ESTILO: Record<StatusDiario, { rotulo: string; classe: string }> = {
  RASCUNHO: { rotulo: "RASCUNHO", classe: "bg-[#f1f5f9] text-[#475569]" },
  ENVIADO: { rotulo: "ENVIADO", classe: "bg-[rgba(161,196,255,0.3)] text-[#2a5085]" },
  APROVADO: { rotulo: "APROVADO", classe: "bg-[rgba(159,211,0,0.2)] text-[#405700]" },
};

type FiltroStatus = "TODOS" | StatusDiario;

function parseData(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarData(iso: string): string {
  return parseData(iso)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "")
    .toUpperCase();
}

function diaDaSemana(iso: string): string {
  return parseData(iso).toLocaleDateString("pt-BR", { weekday: "long" });
}

function formatarAtualizacao(iso?: string | null): string {
  if (!iso) return "sem registros";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function DiarioObraPage() {
  const params = useParams();
  const obraId = params.id as string;
  const { showToast } = useToast();

  const [dados, setDados] = useState<DiarioListagem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroStatus>("TODOS");
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Diario | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setDados(await getDiarios(obraId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o diário");
    } finally {
      setCarregando(false);
    }
  }, [obraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const mudarStatus = async (registro: Diario, status: StatusDiario) => {
    try {
      await alterarStatusDiario(obraId, registro.id, status);
      await carregar();
    } catch (e) {
      showToast("Não foi possível alterar o status", e instanceof Error ? e.message : undefined, "error");
    }
  };

  const excluir = async (registro: Diario) => {
    if (!window.confirm(`Excluir o diário de ${formatarData(registro.data)}? As fotos também serão apagadas.`)) return;
    try {
      await excluirDiario(obraId, registro.id);
      showToast("Diário excluído", undefined, "success");
      await carregar();
    } catch (e) {
      showToast("Não foi possível excluir", e instanceof Error ? e.message : undefined, "error");
    }
  };

  const abrirNovo = () => {
    setEmEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (registro: Diario) => {
    setEmEdicao(registro);
    setModalAberto(true);
  };

  if (carregando) {
    return <p className="p-12 text-center text-[14px] text-[#94a3b8] font-manrope">Carregando diário da obra…</p>;
  }

  if (erro || !dados) {
    return (
      <div className="p-12 text-center font-manrope">
        <p className="text-[14px] text-[#93000a]">{erro ?? "Obra não encontrada."}</p>
        <Link href="/diario" className="inline-block mt-4 text-[13px] font-bold text-[#4c6700] hover:underline">
          Voltar ao diário
        </Link>
      </div>
    );
  }

  const { obra, registros } = dados;
  const visiveis = filtro === "TODOS" ? registros : registros.filter((r) => r.status === filtro);

  return (
    <div className="flex flex-col h-full font-manrope">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/diario"
          aria-label="Voltar"
          className="w-10 h-10 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#001b3c] hover:bg-slate-50"
        >
          <ArrowLeft size={18} weight="bold" />
        </Link>
        <div>
          <h1 className="text-[24px] font-extrabold text-[#001b3c] tracking-tight">Diário de Obra</h1>
          <p className="text-sm text-[#64748b] mt-1">{obra.nome}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-[12px] p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[220px]">
          <div>
            <h2 className="text-[32px] font-extrabold text-[#001b3c] tracking-tight">{obra.nome}</h2>
            <p className="text-[15px] text-[#434935] mt-2 max-w-[500px] leading-[22px]">
              Registros diários de atividades, clima, equipe e ocorrências do canteiro.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-4 mt-6 border-t border-[#e2e8f0] pt-4">
            {obra.prazo_dias != null && (
              <div>
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px]">Prazo</span>
                <div className="text-[20px] font-extrabold text-[#001b3c] mt-0.5">
                  {obra.prazo_dias} <span className="text-sm font-semibold text-[#94a3b8]">dias</span>
                </div>
              </div>
            )}
            {obra.local && (
              <div>
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px]">Localização</span>
                <div className="text-[15px] font-bold text-[#001b3c] mt-1 flex items-center gap-1.5">
                  <MapPin size={16} className="text-[#64748b]" weight="bold" />
                  {obra.local}
                </div>
              </div>
            )}
            {obra.responsavel && (
              <div>
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[1px]">Responsável</span>
                <div className="text-[15px] font-bold text-[#001b3c] mt-1">{obra.responsavel}</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#003061] text-white rounded-[12px] p-8 flex flex-col items-center justify-between shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] min-h-[220px]">
          <span className="text-[12px] font-bold text-slate-300 uppercase tracking-[1px]">Progresso da Obra</span>
          <div className="relative w-28 h-28 flex items-center justify-center my-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-500/30"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#9fd300]"
                strokeWidth="3"
                strokeDasharray={`${obra.progresso}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
              <span className="text-[26px] font-extrabold">{obra.progresso}%</span>
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.8px] mt-0.5">Completo</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-300">Último registro alterado em {formatarAtualizacao(obra.ultima_atualizacao)}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="w-[8px] h-[32px] rounded-full bg-gradient-to-b from-[#4c6700] to-[#9fd300]" />
            <h3 className="text-[20px] font-extrabold text-[#001b3c] tracking-tight">Linha do Tempo</h3>
          </div>
          <div className="flex gap-2">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as FiltroStatus)}
              aria-label="Filtrar por status"
              className="bg-[#f0f3ff] text-[#434935] text-[12px] font-bold px-4 py-2.5 rounded-[12px] cursor-pointer"
            >
              <option value="TODOS">Todos os status</option>
              <option value="RASCUNHO">Rascunhos</option>
              <option value="ENVIADO">Enviados</option>
              <option value="APROVADO">Aprovados</option>
            </select>
            <button
              onClick={abrirNovo}
              className="bg-gradient-to-r from-[#4c6700] to-[#9fd300] hover:opacity-95 text-white text-[12px] font-bold px-4 py-2.5 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(76,103,0,0.2)] cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} weight="bold" /> Novo Registro
            </button>
          </div>
        </div>

        {visiveis.length === 0 ? (
          <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-12 text-center">
            <p className="text-[15px] text-[#434935]">
              {registros.length === 0 ? "Nenhum registro ainda. Comece pelo diário de hoje." : "Nenhum registro com esse status."}
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-[#e2e8f0] ml-6 pl-8 flex flex-col gap-10">
            {visiveis.map((registro, index) => {
              const { rotulo, Icone } = CLIMAS[registro.clima];
              const status = STATUS_ESTILO[registro.status];
              const editavel = registro.status !== "APROVADO";
              return (
                <div key={registro.id} className="relative">
                  <div
                    className={`absolute left-[-41px] top-1.5 w-[20px] h-[20px] rounded-full border-4 border-[#f8fafc] ${
                      index === 0 ? "bg-[#9fd300]" : "bg-[#94a3b8]"
                    }`}
                  />
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="w-[128px] shrink-0 pt-1">
                      <span className="block text-[12px] font-bold text-[#434935]">{formatarData(registro.data)}</span>
                      <span className="block text-[10px] font-bold text-[#94a3b8] uppercase mt-0.5">
                        {diaDaSemana(registro.data)}
                      </span>
                    </div>

                    <div className="flex-1 bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] w-full">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="text-[18px] font-bold text-[#001b3c] tracking-tight">{registro.titulo}</h4>
                          <p className="text-[14px] text-[#64748b] mt-1.5 leading-[20px] whitespace-pre-line">
                            {registro.atividades}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.5px] ${status.classe}`}>
                            {status.rotulo}
                          </span>
                          {registro.tem_ocorrencia && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[rgba(255,218,214,0.4)] text-[#93000a]">
                              <Warning size={12} weight="fill" /> OCORRÊNCIA
                            </span>
                          )}
                        </div>
                      </div>

                      {registro.tem_ocorrencia && (
                        <p className="mt-4 text-[13px] text-[#93000a] bg-[rgba(255,218,214,0.25)] rounded-[8px] px-3 py-2 whitespace-pre-line">
                          {registro.ocorrencias}
                        </p>
                      )}

                      {registro.fotos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                          {registro.fotos.map((foto, i) =>
                            foto.url ? (
                              <a
                                key={foto.id}
                                href={foto.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-video w-full rounded-[8px] overflow-hidden border border-[#e2e8f0] shadow-sm group"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={foto.url}
                                  alt={foto.legenda ?? `Foto ${i + 1} de ${registro.titulo}`}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                                />
                              </a>
                            ) : (
                              <div
                                key={foto.id}
                                className="aspect-video w-full rounded-[8px] bg-[#f1f5f9] flex items-center justify-center text-[11px] text-[#94a3b8]"
                              >
                                Foto indisponível
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="border-t border-[#f1f5f9] mt-6 pt-4 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
                        <div className="flex flex-wrap gap-6 items-center text-[#94a3b8]">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1px]">
                            <Icone size={16} weight="bold" /> {rotulo}
                            {registro.temperatura != null && ` / ${registro.temperatura}°C`}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1px]">
                            <User size={16} weight="bold" /> {registro.responsavel || "Sem responsável"} · {registro.equipe_presente} na equipe
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[12px] font-bold">
                          {registro.status === "RASCUNHO" && (
                            <button onClick={() => mudarStatus(registro, "ENVIADO")} className="px-3 py-1.5 rounded-[8px] bg-[#001b3c] text-white">
                              Enviar
                            </button>
                          )}
                          {registro.status === "ENVIADO" && (
                            <>
                              <button onClick={() => mudarStatus(registro, "APROVADO")} className="px-3 py-1.5 rounded-[8px] bg-[#4c6700] text-white">
                                Aprovar
                              </button>
                              <button onClick={() => mudarStatus(registro, "RASCUNHO")} className="px-3 py-1.5 rounded-[8px] bg-[#f0f3ff] text-[#434935]">
                                Devolver
                              </button>
                            </>
                          )}
                          {registro.status === "APROVADO" && (
                            <button onClick={() => mudarStatus(registro, "ENVIADO")} className="px-3 py-1.5 rounded-[8px] bg-[#f0f3ff] text-[#434935]">
                              Reabrir
                            </button>
                          )}
                          {editavel && (
                            <>
                              <button onClick={() => abrirEdicao(registro)} className="px-3 py-1.5 rounded-[8px] bg-[#f0f3ff] text-[#434935]">
                                Editar
                              </button>
                              <button onClick={() => excluir(registro)} className="px-3 py-1.5 rounded-[8px] text-[#93000a] hover:bg-[#ffdad6]">
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DiarioFormModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        obraId={obraId}
        registro={emEdicao}
        responsavelPadrao={obra.responsavel}
        onSaved={carregar}
      />
    </div>
  );
}
