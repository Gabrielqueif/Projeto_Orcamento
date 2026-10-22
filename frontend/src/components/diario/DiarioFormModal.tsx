"use client";

import { useState } from "react";
import { Cloud, CloudRain, Sun, X } from "@phosphor-icons/react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/common/toast";
import {
  atualizarDiario,
  criarDiario,
  enviarFotoDiario,
  removerFotoDiario,
  type Clima,
  type Diario,
  type FotoDiario,
} from "@/lib/api/diario";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAX_FOTO = 5 * 1024 * 1024;
const MAX_FOTOS = 10;

const CLIMAS: { valor: Clima; rotulo: string; Icone: typeof Sun }[] = [
  { valor: "SOL", rotulo: "Sol", Icone: Sun },
  { valor: "NUBLADO", rotulo: "Nublado", Icone: Cloud },
  { valor: "CHUVA", rotulo: "Chuva", Icone: CloudRain },
];

function hojeLocal(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  registro: Diario | null;
  responsavelPadrao?: string | null;
  onSaved: () => void;
}

const campo =
  "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] text-[#001b3c] bg-white focus:outline-none focus:border-[#4c6700]";
const rotulo = "block text-[11px] font-bold text-[#747a62] uppercase tracking-[1px] mb-1.5";

export function DiarioFormModal({ isOpen, onClose, obraId, registro, responsavelPadrao, onSaved }: Props) {
  // O Modal desmonta o conteúdo ao fechar; a chave refaz o estado ao trocar de registro.
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={registro ? "Editar registro" : "Novo registro"} maxWidth="max-w-2xl">
      <FormularioDiario
        key={registro?.id ?? "novo"}
        onClose={onClose}
        obraId={obraId}
        registro={registro}
        responsavelPadrao={responsavelPadrao}
        onSaved={onSaved}
      />
    </Modal>
  );
}

