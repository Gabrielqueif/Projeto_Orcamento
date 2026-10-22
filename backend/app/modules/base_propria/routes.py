from typing import List, Optional

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status

from app.dependencies import get_supabase
from app.modules.base_propria.planilha import MAX_ARQUIVO_BYTES
from app.modules.base_propria.repositories import BasePropriaRepository
from app.modules.base_propria.schemas import (
    BaseCreate,
    BaseResponse,
    BaseUpdate,
    ComposicaoCreate,
    ComposicaoDetalhe,
    ComposicaoResponse,
    ComposicaoUpdate,
    DuplicarBase,
    ImportacaoResultado,
    InsumoCreate,
    InsumoResponse,
    InsumoUpdate,
    ItemCreate,
    ItemResponse,
    ItemUpdate,
    PrecoComposicaoResponse,
)
from app.modules.base_propria.services import TIPO_PADRAO, BasePropriaService
from app.modules.composicao.repositories import ItemRepository
from core.ownership import enforce_ownership
from core.security import get_current_user

XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

# enforce_ownership só age nas rotas com {base_id} no path: devolve 404 para base alheia.
router = APIRouter(
    prefix="/bases-proprias",
    tags=["Bases Próprias"],
    dependencies=[Depends(enforce_ownership)],
    redirect_slashes=False,
)


def get_base_propria_service(supabase=Depends(get_supabase)) -> BasePropriaService:
    return BasePropriaService(BasePropriaRepository(supabase), ItemRepository(supabase))


# --- Bases -------------------------------------------------------------------


@router.get("", response_model=List[BaseResponse], summary="Listar as bases próprias do usuário")
async def listar_bases_endpoint(
    service: BasePropriaService = Depends(get_base_propria_service), user: dict = Depends(get_current_user)
):
    return service.listar_bases(user["id"])


@router.post("", response_model=BaseResponse, status_code=status.HTTP_201_CREATED, summary="Criar base própria")
async def criar_base_endpoint(
    dados: BaseCreate,
    service: BasePropriaService = Depends(get_base_propria_service),
    user: dict = Depends(get_current_user),
):
    return service.criar_base(user["id"], dados)


@router.get("/modelo-importacao", summary="Baixar o modelo .xlsx de importação")
async def modelo_importacao_endpoint(service: BasePropriaService = Depends(get_base_propria_service)):
    return Response(
        content=service.modelo_importacao(),
        media_type=XLSX,
        headers={"Content-Disposition": 'attachment; filename="modelo_base_propria.xlsx"'},
    )


@router.get("/{base_id}", response_model=BaseResponse, summary="Buscar base própria")
async def obter_base_endpoint(
    base_id: str,
    service: BasePropriaService = Depends(get_base_propria_service),
    user: dict = Depends(get_current_user),
):
    return service.obter_base(base_id, user["id"])


@router.put("/{base_id}", response_model=BaseResponse, summary="Atualizar base própria")
async def atualizar_base_endpoint(
    base_id: str,
    dados: BaseUpdate,
    service: BasePropriaService = Depends(get_base_propria_service),
    user: dict = Depends(get_current_user),
):
    return service.atualizar_base(base_id, user["id"], dados)


@router.delete("/{base_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Excluir base própria")
async def deletar_base_endpoint(
    base_id: str,
    service: BasePropriaService = Depends(get_base_propria_service),
    user: dict = Depends(get_current_user),
):
    service.deletar_base(base_id, user["id"])


@router.post(
    "/{base_id}/duplicar",
    response_model=BaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicar base (cria uma nova versão com insumos e composições)",
)
async def duplicar_base_endpoint(
    base_id: str,
    dados: Optional[DuplicarBase] = None,
    service: BasePropriaService = Depends(get_base_propria_service),
    user: dict = Depends(get_current_user),
):
    return service.duplicar_base(base_id, user["id"], dados.nome if dados else None)


# --- Insumos -----------------------------------------------------------------


@router.get("/{base_id}/insumos", response_model=List[InsumoResponse], summary="Listar insumos da base")
async def listar_insumos_endpoint(
    base_id: str,
    q: Optional[str] = Query(None, max_length=100),
    limite: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: BasePropriaService = Depends(get_base_propria_service),
):
    return service.listar_insumos(base_id, q, limite, offset)


@router.post(
    "/{base_id}/insumos", response_model=InsumoResponse, status_code=status.HTTP_201_CREATED, summary="Criar insumo"
)
async def criar_insumo_endpoint(
    base_id: str, dados: InsumoCreate, service: BasePropriaService = Depends(get_base_propria_service)
):
    return service.criar_insumo(base_id, dados)


@router.get("/{base_id}/insumos/{insumo_id}", response_model=InsumoResponse, summary="Buscar insumo")
async def obter_insumo_endpoint(
    base_id: str, insumo_id: str, service: BasePropriaService = Depends(get_base_propria_service)
):
    return service.obter_insumo(base_id, insumo_id)


