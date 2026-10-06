import logging

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_supabase
from app.modules.composicao.repositories import ItemRepository
from app.modules.composicao.services import ItemService
from core.security import get_current_user

logger = logging.getLogger("projeto_orcamento")

router = APIRouter(
    prefix="/composicoes", tags=["Composições"], dependencies=[Depends(get_current_user)], redirect_slashes=False
)


def get_item_service(supabase=Depends(get_supabase)) -> ItemService:
    repository = ItemRepository(supabase)
    return ItemService(repository)


@router.get("/")
async def listar_composicoes(fonte: str = "SINAPI", service: ItemService = Depends(get_item_service)):
    return service.listar_composicoes(fonte=fonte)


@router.get("/buscar/{termo}")
async def buscar_composicao(
    termo: str,
    fonte: str = "SINAPI",
    uf: str | None = None,
    tipo: str = "Sem Desoneração",
    service: ItemService = Depends(get_item_service),
):
    try:
        return service.buscar_composicao(termo, fonte=fonte, uf=uf, tipo=tipo)
    except Exception:
        logger.error("Erro ao buscar composição", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao buscar composição")


@router.get("/insumos/buscar/{termo}")
async def buscar_insumo(
    termo: str,
    fonte: str = "SINAPI",
    tipo: str = "Sem Desoneração",
    service: ItemService = Depends(get_item_service),
):
    try:
        return service.buscar_insumo(termo, fonte=fonte, tipo=tipo)
    except Exception:
        logger.error("Erro ao buscar insumo", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao buscar insumo")


@router.get("/{codigo_composicao}/estados")
async def listar_estados_composicao(
    codigo_composicao: str,
    mes_referencia: str = "",
    fonte: str = "SINAPI",
    service: ItemService = Depends(get_item_service),
):
    return service.listar_estados_composicao(codigo_composicao, mes_referencia, fonte=fonte)
