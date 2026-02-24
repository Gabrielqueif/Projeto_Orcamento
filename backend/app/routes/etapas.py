from typing import List
from fastapi import APIRouter, Depends
from app.controllers import etapas
from schemas.schemas import EtapaCreate, EtapaResponse
from core.security import get_current_user


router = APIRouter(
    prefix="/orcamentos", 
    tags=["Etapas do Orçamento"],
    dependencies=[Depends(get_current_user)]
)

router.add_api_route(
    "/{orcamento_id}/etapas", 
    etapas.criar_etapa, 
    methods=["POST"], 
    response_model=EtapaResponse, 
    summary="Criar etapa no orçamento"
)

router.add_api_route(
    "/{orcamento_id}/etapas", 
    etapas.listar_etapas, 
    methods=["GET"], 
    response_model=List[EtapaResponse], 
    summary="Listar etapas do orçamento"
)

router.add_api_route(
    "/{orcamento_id}/etapas/{etapa_id}", 
    etapas.deletar_etapa, 
    methods=["DELETE"], 
    summary="Deletar etapa"
)
