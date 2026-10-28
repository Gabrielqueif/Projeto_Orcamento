from datetime import datetime, timezone
from typing import Any, Dict, Optional

TABELA_PROFILES = "profiles"
CAMPOS_EDITAVEIS = frozenset({"full_name", "cargo"})
CAMPOS_LEITURA = "id,email,full_name,cargo,username,role"


class PerfilRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def buscar(self, user_id: str) -> Optional[Dict[str, Any]]:
        resultado = self.supabase.table(TABELA_PROFILES).select(CAMPOS_LEITURA).eq("id", user_id).execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def atualizar(self, user_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # `role` nunca entra num update: só os campos editáveis pelo próprio usuário passam.
        if not set(dados) <= CAMPOS_EDITAVEIS:
            raise ValueError("Campo não editável no perfil")

        dados_atualizacao = {**dados, "updated_at": datetime.now(timezone.utc).isoformat()}
        resultado = self.supabase.table(TABELA_PROFILES).update(dados_atualizacao).eq("id", user_id).execute()
        if resultado.data:
            return resultado.data[0]
        return None
