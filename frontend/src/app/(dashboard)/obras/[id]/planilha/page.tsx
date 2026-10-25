"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DownloadSimple } from "@phosphor-icons/react";
import { getOrcamento, type Orcamento } from "@/lib/api/orcamentos";

import { ObraTabs } from "@/components/obras/ObraTabs";
import { PlanilhaView } from "@/components/orcamentos/PlanilhaView";

export default function PlanilhaOrcamentariaPage() {
  const params = useParams();
  const id = params.id as string;

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrcamento = async () => {
    try {
      const orcData = await getOrcamento(id);
      setOrcamento(orcData);
    } catch (err) {
      console.error("Erro ao carregar orçamento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchOrcamento();
  }, [id]);

  if (loading && !orcamento) {
    return <p className="gp-sub" style={{ textAlign: "center", padding: 48 }}>Carregando planilha orçamentária...</p>;
  }

  if (!orcamento) {
    return <p className="gp-sub" style={{ textAlign: "center", padding: 48 }}>Orçamento não encontrado.</p>;
  }

  // Formatador de Moeda
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <nav aria-label="Trilha" className="gp-crumb">
            <Link href="/obras">Obras</Link> / <Link href={`/obras/${id}`}>{orcamento.nome}</Link> /{" "}
            <span aria-current="page" style={{ color: "#001b3d" }}>Planilha</span>
          </nav>
          <h1 className="gp-h1">{orcamento.nome}</h1>
          <p className="gp-sub">Detalhamento financeiro, composições e insumos vinculados ao projeto.</p>
        </div>
        <button type="button" className="gp-btn gp-bs">
          <DownloadSimple size={18} weight="bold" aria-hidden="true" /> Exportar Excel
        </button>
      </div>

      <ObraTabs id={id} atual="planilha" />

      <section aria-label="Totais" className="gp-grid">
        <div className="gp-card gp-met">
          <span className="gp-ml">Valor total</span>
          <span className="gp-mv">{formatCurrency(orcamento.valor_total)}</span>
          <span className="gp-ms">Custo direto + BDI</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">BDI aplicado</span>
          <span className="gp-mv">{orcamento.bdi ? `${orcamento.bdi.toFixed(2)}%` : "0.00%"}</span>
          <span className="gp-ms">Taxa de lucro e despesas</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Base de referência</span>
          <span className="gp-mv" style={{ fontSize: 20 }}>{orcamento.base_referencia || "Não definida"}</span>
          <span className="gp-ms">Fonte: {orcamento.fonte || "-"}</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Localidade</span>
          <span className="gp-mv" style={{ fontSize: 20 }}>{orcamento.estado?.toUpperCase() || "Nacional"}</span>
          <span className="gp-ms">Tipo: {orcamento.tipo_composicao || "Não definido"}</span>
        </div>
      </section>

      {/* Planilha Dinâmica (Cartões) */}
      <PlanilhaView 
        orcamentoId={id} 
        estadoOrcamento={orcamento.estado}
        fonteOrcamento={orcamento.fonte}
        onTotalChanged={fetchOrcamento}
      />
    </>
  );
}
