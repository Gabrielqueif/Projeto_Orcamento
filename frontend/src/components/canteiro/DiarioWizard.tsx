"use client";

import { useRef, useState } from "react";
import { Camera, Cloud, CloudRain, Image as ImageIcon, Sun, X } from "@phosphor-icons/react";
import { useToast } from "@/components/common/toast";
import { EfetivoPorFuncao, totalDoEfetivo } from "@/components/diario/DiarioFormModal";
import { ServicosChecklist, paraNumero, type ServicosFeitos } from "@/components/diario/ServicosChecklist";
import type { Cargo } from "@/lib/api/cargos";
import {
  alterarStatusDiario,
  atualizarDiario,
  criarDiario,
  enviarFotoDiario,
  removerFotoDiario,
  type Clima,
  type Diario,
  type DiarioCreate,
  type FotoDiario,
  type ServicoObra,
} from "@/lib/api/diario";
import { comprimirImagem } from "@/lib/imagem";
import { ehErroDeRede, enfileirar } from "@/lib/offline/fila";

const PASSOS = ["Dia", "Efetivo", "Serviços", "Ocorrências", "Fotos", "Revisar"] as const;
const MAX_FOTOS = 10;
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const CLIMAS: { valor: Clima; rotulo: string; Icone: typeof Sun }[] = [
  { valor: "SOL", rotulo: "Sol", Icone: Sun },
  { valor: "NUBLADO", rotulo: "Nublado", Icone: Cloud },
  { valor: "CHUVA", rotulo: "Chuva", Icone: CloudRain },
];

export function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  obraId: string;
  obraNome: string;
  registro: Diario | null;
  servicos: ServicoObra[];
  cargos: Cargo[];
  onConcluido: () => void;
}

