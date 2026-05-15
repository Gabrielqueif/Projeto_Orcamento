"""
Tests for ImportService metadata extraction.

Uses the `sinapi_excel_content` fixture from conftest.py to generate
a valid SINAPI-like Excel file in memory, removing any dependency on
physical spreadsheet files in the repository.
"""
import pytest
from app.services.import_service import extract_metadata


@pytest.mark.unit
def test_extract_metadata_success(sinapi_excel_content: bytes):
    """
    Valida que extract_metadata consegue ler o conteúdo mínimo de um Excel
    SINAPI gerado em memória e retornar os campos básicos.
    """
    metadata = extract_metadata(sinapi_excel_content)

    assert metadata.mes_referencia == "12/2025"
    assert metadata.uf == "BR"
    assert "SEM DESONERA" in metadata.desoneracao.upper()


@pytest.mark.unit
def test_extract_metadata_with_explicit_source_type(sinapi_excel_content: bytes):
    """extract_metadata com source_type explícito propaga o campo fonte."""
    metadata = extract_metadata(sinapi_excel_content, source_type="SINAPI")
    assert metadata.fonte == "SINAPI"
    assert metadata.mes_referencia == "12/2025"
