from typing import List
from fastapi import Depends
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
    return service.adicionar_item(orcamento_id, item)

def listar_itens(orcamento_id: str, service: OrcamentoItemService = Depends(get_orcamento_item_service)):
    """Lista todos os itens de um orçamento"""
    return service.listar_itens(orcamento_id)

def atualizar_item(
    orcamento_id: str,
    item_id: str,
    item_update: OrcamentoItemUpdate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Atualiza um item do orçamento"""
    return service.atualizar_item(orcamento_id, item_id, item_update)

def remover_item(
    orcamento_id: str,
    item_id: str,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Remove um item do orçamento"""
    return service.remover_item(orcamento_id, item_id)