@router.put("/{base_id}/insumos/{insumo_id}", response_model=InsumoResponse, summary="Atualizar insumo")
async def atualizar_insumo_endpoint(
    base_id: str,
    insumo_id: str,
    dados: InsumoUpdate,
    service: BasePropriaService = Depends(get_base_propria_service),
):
    return service.atualizar_insumo(base_id, insumo_id, dados)


@router.delete("/{base_id}/insumos/{insumo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Excluir insumo")
async def deletar_insumo_endpoint(
    base_id: str, insumo_id: str, service: BasePropriaService = Depends(get_base_propria_service)
):
    service.deletar_insumo(base_id, insumo_id)


# --- Composições -------------------------------------------------------------


@router.get("/{base_id}/composicoes", response_model=List[ComposicaoResponse], summary="Listar composições da base")
async def listar_composicoes_endpoint(
    base_id: str,
    q: Optional[str] = Query(None, max_length=100),
    limite: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: BasePropriaService = Depends(get_base_propria_service),
):
    return service.listar_composicoes(base_id, q, limite, offset)


@router.post(
    "/{base_id}/composicoes",
    response_model=ComposicaoDetalhe,
    status_code=status.HTTP_201_CREATED,
    summary="Criar composição (com itens opcionais)",
)
async def criar_composicao_endpoint(
    base_id: str, dados: ComposicaoCreate, service: BasePropriaService = Depends(get_base_propria_service)
):
    return service.criar_composicao(base_id, dados)


@router.get(
    "/{base_id}/composicoes/{composicao_id}", response_model=ComposicaoDetalhe, summary="Buscar composição com itens"
)
async def obter_composicao_endpoint(
    base_id: str, composicao_id: str, service: BasePropriaService = Depends(get_base_propria_service)
):
    return service.obter_composicao_detalhada(base_id, composicao_id)


@router.put("/{base_id}/composicoes/{composicao_id}", response_model=ComposicaoResponse, summary="Atualizar composição")
async def atualizar_composicao_endpoint(
    base_id: str,
    composicao_id: str,
    dados: ComposicaoUpdate,
    service: BasePropriaService = Depends(get_base_propria_service),
):
    return service.atualizar_composicao(base_id, composicao_id, dados)


@router.delete(
    "/{base_id}/composicoes/{composicao_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Excluir composição"
)
async def deletar_composicao_endpoint(
    base_id: str, composicao_id: str, service: BasePropriaService = Depends(get_base_propria_service)
):
    service.deletar_composicao(base_id, composicao_id)


@router.get(
    "/{base_id}/composicoes/{composicao_id}/preco",
    response_model=PrecoComposicaoResponse,
    summary="Calcular o preço da composição (Σ coeficiente × preço) para uma UF e mês de referência",
)
async def preco_composicao_endpoint(
    base_id: str,
    composicao_id: str,
    uf: str = Query(..., min_length=2, max_length=2),
    mes: str = Query(..., min_length=1, max_length=50, description="MM/AAAA, como nas bases oficiais"),
    tipo: str = Query(TIPO_PADRAO, description="Com Desoneração ou Sem Desoneração"),
    service: BasePropriaService = Depends(get_base_propria_service),
):
    return service.calcular_preco(base_id, composicao_id, uf, mes, tipo)


# --- Itens de composição -----------------------------------------------------


@router.post(
    "/{base_id}/composicoes/{composicao_id}/itens",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar item à composição",
)
async def adicionar_item_endpoint(
    base_id: str,
    composicao_id: str,
    dados: ItemCreate,
    service: BasePropriaService = Depends(get_base_propria_service),
):
    return service.adicionar_item(base_id, composicao_id, dados)


@router.put(
    "/{base_id}/composicoes/{composicao_id}/itens/{item_id}",
    response_model=ItemResponse,
    summary="Atualizar item da composição",
)
async def atualizar_item_endpoint(
    base_id: str,
    composicao_id: str,
    item_id: str,
    dados: ItemUpdate,
    service: BasePropriaService = Depends(get_base_propria_service),
):
    return service.atualizar_item(base_id, composicao_id, item_id, dados)


@router.delete(
    "/{base_id}/composicoes/{composicao_id}/itens/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover item da composição",
)
async def remover_item_endpoint(
    base_id: str,
    composicao_id: str,
    item_id: str,
    service: BasePropriaService = Depends(get_base_propria_service),
):
    service.remover_item(base_id, composicao_id, item_id)


# --- Importação --------------------------------------------------------------


@router.post(
    "/{base_id}/importar",
    response_model=ImportacaoResultado,
    summary="Importar insumos e composições de uma planilha .xlsx para esta base",
)
async def importar_endpoint(
    base_id: str,
    file: UploadFile = File(...),
    service: BasePropriaService = Depends(get_base_propria_service),
):
    # Lê um byte além do limite para detectar arquivo grande sem carregá-lo inteiro.
    conteudo = await file.read(MAX_ARQUIVO_BYTES + 1)
    return service.importar(base_id, conteudo)
