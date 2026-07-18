"""
Tests for ImportService metadata extraction and process_import_file.

Uses the `sinapi_excel_content` fixture from conftest.py to generate
a valid SINAPI-like Excel file in memory, removing any dependency on
physical spreadsheet files in the repository.
"""
import pytest
from unittest.mock import MagicMock, patch
from app.services.import_service import extract_metadata, process_import_file


@pytest.mark.unit
def test_extract_metadata_success(sinapi_excel_content: bytes):
    """
    Valida que extract_metadata consegue ler o conteúdo mínimo de um Excel
    SINAPI gerado em memória e retornar os campos básicos.
    """
    metadata = extract_metadata(sinapi_excel_content)

    assert metadata.mes_referencia == "12/2025"
    assert metadata.uf  # deve ser um string não-vazio
    assert "SEM DESONERA" in metadata.desoneracao.upper()


@pytest.mark.unit
def test_extract_metadata_with_explicit_source_type(sinapi_excel_content: bytes):
    """extract_metadata com source_type explícito propaga o campo fonte."""
    metadata = extract_metadata(sinapi_excel_content, source_type="SINAPI")
    assert metadata.fonte == "SINAPI"
    assert metadata.mes_referencia == "12/2025"


# ---------------------------------------------------------------------------
# process_import_file
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_process_import_file_sucesso(sinapi_excel_content: bytes):
    """Arquivo válido → retorna status=sucesso e chama repository correto."""
    # Arrange
    mock_repo = MagicMock()
    mock_repo.upsert_batch_composicoes.return_value = 2
    mock_repo.upsert_batch_estados.return_value = 2
    mock_repo.upsert_batch_composicao_itens.return_value = 0

    # Act
    resultado = process_import_file(sinapi_excel_content, mock_repo, source_type="SINAPI")

    # Assert
    assert resultado["status"] == "sucesso"
    assert "imported_items" in resultado
    assert "imported_prices" in resultado
    mock_repo.upsert_batch_composicoes.assert_called_once()
    mock_repo.upsert_batch_estados.assert_called_once()


@pytest.mark.unit
def test_process_import_file_repo_mock_chamado_com_dados(sinapi_excel_content: bytes):
    """Valida que upsert_batch_composicoes e upsert_batch_estados são chamados."""
    # Arrange
    mock_repo = MagicMock()
    mock_repo.upsert_batch_composicoes.return_value = 1
    mock_repo.upsert_batch_estados.return_value = 1

    # Act
    process_import_file(sinapi_excel_content, mock_repo, source_type="SINAPI")

    # Assert — ambos os métodos foram chamados exatamente uma vez
    assert mock_repo.upsert_batch_composicoes.call_count == 1
    assert mock_repo.upsert_batch_estados.call_count == 1


@pytest.mark.unit
def test_process_import_file_parser_error_propaga_value_error(sinapi_excel_content: bytes):
    """Quando o parser lança exceção, process_import_file re-raise como ValueError."""
    # Arrange
    mock_repo = MagicMock()

    with patch(
        "app.services.import_service.get_parser",
        side_effect=RuntimeError("Parser corrompido"),
    ):
        # Act + Assert
        with pytest.raises(ValueError, match="Erro no processamento"):
            process_import_file(sinapi_excel_content, mock_repo, source_type="SINAPI")