/** Diário do dia em passos curtos, para preencher no celular. Cria ou atualiza o rascunho e, no fim, envia. */
export function DiarioWizard({ obraId, obraNome, registro, servicos, cargos, onConcluido }: Props) {
  const { showToast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [passo, setPasso] = useState(0);
  const [titulo, setTitulo] = useState(registro?.titulo ?? "");
  const [clima, setClima] = useState<Clima>(registro?.clima ?? "SOL");
  const [temperatura, setTemperatura] = useState(registro?.temperatura != null ? String(registro.temperatura) : "");
  const [equipe, setEquipe] = useState(String(registro?.equipe_presente ?? 0));
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() =>
    Object.fromEntries((registro?.efetivo ?? []).flatMap((e): [string, number][] => (e.cargo_id ? [[e.cargo_id, e.quantidade]] : [])))
  );
  const [feitos, setFeitos] = useState<ServicosFeitos>(() =>
    Object.fromEntries((registro?.servicos ?? []).map((s) => [s.item_id, { qtd: String(s.quantidade), pct: String(s.percentual) }]))
  );
  const [atividades, setAtividades] = useState(registro?.atividades ?? "");
  const [temOcorrencia, setTemOcorrencia] = useState(Boolean(registro?.ocorrencias));
  const [ocorrencias, setOcorrencias] = useState(registro?.ocorrencias ?? "");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [fotosAtuais, setFotosAtuais] = useState<FotoDiario[]>(registro?.fotos ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const usaEfetivo = cargos.length > 0;
  const idsCargos = new Set(cargos.map((c) => c.id));
  // Funções do registro que a lista de cargos não cobre: ficam no total e são reenviadas como estão.
  const outras = (registro?.efetivo ?? []).filter((e) => !e.cargo_id || !idsCargos.has(e.cargo_id));
  const outrasPessoas = outras.reduce((soma, e) => soma + e.quantidade, 0);
  const linhasEfetivo = [
    ...cargos.filter((c) => (quantidades[c.id] ?? 0) > 0).map((c) => ({ cargo_id: c.id, funcao: c.nome, quantidade: quantidades[c.id] })),
    ...outras.map((e) => ({ cargo_id: null, funcao: e.funcao, quantidade: e.quantidade })),
  ];
  const totalEquipe = usaEfetivo ? totalDoEfetivo(cargos, quantidades, outrasPessoas) : Number(equipe) || 0;

  const restanteDe = (s: ServicoObra) => {
    const proprio = registro?.servicos.find((x) => x.item_id === s.id)?.quantidade ?? 0;
    return Math.max(0, Number((s.quantidade - s.executado + proprio).toFixed(6)));
  };
  const marcados = servicos.filter((s) => feitos[s.id]).map((s) => ({ servico: s, quantidade: paraNumero(feitos[s.id].qtd) }));
  const invalido = marcados.find(({ servico, quantidade }) => !(quantidade > 0 && quantidade <= restanteDe(servico)));

  /** Mensagem do primeiro problema do passo, ou null se pode avançar. */
  const problemaDoPasso = (i: number): string | null => {
    if (i === 0 && !titulo.trim()) return "Dê um título ao registro do dia.";
    if (i === 2 && invalido) {
      return `Informe para "${invalido.servico.descricao}" uma quantidade entre 0 e ${restanteDe(invalido.servico)} ${invalido.servico.unidade}.`;
    }
    if (i === 2 && !atividades.trim()) return "Resuma o que foi feito no dia.";
    if (i === 3 && temOcorrencia && !ocorrencias.trim()) return "Descreva a ocorrência ou desligue a opção.";
    return null;
  };

  const avancar = () => {
    const problema = problemaDoPasso(passo);
    setErro(problema);
    if (!problema) setPasso((p) => Math.min(PASSOS.length - 1, p + 1));
  };

  const escolherArquivos = (lista: FileList | null) => {
    if (!lista) return;
    const novos = Array.from(lista);
    const ruim = novos.find((f) => !TIPOS_ACEITOS.includes(f.type));
    if (ruim) return setErro(`"${ruim.name}" não é JPG, PNG ou WEBP.`);
    if (fotosAtuais.length + arquivos.length + novos.length > MAX_FOTOS) return setErro(`Cada diário aceita até ${MAX_FOTOS} fotos.`);
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

  const salvar = async (enviar: boolean) => {
    const problema = [0, 2, 3].map(problemaDoPasso).find(Boolean) ?? null;
    if (problema) return setErro(problema);
    setErro(null);
    setSalvando(true);
    // Fotos que ainda não subiram: se a rede cair no meio, só estas vão para a fila.
    const restantes = [...arquivos];
    let dados: DiarioCreate | null = null;
    try {
      dados = {
        data: registro?.data ?? hojeLocal(),
        titulo: titulo.trim(),
        atividades: atividades.trim(),
        ocorrencias: temOcorrencia ? ocorrencias.trim() || null : null,
        clima,
        temperatura: temperatura.trim() === "" ? null : Number(temperatura.replace(",", ".")),
        equipe_presente: totalEquipe,
        servicos: marcados.map(({ servico, quantidade }) => ({ item_id: servico.id, quantidade })),
        ...(usaEfetivo && linhasEfetivo.length > 0 ? { efetivo: linhasEfetivo } : {}),
      };
      const salvo = registro ? await atualizarDiario(obraId, registro.id, dados) : await criarDiario(obraId, dados);

      const falhas: string[] = [];
      for (const arquivo of arquivos) {
        try {
          await enviarFotoDiario(obraId, salvo.id, await comprimirImagem(arquivo));
          restantes.shift();
        } catch (e) {
          if (ehErroDeRede(e)) throw e;
          restantes.shift();
          falhas.push(e instanceof Error ? e.message : arquivo.name);
        }
      }
      if (enviar && falhas.length === 0) await alterarStatusDiario(obraId, salvo.id, "ENVIADO");
      if (falhas.length > 0) {
        showToast("Diário salvo, mas algumas fotos falharam", `${falhas.join("; ")}. Tente de novo antes de enviar.`, "warning");
      } else {
        showToast(enviar ? "Diário enviado" : "Rascunho salvo", undefined, "success");
      }
      onConcluido();
    } catch (e) {
      if (dados && ehErroDeRede(e)) {
        try {
          const fotos = await Promise.all(restantes.map(comprimirImagem));
          await enfileirar({ obraId, dados, fotos, enviar });
          showToast("Sem sinal: diário guardado no aparelho", "Será enviado quando a conexão voltar.", "warning");
          onConcluido();
          return;
        } catch {
          // IndexedDB indisponível: cai no erro abaixo.
        }
      }
      setErro(e instanceof Error ? e.message : "Erro ao salvar o diário");
    } finally {
      setSalvando(false);
    }
  };

  const cabeFoto = fotosAtuais.length + arquivos.length < MAX_FOTOS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <p className="gp-hint" style={{ margin: 0 }}>{obraNome}</p>
        <h2 className="gp-h2" style={{ margin: "2px 0 8px" }}>{PASSOS[passo]}</h2>
        <div role="progressbar" aria-label="Progresso" aria-valuemin={1} aria-valuemax={PASSOS.length} aria-valuenow={passo + 1}
          style={{ height: 6, borderRadius: 3, background: "#E6EBF2", overflow: "hidden" }}>
          <div style={{ width: `${((passo + 1) / PASSOS.length) * 100}%`, height: "100%", background: "#00a3b1" }} />
        </div>
        <p className="gp-hint" style={{ margin: "6px 0 0" }}>Passo {passo + 1} de {PASSOS.length}</p>
      </header>

      {passo === 0 && (
        <>
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="cant-titulo">Título do dia</label>
            <input id="cant-titulo" className="gp-in" maxLength={255} value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Concretagem da laje L2" />
          </div>
          <div className="gp-fld">
            <span className="gp-lb" id="cant-clima">Clima</span>
            <div role="radiogroup" aria-labelledby="cant-clima" className="gp-seg">
              {CLIMAS.map(({ valor, rotulo, Icone }) => (
                <button key={valor} type="button" role="radio" aria-checked={clima === valor} onClick={() => setClima(valor)}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Icone size={18} weight="fill" aria-hidden="true" /> {rotulo}
                </button>
              ))}
            </div>
          </div>
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="cant-temp">Temperatura (°C)</label>
            <input id="cant-temp" className="gp-in" inputMode="decimal" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} placeholder="28" />
          </div>
        </>
      )}

      {passo === 1 &&
        (usaEfetivo ? (
          <EfetivoPorFuncao cargos={cargos} quantidades={quantidades} outrasPessoas={outrasPessoas}
            equipeAnterior={(registro?.efetivo ?? []).length === 0 ? registro?.equipe_presente : null}
            onAjustar={(id, qtd) => setQuantidades((atual) => ({ ...atual, [id]: qtd }))} />
        ) : (
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="cant-equipe">Equipe presente</label>
            <input id="cant-equipe" className="gp-in" type="number" min={0} max={10000} value={equipe} onChange={(e) => setEquipe(e.target.value)} />
          </div>
        ))}

      {passo === 2 && (
        <>
          <ServicosChecklist servicos={servicos} feitos={feitos} onChange={setFeitos} restanteDe={restanteDe} />
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="cant-atividades">Resumo do dia</label>
            <textarea id="cant-atividades" className="gp-in" rows={4} value={atividades} onChange={(e) => setAtividades(e.target.value)}
              placeholder="O que foi feito hoje no canteiro" />
          </div>
        </>
      )}

      {passo === 3 && (
        <>
          <div className="gp-4d-swr">
            <span id="cant-oc-t">
              <strong>Houve ocorrência?</strong>
              <span>Acidente, paralisação, visita, falta de material</span>
            </span>
            <button type="button" role="switch" aria-checked={temOcorrencia} aria-labelledby="cant-oc-t" className="gp-4d-sw"
              onClick={() => { if (temOcorrencia) setOcorrencias(""); setTemOcorrencia(!temOcorrencia); }}>
              <span aria-hidden="true"></span>
            </button>
          </div>
          {temOcorrencia && (
            <div className="gp-fld">
              <label className="gp-lb" htmlFor="cant-ocorrencias">Descreva a ocorrência</label>
              <textarea id="cant-ocorrencias" className="gp-in" rows={4} value={ocorrencias} onChange={(e) => setOcorrencias(e.target.value)} />
            </div>
          )}
        </>
      )}

      {passo === 4 && (
        <div className="gp-fld">
          <span className="gp-lb">Fotos ({fotosAtuais.length + arquivos.length}/{MAX_FOTOS})</span>
          <div className="gp-4d-fg">
            {fotosAtuais.map((foto) => (
              <div key={foto.id} className="gp-4d-ft" style={{ border: "1px solid #E6EBF2" }}>
                {foto.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto.url} alt={foto.legenda ?? "Foto do diário"} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                )}
                <button type="button" onClick={() => removerFotoSalva(foto)} aria-label="Remover foto" className="gp-4d-fx">
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
            {arquivos.map((arquivo, i) => (
              <div key={`${arquivo.name}-${i}`} className="gp-4d-ft"
                style={{ border: "2px dashed #00a3b1", background: "#e0f5f7", padding: 6, fontSize: 10, color: "#00626b", wordBreak: "break-all" }}>
                {arquivo.name}
                <button type="button" onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))} aria-label={`Descartar ${arquivo.name}`} className="gp-4d-fx">
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
          </div>
          {cabeFoto && (
            <div className="gp-4d-fb">
              <button type="button" className="gp-4d-fbt gp-4d-esc" onClick={() => cameraRef.current?.click()}>
                <Camera size={18} weight="bold" aria-hidden="true" /> Tirar foto
              </button>
              <button type="button" className="gp-4d-fbt" onClick={() => galeriaRef.current?.click()}>
                <ImageIcon size={18} weight="bold" aria-hidden="true" /> Da galeria
              </button>
              <input ref={cameraRef} type="file" accept={TIPOS_ACEITOS.join(",")} capture="environment" className="gp-sr" tabIndex={-1} aria-hidden="true"
                onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ""; }} />
              <input ref={galeriaRef} type="file" accept={TIPOS_ACEITOS.join(",")} multiple className="gp-sr" tabIndex={-1} aria-hidden="true"
                onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ""; }} />
            </div>
          )}
          <p className="gp-hint" style={{ margin: 0 }}>As fotos são reduzidas antes do envio.</p>
        </div>
      )}

      {passo === 5 && (
        <dl className="gp-card" style={{ margin: 0, padding: 16, display: "grid", gap: 8, fontSize: 15 }}>
          <div><dt className="gp-hint">Título</dt><dd style={{ margin: 0 }}>{titulo || "—"}</dd></div>
          <div><dt className="gp-hint">Clima</dt><dd style={{ margin: 0 }}>{CLIMAS.find((c) => c.valor === clima)?.rotulo}{temperatura ? `, ${temperatura} °C` : ""}</dd></div>
          <div><dt className="gp-hint">Efetivo</dt><dd style={{ margin: 0 }}>{totalEquipe} {totalEquipe === 1 ? "pessoa" : "pessoas"}</dd></div>
          <div><dt className="gp-hint">Serviços</dt><dd style={{ margin: 0 }}>{marcados.length} marcados</dd></div>
          <div><dt className="gp-hint">Resumo</dt><dd style={{ margin: 0 }}>{atividades || "—"}</dd></div>
          <div><dt className="gp-hint">Ocorrência</dt><dd style={{ margin: 0 }}>{temOcorrencia ? ocorrencias : "Nenhuma"}</dd></div>
          <div><dt className="gp-hint">Fotos</dt><dd style={{ margin: 0 }}>{fotosAtuais.length + arquivos.length}</dd></div>
        </dl>
      )}

      {erro && (
        <p role="alert" style={{ fontSize: 14, fontWeight: 600, color: "#B91C1C", background: "#FEE2E2", borderRadius: 12, padding: "10px 14px", margin: 0 }}>
          {erro}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {passo > 0 && (
          <button type="button" className="gp-btn gp-bs" disabled={salvando} onClick={() => { setErro(null); setPasso(passo - 1); }}>
            Voltar
          </button>
        )}
        {passo < PASSOS.length - 1 ? (
          <button type="button" className="gp-btn gp-bp" style={{ marginLeft: "auto" }} onClick={avancar}>
            Avançar
          </button>
        ) : (
          <>
            <button type="button" className="gp-btn gp-bs" disabled={salvando} onClick={() => salvar(false)}>
              Salvar rascunho
            </button>
            <button type="button" className="gp-btn gp-bp" style={{ marginLeft: "auto", opacity: salvando ? 0.6 : 1 }} disabled={salvando} onClick={() => salvar(true)}>
              {salvando ? "Enviando…" : "Enviar ao responsável"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
