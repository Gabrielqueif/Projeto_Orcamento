import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.dependencies import get_supabase
from app.modules.base_propria.repositories import BasePropriaRepository
from app.modules.base_propria.services import BasePropriaService
from app.modules.composicao.repositories import ItemRepository
from app.modules.etapa.repositories import EtapaRepository
from app.modules.importacao.services.pdf_service import PdfService
from app.modules.orcamento.analise import CronogramaService, CurvaAbcService
from app.modules.orcamento.bdi import FAIXAS_REFERENCIA_TCU, calcular_bdi_tcu
from app.modules.orcamento.repositories import InsumoRepository, OrcamentoItemRepository, OrcamentoRepository
from app.modules.orcamento.schemas import (
    AtualizarPrecosPropriaResponse,
    BDICalculateRequest,
    BDICalculateResponse,
    ComposicaoPropriaBuscaResponse,
    CronogramaResponse,
    CurvaABCResponse,
    OrcamentoCreate,
    OrcamentoItemCreate,
    OrcamentoItemInsumoUpdate,
    OrcamentoItemResponse,
    OrcamentoItemUpdate,
    OrcamentoResponse,
    OrcamentoStatsResponse,
    OrcamentoUpdate,
)
from app.modules.orcamento.services import OrcamentoItemService, OrcamentoService, anexar_nome_base_propria
from core.ownership import enforce_ownership
from core.security import get_current_user

logger = logging.getLogger("projeto_orcamento")

router = APIRouter(prefix="/orcamentos", dependencies=[Depends(enforce_ownership)], redirect_slashes=False)

# --- Dependências locais ---


def get_orcamento_service(supabase=Depends(get_supabase)) -> OrcamentoService:
    repository = OrcamentoRepository(supabase)
    item_repo = OrcamentoItemRepository(supabase)
    return OrcamentoService(repository, item_repo)


def get_curva_abc_service(supabase=Depends(get_supabase)) -> CurvaAbcService:
    return CurvaAbcService(OrcamentoRepository(supabase), OrcamentoItemRepository(supabase), InsumoRepository(supabase))


def get_cronograma_service(supabase=Depends(get_supabase)) -> CronogramaService:
    return CronogramaService(
        OrcamentoRepository(supabase), EtapaRepository(supabase), OrcamentoItemRepository(supabase)
    )


def get_orcamento_item_service(supabase=Depends(get_supabase)) -> OrcamentoItemService:
    item_repo = ItemRepository(supabase)
    orcamento_repo = OrcamentoRepository(supabase)
    orcamento_item_repo = OrcamentoItemRepository(supabase)
    insumo_repo = InsumoRepository(supabase)
    base_propria = BasePropriaService(BasePropriaRepository(supabase), item_repo)
    return OrcamentoItemService(orcamento_item_repo, orcamento_repo, item_repo, insumo_repo, base_propria)


def get_base_propria_service(supabase=Depends(get_supabase)) -> BasePropriaService:
    return BasePropriaService(BasePropriaRepository(supabase), ItemRepository(supabase))


# --- Rotas de Orçamentos ---


@router.post(
    "/calcular-bdi",
    response_model=BDICalculateResponse,
    summary="Simular e calcular BDI Analítico TCU",
    tags=["Orçamentos"],
)
async def simular_calculo_bdi(payload: BDICalculateRequest):
    """Calcula a taxa de BDI pela fórmula oficial TCU (Acórdão 2622/2013) sem persistir."""
    bdi_resultado = calcular_bdi_tcu(payload.config)
    impostos = payload.config.calcular_impostos_total()
    return {
        "bdi": bdi_resultado,
        "bdi_diferenciado": payload.config.bdi_diferenciado,
        "impostos_total": impostos,
        "detalhamento": {
            "formula": "BDI = [ ((1 + AC + SG + R) * (1 + DF) * (1 + L)) / (1 - I) ] - 1",
            "faixas_referencia_edificios": FAIXAS_REFERENCIA_TCU["CONSTRUCAO_EDIFICIOS"],
            "faixas_referencia_equipamentos": FAIXAS_REFERENCIA_TCU["FORNECIMENTO_MATERIAIS_EQUIPAMENTOS"],
        },
    }


@router.post("/", response_model=OrcamentoResponse, summary="Criar novo orçamento", tags=["Orçamentos"])
async def criar_orcamento(
    orcamento: OrcamentoCreate,
    service: OrcamentoService = Depends(get_orcamento_service),
    user: dict = Depends(get_current_user),
):
    """Cria um novo orçamento pertencente ao usuário autenticado"""
    return service.criar_orcamento(orcamento, user_id=user["id"])


