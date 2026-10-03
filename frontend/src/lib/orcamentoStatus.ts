export type OrcamentoStatus =
  | "em_elaboracao"
  | "pendente"
  | "aprovado"
  | "recusado"
  | "cancelado";

export interface StatusInfo {
  label: string;
  filterLabel: string;
  style: string;
  dot: string;
}

export const STATUS_INFO: Record<OrcamentoStatus, StatusInfo> = {
  em_elaboracao: {
    label: "EM ELABORAÇÃO",
    filterLabel: "Em elaboração",
    style: "bg-[rgba(0,163,177,0.1)] text-[#00a3b1]",
    dot: "bg-[#00a3b1]",
  },
  pendente: {
    label: "PENDENTE",
    filterLabel: "Pendentes",
    style: "bg-[rgba(221,196,59,0.25)] text-[#967809]",
    dot: "bg-[#967809]",
  },
  aprovado: {
    label: "APROVADO",
    filterLabel: "Aprovados",
    style: "bg-[#f0fdf4] text-[#15803d]",
    dot: "bg-[#15803d]",
  },
  recusado: {
    label: "RECUSADO",
    filterLabel: "Recusados",
    style: "bg-[#fef2f2] text-[#dc2626]",
    dot: "bg-[#dc2626]",
  },
  cancelado: {
    label: "CANCELADO",
    filterLabel: "Cancelados",
    style: "bg-[#f1f5f9] text-[#64748b]",
    dot: "bg-[#64748b]",
  },
};

export const STATUS_ORDER = Object.keys(STATUS_INFO) as OrcamentoStatus[];

// Valores antigos que ainda podem existir no banco.
const STATUS_ALIASES: Record<string, OrcamentoStatus> = {
  concluido: "aprovado",
  orcamento_concluido: "aprovado",
};

export const UNKNOWN_STATUS_STYLE = "bg-[#f1f5f9] text-[#64748b]";
export const UNKNOWN_STATUS_DOT = "bg-[#64748b]";

/** Normaliza o valor salvo para um status conhecido; `null` se não for reconhecido. */
export function normalizeStatus(raw: string | null | undefined): OrcamentoStatus | null {
  const s = (raw ?? "").trim().toLowerCase();
  if (s in STATUS_INFO) return s as OrcamentoStatus;
  return STATUS_ALIASES[s] ?? null;
}

/** Dados de exibição; valores desconhecidos mostram o texto cru em estilo neutro. */
export function getStatusDisplay(raw: string | null | undefined): Omit<StatusInfo, "filterLabel"> {
  const status = normalizeStatus(raw);
  if (status) return STATUS_INFO[status];
  return {
    label: (raw ?? "").trim().toUpperCase() || "—",
    style: UNKNOWN_STATUS_STYLE,
    dot: UNKNOWN_STATUS_DOT,
  };
}
