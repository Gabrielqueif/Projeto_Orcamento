from typing import List

from fastapi import APIRouter, Depends, Request, status

from app.dependencies import get_supabase
from app.modules.acesso.repositories import AcessoRepository
from app.modules.acesso.schemas import (
    AceiteResponse,
    ConviteAceite,
    ConviteCreate,
    ConviteCriadoResponse,
    ConviteResponse,
    MembroResponse,
)
from app.modules.acesso.services import AcessoService
from app.modules.diario.routes import get_diario_service
from app.modules.diario.schemas import ResumoDiarioResponse
from app.modules.diario.services import DiarioService
from app.modules.equipe.repositories import CargoRepository
from app.modules.equipe.schemas import CargoResponse
from core.ownership import enforce_obra_access, enforce_ownership
from core.security import get_current_user

# Gestão do canteiro: só o dono da obra.
router = APIRouter(
    prefix="/obras/{obra_id}",
    tags=["Acesso ao canteiro"],
    dependencies=[Depends(enforce_ownership)],
    redirect_slashes=False,
)

# Leitura que o canteiro precisa: dono ou membro.
router_obra = APIRouter(
    prefix="/obras/{obra_id}/canteiro",
    tags=["Acesso ao canteiro"],
    dependencies=[Depends(enforce_obra_access)],
    redirect_slashes=False,
)

router_convites = APIRouter(
    prefix="/convites", tags=["Acesso ao canteiro"], dependencies=[Depends(get_current_user)], redirect_slashes=False
)

router_canteiro = APIRouter(
    prefix="/canteiro", tags=["Acesso ao canteiro"], dependencies=[Depends(get_current_user)], redirect_slashes=False
)


def get_acesso_service(supabase=Depends(get_supabase)) -> AcessoService:
    return AcessoService(AcessoRepository(supabase))


@router.post(
    "/convites",
    response_model=ConviteCriadoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Gerar convite (link) para mestre/supervisor",
)
async def criar_convite_endpoint(
    obra_id: str,
    dados: ConviteCreate,
    service: AcessoService = Depends(get_acesso_service),
    user: dict = Depends(get_current_user),
):
    return service.criar_convite(obra_id, dados, user["id"])


@router.get("/convites", response_model=List[ConviteResponse], summary="Convites pendentes da obra")
async def listar_convites_endpoint(obra_id: str, service: AcessoService = Depends(get_acesso_service)):
    return service.listar_convites(obra_id)


@router.delete("/convites/{convite_id}", summary="Revogar convite pendente")
async def revogar_convite_endpoint(
    obra_id: str, convite_id: str, service: AcessoService = Depends(get_acesso_service)
):
    service.revogar_convite(obra_id, convite_id)
    return {"message": "Convite revogado com sucesso"}


@router.get("/membros", response_model=List[MembroResponse], summary="Membros do canteiro")
async def listar_membros_endpoint(obra_id: str, service: AcessoService = Depends(get_acesso_service)):
    return service.listar_membros(obra_id)


@router.delete("/membros/{user_id}", summary="Remover membro do canteiro")
async def remover_membro_endpoint(obra_id: str, user_id: str, service: AcessoService = Depends(get_acesso_service)):
    service.remover_membro(obra_id, user_id)
    return {"message": "Membro removido com sucesso"}


@router_convites.post("/aceitar", response_model=AceiteResponse, summary="Aceitar convite e virar membro da obra")
async def aceitar_convite_endpoint(
    dados: ConviteAceite,
    service: AcessoService = Depends(get_acesso_service),
    user: dict = Depends(get_current_user),
):
    return service.aceitar_convite(dados.token, user["id"])


@router_canteiro.get(
    "/obras", response_model=ResumoDiarioResponse, summary="Obras em que sou membro, com a situação do diário do dia"
)
async def obras_do_canteiro_endpoint(
    service: DiarioService = Depends(get_diario_service), user: dict = Depends(get_current_user)
):
    return service.resumo(user_id=user["id"], como_membro=True)


@router_obra.get("/cargos", response_model=List[CargoResponse], summary="Cargos do dono da obra, para o efetivo do diário")
async def cargos_da_obra_endpoint(request: Request, supabase=Depends(get_supabase), user: dict = Depends(get_current_user)):
    # Os cargos são do dono: o membro não tem os seus, e o diário valida o efetivo contra os do dono.
    dono = getattr(request.state, "dono_da_obra", None) or user["id"]
    return CargoRepository(supabase).listar(str(dono))
