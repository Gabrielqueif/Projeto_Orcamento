from typing import List, Optional
from fastapi import APIRouter, Depends
from app.dependencies import get_supabase
from schemas.schemas import OrcamentoCreate, OrcamentoUpdate, OrcamentoResponse
from app.repositories.orcamento_repository import OrcamentoRepository
from app.services.orcamento_service import OrcamentoService

def get_orcamento_service(supabase=Depends(get_supabase)) -> OrcamentoService:
    repository = OrcamentoRepository(supabase)
    return OrcamentoService(repository)

def criar_orcamento(orcamento: OrcamentoCreate, service: OrcamentoService = Depends(get_orcamento_service)):
    """Cria um novo orçamento"""
    return service.criar_orcamento(orcamento)

def listar_orcamentos(
    status: Optional[str] = None,
    cliente: Optional[str] = None,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Lista todos os orçamentos, com filtros opcionais"""
    return service.listar_orcamentos(status, cliente)

def buscar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Busca um orçamento específico por ID"""
    return service.buscar_orcamento(orcamento_id)

def atualizar_orcamento(
    orcamento_id: str,
    orcamento_update: OrcamentoUpdate,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Atualiza um orçamento existente"""
    return service.atualizar_orcamento(orcamento_id, orcamento_update)

def deletar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Deleta um orçamento e seus itens relacionados"""
    service.deletar_orcamento(orcamento_id)
    return {"message": "Orçamento deletado com sucesso", "id": orcamento_id}


