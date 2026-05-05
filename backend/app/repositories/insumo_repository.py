from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

TABELA_INSUMOS = "orcamento_item_insumo"


class InsumoRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar_batch(self, dados: List[Dict[str, Any]]) -> int:
        """Insere múltiplos insumos de uma vez para um item do orçamento."""
        if not dados:
            return 0
        try:
            r = self.supabase.table(TABELA_INSUMOS).insert(dados).execute()
            return len(r.data) if r.data else 0
        except Exception as e:
            logger.error(f"Erro ao inserir insumos em batch: {e}")
            return 0

    def listar_por_item(self, orcamento_item_id: str) -> List[Dict[str, Any]]:
        """Lista todos os insumos de um item do orçamento."""
        try:
            r = self.supabase.table(TABELA_INSUMOS)\
                .select("*")\
                .eq("orcamento_item_id", orcamento_item_id)\
                .execute()
            return r.data or []
        except Exception as e:
            logger.error(f"Erro ao listar insumos do item {orcamento_item_id}: {e}")
            return []

    def atualizar(self, insumo_id: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza dados de um insumo específico."""
        try:
            r = self.supabase.table(TABELA_INSUMOS)\
                .update(dados)\
                .eq("id", insumo_id)\
                .execute()
            return r.data[0] if r.data else None
        except Exception as e:
            logger.error(f"Erro ao atualizar insumo {insumo_id}: {e}")
            return None

    def buscar_por_id(self, insumo_id: str) -> Optional[Dict[str, Any]]:
        """Busca um insumo específico pelo ID."""
        try:
            r = self.supabase.table(TABELA_INSUMOS).select("*").eq("id", insumo_id).execute()
            return r.data[0] if r.data else None
        except Exception as e:
            logger.error(f"Erro ao buscar insumo {insumo_id}: {e}")
            return None

    def deletar_por_item(self, orcamento_item_id: str) -> None:
        """Remove todos os insumos de um item (usado ao re-explodir após edição)."""
        try:
            self.supabase.table(TABELA_INSUMOS)\
                .delete()\
                .eq("orcamento_item_id", orcamento_item_id)\
                .execute()
        except Exception as e:
            logger.error(f"Erro ao deletar insumos do item {orcamento_item_id}: {e}")
