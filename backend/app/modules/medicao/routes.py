from typing import List, Optional

from fastapi import APIRouter, Depends, status

from app.dependencies import get_supabase
from app.modules.medicao.repositories import MedicaoRepository
from app.modules.medicao.schemas import CurvaSResponse, MedicaoCreate, MedicaoResponse
from app.modules.medicao.services import MedicaoService
from core.ownership import enforce_ownership

router = APIRouter(
    prefix="/obras/{obra_id}",
    tags=["Medições"],
    dependencies=[Depends(enforce_ownership)],
    redirect_slashes=False,
)


def get_medicao_service(supabase=Depends(get_supabase)) -> MedicaoService:
    return MedicaoService(MedicaoRepository(supabase))


@router.post(
    "/medicoes",
    response_model=MedicaoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar medição do avanço de uma etapa",
)
async def registrar_endpoint(
    obra_id: str, dados: MedicaoCreate, service: MedicaoService = Depends(get_medicao_service)
):
    return service.registrar(obra_id, dados)


@router.get("/medicoes", response_model=List[MedicaoResponse], summary="Histórico de medições da obra")
async def listar_endpoint(
    obra_id: str, etapa_id: Optional[str] = None, service: MedicaoService = Depends(get_medicao_service)
):
    return service.listar(obra_id, etapa_id)


@router.delete("/medicoes/{medicao_id}", summary="Excluir medição")
async def remover_endpoint(obra_id: str, medicao_id: str, service: MedicaoService = Depends(get_medicao_service)):
    service.remover(obra_id, medicao_id)
    return {"message": "Medição excluída com sucesso"}


@router.get("/curva-s", response_model=CurvaSResponse, summary="Curva S: avanço planejado x realizado")
async def curva_s_endpoint(obra_id: str, service: MedicaoService = Depends(get_medicao_service)):
    return service.curva_s(obra_id)
