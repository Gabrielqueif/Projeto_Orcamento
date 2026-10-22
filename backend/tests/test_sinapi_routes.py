"""
Integration tests for rotas SINAPI: composições e bases disponíveis.
"""
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
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
    chain.eq.return_value = chain
    chain.limit.return_value = chain
    chain.text_search.return_value = chain
    chain.execute.return_value.data = dados

    # Act
    response = client.get("/composicoes/buscar/alvenaria")

    # Assert
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)


def _mock_paginas(mock_supabase, paginas):
    chain = mock_supabase.table.return_value.select.return_value
    chain.order.return_value = chain
    chain.range.return_value = chain
    resultados = []
    for pagina in paginas:
        r = MagicMock()
        r.data = pagina
        resultados.append(r)
    chain.execute.side_effect = resultados
    return chain


@pytest.mark.integration
def test_listar_bases_disponiveis_agrupa_e_conta(client: TestClient, mock_supabase):
    """GET /importacao/bases → agrupa por fonte/mês/tipo reais e conta composições."""
    linhas = [
        {"fonte": "SINAPI", "mes_referencia": "12/2025", "tipo_composicao": "Com Desoneração"},
        {"fonte": "SINAPI", "mes_referencia": "12/2025", "tipo_composicao": "Com Desoneração"},
        {"fonte": "SINAPI", "mes_referencia": "11/2025", "tipo_composicao": "Sem Desoneração"},
        {"fonte": "SEINFRA", "mes_referencia": "01/2026", "tipo_composicao": "Sem Desoneração"},
        {"fonte": "SINAPI", "mes_referencia": None, "tipo_composicao": "Sem Desoneração"},
    ]
    _mock_paginas(mock_supabase, [linhas])

    with patch("app.modules.importacao.routes.get_supabase_client", return_value=mock_supabase):
        response = client.get("/importacao/bases")

    assert response.status_code == 200
    assert response.json() == [
        {"fonte": "SEINFRA", "mes_referencia": "01/2026", "tipo_composicao": "Sem Desoneração", "total_composicoes": 1},
        {"fonte": "SINAPI", "mes_referencia": "12/2025", "tipo_composicao": "Com Desoneração", "total_composicoes": 2},
        {"fonte": "SINAPI", "mes_referencia": "11/2025", "tipo_composicao": "Sem Desoneração", "total_composicoes": 1},
    ]


@pytest.mark.integration
def test_listar_bases_disponiveis_pagina_alem_de_mil_linhas(client: TestClient, mock_supabase):
    """Mais de 1000 linhas: continua lendo páginas até a última, sem perder grupos."""
    pagina1 = [{"fonte": "SINAPI", "mes_referencia": "12/2025", "tipo_composicao": "Sem Desoneração"}] * 1000
    pagina2 = [{"fonte": "SEINFRA", "mes_referencia": "10/2025", "tipo_composicao": "Sem Desoneração"}] * 5
    chain = _mock_paginas(mock_supabase, [pagina1, pagina2])

    with patch("app.modules.importacao.routes.get_supabase_client", return_value=mock_supabase):
        response = client.get("/importacao/bases")

    assert response.status_code == 200
    totais = {(b["fonte"], b["mes_referencia"]): b["total_composicoes"] for b in response.json()}
    assert totais == {("SINAPI", "12/2025"): 1000, ("SEINFRA", "10/2025"): 5}
    assert chain.range.call_args_list[0].args == (0, 999)
    assert chain.range.call_args_list[1].args == (1000, 1999)


@pytest.mark.integration
def test_listar_bases_exige_autenticacao(mock_supabase):
    """Sem usuário autenticado o endpoint responde 401."""
    from fastapi.testclient import TestClient as TC

    from app.main import app

    app.dependency_overrides.clear()
    response = TC(app).get("/importacao/bases")
    assert response.status_code in (401, 403)
