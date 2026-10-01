import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_supabase
from app.modules.etapa.repositories import EtapaRepository
from app.modules.etapa.schemas import EtapaCreate, EtapaResponse, EtapaUpdate
from app.modules.etapa.services import EtapaService
from core.ownership import enforce_ownership

logger = logging.getLogger("projeto_orcamento")

router = APIRouter(
    prefix="/orcamentos",
    tags=["Etapas do Orçamento"],
    dependencies=[Depends(enforce_ownership)],
    redirect_slashes=False,
)


def get_etapa_service(supabase=Depends(get_supabase)) -> EtapaService:
    repository = EtapaRepository(supabase)
    return EtapaService(repository)


@router.post("/{orcamento_id}/etapas", response_model=EtapaResponse, summary="Criar etapa no orçamento")
async def criar_etapa(orcamento_id: str, etapa: EtapaCreate, service: EtapaService = Depends(get_etapa_service)):
    """Cria uma nova etapa para um orçamento"""
    try:
        return service.criar_etapa(orcamento_id, etapa)
    except Exception:
        logger.error("Erro ao criar etapa", exc_info=True)
        raise HTTPException(status_code=400, detail="Erro ao criar etapa")


@router.get("/{orcamento_id}/etapas", response_model=List[EtapaResponse], summary="Listar etapas do orçamento")
async def listar_etapas(orcamento_id: str, service: EtapaService = Depends(get_etapa_service)):
    """Lista todas as etapas de um orçamento ordenadas"""
    try:
        return service.listar_etapas(orcamento_id)
    except Exception:
        logger.error("Erro ao listar etapas", exc_info=True)
        raise HTTPException(status_code=400, detail="Erro ao listar etapas")


@router.put(
    "/{orcamento_id}/etapas/{etapa_id}",
    response_model=EtapaResponse,
    summary="Atualizar etapa (nome, ordem ou hierarquia)",
)
async def atualizar_etapa(
    orcamento_id: str, etapa_id: str, etapa_update: EtapaUpdate, service: EtapaService = Depends(get_etapa_service)
):
    """Atualiza uma etapa (nome, ordem ou hierarquia)"""
    try:
        return service.atualizar_etapa(etapa_id, etapa_update.model_dump(exclude_unset=True, mode="json"))
    except Exception:
        logger.error("Erro ao atualizar etapa", exc_info=True)
        raise HTTPException(status_code=400, detail="Erro ao atualizar etapa")


@router.delete("/{orcamento_id}/etapas/{etapa_id}", summary="Deletar etapa")
async def deletar_etapa(orcamento_id: str, etapa_id: str, service: EtapaService = Depends(get_etapa_service)):
    """Deleta uma etapa"""
    try:
        return service.deletar_etapa(etapa_id, orcamento_id)
    except Exception:
        logger.error("Erro ao deletar etapa", exc_info=True)
        raise HTTPException(status_code=400, detail="Erro ao deletar etapa")


@router.patch(
    "/{orcamento_id}/etapas/{etapa_id}/progresso",
    response_model=EtapaResponse,
    summary="Atualizar progresso de uma etapa",
)
async def atualizar_progresso_etapa(
    orcamento_id: str, etapa_id: str, payload: dict, service: EtapaService = Depends(get_etapa_service)
):
    """Atualiza apenas o campo progresso (0-100) de uma etapa"""
    progresso = payload.get("progresso")
    if progresso is None or not isinstance(progresso, int) or not (0 <= progresso <= 100):
        raise HTTPException(status_code=422, detail="progresso deve ser um inteiro entre 0 e 100")
    try:
        resultado = service.atualizar_etapa(etapa_id, {"progresso": progresso})
        if not resultado:
            raise HTTPException(status_code=404, detail="Etapa não encontrada")
        return resultado
    except HTTPException:
        raise
    except Exception:
        logger.error("Erro ao atualizar progresso", exc_info=True)
        raise HTTPException(status_code=400, detail="Erro ao atualizar progresso")
