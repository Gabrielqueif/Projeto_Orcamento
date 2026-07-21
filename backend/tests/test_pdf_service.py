import pytest
from app.modules.importacao.services.pdf_service import PdfService

def test_pdf_service_plano():
    """Testa a geração de PDF plano (retrocompatível)"""
    orcamento = {
        "cliente": "Cliente Plano",
        "nome": "Obra Plana",
        "fonte": "SINAPI",
        "base_referencia": "01/2025",
        "created_at": "2025-01-01T00:00:00Z",
        "bdi": 25.0
    }
    itens = [
        {"id": "i1", "descricao": "Item 1", "quantidade": 2.0, "preco_unitario": 100.0, "preco_total": 200.0},
        {"id": "i2", "descricao": "Item 2", "quantidade": 3.0, "preco_unitario": 50.0, "preco_total": 150.0}
    ]
    
    pdf_service = PdfService()
    pdf_bytes = pdf_service.gerar_pdf(orcamento, itens)
    
    assert isinstance(pdf_bytes, bytearray) or isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    # Verificação básica de cabeçalho PDF
    assert pdf_bytes.startswith(b"%PDF")

def test_pdf_service_hierarquico():
    """Testa a geração de PDF hierárquico com etapas e sub-etapas"""
    orcamento = {
        "cliente": "Cliente Hierárquico",
        "nome": "Obra Hierárquica",
        "fonte": "SEINFRA",
        "base_referencia": "02/2025",
        "created_at": "2025-02-01T00:00:00Z",
        "bdi": 20.0
    }
    
    etapas = [
        {"id": "e1", "nome": "Infraestrutura", "ordem": 1, "parent_id": None},
        {"id": "e1.1", "nome": "Fundações", "ordem": 1, "parent_id": "e1"},
        {"id": "e1.2", "nome": "Estrutura", "ordem": 2, "parent_id": "e1"},
        {"id": "e2", "nome": "Instalações", "ordem": 2, "parent_id": None}
    ]
    
    itens = [
        # Itens em e1.1
        {"id": "i1", "descricao": "Escavação", "quantidade": 10.0, "preco_unitario": 50.0, "preco_total": 500.0, "etapa_id": "e1.1"},
        # Itens em e1.2
        {"id": "i2", "descricao": "Pilares de Concreto", "quantidade": 5.0, "preco_unitario": 200.0, "preco_total": 1000.0, "etapa_id": "e1.2"},
        # Item em e2
        {"id": "i3", "descricao": "Fios elétricos", "quantidade": 100.0, "preco_unitario": 2.0, "preco_total": 200.0, "etapa_id": "e2"},
        # Item sem etapa (Outros)
        {"id": "i4", "descricao": "Limpeza final", "quantidade": 1.0, "preco_unitario": 300.0, "preco_total": 300.0, "etapa_id": None}
    ]
    
    pdf_service = PdfService()
    pdf_bytes = pdf_service.gerar_pdf(orcamento, itens, etapas)
    
    assert isinstance(pdf_bytes, bytearray) or isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF")
