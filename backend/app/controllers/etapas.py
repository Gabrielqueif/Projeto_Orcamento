from typing import List
from fastapi import HTTPException, Depends
from schemas.schemas import EtapaCreate
from app.dependencies import get_supabase
from app.repositories.etapa_repository import EtapaRepository
from app.services.etapa_service import EtapaService

def get_etapa_service(supabase=Depends(get_supabase)) -> EtapaService:
    repository = EtapaRepository(supabase)
    return EtapaService(repository)

def criar_etapa(orcamento_id: str, etapa: EtapaCreate, service: EtapaService = Depends(get_etapa_service)) -> dict:
    """Cria uma nova etapa para um orçamento"""
    try:
        return service.criar_etapa(orcamento_id, etapa)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar etapa: {str(e)}")

def listar_etapas(orcamento_id: str, service: EtapaService = Depends(get_etapa_service)) -> List[dict]:
    """Lista todas as etapas de um orçamento ordenadas"""
    try:
        return service.listar_etapas(orcamento_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar etapas: {str(e)}")

def deletar_etapa(etapa_id: str, orcamento_id: str, service: EtapaService = Depends(get_etapa_service)) -> dict:
    """Deleta uma etapa"""
    try:
        return service.deletar_etapa(etapa_id, orcamento_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar etapa: {str(e)}")

def atualizar_etapa(orcamento_id: str, etapa_id: str, etapa_update: dict, service: EtapaService = Depends(get_etapa_service)) -> dict:
    """Atualiza uma etapa (nome, ordem ou hierarquia)"""
    try:
        return service.atualizar_etapa(etapa_id, etapa_update)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar etapa: {str(e)}")
