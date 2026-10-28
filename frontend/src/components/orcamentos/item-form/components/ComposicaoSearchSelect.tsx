"use client";

import * as React from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { buscarComposicoes as apiBuscarComposicoes, type ContextoPreco } from "@/lib/api/composicoes";
import { buscarComposicoesProprias } from "@/lib/api/orcamentos";
import type { ItemComposicao } from "../types";

interface ComposicaoSearchSelectProps {
  composicaoSelecionada: ItemComposicao | null;
  onSelectComposicao: (item: ItemComposicao) => void;
  onClearComposicao: () => void;
  baseBusca: string;
  onBaseBuscaChange: (base: string) => void;
  isEditing?: boolean;
  /** Estado, mês e tipo do orçamento, usados para exibir o preço nos resultados */
  contextoPreco?: ContextoPreco;
  /** Quando informado, a busca inclui composições das bases próprias do usuário */
  orcamentoId?: string;
}

function BadgeFonte({ item }: { item: ItemComposicao }) {
  const estilo =
    item.fonte === "PROPRIA"
      ? { background: "#e0f5f7", color: "#00626b" }
      : item.fonte === "SEINFRA"
        ? { background: "#EDF1F6", color: "#001b3d" }
        : { background: "#E6F6D0", color: "#3F6604" };
  const rotulo =
    item.fonte === "PROPRIA"
      ? `Própria${item.base_propria_nome ? `: ${item.base_propria_nome}` : ""}`
      : item.fonte;
  return (
    <span
      style={{ ...estilo, alignSelf: "flex-start", fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}
    >
      {rotulo}
    </span>
  );
}

const formatarPreco = (valor?: number | null) =>
  valor == null ? "Sem preço" : valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ComposicaoSearchSelect({
  composicaoSelecionada,
  onSelectComposicao,
  onClearComposicao,
  baseBusca,
  onBaseBuscaChange,
  isEditing = false,
  contextoPreco,
  orcamentoId,
}: ComposicaoSearchSelectProps) {
  const estadoPreco = contextoPreco?.estado;
  const mesPreco = contextoPreco?.mes_referencia;
  const tipoPreco = contextoPreco?.tipo_composicao;
  const [termo, setTermo] = React.useState("");
  const [resultados, setResultados] = React.useState<ItemComposicao[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, proprias] = await Promise.all([
          apiBuscarComposicoes(termo, baseBusca, {
            estado: estadoPreco,
            mes_referencia: mesPreco,
            tipo_composicao: tipoPreco,
          }),
          orcamentoId
            ? buscarComposicoesProprias(orcamentoId, termo, 20).catch((err) => {
                console.error("Erro ao buscar bases próprias:", err);
                return [];
              })
            : Promise.resolve([]),
        ]);
        const comoItem: ItemComposicao[] = proprias.map((p) => ({
          codigo_composicao: p.codigo,
          descricao: p.descricao,
          unidade: p.unidade,
          preco: p.preco_unitario ?? undefined,
          fonte: "PROPRIA",
          base_propria_id: p.base_propria_id,
          base_propria_nome: p.base_propria_nome,
        }));
        setResultados([...comoItem, ...(data || [])]);
      } catch (err) {
        console.error(err);
        setError("Erro ao buscar composições.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termo, baseBusca, estadoPreco, mesPreco, tipoPreco, orcamentoId]);

  const handleSelect = (item: ItemComposicao) => {
    onSelectComposicao(item);
    setResultados([]);
    setTermo("");
  };

  return (
    <div className="gp-4b-busca" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        <label className="gp-lb" htmlFor="busca" style={{ marginRight: "auto" }}>
          Buscar Composição
        </label>
        <div role="group" aria-label="Filtrar por base" style={{ display: "flex", gap: 6 }}>
          {["SINAPI", "SEINFRA"].map((base) => (
            <button
              key={base}
              type="button"
              className="gp-chip"
              aria-pressed={baseBusca === base}
              onClick={() => onBaseBuscaChange(base)}
            >
              {base}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#B91C1C" }}>
          {error}
        </p>
      )}

      {composicaoSelecionada ? (
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "14px 16px", borderRadius: 14, background: "#F7FCE9", boxShadow: "inset 4px 0 0 #9fd300",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <BadgeFonte item={composicaoSelecionada} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
              <span className="gp-mono" style={{ fontWeight: 600 }}>{composicaoSelecionada.codigo_composicao}</span>
              {" - "}
              {composicaoSelecionada.descricao}
            </p>
            <p className="gp-hint" style={{ margin: 0 }}>
              Unidade: {composicaoSelecionada.unidade}
              {composicaoSelecionada.preco != null && (
                <span className="gp-mono" style={{ marginLeft: 12, fontWeight: 600, color: "#001b3d" }}>
                  {formatarPreco(composicaoSelecionada.preco)}
                </span>
              )}
            </p>
          </div>
          {!isEditing ? (
            <button
              type="button"
              onClick={onClearComposicao}
              className="gp-ib"
              aria-label="Remover seleção"
              title="Remover seleção"
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={onClearComposicao} className="gp-btn gp-bs gp-sm">
              Trocar Serviço
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="gp-srch" style={{ height: 50 }}>
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
            <input
              type="search"
              id="busca"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Digite código ou descrição da composição"
              style={{ fontSize: 16 }}
            />
          </div>
          {loading && <p className="gp-hint" style={{ margin: 0 }}>Buscando...</p>}
          {resultados.length > 0 && (
            <ul
              aria-live="polite"
              aria-label="Resultados da busca"
              className="gp-4b-res"
              style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 288, overflowY: "auto", border: "1px solid #E6EBF2", borderRadius: 14 }}
            >
              {resultados.map((item) => (
                <li
                  key={`${item.fonte}-${item.base_propria_id ?? ""}-${item.codigo_composicao}`}
                  style={{ borderTop: "1px solid #E6EBF2" }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="gp-row"
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
                      border: 0, background: "#fff", color: "#001b3d", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 96 }}>
                      <span className="gp-mono" style={{ fontSize: 14, fontWeight: 600 }}>{item.codigo_composicao}</span>
                      <BadgeFonte item={item} />
                    </span>
                    <span style={{ flex: "1 1 auto" }}>
                      <span style={{ display: "block", fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{item.descricao}</span>
                      <span style={{ fontSize: 13, color: "#475569" }}>Unidade: {item.unidade}</span>
                    </span>
                    {(estadoPreco || item.fonte === "PROPRIA") && (
                      <span className="gp-mono" style={{ fontSize: 15, fontWeight: 600 }}>{formatarPreco(item.preco)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
