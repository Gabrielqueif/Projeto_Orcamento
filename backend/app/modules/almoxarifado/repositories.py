from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger("projeto_orcamento")

TABELA_ESTOQUE = "estoque_insumos"
TABELA_MOVIMENTACOES = "movimentacoes_estoque"
TABELA_LOCACOES = "locacoes_equipamentos"

class AlmoxarifadoRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def _resolver_obra_id(self, obra_id: str) -> str:
        """
        Garante que o ID passado é o ID real da obra (PK na tabela obras).
        Se for o orcamento_id, busca a obra correspondente na tabela obras.
        """
        try:
            res = self.supabase.table("obras").select("id").eq("id", obra_id).execute()
            if res.data:
                return obra_id
            
            res = self.supabase.table("obras").select("id").eq("orcamento_id", obra_id).execute()
            if res.data:
                return res.data[0]["id"]
            
            return obra_id
        except Exception as e:
            logger.warning(f"Erro ao resolver obra_id {obra_id}: {e}")
            return obra_id

    def listar_insumos(self, obra_id: str) -> List[Dict[str, Any]]:
        obra_id_real = self._resolver_obra_id(obra_id)
        try:
            # Consulta otimizada, selecionando colunas específicas
            resultado = self.supabase.table(TABELA_ESTOQUE).select(
                "id, obra_id, codigo_insumo, descricao, categoria, quantidade_atual, quantidade_minima, unidade, preco_unitario, created_at, updated_at"
            ).eq("obra_id", obra_id_real).execute()
            return resultado.data or []
        except Exception as e:
            logger.error(f"Erro ao listar insumos da obra {obra_id}: {e}")
            return []

    def buscar_insumo_por_id(self, insumo_id: str) -> Optional[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_ESTOQUE).select(
                "id, obra_id, codigo_insumo, descricao, categoria, quantidade_atual, quantidade_minima, unidade, preco_unitario"
            ).eq("id", insumo_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar insumo por id {insumo_id}: {e}")
            return None

    def criar_insumo(self, obra_id: str, dados: Dict[str, Any]) -> Dict[str, Any]:
        obra_id_real = self._resolver_obra_id(obra_id)
        try:
            dados["obra_id"] = obra_id_real
            resultado = self.supabase.table(TABELA_ESTOQUE).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao criar registro de insumo no estoque")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao criar insumo: {e}")
            raise e

    def atualizar_quantidade_insumo(self, insumo_id: str, nova_quantidade: float) -> Dict[str, Any]:
        try:
            resultado = self.supabase.table(TABELA_ESTOQUE).update({
                "quantidade_atual": nova_quantidade,
                "updated_at": "now()"
            }).eq("id", insumo_id).execute()
            if not resultado.data:
                raise Exception("Falha ao atualizar quantidade do insumo")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao atualizar quantidade do insumo {insumo_id}: {e}")
            raise e

    def criar_movimentacao(self, insumo_id: str, dados: Dict[str, Any]) -> Dict[str, Any]:
        try:
            dados["insumo_id"] = insumo_id
            resultado = self.supabase.table(TABELA_MOVIMENTACOES).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao registrar movimentação de estoque")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao criar movimentação de estoque: {e}")
            raise e

    def listar_movimentacoes(self, obra_id: str) -> List[Dict[str, Any]]:
        obra_id_real = self._resolver_obra_id(obra_id)
        try:
            # Lista todas as movimentações dos insumos daquela obra realizando join com inner select
            resultado = self.supabase.table(TABELA_MOVIMENTACOES).select(
                "id, insumo_id, tipo_movimentacao, quantidade, responsavel, observacoes, data_movimentacao, created_at, estoque_insumos!inner(obra_id)"
            ).eq("estoque_insumos.obra_id", obra_id_real).execute()
            # Limpa o inner select da resposta final se necessário
            data = resultado.data or []
            for item in data:
                if "estoque_insumos" in item:
                    del item["estoque_insumos"]
            return data
        except Exception as e:
            logger.error(f"Erro ao listar movimentações da obra {obra_id}: {e}")
            return []

    def listar_locacoes(self, obra_id: str) -> List[Dict[str, Any]]:
        obra_id_real = self._resolver_obra_id(obra_id)
        try:
            resultado = self.supabase.table(TABELA_LOCACOES).select(
                "id, obra_id, nome_equipamento, locadora, status, devolucao_prevista, responsavel, created_at"
            ).eq("obra_id", obra_id_real).execute()
            return resultado.data or []
        except Exception as e:
            logger.error(f"Erro ao listar locações da obra {obra_id}: {e}")
            return []

    def criar_locacao(self, obra_id: str, dados: Dict[str, Any]) -> Dict[str, Any]:
        obra_id_real = self._resolver_obra_id(obra_id)
        try:
            dados["obra_id"] = obra_id_real
            resultado = self.supabase.table(TABELA_LOCACOES).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao registrar locação")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao registrar locação: {e}")
            raise e

    def atualizar_status_locacao(self, locacao_id: str, status: str) -> Dict[str, Any]:
        try:
            resultado = self.supabase.table(TABELA_LOCACOES).update({
                "status": status
            }).eq("id", locacao_id).execute()
            if not resultado.data:
                raise Exception("Falha ao atualizar status da locação")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao atualizar status da locação {locacao_id}: {e}")
            raise e

    def deletar_insumo(self, insumo_id: str) -> bool:
        try:
            resultado = self.supabase.table(TABELA_ESTOQUE).delete().eq("id", insumo_id).execute()
            return len(resultado.data) > 0 if resultado.data else False
        except Exception as e:
            logger.error(f"Erro ao deletar insumo {insumo_id}: {e}")
            raise e

    def deletar_locacao(self, locacao_id: str) -> bool:
        try:
            resultado = self.supabase.table(TABELA_LOCACOES).delete().eq("id", locacao_id).execute()
            return len(resultado.data) > 0 if resultado.data else False
        except Exception as e:
            logger.error(f"Erro ao deletar locacao {locacao_id}: {e}")
            raise e
