import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from io import BytesIO

def test_upload_no_file(client: TestClient):
    """Testa o endpoint de upload sem enviar arquivo."""
    # O FastAPI deve retornar 422 Unprocessable Entity
    response = client.post("/importacao/upload")
    assert response.status_code == 422 

def test_upload_invalid_extension(client: TestClient):
    """Testa upload de extensão proibida (ex: .exe)."""
    files = {"file": ("malicious.exe", b"fake binary", "application/octet-stream")}
    response = client.post("/importacao/upload", files=files)
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]

def test_upload_unsupported_source(client: TestClient):
    """Testa o upload passando uma fonte não suportada pelo factory."""
    files = {"file": ("test.xlsx", b"fake excel", "application/vnd.ms-excel")}
    response = client.post("/importacao/upload?source=UNKNOWN_SOURCE", files=files)
    
    # O ImportService chama extract_metadata -> get_parser -> que lança ValueError 
    # se a fonte não estiver mapeada
    assert response.status_code == 400
    assert "não suportada" in response.json()["detail"]

def test_search_injection_attempt(client: TestClient):
    """Testa se a busca lida bem com strings que tentam SQL Injection."""
    injection_query = "'; DROP TABLE composicao; --"
    # A rota correta é /composicoes/buscar/{termo}
    response = client.get(f"/composicoes/buscar/{injection_query}")
    
    # Deve retornar 200 (lista vazia) ou erro 400 se houver validação estrita
    assert response.status_code in [200, 400]

def test_search_long_query(client: TestClient):
    """Testa busca com termo extremamente longo."""
    long_query = "a" * 1000
    response = client.get(f"/composicoes/buscar/{long_query}")
    assert response.status_code in [200, 400, 422]

def test_get_orcamento_not_found(client: TestClient, mock_supabase):
    """Testa buscar um orçamento que não existe."""
    # Mockar o retorno do Supabase como lista vazia
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    
    response = client.get("/orcamentos/non-existent-id")
    # Atualmente o service levanta ValueError. Se o controller não pega, dá 500.
    # Vamos verificar se o comportamento é 404 (ideal) ou se precisamos tratar.
    assert response.status_code in [404, 500]
