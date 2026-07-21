from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.modules.etapa.schemas import EtapaCreate, EtapaUpdate, EtapaResponse
from app.modules.etapa.services import EtapaService
from app.modules.etapa.repositories import EtapaRepository
from app.dependencies import get_supabase
from core.security import get_current_user

router = APIRouter(
    prefix="/orcamentos", 
    tags=["Etapas do Orçamento"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

def get_etapa_service(supabase = Depends(get_supabase)) -> EtapaService:
    repository = EtapaRepository(supabase)
    return EtapaService(repository)

@router.post(
    "/{orcamento_id}/etapas", 
    response_model=EtapaResponse, 
    summary="Criar etapa no orçamento"
)
async def criar_etapa(
    orcamento_id: str, 
    etapa: EtapaCreate, 
    service: EtapaService = Depends(get_etapa_service)
):
    """Cria uma nova etapa para um orçamento"""
    try:
        return service.criar_etapa(orcamento_id, etapa)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar etapa: {str(e)}")

@router.get(
    "/{orcamento_id}/etapas", 
    response_model=List[EtapaResponse], 
    summary="Listar etapas do orçamento"
)
async def listar_etapas(
    orcamento_id: str, 
    service: EtapaService = Depends(get_etapa_service)
):
    """Lista todas as etapas de um orçamento ordenadas"""
    try:
        return service.listar_etapas(orcamento_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao listar etapas: {str(e)}")

@router.put(
    "/{orcamento_id}/etapas/{etapa_id}", 
    response_model=EtapaResponse, 
    summary="Atualizar etapa (nome, ordem ou hierarquia)"
)
async def atualizar_etapa(
    orcamento_id: str, 
    etapa_id: str, 
    etapa_update: EtapaUpdate, 
    service: EtapaService = Depends(get_etapa_service)
):
    """Atualiza uma etapa (nome, ordem ou hierarquia)"""
    try:
        return service.atualizar_etapa(etapa_id, etapa_update.model_dump(exclude_unset=True))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar etapa: {str(e)}")

@router.delete(
    "/{orcamento_id}/etapas/{etapa_id}", 
    summary="Deletar etapa"
)
async def deletar_etapa(
    orcamento_id: str, 
    etapa_id: str, 
    service: EtapaService = Depends(get_etapa_service)
):
    """Deleta uma etapa"""
    try:
        return service.deletar_etapa(etapa_id, orcamento_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao deletar etapa: {str(e)}")
