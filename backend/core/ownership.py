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


def _obra_com_dono(supabase: Client, obra_id: str):
    """(obras.id, user_id) da obra, endereçada por id ou orcamento_id; None se não existir."""
    for coluna in ("id", "orcamento_id"):
        try:
            resultado = supabase.table("obras").select("id, user_id").eq(coluna, obra_id).execute()
        except Exception as e:
            logger.warning(f"Falha ao consultar obra {coluna}={obra_id}: {e}")
            return None
        if resultado.data:
            return resultado.data[0]
    return None


def _papel_do_membro(supabase: Client, obra_id: str, user_id: str):
    try:
        resultado = (
            supabase.table("obra_membros")
            .select("papel")
            .eq("obra_id", obra_id)
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as e:
        logger.warning(f"Falha ao consultar membro da obra {obra_id}: {e}")
        return None
    return resultado.data[0].get("papel") if resultado.data else None


def enforce_obra_access(
    request: Request,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """
    Como enforce_ownership, mas também admite membros vinculados à obra (mestre/supervisor).
    Usar só nas rotas que o canteiro precisa; as demais continuam exclusivas do dono.
    Guarda em request.state o papel ("DONO", "MESTRE" ou "SUPERVISOR") e o dono da obra.
    """
    user_id = user.get("id")
    obra_id = request.path_params.get("obra_id")
    obra = _obra_com_dono(supabase, obra_id) if obra_id is not None and user_id else None
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada")
    if str(obra.get("user_id")) == str(user_id):
        papel = "DONO"
    else:
        papel = _papel_do_membro(supabase, obra["id"], user_id)
        if papel is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada")
    request.state.papel_na_obra = papel
    request.state.dono_da_obra = obra.get("user_id")
    return user


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
