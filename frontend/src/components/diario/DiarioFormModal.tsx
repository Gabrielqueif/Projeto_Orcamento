"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Cloud, CloudRain, Image as ImageIcon, Sun, X } from "@phosphor-icons/react";
import { useToast } from "@/components/common/toast";
import { getCargos, type Cargo } from "@/lib/api/cargos";
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

// Teto por função: o backend recusa linhas acima de 10000 pessoas.
const MAX_POR_FUNCAO = 10000;

/** Total de pessoas: soma dos cargos da lista mais as funções sem cargo do registro antigo. */
export function totalDoEfetivo(cargos: Cargo[], quantidades: Record<string, number>, outrasPessoas: number): number {
  return cargos.reduce((soma, c) => soma + (quantidades[c.id] ?? 0), 0) + outrasPessoas;
}

interface EfetivoProps {
  cargos: Cargo[];
  quantidades: Record<string, number>;
  onAjustar: (cargoId: string, quantidade: number) => void;
  /** Pessoas de funções sem cargo (digitadas livremente no registro antigo): entram no total, não são editáveis aqui. */
  outrasPessoas: number;
  /** Total antigo do registro, mostrado como apoio quando ainda não há efetivo por função. */
  equipeAnterior?: number | null;
}

export function EfetivoPorFuncao({ cargos, quantidades, onAjustar, outrasPessoas, equipeAnterior }: EfetivoProps) {
  const total = totalDoEfetivo(cargos, quantidades, outrasPessoas);
  return (
    <div className="gp-fld">
      <span className="gp-lb" id="diario-efetivo">Efetivo no canteiro</span>
      <ul role="list" aria-labelledby="diario-efetivo" className="gp-6a-efetivo">
        {cargos.map((cargo) => {
          const qtd = quantidades[cargo.id] ?? 0;
          return (
            <li key={cargo.id} className="gp-6a-efetivo-linha">
              <span className="gp-6a-efetivo-nome">{cargo.nome}</span>
              <div className="gp-6a-contador">
                <button type="button" aria-label={`Diminuir ${cargo.nome}`} disabled={qtd <= 0}
                  onClick={() => onAjustar(cargo.id, Math.max(0, qtd - 1))}>
                  −
                </button>
                <output aria-live="polite">{qtd}</output>
                <button type="button" aria-label={`Aumentar ${cargo.nome}`} disabled={qtd >= MAX_POR_FUNCAO}
                  onClick={() => onAjustar(cargo.id, Math.min(MAX_POR_FUNCAO, qtd + 1))}>
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="gp-6a-efetivo-total">
        <strong>{total} {total === 1 ? "pessoa" : "pessoas"}</strong>
      </p>
      {equipeAnterior != null && equipeAnterior > 0 && (
        <p className="gp-hint" style={{ margin: 0 }}>
          Antes: {equipeAnterior} pessoas, sem detalhe por função. Informe o efetivo para substituir.
        </p>
      )}
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  /** Nome da obra, mostrado no cabeçalho do formulário no mobile. */
  obraNome?: string;
  registro: Diario | null;
  responsavelPadrao?: string | null;
  servicos: ServicoObra[];
  onSaved: () => void;
}


export function DiarioFormModal({ isOpen, onClose, obraId, obraNome, registro, responsavelPadrao, servicos, onSaved }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const titulo = registro ? "Editar registro" : "Novo registro";
  // Drawer lateral do artefato no desktop; no mobile, tela cheia com cabeçalho escuro.
  // A chave refaz o estado do formulário ao trocar de registro.
  return (
    <div className="gp-ov" style={{ justifyContent: "flex-end", padding: 0 }}>
      <div className="gp-drw gp-4d-dn" role="dialog" aria-modal="true" aria-label={titulo} style={{ width: "min(560px, 100%)" }}>
        <div className="gp-dh gp-only-d">
          <h2 className="gp-h2">{titulo}</h2>
          <button type="button" className="gp-ib" aria-label="Fechar" onClick={onClose}>
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <FormularioDiario
          key={registro?.id ?? "novo"}
          onClose={onClose}
          obraId={obraId}
          obraNome={obraNome}
          titulo={titulo}
          registro={registro}
          responsavelPadrao={responsavelPadrao}
          servicos={servicos}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}

type FormProps = Omit<Props, "isOpen"> & { titulo: string };

function FormularioDiario({ onClose, obraId, obraNome, titulo: tituloForm, registro, responsavelPadrao, servicos, onSaved }: FormProps) {
  const { showToast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const climaRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Qual botão de envio foi usado: "Salvar rascunho" ou "Concluir registro" (só no mobile).
  const acao = useRef<"salvar" | "concluir">("salvar");
  const [temOcorrencia, setTemOcorrencia] = useState(Boolean(registro?.ocorrencias));
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
  // null enquanto carrega; sem cargos (ou se falhar) o formulário usa o campo numérico "Equipe presente".
  const [cargos, setCargos] = useState<Cargo[] | null>(null);
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      (registro?.efetivo ?? []).flatMap((e): [string, number][] => (e.cargo_id ? [[e.cargo_id, e.quantidade]] : []))
    )
  );

  useEffect(() => {
    let ativo = true;
    getCargos()
      .then((lista) => { if (ativo) setCargos(lista); })
      .catch(() => { if (ativo) setCargos([]); });
    return () => { ativo = false; };
  }, []);

  const cargosDisponiveis = cargos ?? [];
  const usaEfetivo = cargosDisponiveis.length > 0;
  const efetivoAtual = registro?.efetivo ?? [];
  // Funções sem cargo (ou com cargo que já não existe) não aparecem na lista; ficam no registro e no total.
  const idsCargos = new Set(cargosDisponiveis.map((c) => c.id));
  const outrasFuncoes = efetivoAtual.filter((e) => !e.cargo_id || !idsCargos.has(e.cargo_id));
  const outrasPessoas = outrasFuncoes.reduce((soma, e) => soma + e.quantidade, 0);
  const linhasEfetivo = [
    ...cargosDisponiveis
      .filter((c) => (quantidades[c.id] ?? 0) > 0)
      .map((c) => ({ cargo_id: c.id, funcao: c.nome, quantidade: quantidades[c.id] })),
    ...outrasFuncoes.map((e) => ({ cargo_id: null, funcao: e.funcao, quantidade: e.quantidade })),
  ];
  // Registro antigo sem efetivo e com contadores zerados: não envia efetivo, para não zerar o total antigo.
  const enviaEfetivo = usaEfetivo && (linhasEfetivo.length > 0 || efetivoAtual.length > 0);

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
      // Sem efetivo enviado, o backend mantém o efetivo atual; equipe_presente segue o campo numérico
      // (ou o total antigo, quando a lista está ativa mas o registro ainda não tem efetivo).
      const equipePresente = enviaEfetivo
        ? linhasEfetivo.reduce((soma, l) => soma + l.quantidade, 0)
        : usaEfetivo
          ? (registro?.equipe_presente ?? 0)
          : Number(equipe) || 0;
      const dados: DiarioCreate = {
        data,
        titulo: titulo.trim(),
        atividades: atividades.trim(),
        ocorrencias: ocorrencias.trim() || null,
        clima,
        temperatura: temperatura.trim() === "" ? null : Number(temperatura.replace(",", ".")),
        equipe_presente: equipePresente,
        responsavel: responsavel.trim() || null,
        servicos: marcados.map(({ servico, quantidade }) => ({ item_id: servico.id, quantidade })),
        ...(enviaEfetivo ? { efetivo: linhasEfetivo } : {}),
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
      // "Concluir registro" = salvar e enviar (RASCUNHO -> ENVIADO), como o botão Enviar da lista.
      let erroConclusao: string | null = null;
      const concluir = acao.current === "concluir" && salvo.status === "RASCUNHO";
      if (concluir) {
        try {
          await alterarStatusDiario(obraId, salvo.id, "ENVIADO");
        } catch (err) {
          erroConclusao = err instanceof Error ? err.message : "Erro ao concluir o registro";
        }
      }
      if (falhas.length > 0) {
        showToast("Diário salvo, mas algumas fotos falharam", falhas.join("; "), "warning");
      } else if (erroConclusao) {
        showToast("Diário salvo como rascunho, mas não foi concluído", erroConclusao, "warning");
      } else {
        showToast(concluir ? "Registro concluído" : "Diário salvo", undefined, "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar o diário");
    } finally {
      setSalvando(false);
      acao.current = "salvar";
    }
  };

  const alternarOcorrencia = () => {
    // Desligar o switch descarta o texto: o registro passa a não ter ocorrência.
    if (temOcorrencia) setOcorrencias("");
    setTemOcorrencia(!temOcorrencia);
  };

  // Radiogroup do clima: setas mudam a escolha e o foco (tabindex itinerante).
  const teclaClima = (e: React.KeyboardEvent, i: number) => {
    const passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const j = (i + passo + CLIMAS.length) % CLIMAS.length;
    setClima(CLIMAS[j].valor);
    climaRefs.current[j]?.focus();
  };

  const podeConcluir = !registro || registro.status === "RASCUNHO";
  const cabeFoto = fotosAtuais.length + arquivos.length < MAX_FOTOS;

  return (
    <form onSubmit={salvar} style={{ display: "contents" }}>
      <div className="gp-db">
        {/* No desktop o invólucro some (display: contents) e a data fica no topo do corpo;
            no mobile ele é o cabeçalho escuro com fechar, título, obra e data. */}
        <div className="gp-4d-dnh">
          <div className="gp-4d-dnt gp-only-m">
            <button type="button" className="gp-4d-x" aria-label="Fechar sem salvar" onClick={onClose}>
              <X size={20} weight="bold" aria-hidden="true" />
            </button>
            <div style={{ minWidth: 0 }}>
              <h2>{tituloForm}</h2>
              {obraNome && <p>{obraNome}</p>}
            </div>
          </div>
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="diario-data">
              <span className="gp-only-d">Data</span>
              <span className="gp-only-m">Data do registro</span>
            </label>
            <input id="diario-data" type="date" required max={hojeLocal()} value={data}
              onChange={(e) => setData(e.target.value)} className="gp-in" />
          </div>
        </div>

        <div className="gp-4d-sec">
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="diario-titulo">Título</label>
            <input id="diario-titulo" required maxLength={255} value={titulo}
              onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Concretagem da laje L2" className="gp-in" />
          </div>
        </div>

        <div className="gp-4d-sec">
          <div className="gp-fld">
            <span className="gp-lb" id="diario-clima">Clima</span>
            <div role="radiogroup" aria-labelledby="diario-clima" className="gp-seg gp-4d-clm">
              {CLIMAS.map(({ valor, rotulo: nome, Icone }, i) => (
                <button key={valor} type="button" role="radio" aria-checked={clima === valor}
                  tabIndex={clima === valor ? 0 : -1}
                  ref={(el) => { climaRefs.current[i] = el; }}
                  onClick={() => setClima(valor)} onKeyDown={(e) => teclaClima(e, i)}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Icone size={18} weight="fill" aria-hidden="true" /> {nome}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="gp-4d-sec">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
            <div className="gp-fld">
              <label className="gp-lb" htmlFor="diario-temp">Temperatura (°C)</label>
              <input id="diario-temp" inputMode="decimal" value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)} placeholder="28" className="gp-in" />
            </div>
            {!usaEfetivo && (
              <div className="gp-fld">
                <label className="gp-lb" htmlFor="diario-equipe">Equipe presente</label>
                <input id="diario-equipe" type="number" min={0} max={10000} value={equipe}
                  onChange={(e) => setEquipe(e.target.value)} className="gp-in" />
              </div>
            )}
            <div className="gp-fld">
              <label className="gp-lb" htmlFor="diario-resp">Responsável</label>
              <input id="diario-resp" maxLength={150} value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)} className="gp-in" />
            </div>
          </div>
        </div>

        {usaEfetivo && (
          <div className="gp-4d-sec">
            <EfetivoPorFuncao
              cargos={cargosDisponiveis}
              quantidades={quantidades}
              outrasPessoas={outrasPessoas}
              equipeAnterior={efetivoAtual.length === 0 ? registro?.equipe_presente : null}
              onAjustar={(cargoId, quantidade) => setQuantidades((atual) => ({ ...atual, [cargoId]: quantidade }))}
            />
          </div>
        )}

        <div className="gp-4d-sec">
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="diario-atividades">Atividades executadas</label>
            <textarea id="diario-atividades" required rows={4} value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              placeholder="O que foi feito hoje no canteiro" className="gp-in" />
          </div>
        </div>

        {/* No mobile a ocorrência fica atrás de um switch; no desktop o campo aparece sempre. */}
        <div className="gp-4d-sec">
          <div className="gp-4d-swr gp-only-m">
            <span id="diario-oc-t">
              <strong>Houve ocorrência?</strong>
              <span>Acidente, paralisação, visita, falta de material</span>
            </span>
            <button type="button" role="switch" aria-checked={temOcorrencia} aria-labelledby="diario-oc-t"
              onClick={alternarOcorrencia} className="gp-4d-sw">
              <span aria-hidden="true"></span>
            </button>
          </div>
          <div className="gp-fld gp-4d-oc" data-off={temOcorrencia ? undefined : ""}>
            <label className="gp-lb" htmlFor="diario-ocorrencias">
              <span className="gp-only-d">Ocorrências (opcional)</span>
              <span className="gp-only-m">Descreva a ocorrência</span>
            </label>
            <textarea id="diario-ocorrencias" rows={3} value={ocorrencias}
              onChange={(e) => {
                setOcorrencias(e.target.value);
                if (e.target.value.trim()) setTemOcorrencia(true);
              }}
              placeholder="Paralisações, acidentes, falta de material…" className="gp-in" />
          </div>
        </div>

        {servicos.length > 0 && (
          <div className="gp-4d-sec">
          <div className="gp-fld">
            <span className="gp-lb">Serviços executados ({Object.keys(feitos).length} marcados)</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar serviço por código, nome ou etapa"
              aria-label="Buscar serviço"
              className="gp-in"
            />
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 288, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {visiveis.map((servico) => {
                const feito = feitos[servico.id];
                const restante = restanteDe(servico);
                const concluido = restante === 0;
                return (
                  <li
                    key={servico.id}
                    style={{
                      border: `1px solid ${concluido ? "#65A30D" : "#E6EBF2"}`,
                      background: concluido ? "#E6F6D0" : "#fff",
                      borderRadius: 12,
                      padding: "10px 12px",
                    }}
                  >
                    <label
                      style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: concluido ? "#3F6604" : "#001b3d", cursor: concluido ? "default" : "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={!!feito}
                        disabled={concluido}
                        onChange={(e) => marcar(servico.id, e.target.checked)}
                        className="gp-4d-chk"
                        style={{ marginTop: 3, width: 16, height: 16, flex: "0 0 auto" }}
                      />
                      <span style={{ flex: 1 }}>
                        {servico.descricao}
                        <span className="gp-hint" style={{ display: "block", color: concluido ? "#3F6604" : undefined }}>
                          {[servico.codigo, servico.etapa_nome].filter(Boolean).join(" · ")}
                          {" · "}
                          {concluido
                            ? `concluído (100% de ${servico.quantidade} ${servico.unidade})`
                            : `falta ${restante} de ${servico.quantidade} ${servico.unidade}`}
                        </span>
                      </span>
                    </label>
                    {feito && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingLeft: 24 }}>
                        <input
                          inputMode="decimal"
                          aria-label={`Quantidade de ${servico.descricao}`}
                          value={feito.qtd}
                          placeholder="0"
                          onChange={(e) => digitarQuantidade(servico, e.target.value)}
                          className="gp-in gp-mono gp-4d-num"
                          style={{ width: 96, height: 40, textAlign: "right", fontSize: 14 }}
                        />
                        <span className="gp-hint">{servico.unidade}</span>
                        <input
                          inputMode="decimal"
                          aria-label={`Percentual de ${servico.descricao}`}
                          value={feito.pct}
                          placeholder="0"
                          onChange={(e) => digitarPercentual(servico, e.target.value)}
                          className="gp-in gp-mono gp-4d-num"
                          style={{ width: 80, height: 40, textAlign: "right", fontSize: 14 }}
                        />
                        <span className="gp-hint">%</span>
                      </div>
                    )}
                  </li>
                );
              })}
              {visiveis.length === 0 && <li className="gp-hint">Nenhum serviço encontrado.</li>}
            </ul>
            <p className="gp-hint" style={{ margin: 0 }}>
              Marque o que foi feito no dia e informe a quantidade ou o percentual do serviço: um calcula o outro.
            </p>
          </div>
          </div>
        )}

        <div className="gp-4d-sec">
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
                  <button type="button" onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}
                    aria-label={`Descartar ${arquivo.name}`} className="gp-4d-fx">
                    <X size={12} weight="bold" />
                  </button>
                </div>
              ))}
              {cabeFoto && (
                <div className="gp-only-d">
                  <label style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed #7B8AA0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#475569", cursor: "pointer", boxSizing: "border-box" }}>
                    +
                    <input type="file" accept={TIPOS_ACEITOS.join(",")} multiple className="gp-sr"
                      onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ""; }} />
                  </label>
                </div>
              )}
            </div>
            {/* Mobile: câmera traseira direto ou galeria do aparelho */}
            {cabeFoto && (
              <div className="gp-4d-fb gp-only-m">
                <button type="button" className="gp-4d-fbt gp-4d-esc" onClick={() => cameraRef.current?.click()}>
                  <Camera size={18} weight="bold" aria-hidden="true" /> Tirar foto
                </button>
                <button type="button" className="gp-4d-fbt" onClick={() => galeriaRef.current?.click()}>
                  <ImageIcon size={18} weight="bold" aria-hidden="true" /> Da galeria
                </button>
                <input ref={cameraRef} type="file" accept={TIPOS_ACEITOS.join(",")} capture="environment"
                  className="gp-sr" tabIndex={-1} aria-hidden="true"
                  onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ""; }} />
                <input ref={galeriaRef} type="file" accept={TIPOS_ACEITOS.join(",")} multiple
                  className="gp-sr" tabIndex={-1} aria-hidden="true"
                  onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ""; }} />
              </div>
            )}
            <p className="gp-hint" style={{ margin: 0 }}>JPG, PNG ou WEBP, até 5 MB cada.</p>
          </div>
        </div>

        {erro && (
          <p role="alert" className="gp-4d-err" style={{ fontSize: 14, fontWeight: 600, color: "#B91C1C", background: "#FEE2E2", borderRadius: 12, padding: "10px 14px" }}>
            {erro}
          </p>
        )}
      </div>

      {/* Desktop: Cancelar + Salvar. Mobile: rodapé fixo com rascunho e conclusão. */}
      <div className="gp-df gp-4d-dnf" data-um={podeConcluir ? undefined : ""}>
        <button type="button" onClick={onClose} className="gp-btn gp-bs gp-only-d">Cancelar</button>
        <button type="submit" disabled={salvando} onClick={() => { acao.current = "salvar"; }}
          className={`gp-btn gp-bp${podeConcluir ? " gp-4d-rasc" : ""}`} style={{ opacity: salvando ? 0.6 : 1 }}>
          {salvando ? (
            "Salvando…"
          ) : (
            <>
              <span className="gp-only-d">Salvar</span>
              <span className="gp-only-m">{podeConcluir ? "Salvar rascunho" : "Salvar alterações"}</span>
            </>
          )}
        </button>
        {podeConcluir && (
          <button type="submit" disabled={salvando} onClick={() => { acao.current = "concluir"; }}
            className="gp-btn gp-bp gp-only-m gp-4d-conc" style={{ opacity: salvando ? 0.6 : 1 }}>
            Concluir registro
          </button>
        )}
      </div>
    </form>
  );
}
