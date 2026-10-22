from fastapi import APIRouter, Depends

from app.dependencies import get_supabase
from app.modules.dashboard.repositories import DashboardRepository
from app.modules.dashboard.schemas import DashboardResponse
from app.modules.dashboard.services import DashboardService
from app.modules.financeiro.repositories import FinanceiroRepository
from app.modules.financeiro.services import FinanceiroService
from app.modules.medicao.repositories import MedicaoRepository
from core.security import get_current_user

router = APIRouter(
    prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_user)], redirect_slashes=False
)


def get_dashboard_service(supabase=Depends(get_supabase)) -> DashboardService:
    return DashboardService(
        DashboardRepository(supabase),
        MedicaoRepository(supabase),
        FinanceiroService(FinanceiroRepository(supabase)),
    )


@router.get("", response_model=DashboardResponse, summary="Painel executivo das obras ativas do usuário")
async def obter_dashboard_endpoint(
    service: DashboardService = Depends(get_dashboard_service), user: dict = Depends(get_current_user)
):
    return service.obter(user_id=user["id"])