function FormularioDiario({ onClose, obraId, registro, responsavelPadrao, onSaved }: Omit<Props, "isOpen">) {
  const { showToast } = useToast();
  const [data, setData] = useState(registro?.data ?? hojeLocal());
  const [titulo, setTitulo] = useState(registro?.titulo ?? "");
  const [atividades, setAtividades] = useState(registro?.atividades ?? "");
  const [ocorrencias, setOcorrencias] = useState(registro?.ocorrencias ?? "");
  const [clima, setClima] = useState<Clima>(registro?.clima ?? "SOL");
  const [temperatura, setTemperatura] = useState(registro?.temperatura != null ? String(registro.temperatura) : "");
  const [equipe, setEquipe] = useState(String(registro?.equipe_presente ?? 0));
  const [responsavel, setResponsavel] = useState(registro?.responsavel ?? responsavelPadrao ?? "");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [fotosAtuais, setFotosAtuais] = useState<FotoDiario[]>(registro?.fotos ?? []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const escolherArquivos = (lista: FileList | null) => {
    if (!lista) return;
    const novos: File[] = [];
    for (const f of Array.from(lista)) {
      if (!TIPOS_ACEITOS.includes(f.type)) {
        setErro(`"${f.name}" não é JPG, PNG ou WEBP.`);
        return;
      }
      if (f.size > TAMANHO_MAX_FOTO) {
        setErro(`"${f.name}" passa de 5 MB.`);
        return;
      }
      novos.push(f);
    }
    if (fotosAtuais.length + arquivos.length + novos.length > MAX_FOTOS) {
      setErro(`Cada diário aceita até ${MAX_FOTOS} fotos.`);
      return;
    }
    setErro(null);
    setArquivos((atual) => [...atual, ...novos]);
  };

  const removerFotoSalva = async (foto: FotoDiario) => {
    if (!registro) return;
    try {
      await removerFotoDiario(obraId, registro.id, foto.id);
      setFotosAtuais((atual) => atual.filter((f) => f.id !== foto.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover a foto");
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const dados = {
        data,
        titulo: titulo.trim(),
        atividades: atividades.trim(),
        ocorrencias: ocorrencias.trim() || null,
        clima,
        temperatura: temperatura.trim() === "" ? null : Number(temperatura.replace(",", ".")),
        equipe_presente: Number(equipe) || 0,
        responsavel: responsavel.trim() || null,
      };
      const salvo = registro
        ? await atualizarDiario(obraId, registro.id, dados)
        : await criarDiario(obraId, dados);

      const falhas: string[] = [];
      for (const arquivo of arquivos) {
        try {
          await enviarFotoDiario(obraId, salvo.id, arquivo);
        } catch (err) {
          falhas.push(err instanceof Error ? err.message : arquivo.name);
        }
      }
      if (falhas.length > 0) {
        showToast("Diário salvo, mas algumas fotos falharam", falhas.join("; "), "warning");
      } else {
        showToast("Diário salvo", undefined, "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar o diário");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <form onSubmit={salvar} className="flex flex-col gap-4 font-manrope">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={rotulo} htmlFor="diario-data">Data</label>
            <input id="diario-data" type="date" required max={hojeLocal()} value={data}
              onChange={(e) => setData(e.target.value)} className={campo} />
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="diario-titulo">Título</label>
            <input id="diario-titulo" required maxLength={255} value={titulo}
              onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Concretagem da laje L2" className={campo} />
          </div>
        </div>

        <div>
          <span className={rotulo}>Clima</span>
          <div className="flex gap-2">
            {CLIMAS.map(({ valor, rotulo: nome, Icone }) => (
              <button key={valor} type="button" onClick={() => setClima(valor)} aria-pressed={clima === valor}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[8px] border text-[13px] font-bold transition-colors ${
                  clima === valor
                    ? "border-[#4c6700] bg-[rgba(159,211,0,0.15)] text-[#405700]"
                    : "border-[#e2e8f0] text-[#64748b] hover:bg-slate-50"
                }`}>
                <Icone size={18} weight="fill" /> {nome}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={rotulo} htmlFor="diario-temp">Temperatura (°C)</label>
            <input id="diario-temp" inputMode="decimal" value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)} placeholder="28" className={campo} />
          </div>
          <div>
            <label className={rotulo} htmlFor="diario-equipe">Equipe presente</label>
            <input id="diario-equipe" type="number" min={0} max={10000} value={equipe}
              onChange={(e) => setEquipe(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo} htmlFor="diario-resp">Responsável</label>
            <input id="diario-resp" maxLength={150} value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)} className={campo} />
          </div>
        </div>

        <div>
          <label className={rotulo} htmlFor="diario-atividades">Atividades executadas</label>
          <textarea id="diario-atividades" required rows={4} value={atividades}
            onChange={(e) => setAtividades(e.target.value)} className={campo} />
        </div>

        <div>
          <label className={rotulo} htmlFor="diario-ocorrencias">Ocorrências (opcional)</label>
          <textarea id="diario-ocorrencias" rows={3} value={ocorrencias}
            onChange={(e) => setOcorrencias(e.target.value)}
            placeholder="Paralisações, acidentes, falta de material…" className={campo} />
        </div>

        <div>
          <span className={rotulo}>Fotos ({fotosAtuais.length + arquivos.length}/{MAX_FOTOS})</span>
          <div className="flex flex-wrap gap-3">
            {fotosAtuais.map((foto) => (
              <div key={foto.id} className="relative w-20 h-20 rounded-[8px] overflow-hidden border border-[#e2e8f0]">
                {foto.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto.url} alt={foto.legenda ?? "Foto do diário"} className="object-cover w-full h-full" />
                )}
                <button type="button" onClick={() => removerFotoSalva(foto)} aria-label="Remover foto"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
            {arquivos.map((arquivo, i) => (
              <div key={`${arquivo.name}-${i}`}
                className="relative w-20 h-20 rounded-[8px] border border-dashed border-[#9fd300] bg-[rgba(159,211,0,0.08)] p-1.5 text-[10px] text-[#405700] break-all overflow-hidden">
                {arquivo.name}
                <button type="button" onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}
                  aria-label={`Descartar ${arquivo.name}`}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
            {fotosAtuais.length + arquivos.length < MAX_FOTOS && (
              <label className="w-20 h-20 rounded-[8px] border border-dashed border-[#cbd5e1] flex items-center justify-center text-[24px] text-[#94a3b8] cursor-pointer hover:bg-slate-50">
                +
                <input type="file" accept={TIPOS_ACEITOS.join(",")} multiple className="sr-only"
                  onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-1.5">JPG, PNG ou WEBP, até 5 MB cada.</p>
        </div>

        {erro && (
          <p role="alert" className="text-[13px] font-medium text-[#93000a] bg-[#ffdad6] rounded-[8px] px-3 py-2">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-[8px] text-[13px] font-bold text-[#434935] bg-[#f0f3ff] hover:bg-slate-200">
            Cancelar
          </button>
          <button type="submit" disabled={salvando}
            className="px-5 py-2 rounded-[8px] text-[13px] font-bold text-white bg-gradient-to-r from-[#4c6700] to-[#9fd300] disabled:opacity-60">
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </>
  );
}
