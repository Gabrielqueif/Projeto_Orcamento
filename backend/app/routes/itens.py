from fastapi import APIRouter, Depends
from app.controllers import itens
from core.security import get_current_user

router = APIRouter(
    prefix="/composicoes", 
    tags=["Composições"],
    dependencies=[Depends(get_current_user)]
)

router.add_api_route("/importar", itens.importar_sinapi, methods=["POST"], summary="Importar SINAPI (Completo)")
router.add_api_route("/", itens.listar_composicoes, methods=["GET"])
router.add_api_route("/buscar/{termo}", itens.buscar_composicao, methods=["GET"])
router.add_api_route("/{codigo_composicao}/estados", itens.listar_estados_composicao, methods=["GET"])
