"use client";

import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { createOrcamento } from "@/lib/api/orcamentos";
import { getMembrosEquipe, alocarMembrosAoOrcamento, type MembroEquipe } from "@/lib/api/membros_equipe";
import { getEquipes, type Equipe } from "@/lib/api/equipes";
import { useRouter } from "next/navigation";
import { ObraWizardStepper, ObraWizardResumo, resumoBase } from "@/components/obras/ObraWizardStepper";
import { useToast } from "@/components/common/toast";

export default function NovaObraEtapa2Page() {
  const { showToast } = useToast();
  const { data } = useWizard();
  const [professionals, setProfessionals] = useState<MembroEquipe[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState<string>("—");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      getMembrosEquipe().then((res) => res.filter((m) => m.status === "ATIVO")),
      getEquipes(),
    ])
      .then(([membrosActivos, equipesList]) => {
        setProfessionals(membrosActivos);
        setEquipes(equipesList);
      })
      .catch((err) => console.error("Erro ao carregar dados de equipe:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleFinish = async () => {
    if (!data.nome || !data.cliente) {
      showToast("Por favor, preencha os dados básicos na Etapa 1.", undefined, "warning");
      router.push("/obras/novo");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Criar o orçamento (obra) no backend
      const newOrcamento = await createOrcamento({
        nome: data.nome,
        cliente: data.cliente,
        data: data.dataInicio || new Date().toISOString().split("T")[0],
        base_referencia: data.baseReferencia,
        tipo_composicao: data.tipoComposicao || "Sem Desoneração",
        estado: data.estado,
        fonte: "SINAPI",
        bdi: data.bdi,
        status: data.status || "em_elaboracao",
      });

      // 2. Alocar os membros selecionados ao novo orçamento criado
      if (selectedMemberIds.length > 0 && newOrcamento?.id) {
        await alocarMembrosAoOrcamento(selectedMemberIds, newOrcamento.id);
      }

      showToast("Projeto criado com sucesso!", undefined, "success");
      router.push("/obras");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      showToast("Ocorreu um erro ao salvar o projeto.", undefined, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSelectEquipe = (equipeId: string) => {
    setSelectedEquipeId(equipeId);
    if (equipeId === "—") {
      setSelectedMemberIds([]);
      return;
    }
    // Seleciona todos os profissionais ativos que pertencem a esta equipe
    const teamMemberIds = professionals
      .filter((p) => p.equipe_id === equipeId)
      .map((p) => p.id);
    setSelectedMemberIds(teamMemberIds);
  };

  const filteredProfessionals = professionals.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const nSel = selectedMemberIds.length;
  const selTxt = `${nSel} ${nSel === 1 ? "selecionado" : "selecionados"}`;

  return (
    <>
      <ObraWizardStepper currentStep={2} />

      <div className="gp-split">
        <div className="gp-main" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section className="gp-card gp-pad" aria-label="Equipe" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="gp-fld">
              <label htmlFor="equipe-select" className="gp-lb">Selecionar por equipe ou grupo</label>
              <select
                id="equipe-select"
                className="gp-in"
                value={selectedEquipeId}
                onChange={(e) => handleSelectEquipe(e.target.value)}
              >
                <option value="—">Selecione uma equipe para auto-alocar...</option>
                {equipes.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h2 className="gp-h2" style={{ fontSize: 16 }}>Equipe alocada</h2>
              <span className="gp-hint" aria-live="polite">{selTxt}</span>
            </div>

            <label className="gp-srch">
              <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
              <span className="gp-sr">Buscar profissional</span>
              <input
                type="search"
                placeholder="Buscar profissional por nome ou cargo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>

            {loading ? (
              <p role="status" className="gp-hint" style={{ margin: 0, textAlign: "center", padding: 16 }}>
                Carregando profissionais...
              </p>
            ) : filteredProfessionals.length === 0 ? (
              <p className="gp-hint" style={{ margin: 0, textAlign: "center", padding: 16 }}>
                Nenhum profissional cadastrado ou ativo encontrado.
              </p>
            ) : (
              <div
                role="group"
                aria-label="Colaboradores"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}
              >
                {filteredProfessionals.map((person) => {
                  const on = selectedMemberIds.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleMemberSelection(person.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "12px 14px", borderRadius: 14,
                        color: "#001b3d", cursor: "pointer", fontFamily: "inherit",
                        ...(on ? { border: "2px solid #001b3d", background: "#F7FCE9" } : { border: "1px solid #CBD5E1", background: "#fff" }),
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          flex: "0 0 22px", width: 22, height: 22, boxSizing: "border-box", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800,
                          ...(on ? { background: "#001b3d", color: "#fff" } : { border: "2px solid #7B8AA0" }),
                        }}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span style={{ textAlign: "left", minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: 15 }}>{person.nome}</strong>
                        <span style={{ fontSize: 13, color: "#475569" }}>{person.cargo}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <Link href="/equipe" style={{ fontSize: 14, fontWeight: 800 }}>Cadastrar novo colaborador</Link>
          </section>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Link href="/obras/novo" className="gp-btn gp-bs">Voltar</Link>
            <Link href="/obras/novo/etapa-3" className="gp-btn gp-bp">Próximo: financeiro</Link>
          </div>
        </div>

        <ObraWizardResumo itens={[...resumoBase(data), { label: "Equipe", valor: selTxt }]} />
      </div>
    </>
  );
}
