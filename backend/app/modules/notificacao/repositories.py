from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

TABELA_NOTIFICACOES_LIDAS = "notificacoes_lidas"
TABELA_EVENTOS = "notificacoes_evento"


class NotificacaoRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def chaves_lidas(self, user_id: str) -> List[str]:
        resultado = self.supabase.table(TABELA_NOTIFICACOES_LIDAS).select("chave").eq("user_id", user_id).execute()
        return [r["chave"] for r in (resultado.data or [])]

    def apagar_obsoletas(self, user_id: str, ativas: List[str]) -> None:
        """Remove as chaves do usuário que não são mais riscos ativos; sem riscos, remove todas."""
        consulta = self.supabase.table(TABELA_NOTIFICACOES_LIDAS).delete().eq("user_id", user_id)
        if ativas:
            consulta = consulta.not_.in_("chave", ativas)
        consulta.execute()

    def marcar(self, user_id: str, chaves: List[str]) -> None:
        linhas: List[Dict[str, Any]] = [{"user_id": user_id, "chave": c} for c in chaves]
        self.supabase.table(TABELA_NOTIFICACOES_LIDAS).upsert(linhas, on_conflict="user_id,chave").execute()

    # --- Eventos persistidos (ex.: diário enviado) ---------------------------

    def listar_eventos(self, user_id: str, limite: int = 30) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_EVENTOS)
            .select("id, tipo, titulo, descricao, href, lida_em")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limite)
            .execute()
        )
        return resultado.data or []

    def marcar_eventos(self, user_id: str, ids: Optional[List[str]]) -> None:
        """ids None marca todos os não lidos do usuário."""
        consulta = (
            self.supabase.table(TABELA_EVENTOS)
            .update({"lida_em": datetime.now(timezone.utc).isoformat()})
            .eq("user_id", user_id)
            .is_("lida_em", "null")
        )
        if ids is not None:
            consulta = consulta.in_("id", ids)
        consulta.execute()
