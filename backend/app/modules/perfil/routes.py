from fastapi import APIRouter, Depends

from app.dependencies import get_supabase
from app.modules.perfil.repositories import PerfilRepository
from app.modules.perfil.schemas import PerfilResponse, PerfilUpdate
from app.modules.perfil.services import PerfilService
from core.security import get_current_user

router = APIRouter(prefix="/perfil", tags=["Perfil"], dependencies=[Depends(get_current_user)], redirect_slashes=False)


def get_perfil_service(supabase=Depends(get_supabase)) -> PerfilService:
    return PerfilService(PerfilRepository(supabase))


@router.get("", response_model=PerfilResponse, summary="Perfil do usuário autenticado")
async def obter_perfil(user: dict = Depends(get_current_user), service: PerfilService = Depends(get_perfil_service)):
    return service.obter_perfil(user)


@router.patch("", response_model=PerfilResponse, summary="Atualizar nome completo e/ou cargo do próprio perfil")
async def atualizar_perfil(
    dados: PerfilUpdate,
    user: dict = Depends(get_current_user),
    service: PerfilService = Depends(get_perfil_service),
):
    return service.atualizar_perfil(user, dados)
