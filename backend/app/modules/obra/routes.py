from typing import List
from fastapi import APIRouter, Depends
from app.modules.obra.schemas import ObraTransitionCreate, ObraResponse, LimiteRequisicaoResponse
from app.modules.obra.services import ObraService
from app.modules.obra.repositories import ObraRepository
from app.modules.orcamento.repositories import OrcamentoRepository, OrcamentoItemRepository
from app.modules.etapa.repositories import EtapaRepository
from app.dependencies import get_supabase
from core.security import get_current_user

router = APIRouter(
    prefix="/obras",
    tags=["Obras"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

def get_obra_service(supabase = Depends(get_supabase)) -> ObraService:
    return ObraService(
        obra_repository=ObraRepository(supabase),
        orcamento_repository=OrcamentoRepository(supabase),
        etapa_repository=EtapaRepository(supabase),
        orcamento_item_repository=OrcamentoItemRepository(supabase),
        supabase_client=supabase
    )

@router.post(
    "/transicao/{orcamento_id}",
    response_model=ObraResponse,
    summary="Gerar obra a partir de orçamento aprovado"
)
async def gerar_obra_endpoint(
    orcamento_id: str,
    dados_transicao: ObraTransitionCreate,
    service: ObraService = Depends(get_obra_service)
):
    return service.gerar_obra(orcamento_id, dados_transicao)

@router.get(
    "/",
    response_model=List[ObraResponse],
    summary="Listar todas as obras"
)
async def listar_obras_endpoint(
    service: ObraService = Depends(get_obra_service)
):
    return service.listar_obras()

@router.get(
    "/{obra_id}",
    response_model=ObraResponse,
    summary="Buscar obra por ID"
)
async def buscar_obra_endpoint(
    obra_id: str,
    service: ObraService = Depends(get_obra_service)
):
    return service.buscar_obra(obra_id)

@router.get(
    "/{obra_id}/limites",
    response_model=List[LimiteRequisicaoResponse],
    summary="Listar limites de requisição da Curve ABC de uma obra"
)
async def listar_limites_endpoint(
    obra_id: str,
    service: ObraService = Depends(get_obra_service)
):
    return service.listar_limites(obra_id)
