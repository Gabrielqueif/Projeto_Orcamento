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
  type ServicoObra,
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

// Quantidade e % do serviço andam juntos: digitar um calcula o outro (% sobre a quantidade orçada).
function arredondar(n: number, casas: number): string {
  return Number.isFinite(n) ? String(Number(n.toFixed(casas))) : "";
}
const paraNumero = (texto: string) => Number(texto.replace(",", "."));

interface Props {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  registro: Diario | null;
  responsavelPadrao?: string | null;
  servicos: ServicoObra[];
  onSaved: () => void;
}

const campo =
  "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] text-[#001b3c] bg-white focus:outline-none focus:border-[#4c6700]";
const rotulo = "block text-[11px] font-bold text-[#747a62] uppercase tracking-[1px] mb-1.5";

export function DiarioFormModal({ isOpen, onClose, obraId, registro, responsavelPadrao, servicos, onSaved }: Props) {
  // O Modal desmonta o conteúdo ao fechar; a chave refaz o estado ao trocar de registro.
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={registro ? "Editar registro" : "Novo registro"} maxWidth="max-w-2xl">
      <FormularioDiario
        key={registro?.id ?? "novo"}
        onClose={onClose}
        obraId={obraId}
        registro={registro}
        responsavelPadrao={responsavelPadrao}
        servicos={servicos}
        onSaved={onSaved}
      />
    </Modal>
  );
}

function FormularioDiario({ onClose, obraId, registro, responsavelPadrao, servicos, onSaved }: Omit<Props, "isOpen">) {
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
  // Um serviço marcado no checklist tem entrada aqui; some ao desmarcar.
  const [feitos, setFeitos] = useState<Record<string, { qtd: string; pct: string }>>(() =>
    Object.fromEntries(
      (registro?.servicos ?? []).map((s) => [s.item_id, { qtd: String(s.quantidade), pct: String(s.percentual) }])
    )
  );
  const [busca, setBusca] = useState("");

  const marcar = (id: string, marcado: boolean) =>
    setFeitos((atual) => {
      if (marcado) return { ...atual, [id]: { qtd: "", pct: "" } };
      return Object.fromEntries(Object.entries(atual).filter(([chave]) => chave !== id));
    });
  const digitarQuantidade = (servico: ServicoObra, qtd: string) =>
    setFeitos((atual) => ({
      ...atual,
      [servico.id]: { qtd, pct: qtd.trim() === "" ? "" : arredondar((paraNumero(qtd) / servico.quantidade) * 100, 1) },
    }));
  const digitarPercentual = (servico: ServicoObra, pct: string) =>
    setFeitos((atual) => ({
      ...atual,
      [servico.id]: { pct, qtd: pct.trim() === "" ? "" : arredondar((paraNumero(pct) / 100) * servico.quantidade, 3) },
    }));

  const termo = busca.trim().toLowerCase();
  // O que sobra do orçado: o executado em todos os diários, menos o que este mesmo diário já lançou.
  const restanteDe = (s: ServicoObra) => {
    const proprio = registro?.servicos.find((x) => x.item_id === s.id)?.quantidade ?? 0;
    return Math.max(0, Number((s.quantidade - s.executado + proprio).toFixed(6)));
  };
  // Serviços já concluídos em outros diários vão para o fim da lista.
  const visiveis = servicos
    .filter((s) => !termo || `${s.codigo ?? ""} ${s.descricao} ${s.etapa_nome ?? ""}`.toLowerCase().includes(termo))
    .sort((a, b) => Number(restanteDe(a) === 0) - Number(restanteDe(b) === 0));

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
    const marcados = servicos
      .filter((s) => feitos[s.id])
      .map((s) => ({ servico: s, quantidade: paraNumero(feitos[s.id].qtd) }));
    const invalido = marcados.find(({ servico, quantidade }) => !(quantidade > 0 && quantidade <= restanteDe(servico)));
    if (invalido) {
      setErro(
        `Informe para "${invalido.servico.descricao}" uma quantidade entre 0 e ${restanteDe(invalido.servico)} ${invalido.servico.unidade} (o que ainda falta do orçado).`
      );
      return;
    }
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
        servicos: marcados.map(({ servico, quantidade }) => ({ item_id: servico.id, quantidade })),
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

        {servicos.length > 0 && (
          <div>
            <span className={rotulo}>Serviços executados ({Object.keys(feitos).length} marcados)</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar serviço por código, nome ou etapa"
              aria-label="Buscar serviço"
              className={`${campo} mb-2`}
            />
            <ul className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {visiveis.map((servico) => {
                const feito = feitos[servico.id];
                const restante = restanteDe(servico);
                const concluido = restante === 0;
                return (
                  <li
                    key={servico.id}
                    className={`border rounded-[8px] px-3 py-2 ${
                      concluido ? "border-[#9fd300] bg-[rgba(159,211,0,0.15)]" : "border-[#e2e8f0]"
                    }`}
                  >
                    <label
                      className={`flex items-start gap-2 text-[13px] ${
                        concluido ? "text-[#405700] cursor-default" : "text-[#001b3c] cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!feito}
                        disabled={concluido}
                        onChange={(e) => marcar(servico.id, e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="flex-1">
                        {servico.descricao}
                        <span className={`block text-[11px] ${concluido ? "text-[#4c6700]" : "text-[#94a3b8]"}`}>
                          {[servico.codigo, servico.etapa_nome].filter(Boolean).join(" · ")}
                          {" · "}
                          {concluido
                            ? `concluído (100% de ${servico.quantidade} ${servico.unidade})`
                            : `falta ${restante} de ${servico.quantidade} ${servico.unidade}`}
                        </span>
                      </span>
                    </label>
                    {feito && (
                      <div className="flex items-center gap-2 mt-2 pl-6">
                        <input
                          inputMode="decimal"
                          aria-label={`Quantidade de ${servico.descricao}`}
                          value={feito.qtd}
                          placeholder="0"
                          onChange={(e) => digitarQuantidade(servico, e.target.value)}
                          className="w-24 border border-[#e2e8f0] rounded-[6px] px-2 py-1 text-right text-[13px]"
                        />
                        <span className="text-[12px] text-[#64748b]">{servico.unidade}</span>
                        <input
                          inputMode="decimal"
                          aria-label={`Percentual de ${servico.descricao}`}
                          value={feito.pct}
                          placeholder="0"
                          onChange={(e) => digitarPercentual(servico, e.target.value)}
                          className="w-20 border border-[#e2e8f0] rounded-[6px] px-2 py-1 text-right text-[13px]"
                        />
                        <span className="text-[12px] text-[#64748b]">%</span>
                      </div>
                    )}
                  </li>
                );
              })}
              {visiveis.length === 0 && <li className="text-[12px] text-[#94a3b8] px-1">Nenhum serviço encontrado.</li>}
            </ul>
            <p className="text-[11px] text-[#94a3b8] mt-1.5">
              Marque o que foi feito no dia e informe a quantidade ou o percentual do serviço: um calcula o outro.
            </p>
          </div>
        )}

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
