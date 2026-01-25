from typing import List
from fastapi import APIRouter
from app.controllers import orcamentos
from schemas.schemas import OrcamentoResponse

router = APIRouter(prefix="/orcamentos", tags=["Orçamentos"])

router.add_api_route(
    "/", 
    orcamentos.criar_orcamento, 
    methods=["POST"], 
    response_model=OrcamentoResponse, 
    summary="Criar novo orçamento"
)
router.add_api_route(
    "/", 
    orcamentos.listar_orcamentos, 
    methods=["GET"], 
    response_model=List[OrcamentoResponse], 
    summary="Listar orçamentos"
)
router.add_api_route(
    "/{orcamento_id}", 
    orcamentos.buscar_orcamento, 
    methods=["GET"], 
    response_model=OrcamentoResponse, 
    summary="Buscar orçamento por ID"
)
router.add_api_route(
    "/{orcamento_id}", 
    orcamentos.atualizar_orcamento, 
    methods=["PUT"], 
    response_model=OrcamentoResponse, 
    summary="Atualizar orçamento"
)
router.add_api_route(
    "/{orcamento_id}", 
    orcamentos.deletar_orcamento, 
    methods=["DELETE"], 
    summary="Deletar orçamento"
)
