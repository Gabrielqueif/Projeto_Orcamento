import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

TABELA_COMPOSICOES = "composicao"
TABELA_COMPOSICOES_ESTADOS = "composicao_estados"
TABELA_COMPOSICAO_ITENS = "composicao_itens"

class ItemRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def upsert_batch_composicoes(self, dados: List[Dict[str, Any]]) -> int:
        if not dados: return 0
        total = 0
        for i in range(0, len(dados), 1000):
            try:
                r = self.supabase.table(TABELA_COMPOSICOES).upsert(
                    dados[i:i+1000],
                    on_conflict="codigo_composicao,mes_referencia,fonte"
                ).execute()
                if r.data: total += len(r.data)
            except Exception as e:
                logger.error(f"Erro lote {TABELA_COMPOSICOES}: {e}")
        return total

    def upsert_batch_estados(self, dados: List[Dict[str, Any]]) -> int:
        if not dados: return 0
        total = 0
        for i in range(0, len(dados), 1000):
            try:
                r = self.supabase.table(TABELA_COMPOSICOES_ESTADOS).upsert(
                    dados[i:i+1000],
                    on_conflict="codigo_composicao,mes_referencia,tipo_composicao,fonte"
                ).execute()
                if r.data: total += len(r.data)
            except Exception as e:
                logger.error(f"Erro lote {TABELA_COMPOSICOES_ESTADOS}: {e}")
        return total

    def listar(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("*").limit(limit).execute().data or []

    def buscar_por_codigo(self, codigo: str, fonte: str = "SINAPI") -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("*")\
            .eq("codigo_composicao", codigo)\
            .eq("fonte", fonte)\
            .execute().data

    def buscar_por_descricao(self, termo: str, fonte: str = "SINAPI", limit: int = 50) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("*")\
            .ilike("descricao", f"%{termo}%")\
            .eq("fonte", fonte)\
            .limit(limit).execute().data

    def listar_estados_por_item(self, codigo_composicao: str, mes_referencia: str, fonte: str = "SINAPI") -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES_ESTADOS).select("*")\
            .eq("codigo_composicao", codigo_composicao)\
            .eq("mes_referencia", mes_referencia)\
            .eq("fonte", fonte)\
            .execute().data or []

    def listar_bases_disponiveis(self) -> List[Dict[str, Any]]:
        """Retorna todos os meses e tipos de composição disponíveis no banco."""
        # Consultar na tabela de composições para garantir que meses apareçam mesmo sem preços
        return self.supabase.table(TABELA_COMPOSICOES).select("mes_referencia,fonte").execute().data or []

    def buscar_preco(self, codigo_composicao: str, estado: str, mes_referencia: str, tipo_composicao: str, fonte: str = "SINAPI") -> Optional[float]:
        """Busca o preço de uma composição para um estado, mês, tipo e fonte específicos."""
        try:
            r = self.supabase.table(TABELA_COMPOSICOES_ESTADOS)\
                .select("*")\
                .eq("codigo_composicao", codigo_composicao)\
                .eq("mes_referencia", mes_referencia)\
                .eq("tipo_composicao", tipo_composicao)\
                .eq("fonte", fonte)\
                .execute()
            
            if not r.data:
                return None
                
            dados = r.data[0]
            preco = dados.get(estado.lower())
            return float(preco) if preco is not None else None
        except Exception:
            return None

    def upsert_batch_composicao_itens(self, dados: List[Dict[str, Any]]) -> int:
        """Grava os relacionamentos pai→filho da aba Analítico na tabela composicao_itens."""
        if not dados:
            return 0
        total = 0
        for i in range(0, len(dados), 500):
            try:
                r = self.supabase.table(TABELA_COMPOSICAO_ITENS).upsert(
                    dados[i:i+500],
                    on_conflict="codigo_pai,codigo_filho,mes_referencia,fonte"
                ).execute()
                if r.data:
                    total += len(r.data)
            except Exception as e:
                logger.error(f"Erro lote {TABELA_COMPOSICAO_ITENS}: {e}")
        return total

    def buscar_filhos_composicao(self, codigo_pai: str, mes_referencia: str, fonte: str = "SINAPI") -> List[Dict[str, Any]]:
        """Retorna os insumos/sub-composições que compõem uma composição pai."""
        try:
            r = self.supabase.table(TABELA_COMPOSICAO_ITENS)\
                .select("*")\
                .eq("codigo_pai", codigo_pai)\
                .eq("mes_referencia", mes_referencia)\
                .eq("fonte", fonte)\
                .execute()
            return r.data or []
        except Exception as e:
            logger.error(f"Erro ao buscar filhos de {codigo_pai}: {e}")
            return []
