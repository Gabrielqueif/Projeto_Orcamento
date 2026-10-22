from datetime import date
from typing import Any, Dict, List

COLUNAS_OBRA = "id, orcamento_id, cliente, escopo, status, data_inicio_real, prazo_estimado_dias"


class DashboardRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def obras_do_usuario(self, user_id: str) -> List[Dict[str, Any]]:
        resultado = self.supabase.table("obras").select(COLUNAS_OBRA).eq("user_id", user_id).execute()
        return resultado.data or []

    def nomes_de_orcamentos(self, orcamento_ids: List[str]) -> Dict[str, str]:
        if not orcamento_ids:
            return {}
        resultado = self.supabase.table("orcamentos").select("id, nome").in_("id", orcamento_ids).execute()
        return {r["id"]: r["nome"] for r in (resultado.data or []) if r.get("nome")}

    def insumos_criticos_por_obra(self, obra_ids: List[str]) -> Dict[str, int]:
        """Insumos com saldo igual ou abaixo do mínimo, a mesma regra do almoxarifado."""
        if not obra_ids:
            return {}
        resultado = (
            self.supabase.table("estoque_insumos")
            .select("obra_id, quantidade_atual, quantidade_minima")
            .in_("obra_id", obra_ids)
            .execute()
        )
        contagem: Dict[str, int] = {}
        for insumo in resultado.data or []:
            if float(insumo.get("quantidade_atual") or 0) <= float(insumo.get("quantidade_minima") or 0):
                contagem[insumo["obra_id"]] = contagem.get(insumo["obra_id"], 0) + 1
        return contagem

    def diarios_recentes(self, obra_ids: List[str], desde: date) -> List[Dict[str, Any]]:
        if not obra_ids:
            return []
        resultado = (
            self.supabase.table("diarios_obra")
            .select("obra_id, data, titulo, status, updated_at")
            .in_("obra_id", obra_ids)
            .gte("data", desde.isoformat())
            .order("data", desc=True)
            .execute()
        )
        return resultado.data or []

    def atualizar_status_obra(self, obra_id: str, status: str) -> None:
        self.supabase.table("obras").update({"status": status}).eq("id", obra_id).execute()
