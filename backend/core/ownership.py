import logging

from fastapi import Depends, HTTPException, Request, status
from supabase import Client

from app.dependencies import get_supabase
from core.security import get_current_user

logger = logging.getLogger("projeto_orcamento")

# Raízes de propriedade: toda rota que carrega um desses ids no path só é
# acessível ao dono do registro (coluna user_id). O terceiro item são as colunas
# pelas quais o id do path pode identificar o registro, em ordem: as telas de obra
# usam o id do orçamento de origem no path, e os repositórios resolvem a obra a
# partir dele (obras.orcamento_id).
_RAIZES = (
    ("orcamento_id", "orcamentos", ("id",), "Orçamento não encontrado"),
    ("obra_id", "obras", ("id", "orcamento_id"), "Obra não encontrada"),
    ("base_id", "bases_proprias", ("id",), "Base não encontrada"),
)


def _dono_do_registro(supabase: Client, tabela: str, colunas: tuple, registro_id: str):
    for coluna in colunas:
        try:
            resultado = supabase.table(tabela).select("user_id").eq(coluna, registro_id).execute()
        except Exception as e:
            # id malformado ou falha de consulta: trata como inexistente
            logger.warning(f"Falha ao consultar dono em {tabela}.{coluna}={registro_id}: {e}")
            return None
        if resultado.data:
            return resultado.data[0].get("user_id")
    return None


def enforce_ownership(
    request: Request,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """
    Garante que o usuário autenticado é dono do orçamento/obra referenciado no path.
    Responde 404 (e não 403) tanto para inexistente quanto para de terceiros,
    para não revelar a existência de registros alheios.
    """
    user_id = user.get("id")
    for param, tabela, colunas, mensagem in _RAIZES:
        registro_id = request.path_params.get(param)
        if registro_id is None:
            continue
        dono = _dono_do_registro(supabase, tabela, colunas, registro_id)
        if not user_id or dono is None or str(dono) != str(user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=mensagem)
    return user
