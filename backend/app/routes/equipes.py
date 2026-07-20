from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from schemas.equipe import EquipeResponse, EquipeCreate, EquipeUpdate
from app.services.equipe_service import EquipeService
from app.repositories.equipe_repository import EquipeRepository
from core.supabase_client import get_supabase_client
from core.security import get_current_user
from app.dependencies import get_supabase

router = APIRouter(
    prefix="/equipes",
    tags=["Equipes"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

def get_equipe_service(supabase = Depends(get_supabase)) -> EquipeService:
    repo = EquipeRepository(supabase)
    return EquipeService(repo)

@router.post(
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

@router.get(
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

@router.get(
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

@router.put(
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

@router.delete(
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
