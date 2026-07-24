from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from io import BytesIO

from app.modules.orcamento.schemas import (
    OrcamentoResponse, OrcamentoCreate, OrcamentoUpdate, OrcamentoStatsResponse,
    CurvaABCResponse, CronogramaResponse, OrcamentoItemResponse, OrcamentoItemCreate,
    OrcamentoItemUpdate, OrcamentoItemInsumoUpdate
)
from app.modules.orcamento.services import OrcamentoService, OrcamentoItemService
from app.modules.orcamento.repositories import OrcamentoRepository, OrcamentoItemRepository, InsumoRepository
from app.modules.item.repositories import ItemRepository
from app.modules.etapa.repositories import EtapaRepository
from app.modules.importacao.services.pdf_service import PdfService

from core.security import get_current_user
from app.dependencies import get_supabase

router = APIRouter(
    prefix="/orcamentos",
    dependencies=[Depends(get_current_user)],
    redirect_slashes=False
)

# --- Dependências locais ---

def get_orcamento_service(supabase = Depends(get_supabase)) -> OrcamentoService:
    repository = OrcamentoRepository(supabase)
    etapa_repo = EtapaRepository(supabase)
    item_repo = OrcamentoItemRepository(supabase)
    return OrcamentoService(repository, etapa_repo, item_repo, supabase)

def get_orcamento_item_service(supabase = Depends(get_supabase)) -> OrcamentoItemService:
    item_repo = ItemRepository(supabase)
    orcamento_repo = OrcamentoRepository(supabase)
    orcamento_item_repo = OrcamentoItemRepository(supabase)
    insumo_repo = InsumoRepository(supabase)
    return OrcamentoItemService(orcamento_item_repo, orcamento_repo, item_repo, insumo_repo)


# --- Rotas de Orçamentos ---

