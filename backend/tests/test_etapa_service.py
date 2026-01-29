import pytest
from unittest.mock import MagicMock
from app.services.etapa_service import EtapaService
from schemas.schemas import EtapaCreate

@pytest.fixture
def repository_mock():
    return MagicMock()

@pytest.fixture
def etapa_service(repository_mock):
    return EtapaService(repository_mock)

def test_criar_etapa_sucesso(etapa_service, repository_mock):
    # Setup
    etapa_input = EtapaCreate(nome="Fundação", ordem=1)
    retorno_esperado = {"id": "1", "nome": "Fundação", "ordem": 1, "orcamento_id": "orc1"}
    repository_mock.criar.return_value = retorno_esperado

    # Execução
    resultado = etapa_service.criar_etapa("orc1", etapa_input)

    # Verificações
    assert resultado == retorno_esperado
    repository_mock.criar.assert_called_once()
    args, _ = repository_mock.criar.call_args
    assert args[0]["orcamento_id"] == "orc1"
    assert args[0]["nome"] == "Fundação"

def test_criar_etapa_erro(etapa_service, repository_mock):
    # Setup - Repositório retorna None (falha)
    repository_mock.criar.return_value = None
    etapa_input = EtapaCreate(nome="Fundação", ordem=1)

    # Execução
    with pytest.raises(Exception, match="Erro ao criar etapa"):
        etapa_service.criar_etapa("orc1", etapa_input)

def test_listar_etapas(etapa_service, repository_mock):
    # Setup
    retorno_esperado = [{"id": "1", "nome": "E1"}, {"id": "2", "nome": "E2"}]
    repository_mock.listar_por_orcamento.return_value = retorno_esperado

    # Execução
    resultado = etapa_service.listar_etapas("orc1")

    # Verificações
    assert resultado == retorno_esperado
    repository_mock.listar_por_orcamento.assert_called_once_with("orc1")

def test_deletar_etapa(etapa_service, repository_mock):
    # Execução
    resultado = etapa_service.deletar_etapa("etapa1", "orc1")

    # Verificações
    assert resultado["message"] == "Etapa deletada com sucesso"
    repository_mock.deletar.assert_called_once_with("etapa1", "orc1")
