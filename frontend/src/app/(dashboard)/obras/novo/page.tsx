"use client";

import Link from "next/link";

import { useWizard } from "@/contexts/WizardContext";
import { getSinapiBases } from "@/lib/api/orcamentos";
import { useState, useEffect } from "react";
import { ObraWizardStepper, ObraWizardResumo, resumoBase } from "@/components/obras/ObraWizardStepper";

export default function NovaObraPage() {
  const { data, updateData } = useWizard();
  const [bases, setBases] = useState<{ mes_referencia: string; fonte: string; tipo_composicao?: string }[]>([]);

  useEffect(() => {
    async function loadBases() {
      try {
        const fetchedBases = await getSinapiBases();
        setBases(fetchedBases);
        if (!data.baseReferencia && fetchedBases.length > 0) {
          updateData({ baseReferencia: fetchedBases[0].mes_referencia });
        }
      } catch (error) {
        console.error("Erro ao carregar bases:", error);
      }
    }
    loadBases();
  }, []);

  return (
    <>
      <ObraWizardStepper currentStep={1} />

      <div className="gp-split">
        <div className="gp-main" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section
            className="gp-card gp-pad"
            aria-label="Dados da obra"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}
          >
            <div className="gp-fld" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="o-nome" className="gp-lb">
                Nome do projeto <span className="gp-req">(obrigatório)</span>
              </label>
              <input
                id="o-nome"
                className="gp-in"
                aria-required="true"
                placeholder="Ex: Edifício Horizonte - Bloco A"
                value={data.nome || ""}
                onChange={(e) => updateData({ nome: e.target.value })}
              />
            </div>
            <div className="gp-fld">
              <label htmlFor="o-cli" className="gp-lb">Cliente ou proprietário</label>
              <input
                id="o-cli"
                className="gp-in"
                placeholder="Nome da empresa ou pessoa"
                value={data.cliente || ""}
                onChange={(e) => updateData({ cliente: e.target.value })}
              />
            </div>
            <div className="gp-fld">
              <label htmlFor="o-tipo" className="gp-lb">Tipo de construção</label>
              <select
                id="o-tipo"
                className="gp-in"
                value={data.tipo?.[0] || "Residencial Vertical"}
                onChange={(e) => updateData({ tipo: [e.target.value] })}
              >
                <option value="Residencial Vertical">Residencial vertical</option>
                <option value="Residencial Horizontal">Residencial horizontal</option>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Hospitalar">Hospitalar</option>
                <option value="Escolar">Escolar</option>
              </select>
            </div>
            <div className="gp-fld" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="o-end" className="gp-lb">Endereço completo</label>
              <input
                id="o-end"
                className="gp-in"
                autoComplete="street-address"
                placeholder="Rua, número, bairro e cidade"
                value={data.endereco || ""}
                onChange={(e) => updateData({ endereco: e.target.value })}
              />
            </div>
            <div className="gp-fld">
              <label htmlFor="o-ini" className="gp-lb">Início</label>
              <input
                id="o-ini"
                type="date"
                className="gp-in"
                value={data.dataInicio || ""}
                onChange={(e) => updateData({ dataInicio: e.target.value })}
              />
            </div>
            <div className="gp-fld">
              <label htmlFor="o-fim" className="gp-lb">Previsão de término</label>
              <input
                id="o-fim"
                type="date"
                className="gp-in"
                value={data.dataTermino || ""}
                onChange={(e) => updateData({ dataTermino: e.target.value })}
              />
            </div>
          </section>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Link href="/obras" className="gp-btn gp-bs">Cancelar</Link>
            <Link href="/obras/novo/etapa-2" className="gp-btn gp-bp">Próximo: equipe</Link>
          </div>
        </div>

        <ObraWizardResumo itens={resumoBase(data)} />
      </div>
    </>
  );
}
