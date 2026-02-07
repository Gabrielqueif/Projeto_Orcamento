from typing import List, Optional
from fastapi import APIRouter, Depends
from app.controllers import orcamentos
from schemas.schemas import OrcamentoResponse, OrcamentoCreate, OrcamentoUpdate
from app.services.orcamento_service import OrcamentoService

from core.security import get_current_user
from app.dependencies import get_supabase

router = APIRouter(
    prefix="/orcamentos", 
    tags=["Orçamentos"],
    dependencies=[Depends(get_current_user)]
)

@router.post(
    "/",
    response_model=OrcamentoResponse,
    summary="Criar novo orçamento"
)
async def criar_orcamento(
    orcamento: OrcamentoCreate, 
    service: OrcamentoService = Depends(orcamentos.get_orcamento_service)
):
    return orcamentos.criar_orcamento(orcamento, service)

@router.get(
    "/",
    response_model=List[OrcamentoResponse],
    summary="Listar orçamentos"
)
async def listar_orcamentos(
    status: Optional[str] = None, 
    cliente: Optional[str] = None, 
    service: OrcamentoService = Depends(orcamentos.get_orcamento_service)
):
    return orcamentos.listar_orcamentos(status, cliente, service)

@router.get(
    "/{orcamento_id}",
    response_model=OrcamentoResponse,
    summary="Buscar orçamento por ID"
)
async def buscar_orcamento(
    orcamento_id: str, 
    service: OrcamentoService = Depends(orcamentos.get_orcamento_service)
):
    return orcamentos.buscar_orcamento(orcamento_id, service)

@router.put(
    "/{orcamento_id}",
    response_model=OrcamentoResponse,
    summary="Atualizar orçamento"
)
async def atualizar_orcamento(
    orcamento_id: str, 
    orcamento: OrcamentoUpdate, 
    service: OrcamentoService = Depends(orcamentos.get_orcamento_service)
):
    return orcamentos.atualizar_orcamento(orcamento_id, orcamento, service)

@router.delete(
    "/{orcamento_id}",
    summary="Deletar orçamento"
)
async def deletar_orcamento(
    orcamento_id: str, 
    service: OrcamentoService = Depends(orcamentos.get_orcamento_service)
):
    return orcamentos.deletar_orcamento(orcamento_id, service)

@router.get("/{orcamento_id}/pdf")
async def download_pdf_orcamento(
    orcamento_id: str,
    service: OrcamentoService = Depends(orcamentos.get_orcamento_service),
    supabase = Depends(get_supabase)
):
    return orcamentos.download_pdf(orcamento_id, service, supabase)

