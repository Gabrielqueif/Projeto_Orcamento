"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { getMembrosEquipe, deleteMembroEquipe, type MembroEquipe } from "@/lib/api/membros_equipe";
import { getOrcamentos, type Orcamento } from "@/lib/api/orcamentos";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Fab } from "@/components/layout/Fab";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const iniciais = (nome: string) =>
  nome.split(" ").filter(Boolean).map((n) => n[0]).join("").substring(0, 2).toUpperCase();

export default function EquipePage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<MembroEquipe[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObra, setSelectedObra] = useState("Todas as Obras");
  const [selectedCargo, setSelectedCargo] = useState("Todos os Cargos");

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, orcamentosData] = await Promise.all([getMembrosEquipe(), getOrcamentos()]);
      setMembers(membersData);
      setOrcamentos(orcamentosData);
    } catch (err) {
      console.error("Erro ao carregar dados da equipe:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteMember = async (id: string) => {
    if (confirm("Deseja realmente remover este colaborador da equipe?")) {
      try {
        await deleteMembroEquipe(id);
        loadData();
      } catch (err) {
        console.error("Erro ao deletar colaborador:", err);
        showToast("Ocorreu um erro ao remover o colaborador da equipe.", undefined, "error");
      }
    }
  };

  // Compile a map of orcamento_id -> name
  const orcamentoMap = React.useMemo(() => {
    const map = new Map<string, string>();
    orcamentos.forEach((o) => map.set(o.id, o.nome));
    return map;
  }, [orcamentos]);

  const obraDe = (m: MembroEquipe) => (m.orcamento_id ? orcamentoMap.get(m.orcamento_id) ?? "—" : "—");

  const uniqueObras = Array.from(new Set(orcamentos.map((o) => o.nome)));
  const uniqueCargos = Array.from(new Set(members.map((m) => m.cargo)));

  const filteredMembers = members.filter((m) => {
    const termo = searchTerm.toLowerCase();
    const matchesSearch =
      m.nome.toLowerCase().includes(termo) || m.cargo.toLowerCase().includes(termo) || m.code.toLowerCase().includes(termo);
    const matchesObra = selectedObra === "Todas as Obras" || obraDe(m) === selectedObra;
    const matchesCargo = selectedCargo === "Todos os Cargos" || m.cargo === selectedCargo;
    return matchesSearch && matchesObra && matchesCargo;
  });

  // KPIs
  const activeMembers = members.filter((m) => m.status === "ATIVO");
  const totalCost = activeMembers.reduce((sum, m) => sum + (m.remuneracao ?? 0), 0);
  const activeCount = activeMembers.length;
  const inativos = members.length - activeCount;
  const porCanteiro = new Map<string, number>();
  activeMembers.forEach((m) => {
    if (m.orcamento_id) porCanteiro.set(obraDe(m), (porCanteiro.get(obraDe(m)) ?? 0) + 1);
  });
  const semAlocacao = activeMembers.filter((m) => !m.orcamento_id).length;

  const filtrosObra: [string, string, number][] = [
    ["Todas as Obras", "Todas", members.length],
    ...uniqueObras.map((o): [string, string, number] => [o, o, members.filter((m) => obraDe(m) === o).length]),
    ["—", "Sem obra", members.filter((m) => !m.orcamento_id).length],
  ];

  return (
    <>
      <PageHeader
        crumb={<>Operação / <span aria-current="page" style={{ color: "#001b3d" }}>Equipe</span></>}
        eyebrow="Operação"
        back="/mais"
        title="Equipe"
        subtitle="Profissionais, alocação por obra e custo mensal."
        actions={
          <>
            <Link href="/equipe/cargos" className="gp-btn gp-bs">Cargos</Link>
            <Link href="/equipe/novo" className="gp-btn gp-bp gp-only-d">Novo colaborador</Link>
          </>
        }
      />
      <Fab href="/equipe/novo" label="Novo colaborador" />

      <section aria-label="Indicadores" className="gp-grid">
        <div className="gp-card gp-met gp-dark">
          <span className="gp-ml">Custo mensal da equipe</span>
          <span className="gp-mv">{brl(totalCost)}</span>
          <span className="gp-ms">Remuneração dos colaboradores ativos</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Efetivo ativo</span>
          <span className="gp-mv">{activeCount}</span>
          <span className="gp-ms">{inativos} {inativos === 1 ? "inativo" : "inativos"}</span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Canteiros com equipe</span>
          <span className="gp-mv">{porCanteiro.size}</span>
          <span className="gp-ms">
            {porCanteiro.size === 0 ? "Nenhuma alocação" : Array.from(porCanteiro).map(([n, c]) => `${n} (${c})`).join(" · ")}
          </span>
        </div>
        <div className="gp-card gp-met">
          <span className="gp-ml">Sem alocação</span>
          <span className="gp-mv">{semAlocacao}</span>
          <span className="gp-ms">{semAlocacao === 0 ? "Todos os ativos estão em obra" : "Ativos sem obra definida"}</span>
        </div>
      </section>

      <section className="gp-card" aria-labelledby="h-eq" style={{ overflow: "hidden" }}>
        <h2 id="h-eq" className="gp-sr">Colaboradores</h2>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: "1px solid #E6EBF2" }}>
          <div role="group" aria-label="Filtrar por obra" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {filtrosObra.map(([valor, label, n]) => (
              <button key={valor} type="button" className="gp-chip" aria-pressed={selectedObra === valor} onClick={() => setSelectedObra(valor)}>
                {label}
                <span className="gp-cnt">{n}</span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 10, flex: "0 1 520px" }}>
            <div className="gp-fld" style={{ flex: "0 1 200px" }}>
              <label htmlFor="eq-cargo" className="gp-sr">Filtrar por cargo</label>
              <select id="eq-cargo" value={selectedCargo} onChange={(e) => setSelectedCargo(e.target.value)} className="gp-in" style={{ height: 44, fontSize: 15 }}>
                <option value="Todos os Cargos">Todos os Cargos</option>
                {uniqueCargos.map((cargo) => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
            </div>
            <div className="gp-srch" style={{ flex: "1 1 220px" }}>
              <MagnifyingGlass size={16} aria-hidden="true" />
              <label htmlFor="be" className="gp-sr">Buscar colaborador</label>
              <input id="be" type="search" placeholder="Nome ou cargo" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
            <caption className="gp-sr">Colaboradores</caption>
            <thead>
              <tr>
                <th scope="col" className="gp-th" style={{ paddingLeft: 22 }}>Colaborador</th>
                <th scope="col" className="gp-th">Cargo</th>
                <th scope="col" className="gp-th">Obra</th>
                <th scope="col" className="gp-th" style={{ textAlign: "right" }}>Remuneração</th>
                <th scope="col" className="gp-th">Situação</th>
                <th scope="col" className="gp-th" style={{ paddingRight: 22 }}><span className="gp-sr">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="gp-td" style={{ textAlign: "center", padding: 40, color: "#475569" }} role="status">
                    Carregando membros da equipe...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="gp-td" style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                    Nenhum membro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const projNome = obraDe(member);
                  const ativo = member.status === "ATIVO";
                  return (
                    <tr key={member.id} className="gp-row">
                      <th scope="row" className="gp-td" style={{ paddingLeft: 22, textAlign: "left" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            aria-hidden="true"
                            style={{ width: 38, height: 38, flex: "0 0 38px", borderRadius: 12, background: "#EDF1F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}
                          >
                            {iniciais(member.nome)}
                          </span>
                          <span>
                            <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{member.nome}</span>
                            <span className="gp-mono" style={{ fontSize: 12, fontWeight: 400, color: "#475569" }}>ID: {member.code}</span>
                          </span>
                        </span>
                      </th>
                      <td className="gp-td">{member.cargo}</td>
                      <td className="gp-td" style={{ color: "#475569" }}>{projNome}</td>
                      <td className="gp-td gp-mono" style={{ textAlign: "right" }}>{brl(member.remuneracao ?? 0)}</td>
                      <td className="gp-td">
                        <span className={`gp-bg ${ativo ? "gp-ok" : "gp-ne"}`}>
                          <span className="gp-dot" aria-hidden="true"></span>
                          {ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="gp-td" style={{ paddingRight: 22, textAlign: "right", whiteSpace: "nowrap" }}>
                        <Link
                          href={`/equipe/editar/${member.id}`}
                          className="gp-btn gp-bs gp-sm"
                          title="Editar Colaborador"
                          aria-label={`Editar ${member.nome}`}
                        >
                          Editar
                        </Link>{" "}
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id)}
                          className="gp-ib"
                          style={{ width: 40, height: 40, color: "#B91C1C", verticalAlign: "middle" }}
                          title="Excluir Colaborador"
                          aria-label={`Excluir ${member.nome}`}
                        >
                          <Trash size={18} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
