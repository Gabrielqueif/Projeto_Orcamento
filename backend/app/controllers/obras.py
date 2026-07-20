from typing import List, Optional
from fastapi import Depends
from app.dependencies import get_supabase
from schemas.obra import ObraTransitionCreate, ObraResponse, LimiteRequisicaoResponse
from app.repositories.obra_repository import ObraRepository
from app.repositories.orcamento_repository import OrcamentoRepository
from app.repositories.etapa_repository import EtapaRepository
from app.repositories.orcamento_item_repository import OrcamentoItemRepository
from app.services.obra_service import ObraService

def get_obra_service(supabase = Depends(get_supabase)) -> ObraService:
    obra_repo = ObraRepository(supabase)
    orcamento_repo = OrcamentoRepository(supabase)
    etapa_repo = EtapaRepository(supabase)
    item_repo = OrcamentoItemRepository(supabase)
    return ObraService(
        obra_repository=obra_repo,
        orcamento_repository=orcamento_repo,
        etapa_repository=etapa_repo,
        orcamento_item_repository=item_repo,
        supabase_client=supabase
    )

def gerar_obra(
    orcamento_id: str,
    dados_transicao: ObraTransitionCreate,
    service: ObraService = Depends(get_obra_service)
):
    """Realiza a transição de um Orçamento Aprovado para Obra Ativa"""
    return service.gerar_obra(orcamento_id, dados_transicao)

def buscar_obra(
    obra_id: str,
    service: ObraService = Depends(get_obra_service)
):
    """Busca uma obra pelo ID"""
    return service.buscar_obra(obra_id)

def listar_obras(
    service: ObraService = Depends(get_obra_service)
):
    """Lista todas as obras ativas"""
    return service.listar_obras()

def listar_limites(
    obra_id: str,
    service: ObraService = Depends(get_obra_service)
):
    """Lista os limites de requisição da Curve ABC de uma obra"""
    return service.listar_limites(obra_id)
