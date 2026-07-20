from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger("projeto_orcamento")

TABELA_EQUIPES = "equipes"

class EquipeRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def criar(self, dados: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        try:
            dados["user_id"] = user_id
            resultado = self.supabase.table(TABELA_EQUIPES).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao inserir equipe")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao criar equipe: {e}")
            raise e

    def listar(self, user_id: str, nome: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            query = self.supabase.table(TABELA_EQUIPES).select("*").eq("user_id", user_id)
            if nome:
                query = query.ilike("nome", f"%{nome}%")
            query = query.order("nome")
            resultado = query.execute()
            return resultado.data or []
        except Exception as e:
            logger.error(f"Erro ao listar equipes: {e}")
            return []

    def buscar_por_id(self, equipe_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_EQUIPES).select("*").eq("id", equipe_id).eq("user_id", user_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar equipe {equipe_id}: {e}")
            return None

    def atualizar(self, equipe_id: str, dados_atualizacao: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        try:
            dados_atualizacao["updated_at"] = datetime.now().isoformat()
            resultado = self.supabase.table(TABELA_EQUIPES).update(dados_atualizacao).eq("id", equipe_id).eq("user_id", user_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao atualizar equipe {equipe_id}: {e}")
            raise e

    def deletar(self, equipe_id: str, user_id: str) -> bool:
        try:
            resultado = self.supabase.table(TABELA_EQUIPES).delete().eq("id", equipe_id).eq("user_id", user_id).execute()
            return len(resultado.data) > 0 if resultado.data else False
        except Exception as e:
            logger.error(f"Erro ao deletar equipe {equipe_id}: {e}")
            raise e
