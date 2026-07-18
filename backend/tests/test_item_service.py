"""
Unit tests for ItemService — buscar_composicao, listar_composicoes,
listar_estados_composicao.

Todos os repositórios são mockados via fixtures do conftest.py.
"""
import pytest
from unittest.mock import MagicMock


# ---------------------------------------------------------------------------
# buscar_composicao
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_buscar_composicao_por_codigo_com_percentual(item_service_mock, item_repo_mock):
    """Termo com '%' → chama buscar_por_codigo."""
    # Arrange
    esperado = [{"codigo_composicao": "9999", "descricao": "Serviço X"}]
    item_repo_mock.buscar_por_codigo.return_value = esperado

    # Act
    resultado = item_service_mock.buscar_composicao("9999%", fonte="SINAPI")

    # Assert
    assert resultado == esperado
    item_repo_mock.buscar_por_codigo.assert_called_once_with("9999%", fonte="SINAPI")
    item_repo_mock.buscar_por_descricao.assert_not_called()


@pytest.mark.unit
def test_buscar_composicao_por_codigo_numerico(item_service_mock, item_repo_mock):
    """Termo composto só de dígitos → chama buscar_por_codigo."""
    # Arrange
    esperado = [{"codigo_composicao": "1234", "descricao": "Concreto"}]
    item_repo_mock.buscar_por_codigo.return_value = esperado

    # Act
    resultado = item_service_mock.buscar_composicao("1234", fonte="SINAPI")

    # Assert
    assert resultado == esperado
    item_repo_mock.buscar_por_codigo.assert_called_once_with("1234", fonte="SINAPI")
    item_repo_mock.buscar_por_descricao.assert_not_called()


@pytest.mark.unit
def test_buscar_composicao_por_descricao(item_service_mock, item_repo_mock):
    """Texto livre sem '%' nem somente dígitos → chama buscar_por_descricao."""
    # Arrange
    esperado = [{"codigo_composicao": "5555", "descricao": "Alvenaria"}]
    item_repo_mock.buscar_por_descricao.return_value = esperado

    # Act
    resultado = item_service_mock.buscar_composicao("Alvenaria de tijolo", fonte="SINAPI")

    # Assert
    assert resultado == esperado
    item_repo_mock.buscar_por_descricao.assert_called_once_with("Alvenaria de tijolo", fonte="SINAPI")
    item_repo_mock.buscar_por_codigo.assert_not_called()


# ---------------------------------------------------------------------------
# listar_composicoes
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_listar_composicoes_chama_repository_com_limit(item_service_mock, item_repo_mock):
    """listar_composicoes chama repository.listar(limit=100)."""
    # Arrange
    esperado = [{"codigo_composicao": "100"}, {"codigo_composicao": "101"}]
    item_repo_mock.listar.return_value = esperado

    # Act
    resultado = item_service_mock.listar_composicoes()

    # Assert
    assert resultado == esperado
    item_repo_mock.listar.assert_called_once_with(limit=100)


@pytest.mark.unit
def test_listar_composicoes_retorna_lista_vazia(item_service_mock, item_repo_mock):
    """listar_composicoes quando repository retorna [] → repassa []."""
    # Arrange
    item_repo_mock.listar.return_value = []

    # Act
    resultado = item_service_mock.listar_composicoes()

    # Assert
    assert resultado == []


# ---------------------------------------------------------------------------
# listar_estados_composicao
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_listar_estados_composicao_delega_ao_repository(item_service_mock, item_repo_mock):
    """listar_estados_composicao repassa parâmetros corretamente ao repository."""
    # Arrange
    esperado = [{"estado": "sp", "preco": 150.0}]
    item_repo_mock.listar_estados_por_item.return_value = esperado

    # Act
    resultado = item_service_mock.listar_estados_composicao("9999", "12/2025", fonte="SINAPI")

    # Assert
    assert resultado == esperado
    item_repo_mock.listar_estados_por_item.assert_called_once_with(
        "9999", "12/2025", fonte="SINAPI"
    )