@router.post(
    "/",
    response_model=OrcamentoResponse,
    summary="Criar novo orçamento",
    tags=["Orçamentos"]
)
async def criar_orcamento(
    orcamento: OrcamentoCreate, 
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Cria um novo orçamento"""
    return service.criar_orcamento(orcamento)

@router.get(
    "/",
    response_model=List[OrcamentoResponse],
    summary="Listar orçamentos",
    tags=["Orçamentos"]
)
async def listar_orcamentos(
    nome: Optional[str] = None,
    status: Optional[str] = None, 
    cliente: Optional[str] = None, 
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Lista todos os orçamentos, com filtros opcionais"""
    return service.listar_orcamentos(nome, status, cliente)

@router.get(
    "/stats",
    response_model=OrcamentoStatsResponse,
    summary="Obter estatísticas acumuladas dos orçamentos",
    tags=["Orçamentos"]
)
async def obter_estatisticas_endpoint(
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Retorna estatísticas globais sobre os orçamentos"""
    return service.obter_estatisticas()

@router.get(
    "/{orcamento_id}",
    response_model=OrcamentoResponse,
    summary="Buscar orçamento por ID",
    tags=["Orçamentos"]
)
async def buscar_orcamento(
    orcamento_id: str, 
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Busca um orçamento específico por ID"""
    try:
        return service.buscar_orcamento(orcamento_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put(
    "/{orcamento_id}",
    response_model=OrcamentoResponse,
    summary="Atualizar orçamento",
    tags=["Orçamentos"]
)
async def atualizar_orcamento(
    orcamento_id: str, 
    orcamento: OrcamentoUpdate, 
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Atualiza um orçamento existente"""
    try:
        return service.atualizar_orcamento(orcamento_id, orcamento)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete(
    "/{orcamento_id}",
    summary="Deletar orçamento",
    tags=["Orçamentos"]
)
async def deletar_orcamento(
    orcamento_id: str, 
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Deleta um orçamento e seus itens relacionados"""
    try:
        service.deletar_orcamento(orcamento_id)
        return {"message": "Orçamento deletado com sucesso", "id": orcamento_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/{orcamento_id}/pdf",
    tags=["Orçamentos"]
)
async def download_pdf_orcamento(
    orcamento_id: str,
    service: OrcamentoService = Depends(get_orcamento_service),
    supabase = Depends(get_supabase)
):
    """Gera e retorna um relatório em PDF do orçamento"""
    try:
        orcamento = service.buscar_orcamento(orcamento_id)
        itens = service.item_repository.listar_por_orcamento(orcamento_id)
        
        pdf_service = PdfService()
        pdf_bytes = pdf_service.gerar_pdf_orcamento(orcamento, itens)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=orcamento_{orcamento_id}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")

@router.get(
    "/{orcamento_id}/excel",
    tags=["Orçamentos"]
)
async def download_excel_orcamento(
    orcamento_id: str,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Gera e retorna a planilha orçamentária em formato Excel (.xlsx)"""
    try:
        from app.modules.orcamento.export import gerar_planilha_orcamento_excel
        orcamento = service.buscar_orcamento(orcamento_id)
        itens = service.item_repository.listar_por_orcamento(orcamento_id)
        
        excel_bytes = gerar_planilha_orcamento_excel(
            orcamento.model_dump() if hasattr(orcamento, "model_dump") else dict(orcamento),
            [i.model_dump() if hasattr(i, "model_dump") else dict(i) for i in itens]
        )
        
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=orcamento_{orcamento_id}.xlsx"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar planilha Excel: {str(e)}")

@router.get(
    "/{orcamento_id}/curva-abc",
    response_model=CurvaABCResponse,
    summary="Obter Curva ABC real de insumos do orçamento",
    tags=["Orçamentos"]
)
async def obter_curva_abc_endpoint(
    orcamento_id: str,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Retorna a Curva ABC real de insumos do orçamento"""
    try:
        return service.obter_curva_abc(orcamento_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/{orcamento_id}/cronograma",
    response_model=CronogramaResponse,
    summary="Obter Cronograma Físico-Financeiro dinâmico do orçamento",
    tags=["Orçamentos"]
)
async def obter_cronograma_endpoint(
    orcamento_id: str,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Retorna o Cronograma Físico-Financeiro dinâmico do orçamento"""
    try:
        return service.obter_cronograma(orcamento_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- Rotas de Itens do Orçamento ---

@router.post(
    "/{orcamento_id}/itens", 
    response_model=OrcamentoItemResponse, 
    summary="Adicionar item ao orçamento",
    tags=["Itens do Orçamento"]
)
async def adicionar_item(
    orcamento_id: str,
    item: OrcamentoItemCreate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Adiciona um novo item ao orçamento"""
    try:
        return service.adicionar_item(orcamento_id, item)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar item: {str(e)}")

@router.get(
    "/{orcamento_id}/itens", 
    response_model=List[OrcamentoItemResponse], 
    summary="Listar itens do orçamento",
    tags=["Itens do Orçamento"]
)
async def listar_itens(
    orcamento_id: str, 
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Lista todos os itens de um orçamento"""
    try:
        return service.listar_itens(orcamento_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put(
    "/{orcamento_id}/itens/{item_id}", 
    response_model=OrcamentoItemResponse, 
    summary="Atualizar item do orçamento",
    tags=["Itens do Orçamento"]
)
async def atualizar_item(
    orcamento_id: str,
    item_id: str,
    item_update: OrcamentoItemUpdate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Atualiza um item do orçamento"""
    try:
        return service.atualizar_item(orcamento_id, item_id, item_update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete(
    "/{orcamento_id}/itens/{item_id}", 
    summary="Remover item do orçamento",
    tags=["Itens do Orçamento"]
)
async def remover_item(
    orcamento_id: str,
    item_id: str,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Remove um item do orçamento"""
    try:
        return service.remover_item(orcamento_id, item_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/{orcamento_id}/itens/{item_id}/insumos",
    summary="Listar insumos (explosão analítica) de um item",
    tags=["Itens do Orçamento"]
)
async def listar_insumos(
    orcamento_id: str,
    item_id: str,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Lista os insumos (explosão analítica) de um item do orçamento"""
    try:
        return service.listar_insumos(orcamento_id, item_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put(
    "/{orcamento_id}/itens/{item_id}/insumos/{insumo_id}",
    summary="Atualizar um insumo do item",
    tags=["Itens do Orçamento"]
)
async def atualizar_insumo(
    orcamento_id: str,
    item_id: str,
    insumo_id: str,
    insumo_update: OrcamentoItemInsumoUpdate,
    service: OrcamentoItemService = Depends(get_orcamento_item_service)
):
    """Atualiza um insumo e recalcula os totais"""
    try:
        return service.atualizar_insumo(orcamento_id, item_id, insumo_id, insumo_update.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
