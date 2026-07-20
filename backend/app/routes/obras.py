from typing import List
from fastapi import APIRouter, Depends
from app.controllers import obras
from schemas.obra import ObraTransitionCreate, ObraResponse, LimiteRequisicaoResponse
from core.security import get_current_user

router = APIRouter(
    prefix="/obras",
    tags=["Obras"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

@router.post(
    "/transicao/{orcamento_id}",
    response_model=ObraResponse,
    summary="Gerar obra a partir de orçamento aprovado"
)
async def gerar_obra_endpoint(
    orcamento_id: str,
    dados_transicao: ObraTransitionCreate,
    service = Depends(obras.get_obra_service)
):
    return obras.gerar_obra(orcamento_id, dados_transicao, service)

@router.get(
    "/",
    response_model=List[ObraResponse],
    summary="Listar todas as obras"
)
async def listar_obras_endpoint(
    service = Depends(obras.get_obra_service)
):
    return obras.listar_obras(service)

@router.get(
    "/{obra_id}",
    response_model=ObraResponse,
    summary="Buscar obra por ID"
)
async def buscar_obra_endpoint(
    obra_id: str,
    service = Depends(obras.get_obra_service)
):
    return obras.buscar_obra(obra_id, service)

@router.get(
    "/{obra_id}/limites",
    response_model=List[LimiteRequisicaoResponse],
    summary="Listar limites de requisição da Curve ABC de uma obra"
)
async def listar_limites_endpoint(
    obra_id: str,
    service = Depends(obras.get_obra_service)
):
    return obras.listar_limites(obra_id, service)
