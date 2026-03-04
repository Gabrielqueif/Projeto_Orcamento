from fastapi import Depends, HTTPException
from app.dependencies import get_supabase
from app.repositories.item_repository import ItemRepository
from app.services.item_service import ItemService

def get_item_service(supabase=Depends(get_supabase)) -> ItemService:
    repository = ItemRepository(supabase)
    return ItemService(repository)

def importar_sinapi(service: ItemService = Depends(get_item_service)):
    try:
        return service.importar_sinapi()
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

def listar_composicoes(fonte: str = "SINAPI", service: ItemService = Depends(get_item_service)):
    return service.listar_composicoes(fonte=fonte)

def buscar_composicao(termo: str, fonte: str = "SINAPI", service: ItemService = Depends(get_item_service)):
    try:
        return service.buscar_composicao(termo, fonte=fonte)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar composição: {str(e)}")

def listar_estados_composicao(codigo_composicao: str, mes_referencia: str, fonte: str = "SINAPI", service: ItemService = Depends(get_item_service)):
    return service.listar_estados_composicao(codigo_composicao, mes_referencia, fonte=fonte)