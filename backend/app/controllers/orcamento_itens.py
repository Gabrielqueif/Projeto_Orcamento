from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_supabase
from schemas.schemas import OrcamentoItemCreate, OrcamentoItemUpdate
from app.repositories.orcamento_item_repository import OrcamentoItemRepository
from app.repositories.orcamento_repository import OrcamentoRepository
from app.repositories.item_repository import ItemRepository
from app.services.orcamento_item_service import OrcamentoItemService

def get_orcamento_item_service(supabase=Depends(get_supabase)) -> OrcamentoItemService:
    item_repo = ItemRepository(supabase)
    orcamento_repo = OrcamentoRepository(supabase)
    orcamento_item_repo = OrcamentoItemRepository(supabase)
    return OrcamentoItemService(orcamento_item_repo, orcamento_repo, item_repo)

def adicionar_item(
    orcamento_id: str,
    item: OrcamentoItemCreate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Adiciona um novo item ao orçamento"""
    try:
        return service.adicionar_item(orcamento_id, item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar item: {str(e)}")

def listar_itens(orcamento_id: str, service: OrcamentoItemService = Depends(get_orcamento_item_service)):
    """Lista todos os itens de um orçamento"""
    try:
        return service.listar_itens(orcamento_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar itens: {str(e)}")

def atualizar_item(
    orcamento_id: str,
    item_id: str,
    item_update: OrcamentoItemUpdate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Atualiza um item do orçamento"""
    try:
        return service.atualizar_item(orcamento_id, item_id, item_update)
    except ValueError as e:
        # Pode ser item nao encontrado (404) ou erro de validacao (400)
        # Simplificando para 400 ou 404 dependendo da mensagem seria ideal, mas aqui genericamente:
        if "não encontrado" in str(e):
             raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar item: {str(e)}")

def remover_item(
    orcamento_id: str,
    item_id: str,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Remove um item do orçamento"""
    try:
        return service.remover_item(orcamento_id, item_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover item: {str(e)}")

