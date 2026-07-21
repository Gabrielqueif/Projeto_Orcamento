"""
Integration tests for rotas SINAPI: composições e bases disponíveis.
"""
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


def test_upload_sinapi_worksheet(client: TestClient):
    """
    Test uploading a valid SINAPI worksheet.
    Mocking authentication is handled by conftest.py overrides.
    """
    file_path = Path("planilhas/planilha_sinapi.xlsx")
    if not file_path.exists():
        pytest.skip("Planilha de exemplo não encontrada")

    with open(file_path, "rb") as f:
        files = {"file": ("planilha_sinapi.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        response = client.post("/importacao/upload", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["mes_referencia"] == "09/2025"
    assert "uf" in data
    assert "desoneracao" in data


def test_upload_invalid_file(client: TestClient):
    """
    Test uploading a text file instead of Excel.
    """
    files = {"file": ("test.txt", b"plain text", "text/plain")}
    response = client.post("/importacao/upload", files=files)

    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Rotas de composições
# ---------------------------------------------------------------------------

@pytest.mark.integration
def test_listar_composicoes(client: TestClient, mock_supabase):
    """GET /composicoes/ → retorna lista de composições."""
    # Arrange
    dados = [
        {"codigo_composicao": "100", "descricao": "Concreto", "unidade": "M3"},
        {"codigo_composicao": "101", "descricao": "Areia", "unidade": "M3"},
    ]
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value.data = dados

    # Act
    response = client.get("/composicoes/")

    # Assert
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["codigo_composicao"] == "100"


@pytest.mark.integration
def test_buscar_composicao_por_termo(client: TestClient, mock_supabase):
    """GET /composicoes/buscar/{termo} → retorna composições correspondentes."""
    # Arrange
    dados = [{"codigo_composicao": "200", "descricao": "Alvenaria de tijolo"}]
    chain = mock_supabase.table.return_value.select.return_value
    chain.ilike.return_value = chain
    chain.eq.return_value = chain
    chain.limit.return_value = chain
    chain.execute.return_value.data = dados

    # Act
    response = client.get("/composicoes/buscar/alvenaria")

    # Assert
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)


@pytest.mark.integration
def test_listar_bases_disponiveis(client: TestClient, mock_supabase):
    """GET /importacao/bases → retorna lista de bases disponíveis."""
    # Arrange
    dados = [
        {"mes_referencia": "12/2025", "fonte": "SINAPI"},
        {"mes_referencia": "11/2025", "fonte": "SINAPI"},
    ]
    mock_supabase.table.return_value.select.return_value.execute.return_value.data = dados

    with patch("app.modules.importacao.routes.get_supabase_client", return_value=mock_supabase):
        # Act
        response = client.get("/importacao/bases")

    # Assert
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)

