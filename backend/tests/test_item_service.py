"""
Unit tests for ItemService — buscar_composicao, listar_composicoes,
listar_estados_composicao.

Todos os repositórios são mockados via fixtures do conftest.py.
"""

import pytest

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
    """Termo numérico → busca por código (começa com o termo) antes da descrição."""
    esperado = [{"codigo_composicao": "1234", "descricao": "Concreto"}]
    item_repo_mock.buscar_por_codigo_parcial.return_value = esperado

    resultado = item_service_mock.buscar_composicao("1234", fonte="SINAPI")

    assert resultado == esperado
    item_repo_mock.buscar_por_codigo_parcial.assert_called_once_with("1234", fonte="SINAPI")
    item_repo_mock.buscar_por_descricao.assert_not_called()


@pytest.mark.unit
def test_buscar_composicao_por_codigo_alfanumerico_seinfra(item_service_mock, item_repo_mock):
    """Código SEINFRA (letra + dígitos) é reconhecido como código."""
    esperado = [{"codigo_composicao": "C0001", "descricao": "Abrigo"}]
    item_repo_mock.buscar_por_codigo_parcial.return_value = esperado

    resultado = item_service_mock.buscar_composicao("C0001", fonte="SEINFRA")

    assert resultado == esperado
    item_repo_mock.buscar_por_codigo_parcial.assert_called_once_with("C0001", fonte="SEINFRA")
    item_repo_mock.buscar_por_descricao.assert_not_called()


@pytest.mark.unit
def test_buscar_composicao_codigo_sem_resultado_cai_para_descricao(item_service_mock, item_repo_mock):
    """Termo com cara de código mas sem correspondência → tenta a descrição."""
    item_repo_mock.buscar_por_codigo_parcial.return_value = []
    esperado = [{"codigo_composicao": "C4308", "descricao": "Serviço 0001"}]
    item_repo_mock.buscar_por_descricao.return_value = esperado

    resultado = item_service_mock.buscar_composicao("0001", fonte="SEINFRA")

    assert resultado == esperado
    item_repo_mock.buscar_por_descricao.assert_called_once_with("0001", fonte="SEINFRA")


@pytest.mark.unit
@pytest.mark.parametrize(
    ("termo", "esperado"),
    [
        ("C0001", True),
        ("100063", True),
        ("c00", True),
        ("1.2-3", True),
        ("cimento", False),
        ("alvenaria de tijolo", False),
        ("C 0001", False),
        ("", False),
        ("a" * 40 + "1", False),
    ],
)
def test_parece_codigo(termo, esperado):
    from app.modules.composicao.repositories import parece_codigo

    assert parece_codigo(termo) is esperado


@pytest.mark.unit
def test_buscar_insumo_delega_ao_repositorio(item_service_mock, item_repo_mock):
    """A rota de insumos depende deste método do serviço."""
    item_repo_mock.buscar_insumos.return_value = [{"codigo_insumo": "I0004"}]

    resultado = item_service_mock.buscar_insumo("I00", fonte="SEINFRA", tipo="Sem Desoneração")

    assert resultado == [{"codigo_insumo": "I0004"}]
    item_repo_mock.buscar_insumos.assert_called_once_with("I00", fonte="SEINFRA", tipo="Sem Desoneração")


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
