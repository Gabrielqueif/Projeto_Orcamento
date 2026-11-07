from typing import Any, Dict, List, Optional

from core.obras import resolver_obra_id

TABELA_MEMBROS = "obra_membros"
TABELA_CONVITES = "obra_convites"
COLUNAS_CONVITE = "id, papel, expira_em, usado_em"


class AcessoRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def resolver_obra(self, obra_id: str) -> Optional[str]:
        return resolver_obra_id(self.supabase, obra_id)

    # --- Convites ------------------------------------------------------------

    def criar_convite(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = self.supabase.table(TABELA_CONVITES).insert(dados).execute()
        if not resultado.data:
            raise Exception("Falha ao criar convite")
        return resultado.data[0]

    def listar_convites_pendentes(self, obra_id: str, agora: str) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_CONVITES)
            .select(COLUNAS_CONVITE)
            .eq("obra_id", obra_id)
            .is_("usado_em", "null")
            .gt("expira_em", agora)
            .order("created_at", desc=True)
            .execute()
        )
        return resultado.data or []

    def revogar_convite(self, convite_id: str, obra_id: str) -> bool:
        # Só convites ainda não usados: o vínculo já criado se remove pelo membro.
        resultado = (
            self.supabase.table(TABELA_CONVITES)
            .delete()
            .eq("id", convite_id)
            .eq("obra_id", obra_id)
            .is_("usado_em", "null")
            .execute()
        )
        return bool(resultado.data)

    def consumir_convite(self, token_hash: str, user_id: str, agora: str) -> Optional[Dict[str, Any]]:
        """Marca como usado de forma atômica (UPDATE condicional): dois aceites simultâneos não passam os dois."""
        resultado = (
            self.supabase.table(TABELA_CONVITES)
            .update({"usado_em": agora, "usado_por": user_id})
            .eq("token_hash", token_hash)
            .is_("usado_em", "null")
            .gt("expira_em", agora)
            .execute()
        )
        return resultado.data[0] if resultado.data else None

    def liberar_convite(self, convite_id: str) -> None:
        self.supabase.table(TABELA_CONVITES).update({"usado_em": None, "usado_por": None}).eq("id", convite_id).execute()

    # --- Membros -------------------------------------------------------------

    def upsert_membro(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = self.supabase.table(TABELA_MEMBROS).upsert(dados, on_conflict="obra_id,user_id").execute()
        if not resultado.data:
            raise Exception("Falha ao vincular membro")
        return resultado.data[0]

    def listar_membros(self, obra_id: str) -> List[Dict[str, Any]]:
        resultado = (
            self.supabase.table(TABELA_MEMBROS)
            .select("user_id, papel, created_at")
            .eq("obra_id", obra_id)
            .order("created_at")
            .execute()
        )
        return resultado.data or []

    def perfis(self, user_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        if not user_ids:
            return {}
        resultado = self.supabase.table("profiles").select("id, username, email").in_("id", user_ids).execute()
        return {p["id"]: p for p in (resultado.data or [])}

    def remover_membro(self, obra_id: str, user_id: str) -> bool:
        resultado = (
            self.supabase.table(TABELA_MEMBROS).delete().eq("obra_id", obra_id).eq("user_id", user_id).execute()
        )
        return bool(resultado.data)
