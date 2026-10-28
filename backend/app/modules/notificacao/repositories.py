from typing import Any, Dict, List

TABELA_NOTIFICACOES_LIDAS = "notificacoes_lidas"


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
