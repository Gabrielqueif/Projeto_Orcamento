"""
Edge-case and security tests for the API layer.

Uses the `client` fixture from conftest.py (FastAPI TestClient with mocked
Supabase and authentication).
"""
import pytest
from io import BytesIO
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Upload endpoint — structural validation
# ---------------------------------------------------------------------------

@pytest.mark.integration
def test_upload_no_file(client: TestClient):
    """Upload sem arquivo → FastAPI retorna 422 Unprocessable Entity."""
    response = client.post("/importacao/upload")
    assert response.status_code == 422


@pytest.mark.integration
def test_upload_invalid_extension(client: TestClient):
    """Upload de extensão proibida (.exe) → 400 Bad Request."""
    files = {"file": ("malicious.exe", b"fake binary", "application/octet-stream")}
    response = client.post("/importacao/upload", files=files)
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]


@pytest.mark.integration
def test_upload_unsupported_source(client: TestClient):
    """Upload com source desconhecida → 400 (ValueError capturado pelo handler)."""
    files = {"file": ("test.xlsx", b"fake excel", "application/vnd.ms-excel")}
    response = client.post("/importacao/upload?source=UNKNOWN_SOURCE", files=files)
    assert response.status_code == 400
    assert "não suportada" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Orçamento endpoints
# ---------------------------------------------------------------------------

@pytest.mark.integration
def test_get_orcamento_not_found(client: TestClient, mock_supabase):
    """Buscar orçamento inexistente → 404 Not Found."""
    # Supabase retorna lista vazia → service levanta ValueError("não encontrado")
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    response = client.get("/orcamentos/non-existent-id")
    # O exception_handler em main.py converte ValueError com "não encontrado" → 404
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Search endpoint — input sanitisation
# ---------------------------------------------------------------------------

@pytest.mark.integration
def test_search_injection_attempt(client: TestClient):
    """SQL injection no termo de busca → não deve causar erro 500."""
    injection_query = "'; DROP TABLE composicao; --"
    response = client.get(f"/composicoes/buscar/{injection_query}")
    assert response.status_code in [200, 400, 404]


@pytest.mark.integration
def test_search_long_query(client: TestClient):
    """Termo de busca extremamente longo → deve ser tratado graciosamente."""
    long_query = "a" * 1000
    response = client.get(f"/composicoes/buscar/{long_query}")
    assert response.status_code in [200, 400, 404, 422]
