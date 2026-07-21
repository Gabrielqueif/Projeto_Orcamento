from typing import List, Dict, Any, Optional

TABELA_ETAPAS = "orcamento_etapas"

class EtapaRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = self.supabase.table(TABELA_ETAPAS).insert(dados).execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def listar_por_orcamento(self, orcamento_id: str) -> List[Dict[str, Any]]:
        resultado = self.supabase.table(TABELA_ETAPAS)\
            .select("*")\
            .eq("orcamento_id", orcamento_id)\
            .order("ordem")\
            .execute()
        return resultado.data or []

    def atualizar(self, etapa_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        resultado = self.supabase.table(TABELA_ETAPAS)\
            .update(dados)\
            .eq("id", etapa_id)\
            .execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def deletar(self, etapa_id: str, orcamento_id: str) -> bool:
        resultado = self.supabase.table(TABELA_ETAPAS)\
            .delete()\
            .eq("id", etapa_id)\
            .eq("orcamento_id", orcamento_id)\
            .execute()
        return True
