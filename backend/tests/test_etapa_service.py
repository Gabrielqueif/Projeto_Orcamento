"""
Unit tests for EtapaService.
All external dependencies (repository) are mocked.
"""
import pytest
from unittest.mock import MagicMock
from app.services.etapa_service import EtapaService
from schemas import EtapaCreate


@pytest.fixture
def repository_mock():
    return MagicMock()


@pytest.fixture
def etapa_service(repository_mock):
    return EtapaService(repository_mock)


@pytest.mark.unit
def test_criar_etapa_sucesso(etapa_service, repository_mock):
    etapa_input = EtapaCreate(nome="Fundação", ordem=1)
    retorno_esperado = {"id": "1", "nome": "Fundação", "ordem": 1, "orcamento_id": "orc1"}
    repository_mock.criar.return_value = retorno_esperado

    resultado = etapa_service.criar_etapa("orc1", etapa_input)

    assert resultado == retorno_esperado
    repository_mock.criar.assert_called_once()
    args, _ = repository_mock.criar.call_args
    assert args[0]["orcamento_id"] == "orc1"
    assert args[0]["nome"] == "Fundação"


@pytest.mark.unit
def test_criar_etapa_erro(etapa_service, repository_mock):
    repository_mock.criar.return_value = None  # simula falha
    etapa_input = EtapaCreate(nome="Fundação", ordem=1)

    with pytest.raises(Exception, match="Erro ao criar etapa"):
        etapa_service.criar_etapa("orc1", etapa_input)


@pytest.mark.unit
def test_listar_etapas(etapa_service, repository_mock):
    retorno_esperado = [{"id": "1", "nome": "E1"}, {"id": "2", "nome": "E2"}]
    repository_mock.listar_por_orcamento.return_value = retorno_esperado

    resultado = etapa_service.listar_etapas("orc1")

    assert resultado == retorno_esperado
    repository_mock.listar_por_orcamento.assert_called_once_with("orc1")


@pytest.mark.unit
def test_deletar_etapa(etapa_service, repository_mock):
    resultado = etapa_service.deletar_etapa("etapa1", "orc1")

    assert resultado["message"] == "Etapa deletada com sucesso"
    repository_mock.deletar.assert_called_once_with("etapa1", "orc1")


# ---------------------------------------------------------------------------
# atualizar_etapa — cenários faltantes
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_atualizar_etapa_sucesso(etapa_service, repository_mock):
    """atualizar_etapa com dados válidos → retorna resultado do repository."""
    # Arrange
    retorno_esperado = {"id": "1", "nome": "Fundação Revisada", "ordem": 2}
    repository_mock.atualizar.return_value = retorno_esperado

    # Act
    resultado = etapa_service.atualizar_etapa("1", {"nome": "Fundação Revisada", "ordem": 2})

    # Assert
    assert resultado == retorno_esperado
    repository_mock.atualizar.assert_called_once_with("1", {"nome": "Fundação Revisada", "ordem": 2})


@pytest.mark.unit
def test_atualizar_etapa_falha_repositorio_retorna_none(etapa_service, repository_mock):
    """repository.atualizar retorna None → EtapaService lança Exception."""
    # Arrange
    repository_mock.atualizar.return_value = None

    # Act + Assert
    with pytest.raises(Exception, match="Erro ao atualizar etapa"):
        etapa_service.atualizar_etapa("1", {"nome": "X"})

