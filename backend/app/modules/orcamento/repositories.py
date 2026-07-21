from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger("projeto_orcamento")

TABELA_ORCAMENTOS = "orcamentos"
TABELA_ORCAMENTO_ITENS = "orcamento_itens"
TABELA_INSUMOS = "orcamento_item_insumo"

class OrcamentoRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        try:
            resultado = self.supabase.table(TABELA_ORCAMENTOS).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao inserir orçamento")
            return resultado.data[0]
        except Exception as e:
            raise e

    def listar(self, nome: Optional[str] = None, status: Optional[str] = None, cliente: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.supabase.table(TABELA_ORCAMENTOS).select("*")
        
        if nome:
            query = query.ilike("nome", f"%{nome}%")
        if status:
            query = query.eq("status", status)
        if cliente:
            query = query.ilike("cliente", f"%{cliente}%")
        
        query = query.order("created_at", desc=True)
        resultado = query.execute()
        return resultado.data or []

    def buscar_por_id(self, orcamento_id: str) -> Optional[Dict[str, Any]]:
        resultado = self.supabase.table(TABELA_ORCAMENTOS).select("*").eq("id", orcamento_id).execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def atualizar(self, orcamento_id: str, dados_atualizacao: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        dados_atualizacao["updated_at"] = datetime.now().isoformat()
        resultado = self.supabase.table(TABELA_ORCAMENTOS).update(dados_atualizacao).eq("id", orcamento_id).execute()
        if resultado.data:
            return resultado.data[0]
        return None

    def deletar(self, orcamento_id: str) -> bool:
        try:
            self.supabase.table(TABELA_ORCAMENTO_ITENS).delete().eq("orcamento_id", orcamento_id).execute()
        except Exception as e:
            logger.warning(f"Erro ao deletar itens do orçamento {orcamento_id}: {e}")
            
        resultado = self.supabase.table(TABELA_ORCAMENTOS).delete().eq("id", orcamento_id).execute()
        return True


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


class InsumoRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar_batch(self, dados: List[Dict[str, Any]]) -> int:
        if not dados:
            return 0
        try:
            r = self.supabase.table(TABELA_INSUMOS).insert(dados).execute()
            return len(r.data) if r.data else 0
        except Exception as e:
            logger.error(f"Erro ao inserir insumos em batch: {e}")
            return 0

    def listar_por_item(self, orcamento_item_id: str) -> List[Dict[str, Any]]:
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
        try:
            r = self.supabase.table(TABELA_INSUMOS).select("*").eq("id", insumo_id).execute()
            return r.data[0] if r.data else None
        except Exception as e:
            logger.error(f"Erro ao buscar insumo {insumo_id}: {e}")
            return None

    def deletar_por_item(self, orcamento_item_id: str) -> None:
        try:
            self.supabase.table(TABELA_INSUMOS)\
                .delete()\
                .eq("orcamento_item_id", orcamento_item_id)\
                .execute()
        except Exception as e:
            logger.error(f"Erro ao deletar insumos do item {orcamento_item_id}: {e}")
