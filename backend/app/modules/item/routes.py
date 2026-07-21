from fastapi import APIRouter, Depends, HTTPException
from app.modules.item.services import ItemService
from app.modules.item.repositories import ItemRepository
from app.dependencies import get_supabase
from core.security import get_current_user

router = APIRouter(
    prefix="/composicoes", 
    tags=["Composições"],
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

def get_item_service(supabase = Depends(get_supabase)) -> ItemService:
    repository = ItemRepository(supabase)
    return ItemService(repository)

@router.post("/importar", summary="Importar SINAPI (Completo)")
async def importar_sinapi(service: ItemService = Depends(get_item_service)):
    try:
        return service.importar_sinapi()
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

@router.get("/")
async def listar_composicoes(fonte: str = "SINAPI", service: ItemService = Depends(get_item_service)):
    return service.listar_composicoes(fonte=fonte)

@router.get("/buscar/{termo}")
async def buscar_composicao(termo: str, fonte: str = "SINAPI", service: ItemService = Depends(get_item_service)):
    try:
        return service.buscar_composicao(termo, fonte=fonte)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar composição: {str(e)}")

@router.get("/{codigo_composicao}/estados")
async def listar_estados_composicao(
    codigo_composicao: str, 
    mes_referencia: str = "", 
    fonte: str = "SINAPI", 
    service: ItemService = Depends(get_item_service)
):
    return service.listar_estados_composicao(codigo_composicao, mes_referencia, fonte=fonte)
