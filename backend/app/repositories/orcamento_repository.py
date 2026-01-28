from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException

TABELA_ORCAMENTOS = "orcamentos"

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
            # Re-raise para ser tratado no service/controller ou transformado
            raise e

    def listar(self, status: Optional[str] = None, cliente: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.supabase.table(TABELA_ORCAMENTOS).select("*")
        
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
        # Deletar itens do orçamento primeiro
        try:
            self.supabase.table("orcamento_itens").delete().eq("orcamento_id", orcamento_id).execute()
        except:
            pass
            
        resultado = self.supabase.table(TABELA_ORCAMENTOS).delete().eq("id", orcamento_id).execute()
        return True