@router.get("/", response_model=List[OrcamentoResponse], summary="Listar orçamentos", tags=["Orçamentos"])
async def listar_orcamentos(
    nome: Optional[str] = None,
    status: Optional[str] = None,
    cliente: Optional[str] = None,
    service: OrcamentoService = Depends(get_orcamento_service),
    user: dict = Depends(get_current_user),
):
    """Lista os orçamentos do usuário autenticado, com filtros opcionais"""
    return service.listar_orcamentos(nome, status, cliente, user_id=user["id"])


@router.get(
    "/stats",
    response_model=OrcamentoStatsResponse,
    summary="Obter estatísticas acumuladas dos orçamentos",
    tags=["Orçamentos"],
)
async def obter_estatisticas_endpoint(
    service: OrcamentoService = Depends(get_orcamento_service), user: dict = Depends(get_current_user)
):
    """Retorna estatísticas dos orçamentos do usuário autenticado"""
    return service.obter_estatisticas(user_id=user["id"])


@router.get("/{orcamento_id}", response_model=OrcamentoResponse, summary="Buscar orçamento por ID", tags=["Orçamentos"])
async def buscar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Busca um orçamento específico por ID"""
    return service.buscar_orcamento(orcamento_id)


@router.put("/{orcamento_id}", response_model=OrcamentoResponse, summary="Atualizar orçamento", tags=["Orçamentos"])
async def atualizar_orcamento(
    orcamento_id: str, orcamento: OrcamentoUpdate, service: OrcamentoService = Depends(get_orcamento_service)
):
    """Atualiza um orçamento existente"""
    return service.atualizar_orcamento(orcamento_id, orcamento)


@router.delete("/{orcamento_id}", summary="Deletar orçamento", tags=["Orçamentos"])
async def deletar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Deleta um orçamento e seus itens relacionados"""
    service.deletar_orcamento(orcamento_id)
    return {"message": "Orçamento deletado com sucesso", "id": orcamento_id}


