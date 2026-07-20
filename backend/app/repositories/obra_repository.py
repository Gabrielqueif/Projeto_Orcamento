from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger("projeto_orcamento")

TABELA_OBRAS = "obras"
TABELA_ORCAMENTOS_META = "orcamentos_meta"
TABELA_LIMITES = "limites_requisicao"

class ObraRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar_obra(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        try:
            resultado = self.supabase.table(TABELA_OBRAS).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao criar registro de obra")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro no ObraRepository.criar_obra: {e}")
            raise e

    def buscar_obra_por_id(self, obra_id: str) -> Optional[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_OBRAS).select("*").eq("id", obra_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar obra por id {obra_id}: {e}")
            return None

    def listar_obras(self) -> List[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_OBRAS).select("*").order("created_at", desc=True).execute()
            return resultado.data or []
        except Exception as e:
            logger.error(f"Erro ao listar obras: {e}")
            return []

    def criar_snapshot_meta(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        try:
            resultado = self.supabase.table(TABELA_ORCAMENTOS_META).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao criar snapshot do orçamento meta")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao criar snapshot meta: {e}")
            raise e

    def buscar_snapshot_meta_por_orcamento(self, orcamento_id: str) -> Optional[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_ORCAMENTOS_META).select("*").eq("orcamento_id", orcamento_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar snapshot meta do orçamento {orcamento_id}: {e}")
            return None

    def criar_limites_requisicao_batch(self, limites: List[Dict[str, Any]]) -> int:
        if not limites:
            return 0
        try:
            resultado = self.supabase.table(TABELA_LIMITES).insert(limites).execute()
            return len(resultado.data) if resultado.data else 0
        except Exception as e:
            logger.error(f"Erro ao inserir limites de requisição em batch: {e}")
            raise e

    def listar_limites_por_obra(self, obra_id: str) -> List[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_LIMITES).select("*").eq("obra_id", obra_id).execute()
            return resultado.data or []
        except Exception as e:
            logger.error(f"Erro ao listar limites da obra {obra_id}: {e}")
            return []
