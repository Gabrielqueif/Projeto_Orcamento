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
            logger.info(
                f"[buscar_preco] Buscando: codigo={codigo_composicao!r}, estado={estado!r}, "
                f"mes_referencia={mes_referencia!r}, tipo_composicao={tipo_composicao!r}, fonte={fonte!r}"
            )

            # Tentativa 1: busca exata
            r = self.supabase.table(TABELA_COMPOSICOES_ESTADOS)\
                .select("*")\
                .eq("codigo_composicao", codigo_composicao)\
                .eq("mes_referencia", mes_referencia)\
                .eq("tipo_composicao", tipo_composicao)\
                .eq("fonte", fonte)\
                .execute()

            if not r.data:
                # Diagnóstico: mostrar o que existe para este código + fonte
                diag = self.supabase.table(TABELA_COMPOSICOES_ESTADOS)\
                    .select("codigo_composicao,mes_referencia,tipo_composicao,fonte")\
                    .eq("codigo_composicao", codigo_composicao)\
                    .eq("fonte", fonte)\
                    .limit(5)\
                    .execute()
                logger.warning(
                    f"[buscar_preco] Nenhum registro encontrado para busca exata. "
                    f"Registros existentes no banco para codigo={codigo_composicao!r}, fonte={fonte!r}: {diag.data}"
                )

                # Tentativa 2: fallback com ilike no tipo_composicao (ignora capitalização/acento)
                r2 = self.supabase.table(TABELA_COMPOSICOES_ESTADOS)\
                    .select("*")\
                    .eq("codigo_composicao", codigo_composicao)\
                    .eq("mes_referencia", mes_referencia)\
                    .ilike("tipo_composicao", tipo_composicao)\
                    .eq("fonte", fonte)\
                    .limit(1)\
                    .execute()

                if r2.data:
                    logger.info(f"[buscar_preco] Fallback ilike encontrou: tipo_composicao real={r2.data[0].get('tipo_composicao')!r}")
                    r = r2
                else:
                    # Tentativa 3: fallback ignorando mes_referencia (pegar o mais recente disponível)
                    r3 = self.supabase.table(TABELA_COMPOSICOES_ESTADOS)\
                        .select("*")\
                        .eq("codigo_composicao", codigo_composicao)\
                        .ilike("tipo_composicao", tipo_composicao)\
                        .eq("fonte", fonte)\
                        .execute()
                    
                    if r3.data:
                        def sort_key(d):
                            m_str = d.get('mes_referencia', '00/0000')
                            parts = m_str.split('/')
                            if len(parts) == 2:
                                return (parts[1], parts[0])
                            return ('0000', '00')
                        
                        sorted_data = sorted(r3.data, key=sort_key, reverse=True)
                        logger.warning(
                            f"[buscar_preco] Fallback de mês: {mes_referencia!r} não encontrado. "
                            f"Usando o mais recente: {sorted_data[0].get('mes_referencia')!r}"
                        )
                        r = r3
                        r.data = [sorted_data[0]]
                    else:
                        logger.error(f"[buscar_preco] Falha total: Composição {codigo_composicao} não encontrada em NENHUM mês para fonte {fonte} e tipo {tipo_composicao}.")
                        return None

            dados = r.data[0]
            preco = dados.get(estado.lower())
            logger.info(f"[buscar_preco] Preço encontrado para estado={estado.lower()!r}: {preco}")
            return float(preco) if preco is not None else None
        except Exception as e:
            logger.error(f"[buscar_preco] Exceção: {e}")
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
