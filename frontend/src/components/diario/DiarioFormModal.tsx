"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, X } from "@phosphor-icons/react";
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


export function DiarioFormModal({ isOpen, onClose, obraId, registro, responsavelPadrao, servicos, onSaved }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  // Drawer lateral do artefato. A chave refaz o estado do formulário ao trocar de registro.
  return (
    <div className="gp-ov" style={{ justifyContent: "flex-end", padding: 0 }}>
      <div className="gp-drw" role="dialog" aria-modal="true" aria-labelledby="diario-form-t" style={{ width: "min(560px, 100%)" }}>
        <div className="gp-dh">
          <h2 id="diario-form-t" className="gp-h2">{registro ? "Editar registro" : "Novo registro"}</h2>
          <button type="button" className="gp-ib" aria-label="Fechar" onClick={onClose}>
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <FormularioDiario
          key={registro?.id ?? "novo"}
          onClose={onClose}
          obraId={obraId}
          registro={registro}
          responsavelPadrao={responsavelPadrao}
          servicos={servicos}
          onSaved={onSaved}
        />
      </div>
    </div>
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
    <form onSubmit={salvar} style={{ display: "contents" }}>
      <div className="gp-db">
        <div className="gp-fld">
          <label className="gp-lb" htmlFor="diario-data">Data</label>
          <input id="diario-data" type="date" required max={hojeLocal()} value={data}
            onChange={(e) => setData(e.target.value)} className="gp-in" />
        </div>
        <div className="gp-fld">
          <label className="gp-lb" htmlFor="diario-titulo">Título</label>
          <input id="diario-titulo" required maxLength={255} value={titulo}
            onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Concretagem da laje L2" className="gp-in" />
        </div>

        <div className="gp-fld">
          <span className="gp-lb" id="diario-clima">Clima</span>
          <div role="group" aria-labelledby="diario-clima" className="gp-seg">
            {CLIMAS.map(({ valor, rotulo: nome, Icone }) => (
              <button key={valor} type="button" onClick={() => setClima(valor)} aria-pressed={clima === valor}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icone size={18} weight="fill" aria-hidden="true" /> {nome}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="diario-temp">Temperatura (°C)</label>
            <input id="diario-temp" inputMode="decimal" value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)} placeholder="28" className="gp-in" />
          </div>
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="diario-equipe">Equipe presente</label>
            <input id="diario-equipe" type="number" min={0} max={10000} value={equipe}
              onChange={(e) => setEquipe(e.target.value)} className="gp-in" />
          </div>
          <div className="gp-fld">
            <label className="gp-lb" htmlFor="diario-resp">Responsável</label>
            <input id="diario-resp" maxLength={150} value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)} className="gp-in" />
          </div>
        </div>

        <div className="gp-fld">
          <label className="gp-lb" htmlFor="diario-atividades">Atividades executadas</label>
          <textarea id="diario-atividades" required rows={4} value={atividades}
            onChange={(e) => setAtividades(e.target.value)} className="gp-in" />
        </div>

        <div className="gp-fld">
          <label className="gp-lb" htmlFor="diario-ocorrencias">Ocorrências (opcional)</label>
          <textarea id="diario-ocorrencias" rows={3} value={ocorrencias}
            onChange={(e) => setOcorrencias(e.target.value)}
            placeholder="Paralisações, acidentes, falta de material…" className="gp-in" />
        </div>

        {servicos.length > 0 && (
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
                        style={{ marginTop: 3, width: 16, height: 16 }}
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
                          className="gp-in gp-mono"
                          style={{ width: 96, height: 40, textAlign: "right", fontSize: 14 }}
                        />
                        <span className="gp-hint">{servico.unidade}</span>
                        <input
                          inputMode="decimal"
                          aria-label={`Percentual de ${servico.descricao}`}
                          value={feito.pct}
                          placeholder="0"
                          onChange={(e) => digitarPercentual(servico, e.target.value)}
                          className="gp-in gp-mono"
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
        )}

        <div className="gp-fld">
          <span className="gp-lb">Fotos ({fotosAtuais.length + arquivos.length}/{MAX_FOTOS})</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {fotosAtuais.map((foto) => (
              <div key={foto.id} style={{ position: "relative", width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: "1px solid #E6EBF2" }}>
                {foto.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto.url} alt={foto.legenda ?? "Foto do diário"} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                )}
                <button type="button" onClick={() => removerFotoSalva(foto)} aria-label="Remover foto" style={botaoX}>
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
            {arquivos.map((arquivo, i) => (
              <div key={`${arquivo.name}-${i}`}
                style={{ position: "relative", width: 80, height: 80, borderRadius: 12, border: "2px dashed #00a3b1", background: "#e0f5f7", padding: 6, fontSize: 10, color: "#00626b", wordBreak: "break-all", overflow: "hidden", boxSizing: "border-box" }}>
                {arquivo.name}
                <button type="button" onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}
                  aria-label={`Descartar ${arquivo.name}`} style={botaoX}>
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
            {fotosAtuais.length + arquivos.length < MAX_FOTOS && (
              <label style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed #7B8AA0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#475569", cursor: "pointer", boxSizing: "border-box" }}>
                +
                <input type="file" accept={TIPOS_ACEITOS.join(",")} multiple className="gp-sr"
                  onChange={(e) => { escolherArquivos(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <p className="gp-hint" style={{ margin: 0 }}>JPG, PNG ou WEBP, até 5 MB cada.</p>
        </div>

        {erro && (
          <p role="alert" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#B91C1C", background: "#FEE2E2", borderRadius: 12, padding: "10px 14px" }}>
            {erro}
          </p>
        )}
      </div>

      <div className="gp-df">
        <button type="button" onClick={onClose} className="gp-btn gp-bs">Cancelar</button>
        <button type="submit" disabled={salvando} className="gp-btn gp-bp" style={{ opacity: salvando ? 0.6 : 1 }}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

const botaoX: React.CSSProperties = {
  position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: 0,
  background: "rgba(0,27,61,.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
