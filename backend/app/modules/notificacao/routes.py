from typing import Optional

from fastapi import APIRouter, Depends

from app.dependencies import get_supabase
from app.modules.dashboard.routes import get_dashboard_service
from app.modules.dashboard.services import DashboardService
from app.modules.notificacao.repositories import NotificacaoRepository
from app.modules.notificacao.schemas import MarcarLidasRequest, MarcarLidasResponse, NotificacoesResponse
from app.modules.notificacao.services import NotificacaoService
from core.security import get_current_user

router = APIRouter(
    prefix="/notificacoes", tags=["Notificações"], dependencies=[Depends(get_current_user)], redirect_slashes=False
)


def get_notificacao_service(
    dashboard: DashboardService = Depends(get_dashboard_service), supabase=Depends(get_supabase)
) -> NotificacaoService:
    return NotificacaoService(dashboard, NotificacaoRepository(supabase))


@router.get("", response_model=NotificacoesResponse, summary="Notificações do usuário (riscos do painel)")
async def listar_notificacoes_endpoint(
    service: NotificacaoService = Depends(get_notificacao_service), user: dict = Depends(get_current_user)
):
    return service.listar(user_id=user["id"])


@router.post("/lidas", response_model=MarcarLidasResponse, summary="Marcar notificações como lidas")
async def marcar_lidas_endpoint(
    corpo: Optional[MarcarLidasRequest] = None,
    service: NotificacaoService = Depends(get_notificacao_service),
    user: dict = Depends(get_current_user),
):
    chaves = corpo.chaves if corpo else None
    return service.marcar_lidas(user_id=user["id"], chaves=chaves)
