from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.financeiro.schemas import (
    DespesaCreate,
    DespesaResponse,
    ConsolidadoFinanceiro,
    PortfolioConsolidadoResponse,
)
from app.modules.financeiro.services import FinanceiroService
from app.modules.financeiro.repositories import FinanceiroRepository
from app.dependencies import get_supabase
from core.security import get_current_user

router = APIRouter(
    prefix="/obras/{obra_id}/financeiro",
    tags=["Financeiro"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

router_portfolio = APIRouter(
    prefix="/financeiro",
    tags=["Financeiro"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

def get_financeiro_service(supabase = Depends(get_supabase)) -> FinanceiroService:
    return FinanceiroService(FinanceiroRepository(supabase))

@router_portfolio.get(
    "/portfolio",
    response_model=PortfolioConsolidadoResponse,
    summary="Obter consolidado do portfólio de todas as obras"
)
async def obter_portfolio_consolidado_endpoint(
    service: FinanceiroService = Depends(get_financeiro_service)
):
    return service.obter_portfolio_consolidado()


def get_financeiro_service(supabase = Depends(get_supabase)) -> FinanceiroService:
    return FinanceiroService(FinanceiroRepository(supabase))

@router.get(
    "/consolidado",
    response_model=ConsolidadoFinanceiro,
    summary="Obter consolidado financeiro planejado vs realizado"
)
async def obter_consolidado_endpoint(
    obra_id: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    return service.obter_consolidado_financeiro(obra_id)

@router.get(
    "/despesas",
    response_model=List[DespesaResponse],
    summary="Listar despesas reais da obra"
)
async def listar_despesas_endpoint(
    obra_id: str,
    categoria: Optional[str] = None,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    return service.listar_despesas(obra_id, categoria)

@router.post(
    "/despesas",
    response_model=DespesaResponse,
    summary="Lançar nova despesa financeira"
)
async def criar_despesa_endpoint(
    obra_id: str,
    dados: DespesaCreate,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    return service.criar_despesa(obra_id, dados)

@router.put(
    "/despesas/{despesa_id}/status",
    response_model=DespesaResponse,
    summary="Atualizar status da despesa"
)
async def atualizar_despesa_status_endpoint(
    obra_id: str,
    despesa_id: str,
    novo_status: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    if novo_status not in ["EM_ANALISE", "APROVADO", "PAGO", "RECUSADO"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status de despesa inválido"
        )
    despesa = service.repository.buscar_despesa_por_id(despesa_id)
    if not despesa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Despesa não encontrada"
        )
    return service.atualizar_status_despesa(despesa_id, novo_status)

@router.delete(
    "/despesas/{despesa_id}",
    summary="Excluir despesa financeira"
)
async def deletar_despesa_endpoint(
    obra_id: str,
    despesa_id: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    sucesso = service.deletar_despesa(despesa_id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Despesa não encontrada ou falha ao excluir"
        )
    return {"message": "Despesa excluída com sucesso"}
