from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from app.dependencies import get_supabase
from app.modules.diario.repositories import DiarioRepository
from app.modules.diario.schemas import (
    DiarioCreate,
    DiarioListagem,
    DiarioResponse,
    DiarioStatusUpdate,
    DiarioUpdate,
    FotoResponse,
    ResumoDiarioResponse,
)
from app.modules.diario.services import DiarioService
from core.ownership import enforce_ownership
from core.security import get_current_user

MAX_FOTO_MB = 5

router = APIRouter(
    prefix="/obras/{obra_id}/diario",
    tags=["Diário de Obra"],
    dependencies=[Depends(enforce_ownership)],
    redirect_slashes=False,
)

router_resumo = APIRouter(
    prefix="/diario", tags=["Diário de Obra"], dependencies=[Depends(get_current_user)], redirect_slashes=False
)


def get_diario_service(supabase=Depends(get_supabase)) -> DiarioService:
    return DiarioService(DiarioRepository(supabase))


@router_resumo.get("/resumo", response_model=ResumoDiarioResponse, summary="Visão geral do diário das obras ativas")
async def resumo_endpoint(service: DiarioService = Depends(get_diario_service), user: dict = Depends(get_current_user)):
    return service.resumo(user_id=user["id"])


@router.get("", response_model=DiarioListagem, summary="Listar diários da obra (mais recentes primeiro)")
async def listar_endpoint(
    obra_id: str,
    limite: int = Query(30, ge=1, le=100),
    service: DiarioService = Depends(get_diario_service),
):
    return service.listar(obra_id, limite)


@router.post("", response_model=DiarioResponse, status_code=status.HTTP_201_CREATED, summary="Criar diário do dia")
async def criar_endpoint(obra_id: str, dados: DiarioCreate, service: DiarioService = Depends(get_diario_service)):
    return service.criar(obra_id, dados)


@router.get("/{diario_id}", response_model=DiarioResponse, summary="Buscar diário")
async def obter_endpoint(obra_id: str, diario_id: str, service: DiarioService = Depends(get_diario_service)):
    return service.obter(obra_id, diario_id)


@router.put("/{diario_id}", response_model=DiarioResponse, summary="Atualizar diário")
async def atualizar_endpoint(
    obra_id: str, diario_id: str, dados: DiarioUpdate, service: DiarioService = Depends(get_diario_service)
):
    return service.atualizar(obra_id, diario_id, dados)


@router.patch("/{diario_id}/status", response_model=DiarioResponse, summary="Enviar, aprovar ou reabrir diário")
async def alterar_status_endpoint(
    obra_id: str, diario_id: str, dados: DiarioStatusUpdate, service: DiarioService = Depends(get_diario_service)
):
    return service.alterar_status(obra_id, diario_id, dados.status)


@router.delete("/{diario_id}", summary="Excluir diário")
async def deletar_endpoint(obra_id: str, diario_id: str, service: DiarioService = Depends(get_diario_service)):
    service.deletar(obra_id, diario_id)
    return {"message": "Diário excluído com sucesso"}


@router.post("/{diario_id}/fotos", response_model=FotoResponse, status_code=201, summary="Anexar foto ao diário")
async def adicionar_foto_endpoint(
    obra_id: str,
    diario_id: str,
    file: UploadFile = File(...),
    legenda: Optional[str] = Form(None),
    service: DiarioService = Depends(get_diario_service),
):
    limite = MAX_FOTO_MB * 1024 * 1024
    # Lê um byte além do limite para recusar sem carregar o restante do arquivo.
    conteudo = await file.read(limite + 1)
    if len(conteudo) > limite:
        raise HTTPException(status_code=413, detail=f"A foto excede o limite de {MAX_FOTO_MB} MB.")
    return service.adicionar_foto(obra_id, diario_id, conteudo, legenda)


@router.delete("/{diario_id}/fotos/{foto_id}", summary="Remover foto do diário")
async def remover_foto_endpoint(
    obra_id: str, diario_id: str, foto_id: str, service: DiarioService = Depends(get_diario_service)
):
    service.remover_foto(obra_id, diario_id, foto_id)
    return {"message": "Foto removida com sucesso"}
