from typing import List
from fastapi import APIRouter
from app.controllers import orcamento_itens
from schemas.schemas import OrcamentoItemResponse

router = APIRouter(prefix="/orcamentos", tags=["Itens do Orçamento"])

router.add_api_route(
    "/{orcamento_id}/itens", 
    orcamento_itens.adicionar_item, 
    methods=["POST"], 
    response_model=OrcamentoItemResponse, 
    summary="Adicionar item ao orçamento"
)
router.add_api_route(
    "/{orcamento_id}/itens", 
    orcamento_itens.listar_itens, 
    methods=["GET"], 
    response_model=List[OrcamentoItemResponse], 
    summary="Listar itens do orçamento"
)
router.add_api_route(
    "/{orcamento_id}/itens/{item_id}", 
    orcamento_itens.atualizar_item, 
    methods=["PUT"], 
    response_model=OrcamentoItemResponse, 
    summary="Atualizar item do orçamento"
)
router.add_api_route(
    "/{orcamento_id}/itens/{item_id}", 
    orcamento_itens.remover_item, 
    methods=["DELETE"], 
    summary="Remover item do orçamento"
)
