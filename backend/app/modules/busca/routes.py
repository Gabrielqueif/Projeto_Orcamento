from fastapi import APIRouter, Depends, Query

from app.dependencies import get_supabase
from app.modules.busca.repositories import BuscaRepository
from app.modules.busca.schemas import BuscaResponse
from app.modules.busca.services import BuscaService
from core.security import get_current_user

router = APIRouter(prefix="/busca", tags=["Busca"], redirect_slashes=False)


def get_busca_service(supabase=Depends(get_supabase)) -> BuscaService:
    return BuscaService(BuscaRepository(supabase))


@router.get("", response_model=BuscaResponse, summary="Buscar em obras, orçamentos e equipe do usuário")
async def buscar_endpoint(
    q: str = Query(min_length=2, max_length=100),
    service: BuscaService = Depends(get_busca_service),
    user: dict = Depends(get_current_user),
):
    return service.buscar(q, user_id=user["id"])
