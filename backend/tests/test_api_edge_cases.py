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


# ---------------------------------------------------------------------------
# Importação — limites e resultado por arquivo
# ---------------------------------------------------------------------------

@pytest.mark.integration
def test_test_upload_removido(client: TestClient):
    files = {"file": ("a.xlsx", b"x", "application/octet-stream")}
    assert client.post("/importacao/test-upload", files=files).status_code in (404, 405)


@pytest.mark.integration
def test_upload_acima_do_limite_413(client: TestClient, monkeypatch):
    from core.config import settings
    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 1)
    files = {"file": ("big.xlsx", b"0" * (1024 * 1024 + 10), "application/octet-stream")}
    assert client.post("/importacao/upload", files=files).status_code == 413


@pytest.mark.integration
def test_upload_extensao_maiuscula_aceita(client: TestClient):
    files = {"file": ("PLANILHA.XLSX", b"fake excel", "application/vnd.ms-excel")}
    # passa da validação de extensão; falha depois no parse (400), nunca "Invalid file format"
    r = client.post("/importacao/upload", files=files)
    assert "Invalid file format" not in r.text


@pytest.mark.integration
def test_import_parcial_e_total_falha(client: TestClient, monkeypatch):
    from app.modules.importacao import routes

    def fake_process(content, repo, source_type="SINAPI"):
        if content == b"bom":
            return {"imported_items": 2, "imported_prices": 3, "metadata": {"fonte": "SINAPI"}}
        raise ValueError("planilha corrompida")

    monkeypatch.setattr(routes, "process_import_file", fake_process)
    # evita criar o cliente Supabase real (sem chave no CI)
    monkeypatch.setattr(routes, "get_item_repository", lambda: None)

    parcial = client.post("/importacao/import", files=[
        ("files", ("ok.xlsx", b"bom", "application/octet-stream")),
        ("files", ("ruim.xlsx", b"ruim", "application/octet-stream")),
        ("files", ("nota.txt", b"x", "application/octet-stream")),
    ])
    body = parcial.json()
    assert parcial.status_code == 200
    assert body["status"] == "parcial"
    assert {f["arquivo"] for f in body["falhas"]} == {"ruim.xlsx", "nota.txt"}

    todos_ruins = client.post("/importacao/import", files=[
        ("files", ("ruim.xlsx", b"ruim", "application/octet-stream")),
    ])
    assert todos_ruins.status_code == 400
    assert "planilha corrompida" in todos_ruins.json()["detail"]
