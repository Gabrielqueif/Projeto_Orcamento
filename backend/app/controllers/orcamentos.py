from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_supabase
from schemas.schemas import OrcamentoCreate, OrcamentoUpdate, OrcamentoResponse
from app.repositories.orcamento_repository import OrcamentoRepository
from app.services.orcamento_service import OrcamentoService

def get_orcamento_service(supabase=Depends(get_supabase)) -> OrcamentoService:
    repository = OrcamentoRepository(supabase)
    return OrcamentoService(repository)

def criar_orcamento(orcamento: OrcamentoCreate, service: OrcamentoService = Depends(get_orcamento_service)):
    """Cria um novo orçamento"""
    try:
        return service.criar_orcamento(orcamento)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar orçamento: {str(e)}")

def listar_orcamentos(
    status: Optional[str] = None,
    cliente: Optional[str] = None,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Lista todos os orçamentos, com filtros opcionais"""
    try:
        return service.listar_orcamentos(status, cliente)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar orçamentos: {str(e)}")

def buscar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Busca um orçamento específico por ID"""
    try:
        return service.buscar_orcamento(orcamento_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar orçamento: {str(e)}")

def atualizar_orcamento(
    orcamento_id: str,
    orcamento_update: OrcamentoUpdate,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Atualiza um orçamento existente"""
    try:
        return service.atualizar_orcamento(orcamento_id, orcamento_update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar orçamento: {str(e)}")

def deletar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Deleta um orçamento e seus itens relacionados"""
    try:
        service.deletar_orcamento(orcamento_id)
        return {"message": "Orçamento deletado com sucesso", "id": orcamento_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar orçamento: {str(e)}")

