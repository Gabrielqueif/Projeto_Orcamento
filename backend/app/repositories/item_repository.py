from typing import List, Dict, Any, Optional

TABELA_COMPOSICOES = "composicao"
TABELA_COMPOSICOES_ESTADOS = "composicao_estados"

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
                    on_conflict="codigo_composicao,mes_referencia"
                ).execute()
                if r.data: total += len(r.data)
            except Exception as e:
                print(f"Erro lote {TABELA_COMPOSICOES}: {e}")
        return total

    def upsert_batch_estados(self, dados: List[Dict[str, Any]]) -> int:
        if not dados: return 0
        total = 0
        for i in range(0, len(dados), 1000):
            try:
                r = self.supabase.table(TABELA_COMPOSICOES_ESTADOS).upsert(
                    dados[i:i+1000],
                    on_conflict="codigo_composicao,mes_referencia,tipo_composicao"
                ).execute()
                if r.data: total += len(r.data)
            except Exception as e:
                print(f"Erro lote {TABELA_COMPOSICOES_ESTADOS}: {e}")
        return total

    def listar(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("*").limit(limit).execute().data or []

    def buscar_por_codigo(self, codigo: str) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("*").eq("codigo_composicao", codigo).execute().data

    def buscar_por_descricao(self, termo: str, limit: int = 50) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES).select("*").ilike("descricao", f"%{termo}%").limit(limit).execute().data

    def listar_estados_por_item(self, codigo_composicao: str) -> List[Dict[str, Any]]:
        return self.supabase.table(TABELA_COMPOSICOES_ESTADOS).select("*").eq("codigo_composicao", codigo_composicao).execute().data or []

    def listar_bases_disponiveis(self) -> List[Dict[str, Any]]:
        """Retorna todos os meses e tipos de composição disponíveis no banco."""
        # Consultar na tabela de composições para garantir que meses apareçam mesmo sem preços
        return self.supabase.table(TABELA_COMPOSICOES).select("mes_referencia").execute().data or []

    def buscar_preco(self, codigo_composicao: str, estado: str, mes_referencia: str, tipo_composicao: str) -> Optional[float]:
        """Busca o preço de uma composição para um estado, mês e tipo específicos."""
        try:
            r = self.supabase.table(TABELA_COMPOSICOES_ESTADOS)\
                .select("*")\
                .eq("codigo_composicao", codigo_composicao)\
                .eq("mes_referencia", mes_referencia)\
                .eq("tipo_composicao", tipo_composicao)\
                .execute()
            
            if not r.data:
                return None
                
            dados = r.data[0]
            preco = dados.get(estado.lower())
            return float(preco) if preco is not None else None
        except Exception:
            return None
