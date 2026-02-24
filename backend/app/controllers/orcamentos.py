from typing import List, Optional
from fastapi import Depends, Response
from fastapi.responses import StreamingResponse
from io import BytesIO
from app.dependencies import get_supabase
from schemas.schemas import OrcamentoCreate, OrcamentoUpdate, OrcamentoResponse
from app.repositories.orcamento_repository import OrcamentoRepository
from app.repositories.orcamento_item_repository import OrcamentoItemRepository
from app.services.orcamento_service import OrcamentoService
from app.services.pdf_service import PdfService

def get_orcamento_service(supabase=Depends(get_supabase)) -> OrcamentoService:
    repository = OrcamentoRepository(supabase)
    return OrcamentoService(repository)

def criar_orcamento(orcamento: OrcamentoCreate, service: OrcamentoService = Depends(get_orcamento_service)):
    """Cria um novo orçamento"""
    return service.criar_orcamento(orcamento)

def listar_orcamentos(
    status: Optional[str] = None,
    cliente: Optional[str] = None,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Lista todos os orçamentos, com filtros opcionais"""
    return service.listar_orcamentos(status, cliente)

def buscar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Busca um orçamento específico por ID"""
    return service.buscar_orcamento(orcamento_id)

def atualizar_orcamento(
    orcamento_id: str,
    orcamento_update: OrcamentoUpdate,
    service: OrcamentoService = Depends(get_orcamento_service)
):
    """Atualiza um orçamento existente"""
    return service.atualizar_orcamento(orcamento_id, orcamento_update)

def deletar_orcamento(orcamento_id: str, service: OrcamentoService = Depends(get_orcamento_service)):
    """Deleta um orçamento e seus itens relacionados"""
    service.deletar_orcamento(orcamento_id)
    return {"message": "Orçamento deletado com sucesso", "id": orcamento_id}

def download_pdf(
    orcamento_id: str, 
    service: OrcamentoService = Depends(get_orcamento_service),
    supabase = Depends(get_supabase)
):
    """Gera e retorna o PDF do orçamento"""
    # 1. Buscar dados do orçamento
    orcamento = service.buscar_orcamento(orcamento_id)
    
    # 2. Buscar itens do orçamento (precisamos do repositório de itens aqui)
    # Idealmente, o orcamento_service ja deveria trazer tudo, mas vamos buscar direto por enquanto
    item_repo = OrcamentoItemRepository(supabase)
    itens = item_repo.listar_por_orcamento(orcamento_id)
    
    # 3. Gerar PDF
    pdf_service = PdfService()
    pdf_content = pdf_service.gerar_pdf(orcamento, itens)
    
    # 4. Retornar stream
    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=orcamento_{orcamento_id}.pdf"}
    )



