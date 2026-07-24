from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.almoxarifado.schemas import (
    InsumoCreate,
    InsumoResponse,
    MovimentacaoCreate,
    MovimentacaoResponse,
    LocacaoCreate,
    LocacaoResponse,
)
from app.modules.almoxarifado.services import AlmoxarifadoService
from app.modules.almoxarifado.repositories import AlmoxarifadoRepository
from app.dependencies import get_supabase
from core.security import get_current_user

router = APIRouter(
    prefix="/obras/{obra_id}/almoxarifado",
    tags=["Almoxarifado"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

def get_almoxarifado_service(supabase = Depends(get_supabase)) -> AlmoxarifadoService:
    return AlmoxarifadoService(AlmoxarifadoRepository(supabase))

@router.get(
    "/insumos",
    response_model=List[InsumoResponse],
    summary="Listar estoque de insumos da obra"
)
async def listar_insumos_endpoint(
    obra_id: str,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    return service.listar_insumos(obra_id)

@router.post(
    "/insumos",
    response_model=InsumoResponse,
    summary="Adicionar novo insumo ao estoque"
)
async def criar_insumo_endpoint(
    obra_id: str,
    dados: InsumoCreate,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    return service.criar_insumo(obra_id, dados)

@router.post(
    "/insumos/{insumo_id}/movimentacoes",
    response_model=MovimentacaoResponse,
    summary="Registrar movimentação (entrada/baixa) de estoque"
)
async def registrar_movimentacao_endpoint(
    obra_id: str,
    insumo_id: str,
    dados: MovimentacaoCreate,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    try:
        return service.registrar_movimentacao(insumo_id, dados)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get(
    "/locacoes",
    response_model=List[LocacaoResponse],
    summary="Listar locações de equipamentos da obra"
)
async def listar_locacoes_endpoint(
    obra_id: str,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    return service.listar_locacoes(obra_id)

@router.post(
    "/locacoes",
    response_model=LocacaoResponse,
    summary="Registrar nova locação de equipamento"
)
async def registrar_locacao_endpoint(
    obra_id: str,
    dados: LocacaoCreate,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    return service.registrar_locacao(obra_id, dados)

@router.put(
    "/locacoes/{locacao_id}/status",
    response_model=LocacaoResponse,
    summary="Atualizar status de locação de equipamento"
)
async def atualizar_locacao_status_endpoint(
    obra_id: str,
    locacao_id: str,
    novo_status: str,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    if novo_status not in ["EM_USO", "AGUARDANDO_RETIRADA", "FINALIZADO"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status de locação inválido"
        )
    return service.atualizar_status_locacao(locacao_id, novo_status)

@router.delete(
    "/insumos/{insumo_id}",
    status_code=status.HTTP_200_OK,
    summary="Deletar insumo do estoque"
)
async def deletar_insumo_endpoint(
    obra_id: str,
    insumo_id: str,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    sucesso = service.deletar_insumo(insumo_id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insumo não encontrado no estoque ou falha ao deletar"
        )
    return {"message": "Insumo deletado com sucesso"}

@router.delete(
    "/locacoes/{locacao_id}",
    status_code=status.HTTP_200_OK,
    summary="Deletar locação de equipamento"
)
async def deletar_locacao_endpoint(
    obra_id: str,
    locacao_id: str,
    service: AlmoxarifadoService = Depends(get_almoxarifado_service)
):
    sucesso = service.deletar_locacao(locacao_id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locação não encontrada ou falha ao deletar"
        )
    return {"message": "Locação deletada com sucesso"}
