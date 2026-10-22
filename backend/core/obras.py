import logging
from typing import Optional

from supabase import Client

logger = logging.getLogger("projeto_orcamento")


def resolver_obra_id(supabase: Client, obra_id: str) -> Optional[str]:
    """
    Devolve o id real da obra (obras.id) ou None se ela não existir.

    As telas de obra endereçam a obra pelo id do orçamento de origem, então o id
    recebido no path pode ser obras.id ou obras.orcamento_id. É chamado depois de
    enforce_ownership, que já garantiu que o registro é do usuário.
    """
    for coluna in ("id", "orcamento_id"):
        try:
            resultado = supabase.table("obras").select("id").eq(coluna, obra_id).execute()
        except Exception as e:
            logger.warning(f"Falha ao resolver obra {coluna}={obra_id}: {e}")
            return None
        if resultado.data:
            return resultado.data[0]["id"]
    return None
