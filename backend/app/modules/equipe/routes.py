from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.equipe.schemas import (
    EquipeResponse, EquipeCreate, EquipeUpdate,
    MembroEquipeResponse, MembroEquipeCreate, MembroEquipeUpdate, AlocacaoRequest
)
from app.modules.equipe.services import EquipeService, MembroEquipeService
from app.modules.equipe.repositories import EquipeRepository, MembroEquipeRepository
from app.dependencies import get_supabase
from core.security import get_current_user

# Router para Equipes
router_equipes = APIRouter(
    prefix="/equipes",
    tags=["Equipes"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

# Router para Membros da Equipe
router_membros = APIRouter(
    prefix="/membros-equipe",
    tags=["Membros da Equipe"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

# --- Dependências locais ---

def get_equipe_service(supabase = Depends(get_supabase)) -> EquipeService:
    repo = EquipeRepository(supabase)
    return EquipeService(repo)

def get_membro_equipe_service(supabase = Depends(get_supabase)) -> MembroEquipeService:
    repo = MembroEquipeRepository(supabase)
    return MembroEquipeService(repo)


# --- Rotas de Equipes ---

@router_equipes.post(
    "/",
    response_model=EquipeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova equipe"
)
async def criar_equipe(
    equipe: EquipeCreate,
    current_user: dict = Depends(get_current_user),
    service: EquipeService = Depends(get_equipe_service)
):
    user_id = current_user.get("id")
    try:
        return service.criar_equipe(equipe, user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_equipes.get(
    "/",
    response_model=List[EquipeResponse],
    summary="Listar equipes"
)
async def listar_equipes(
    nome: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    service: EquipeService = Depends(get_equipe_service)
):
    user_id = current_user.get("id")
    return service.listar_equipes(user_id, nome)

@router_equipes.get(
    "/{equipe_id}",
    response_model=EquipeResponse,
    summary="Buscar equipe por ID"
)
async def buscar_equipe(
    equipe_id: str,
    current_user: dict = Depends(get_current_user),
    service: EquipeService = Depends(get_equipe_service)
):
    user_id = current_user.get("id")
    try:
        return service.buscar_equipe(equipe_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router_equipes.put(
    "/{equipe_id}",
    response_model=EquipeResponse,
    summary="Atualizar equipe"
)
async def atualizar_equipe(
    equipe_id: str,
    equipe: EquipeUpdate,
    current_user: dict = Depends(get_current_user),
    service: EquipeService = Depends(get_equipe_service)
):
    user_id = current_user.get("id")
    try:
        return service.atualizar_equipe(equipe_id, equipe, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_equipes.delete(
    "/{equipe_id}",
    summary="Deletar equipe"
)
async def deletar_equipe(
    equipe_id: str,
    current_user: dict = Depends(get_current_user),
    service: EquipeService = Depends(get_equipe_service)
):
    user_id = current_user.get("id")
    try:
        service.deletar_equipe(equipe_id, user_id)
        return {"message": "Equipe deletada com sucesso", "id": equipe_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Rotas de Membros da Equipe ---

@router_membros.post(
    "/",
    response_model=MembroEquipeResponse,
    summary="Criar novo membro da equipe"
)
async def criar_membro(
    membro: MembroEquipeCreate,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    user_id = current_user.get("id")
    try:
        return service.criar_membro(membro, user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_membros.get(
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
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    user_id = current_user.get("id")
    return service.listar_membros(user_id, nome, cargo, status, orcamento_id, equipe_id)

@router_membros.get(
    "/{membro_id}",
    response_model=MembroEquipeResponse,
    summary="Buscar membro da equipe por ID"
)
async def buscar_membro(
    membro_id: str,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    user_id = current_user.get("id")
    try:
        return service.buscar_membro(membro_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router_membros.put(
    "/{membro_id}",
    response_model=MembroEquipeResponse,
    summary="Atualizar membro da equipe"
)
async def atualizar_membro(
    membro_id: str,
    membro: MembroEquipeUpdate,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    user_id = current_user.get("id")
    try:
        return service.atualizar_membro(membro_id, membro, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_membros.delete(
    "/{membro_id}",
    summary="Deletar membro da equipe"
)
async def deletar_membro(
    membro_id: str,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    user_id = current_user.get("id")
    try:
        service.deletar_membro(membro_id, user_id)
        return {"message": "Colaborador removido da equipe com sucesso", "id": membro_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router_membros.post(
    "/alocar",
    summary="Alocar múltiplos membros a um orçamento"
)
async def alocar_membros(
    request: AlocacaoRequest,
    current_user: dict = Depends(get_current_user),
    service: MembroEquipeService = Depends(get_membro_equipe_service)
):
    user_id = current_user.get("id")
    try:
        membro_ids_str = [str(m_id) for m_id in request.membro_ids]
        orcamento_id_str = str(request.orcamento_id) if request.orcamento_id else None
        service.alocar_membros(membro_ids_str, orcamento_id_str, user_id)
        return {"message": "Membros alocados com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
