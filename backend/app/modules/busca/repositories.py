import logging
from typing import Any, Dict, List

logger = logging.getLogger("projeto_orcamento")

TABELA_OBRAS = "obras"
TABELA_ORCAMENTOS = "orcamentos"
TABELA_MEMBROS = "membros_equipe"


class BuscaRepository:
    """Consultas de busca. `termo` chega já sanitizado pelo serviço; todas filtram por user_id."""

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def buscar_obras(self, termo: str, user_id: str, limite: int) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_OBRAS)
            .select("id, orcamento_id, escopo, cliente")
            .eq("user_id", user_id)
            .or_(f"escopo.ilike.%{termo}%,cliente.ilike.%{termo}%")
            .order("created_at", desc=True)
            .limit(limite)
            .execute()
        )
        return resultado.data or []

    def buscar_orcamentos(self, termo: str, user_id: str, limite: int) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_ORCAMENTOS)
            .select("id, nome, cliente")
            .eq("user_id", user_id)
            .or_(f"nome.ilike.%{termo}%,cliente.ilike.%{termo}%")
            .order("created_at", desc=True)
            .limit(limite)
            .execute()
        )
        return resultado.data or []

    def buscar_membros(self, termo: str, user_id: str, limite: int) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_MEMBROS)
            .select("id, nome, cargo")
            .eq("user_id", user_id)
            .or_(f"nome.ilike.%{termo}%,cargo.ilike.%{termo}%")
            .order("nome")
            .limit(limite)
            .execute()
        )
        return resultado.data or []
