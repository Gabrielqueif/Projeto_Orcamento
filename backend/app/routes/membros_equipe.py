from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.controllers import membros_equipe
from schemas.membro_equipe import MembroEquipeResponse, MembroEquipeCreate, MembroEquipeUpdate, AlocacaoRequest
from app.services.membro_equipe_service import MembroEquipeService
from core.security import get_current_user

router = APIRouter(
    prefix="/membros-equipe",
    tags=["Membros da Equipe"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

@router.post(
    "/",
    response_model=MembroEquipeResponse,
    summary="Criar novo membro da equipe"
)
async def criar_membro(
    membro: MembroEquipeCreate,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(membros_equipe.get_membro_equipe_service)
):
    user_id = current_user.get("id")
    return membros_equipe.criar_membro(membro, user_id, service)

@router.get(
    "/",
    response_model=List[MembroEquipeResponse],
    summary="Listar membros da equipe"
)
async def listar_membros(
    nome: Optional[str] = None,
    cargo: Optional[str] = None,
    status: Optional[str] = None,
    orcamento_id: Optional[str] = None,
    equipe_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(membros_equipe.get_membro_equipe_service)
):
    user_id = current_user.get("id")
    return membros_equipe.listar_membros(user_id, nome, cargo, status, orcamento_id, equipe_id, service)

@router.get(
    "/{membro_id}",
    response_model=MembroEquipeResponse,
    summary="Buscar membro da equipe por ID"
)
async def buscar_membro(
    membro_id: str,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(membros_equipe.get_membro_equipe_service)
):
    user_id = current_user.get("id")
    return membros_equipe.buscar_membro(membro_id, user_id, service)

@router.put(
    "/{membro_id}",
    response_model=MembroEquipeResponse,
    summary="Atualizar membro da equipe"
)
async def atualizar_membro(
    membro_id: str,
    membro: MembroEquipeUpdate,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(membros_equipe.get_membro_equipe_service)
):
    user_id = current_user.get("id")
    return membros_equipe.atualizar_membro(membro_id, membro, user_id, service)

@router.delete(
    "/{membro_id}",
    summary="Deletar membro da equipe"
)
async def deletar_membro(
    membro_id: str,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(membros_equipe.get_membro_equipe_service)
):
    user_id = current_user.get("id")
    return membros_equipe.deletar_membro(membro_id, user_id, service)

@router.post(
    "/alocar",
    summary="Alocar múltiplos membros a um orçamento"
)
async def alocar_membros(
    request: AlocacaoRequest,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(membros_equipe.get_membro_equipe_service)
):
    user_id = current_user.get("id")
    # Converte UUIDs para strings
    membro_ids_str = [str(m_id) for m_id in request.membro_ids]
    orcamento_id_str = str(request.orcamento_id) if request.orcamento_id else None
    return membros_equipe.alocar_membros(membro_ids_str, orcamento_id_str, user_id, service)
