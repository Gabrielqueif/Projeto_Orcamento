import pytest
from pathlib import Path
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
        response = client.post("/sinapi/upload", files=files)

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
    response = client.post("/sinapi/upload", files=files)
    
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]
