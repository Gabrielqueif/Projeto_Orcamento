from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger("projeto_orcamento")

TABELA_MEMBROS = "membros_equipe"

class MembroEquipeRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar(self, dados: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        try:
            dados["user_id"] = user_id
            resultado = self.supabase.table(TABELA_MEMBROS).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao inserir membro da equipe")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao criar membro da equipe: {e}")
            raise e

    def listar(
        self, 
        user_id: str,
        nome: Optional[str] = None, 
        cargo: Optional[str] = None, 
        status: Optional[str] = None,
        orcamento_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        try:
            query = self.supabase.table(TABELA_MEMBROS).select("*").eq("user_id", user_id)
            
            if nome:
                query = query.ilike("nome", f"%{nome}%")
            if cargo:
                query = query.eq("cargo", cargo)
            if status:
                query = query.eq("status", status)
            if orcamento_id:
                if orcamento_id == "—" or orcamento_id == "null" or orcamento_id == "None":
                    query = query.is_("orcamento_id", "null")
                else:
                    query = query.eq("orcamento_id", orcamento_id)
                    
            query = query.order("nome")
            resultado = query.execute()
            return resultado.data or []
        except Exception as e:
            logger.error(f"Erro ao listar membros da equipe: {e}")
            return []

    def buscar_por_id(self, membro_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_MEMBROS).select("*").eq("id", membro_id).eq("user_id", user_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar membro {membro_id}: {e}")
            return None

    def atualizar(self, membro_id: str, dados_atualizacao: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        try:
            dados_atualizacao["updated_at"] = datetime.now().isoformat()
            resultado = self.supabase.table(TABELA_MEMBROS).update(dados_atualizacao).eq("id", membro_id).eq("user_id", user_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao atualizar membro {membro_id}: {e}")
            raise e

    def deletar(self, membro_id: str, user_id: str) -> bool:
        try:
            resultado = self.supabase.table(TABELA_MEMBROS).delete().eq("id", membro_id).eq("user_id", user_id).execute()
            return len(resultado.data) > 0 if resultado.data else False
        except Exception as e:
            logger.error(f"Erro ao deletar membro {membro_id}: {e}")
            raise e

    def alocar_ao_orcamento(self, membro_ids: List[str], orcamento_id: Optional[str], user_id: str) -> bool:
        """
        Aloca ou desaloca múltiplos membros a um orçamento de uma vez.
        Se orcamento_id for None, remove a alocação de projeto (desaloca).
        """
        try:
            if not membro_ids:
                return True
                
            dados = {
                "orcamento_id": orcamento_id,
                "updated_at": datetime.now().isoformat()
            }
            
            resultado = self.supabase.table(TABELA_MEMBROS).update(dados).eq("user_id", user_id).in_("id", membro_ids).execute()
            return True
        except Exception as e:
            logger.error(f"Erro ao alocar membros ao orcamento {orcamento_id}: {e}")
            raise e
