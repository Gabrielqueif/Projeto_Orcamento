"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { X } from "@phosphor-icons/react";
import { getMembroEquipe, updateMembroEquipe } from "@/lib/api/membros_equipe";
import { getOrcamentos, type Orcamento } from "@/lib/api/orcamentos";
import { useToast } from "@/components/common/toast";
import { getCargos, type Cargo, type CampoBase } from "@/lib/api/cargos";
import { CamposExtras } from "@/components/equipe/CamposExtras";
import { PageHeader } from "@/components/layout/PageHeader";

interface FileAttachment {
  name: string;
  size: string;
}

export default function EditarMembroPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Form states
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [dadosExtras, setDadosExtras] = useState<Record<string, unknown>>({});
  const cargo = cargos.find((c) => c.id === cargoId);
  const oculto = (campo: CampoBase) => cargo?.campos_ocultos.includes(campo) ?? false;
  const [dataInicio, setDataInicio] = useState("");
  const [descricao, setDescricao] = useState("");
  const [orcamentoId, setOrcamentoId] = useState<string>("—");
  const [remuneracao, setRemuneracao] = useState("");
  const [status, setStatus] = useState("ATIVO");
  
  // Real projects state
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drag & drop file states
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [membro, orcamentosData, cargosData] = await Promise.all([
          getMembroEquipe(id),
          getOrcamentos(),
          getCargos(),
        ]);
        setCargos(cargosData);
        
        setOrcamentos(orcamentosData);
        
        if (membro) {
          setNome(membro.nome);
          setCpf(membro.cpf || "");
          // Membros antigos só têm o nome do cargo: casa pelo nome.
          setCargoId(
            membro.cargo_id ||
              cargosData.find((c) => c.nome.toLowerCase() === membro.cargo.toLowerCase())?.id ||
              ""
          );
          setDadosExtras(membro.dados_extras || {});
          setDataInicio(membro.data_inicio || "");
          setDescricao(membro.descricao || "");
          setOrcamentoId(membro.orcamento_id || "—");
          setStatus(membro.status);
          
          // Format salary for the input
          const formattedVal = (membro.remuneracao ?? 0).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          setRemuneracao(formattedVal);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do colaborador:", err);
        showToast("Erro ao carregar os dados do colaborador.", undefined, "error");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      loadData();
    }
  }, [id]);

  // Mask CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      value = value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setCpf(value);
    }
  };

  // Mask Salary (R$ Money)
  const handleRemuneracaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setRemuneracao("");
      return;
    }
    const numberValue = parseFloat(value) / 100;
    const formatted = numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setRemuneracao(formatted);
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const addFiles = (files: File[]) => {
    const newAttachments = files.map((file) => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        name: file.name,
        size: `${sizeInMB} MB`,
      };
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit / Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !cargo || (!oculto("cpf") && !cpf) || (!oculto("data_inicio") && !dataInicio) || (!oculto("remuneracao") && !remuneracao)) {
      showToast("Por favor, preencha todos os campos obrigatórios.", undefined, "warning");
      return;
    }

    const rawVal = remuneracao.replace(/\./g, "").replace(",", ".");
    const numRemuneracao = parseFloat(rawVal) || 0;

    try {
      await updateMembroEquipe(id, {
        nome,
        cpf: oculto("cpf") ? undefined : cpf,
        cargo_id: cargoId,
        dados_extras: dadosExtras,
        data_inicio: oculto("data_inicio") ? undefined : dataInicio,
        descricao: oculto("descricao") ? undefined : descricao,
        orcamento_id: orcamentoId === "—" ? null : orcamentoId,
        remuneracao: oculto("remuneracao") ? undefined : numRemuneracao,
        status,
      });
      router.push("/equipe");
    } catch (err) {
      console.error("Erro ao salvar colaborador:", err);
      showToast("Ocorreu um erro ao salvar as alterações do colaborador.", undefined, "error");
    }
  };

  if (loading) {
    return (
      <p role="status" style={{ padding: 48, textAlign: "center", color: "#475569" }}>
        Carregando dados do colaborador...
      </p>
    );
  }


  return (
    <>
      <PageHeader
        back="/equipe"
        backLabel="Voltar para equipe"
        crumb={<>Operação / <Link href="/equipe">Equipe</Link> / <span aria-current="page" style={{ color: "#001b3d" }}>Editar colaborador</span></>}
        eyebrow="Equipe"
        title="Editar colaborador"
        subtitle="Atualize os dados, a alocação e a situação do profissional."
      />

      <form onSubmit={handleSave} className="gp-card" style={{ maxWidth: 720, width: "100%", overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="gp-fld">
            <label htmlFor="nome" className="gp-lb">
              Nome completo <span className="gp-req">(obrigatório)</span>
            </label>
            <input
              id="nome"
              type="text"
              required
              aria-required="true"
              placeholder="Ex: Roberto Silva Santos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="gp-in"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {!oculto("cpf") && (
              <div className="gp-fld">
                <label htmlFor="cpf" className="gp-lb">
                  CPF / Documento <span className="gp-req">(obrigatório)</span>
                </label>
                <input
                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="gp-in gp-mono"
                />
              </div>
            )}

            <div className="gp-fld">
              <label htmlFor="cargo" className="gp-lb">
                Cargo <span className="gp-req">(obrigatório)</span>
              </label>
              <select id="cargo" required value={cargoId} onChange={(e) => setCargoId(e.target.value)} className="gp-in">
                <option value="" disabled>Selecione uma função</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <CamposExtras campos={cargo?.campos_extras ?? []} valores={dadosExtras} onChange={(k, v) => setDadosExtras((d) => ({ ...d, [k]: v }))} />

            {!oculto("data_inicio") && (
              <div className="gp-fld">
                <label htmlFor="dataInicio" className="gp-lb">
                  Data de início <span className="gp-req">(obrigatório)</span>
                </label>
                <input
                  id="dataInicio"
                  type="date"
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="gp-in"
                />
              </div>
            )}

            <div className="gp-fld">
              <label htmlFor="projeto" className="gp-lb">Obra</label>
              <select id="projeto" value={orcamentoId} onChange={(e) => setOrcamentoId(e.target.value)} className="gp-in">
                <option value="—">Sem alocação (banco)</option>
                {orcamentos.map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>

            {!oculto("remuneracao") && (
              <div className="gp-fld">
                <label htmlFor="remuneracao" className="gp-lb">
                  Remuneração <span className="gp-req">(obrigatório)</span>
                </label>
                <div className="gp-affix">
                  <span>R$</span>
                  <input
                    id="remuneracao"
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.000,00"
                    value={remuneracao}
                    onChange={handleRemuneracaoChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="gp-fld">
            <label htmlFor="status" className="gp-lb">Situação</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="gp-in">
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
            <span className="gp-hint">
              {status === "ATIVO"
                ? "Aparece no diário e entra no custo da obra."
                : "Fica no histórico e sai das listas de alocação. Pode ser reativado."}
            </span>
          </div>

          {!oculto("descricao") && (
            <div className="gp-fld">
              <label htmlFor="descricao" className="gp-lb">Descrição das atividades / o que faz</label>
              <textarea
                id="descricao"
                rows={3}
                placeholder="Descreva brevemente as responsabilidades e tarefas principais..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="gp-in"
              />
            </div>
          )}

          <div className="gp-fld">
            <span className="gp-lb">Documentos do colaborador</span>
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: 18,
                border: `2px dashed ${isDragging ? "#00a3b1" : "#7B8AA0"}`,
                borderRadius: 14,
                background: "#F4F6FA",
                color: "#001b3d",
                cursor: "pointer",
              }}
            >
              <strong>Anexar documentos (clique ou arraste)</strong>
              <span className="gp-hint">PDF, PNG ou JPG, até 10 MB. Identidade, certificados e contratos.</span>
              <input type="file" multiple onChange={handleFileChange} className="gp-sr" accept=".pdf,.png,.jpg,.jpeg" />
            </label>
            {attachments.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Arquivos selecionados">
                {attachments.map((file, idx) => (
                  <li key={idx} className="gp-li">
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </span>
                      <span className="gp-hint gp-mono">{file.size}</span>
                    </span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="gp-ib" style={{ width: 40, height: 40 }} aria-label={`Remover ${file.name}`}>
                      <X size={16} weight="bold" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="gp-df">
          <button type="button" onClick={() => router.push("/equipe")} className="gp-btn gp-bs">Cancelar</button>
          <button type="submit" className="gp-btn gp-bp">Salvar alterações</button>
        </div>
      </form>
    </>
  );
}
