from typing import Any, Dict, List, Optional

from core.obras import resolver_obra_id

TABELA_MEDICOES = "medicoes_etapa"
COLUNAS_MEDICAO = "id, obra_id, etapa_id, data, progresso, origem, diario_id, observacao, created_at"
COLUNAS_OBRA = "id, orcamento_id, status, data_inicio_real, prazo_estimado_dias"
COLUNAS_ETAPA = "id, orcamento_id, nome, ordem, parent_id, data_inicio, data_fim, progresso"


class MedicaoRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    # --- Contexto da obra ----------------------------------------------------

    def resolver_obra(self, obra_id: str) -> Optional[str]:
        return resolver_obra_id(self.supabase, obra_id)

    def buscar_obra(self, obra_id: str) -> Optional[Dict[str, Any]]:
        resultado = self.supabase.table("obras").select(COLUNAS_OBRA).eq("id", obra_id).execute()
        return resultado.data[0] if resultado.data else None

    def buscar_obra_por_orcamento(self, orcamento_id: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table("obras").select(COLUNAS_OBRA).eq("orcamento_id", orcamento_id).limit(1).execute()
        )
        return resultado.data[0] if resultado.data else None

    def etapas(self, orcamento_id: str) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table("orcamento_etapas")
            .select(COLUNAS_ETAPA)
            .eq("orcamento_id", orcamento_id)
            .order("ordem")
            .execute()
        )
        return resultado.data or []

    def pesos_por_etapa(self, orcamento_id: str) -> Dict[str, float]:
        """Custo orçado de cada etapa (soma dos itens), usado como peso na Curva S."""
        resultado = (
            self.supabase.table("orcamento_itens")
            .select("etapa_id, preco_total")
            .eq("orcamento_id", orcamento_id)
            .execute()
        )
        pesos: Dict[str, float] = {}
        for item in resultado.data or []:
            if item.get("etapa_id"):
                pesos[item["etapa_id"]] = pesos.get(item["etapa_id"], 0.0) + float(item.get("preco_total") or 0)
        return pesos

    def atualizar_progresso_etapa(self, etapa_id: str, orcamento_id: str, progresso: int) -> None:
        (
            self.supabase.table("orcamento_etapas")
            .update({"progresso": progresso})
            .eq("id", etapa_id)
            .eq("orcamento_id", orcamento_id)
            .execute()
        )

    def atualizar_status_obra(self, obra_id: str, status: str) -> None:
        self.supabase.table("obras").update({"status": status}).eq("id", obra_id).execute()

    # --- Medições ------------------------------------------------------------

    def listar(self, obra_id: str, etapa_id: Optional[str] = None) -> List[Dict[str, Any]]:
        consulta = self.supabase.table(TABELA_MEDICOES).select(COLUNAS_MEDICAO).eq("obra_id", obra_id)
        if etapa_id:
            consulta = consulta.eq("etapa_id", etapa_id)
        return consulta.order("data", desc=True).execute().data or []

    def buscar(self, medicao_id: str, obra_id: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_MEDICOES)
            .select(COLUNAS_MEDICAO)
            .eq("id", medicao_id)
            .eq("obra_id", obra_id)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def buscar_por_etapa_data(self, etapa_id: str, data: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_MEDICOES)
            .select(COLUNAS_MEDICAO)
            .eq("etapa_id", etapa_id)
            .eq("data", data)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def inserir(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = self.supabase.table(TABELA_MEDICOES).insert(dados).execute()
        if not resultado.data:
            raise Exception("Falha ao registrar medição")
        return resultado.data[0]

    def atualizar(self, medicao_id: str, obra_id: str, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = (
            self.supabase.table(TABELA_MEDICOES).update(dados).eq("id", medicao_id).eq("obra_id", obra_id).execute()
        )
        if not resultado.data:
            raise Exception("Falha ao atualizar medição")
        return resultado.data[0]

    def deletar(self, medicao_id: str, obra_id: str) -> bool:
        resultado = self.supabase.table(TABELA_MEDICOES).delete().eq("id", medicao_id).eq("obra_id", obra_id).execute()
        return bool(resultado.data)

    def deletar_do_diario(self, diario_id: str, obra_id: str) -> List[str]:
        """Remove as medições nascidas de um diário e devolve as etapas afetadas."""
        resultado = (
            self.supabase.table(TABELA_MEDICOES).delete().eq("diario_id", diario_id).eq("obra_id", obra_id).execute()
        )
        return list({r["etapa_id"] for r in (resultado.data or [])})

    def ultima_da_etapa(self, etapa_id: str) -> Optional[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_MEDICOES)
            .select(COLUNAS_MEDICAO)
            .eq("etapa_id", etapa_id)
            .order("data", desc=True)
            .limit(1)
            .execute()
        )
        return resultado.data[0] if resultado.data else None