@router.get("/{orcamento_id}/pdf", tags=["Orçamentos"])
async def download_pdf_orcamento(
    orcamento_id: str,
    service: OrcamentoService = Depends(get_orcamento_service),
    base_propria: BasePropriaService = Depends(get_base_propria_service),
):
    """Gera e retorna um relatório em PDF do orçamento"""
    try:
        orcamento = service.buscar_orcamento(orcamento_id)
        itens = service.item_repository.listar_por_orcamento(orcamento_id)
        anexar_nome_base_propria(itens, base_propria, orcamento.get("user_id"))

        pdf_service = PdfService()
        pdf_bytes = pdf_service.gerar_pdf(orcamento, itens)

        return Response(
            content=bytes(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=orcamento_{orcamento_id}.pdf"},
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Erro ao gerar PDF", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao gerar PDF")


@router.get("/{orcamento_id}/excel", tags=["Orçamentos"])
async def download_excel_orcamento(
    orcamento_id: str,
    service: OrcamentoService = Depends(get_orcamento_service),
    base_propria: BasePropriaService = Depends(get_base_propria_service),
):
    """Gera e retorna a planilha orçamentária em formato Excel (.xlsx)"""
    try:
        from app.modules.orcamento.export import gerar_planilha_orcamento_excel

        orcamento = service.buscar_orcamento(orcamento_id)
        itens = service.item_repository.listar_por_orcamento(orcamento_id)
        anexar_nome_base_propria(itens, base_propria, orcamento.get("user_id"))

        excel_bytes = gerar_planilha_orcamento_excel(
            orcamento.model_dump() if hasattr(orcamento, "model_dump") else dict(orcamento),
            [i.model_dump() if hasattr(i, "model_dump") else dict(i) for i in itens],
        )

        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=orcamento_{orcamento_id}.xlsx"},
        )
    except ValueError:
        raise
    except Exception:
        logger.error("Erro ao gerar planilha Excel", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao gerar planilha Excel")


@router.get(
    "/{orcamento_id}/curva-abc",
    response_model=CurvaABCResponse,
    summary="Obter Curva ABC real de insumos do orçamento",
    tags=["Orçamentos"],
)
async def obter_curva_abc_endpoint(orcamento_id: str, service: CurvaAbcService = Depends(get_curva_abc_service)):
    """Retorna a Curva ABC real de insumos do orçamento"""
    return service.obter_curva_abc(orcamento_id)


@router.get(
    "/{orcamento_id}/cronograma",
    response_model=CronogramaResponse,
    summary="Obter Cronograma Físico-Financeiro dinâmico do orçamento",
    tags=["Orçamentos"],
)
async def obter_cronograma_endpoint(orcamento_id: str, service: CronogramaService = Depends(get_cronograma_service)):
    """Retorna o Cronograma Físico-Financeiro dinâmico do orçamento"""
    return service.obter_cronograma(orcamento_id)


# --- Rotas de Itens do Orçamento ---


@router.post(
    "/{orcamento_id}/itens",
    response_model=OrcamentoItemResponse,
    summary="Adicionar item ao orçamento",
    tags=["Itens do Orçamento"],
)
async def adicionar_item(
    orcamento_id: str, item: OrcamentoItemCreate, service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Adiciona um novo item ao orçamento"""
    try:
        return service.adicionar_item(orcamento_id, item)
    except ValueError:
        raise
    except Exception:
        logger.error("Erro ao adicionar item", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro ao adicionar item")


@router.get(
    "/{orcamento_id}/itens",
    response_model=List[OrcamentoItemResponse],
    summary="Listar itens do orçamento",
    tags=["Itens do Orçamento"],
)
async def listar_itens(orcamento_id: str, service: OrcamentoItemService = Depends(get_orcamento_item_service)):
    """Lista todos os itens de um orçamento"""
    return service.listar_itens(orcamento_id)


@router.post(
    "/{orcamento_id}/itens/atualizar-precos-propria",
    response_model=AtualizarPrecosPropriaResponse,
    summary="Prévia ou aplicação da atualização de preços dos itens da base própria",
    tags=["Itens do Orçamento"],
)
async def atualizar_precos_propria(
    orcamento_id: str,
    aplicar: bool = Query(False, description="false devolve só a prévia; true grava os novos preços"),
    service: OrcamentoItemService = Depends(get_orcamento_item_service),
):
    """Reprecifica os itens PROPRIA com o preço atual da base; sem `aplicar` nada é gravado."""
    return service.atualizar_precos_propria(orcamento_id, aplicar)


@router.get(
    "/{orcamento_id}/buscar-composicoes-proprias",
    response_model=List[ComposicaoPropriaBuscaResponse],
    summary="Buscar composições nas bases próprias do dono do orçamento",
    tags=["Itens do Orçamento"],
)
async def buscar_composicoes_proprias(
    orcamento_id: str,
    termo: str = Query("", description="Trecho do código ou da descrição"),
    limite: int = Query(20, ge=1, le=100),
    service: OrcamentoItemService = Depends(get_orcamento_item_service),
):
    """Autocomplete: composições próprias já precificadas com UF, mês e tipo do orçamento."""
    return service.buscar_composicoes_proprias(orcamento_id, termo, limite)


@router.put(
    "/{orcamento_id}/itens/{item_id}",
    response_model=OrcamentoItemResponse,
    summary="Atualizar item do orçamento",
    tags=["Itens do Orçamento"],
)
async def atualizar_item(
    orcamento_id: str,
    item_id: str,
    item_update: OrcamentoItemUpdate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service),
):
    """Atualiza um item do orçamento"""
    return service.atualizar_item(orcamento_id, item_id, item_update)


@router.delete("/{orcamento_id}/itens/{item_id}", summary="Remover item do orçamento", tags=["Itens do Orçamento"])
async def remover_item(
    orcamento_id: str, item_id: str, service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Remove um item do orçamento"""
    return service.remover_item(orcamento_id, item_id)


@router.get(
    "/{orcamento_id}/itens/{item_id}/insumos",
    summary="Listar insumos (explosão analítica) de um item",
    tags=["Itens do Orçamento"],
)
async def listar_insumos(
    orcamento_id: str, item_id: str, service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Lista os insumos (explosão analítica) de um item do orçamento"""
    return service.listar_insumos(orcamento_id, item_id)


@router.put(
    "/{orcamento_id}/itens/{item_id}/insumos/{insumo_id}",
    summary="Atualizar um insumo do item",
    tags=["Itens do Orçamento"],
)
async def atualizar_insumo(
    orcamento_id: str,
    item_id: str,
    insumo_id: str,
    insumo_update: OrcamentoItemInsumoUpdate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service),
):
    """Atualiza um insumo e recalcula os totais"""
    return service.atualizar_insumo(orcamento_id, item_id, insumo_id, insumo_update.model_dump(exclude_unset=True))
