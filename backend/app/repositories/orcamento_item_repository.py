from typing import List, Dict, Any, Optional

TABELA_ORCAMENTO_ITENS = "orcamento_itens"

class OrcamentoItemRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        resultado = self.supabase.table(TABELA_ORCAMENTO_ITENS).insert(dados).execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def listar_por_orcamento(self, orcamento_id: str) -> List[Dict[str, Any]]:
        resultado = self.supabase.table(TABELA_ORCAMENTO_ITENS).select("*").eq("orcamento_id", orcamento_id).order("created_at").execute()
        return resultado.data or []

    def buscar_por_id(self, item_id: str, orcamento_id: str = None) -> Optional[Dict[str, Any]]:
        query = self.supabase.table(TABELA_ORCAMENTO_ITENS).select("*").eq("id", item_id)
        if orcamento_id:
            query = query.eq("orcamento_id", orcamento_id)
        resultado = query.execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def atualizar(self, item_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        resultado = self.supabase.table(TABELA_ORCAMENTO_ITENS).update(dados).eq("id", item_id).execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def deletar(self, item_id: str) -> bool:
        self.supabase.table(TABELA_ORCAMENTO_ITENS).delete().eq("id", item_id).execute()
        return True

    def calcular_total_itens(self, orcamento_id: str) -> float:
        resultado = self.supabase.table(TABELA_ORCAMENTO_ITENS).select("preco_total").eq("orcamento_id", orcamento_id).execute()
        total = 0.0
        if resultado.data:
            for item in resultado.data:
                preco = item.get("preco_total")
                if preco:
                    total += float(preco)
        return total
