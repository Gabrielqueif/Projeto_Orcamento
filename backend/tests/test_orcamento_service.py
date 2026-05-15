"""
Unit tests for OrcamentoService.
All external dependencies (repository) are mocked.
"""
import pytest
from unittest.mock import MagicMock
from datetime import datetime
from app.services.orcamento_service import OrcamentoService
from schemas.schemas import OrcamentoCreate, OrcamentoUpdate


@pytest.fixture
def repository_mock():
    return MagicMock()


@pytest.fixture
def orcamento_service(repository_mock):
    return OrcamentoService(repository_mock)


@pytest.mark.unit
def test_criar_orcamento_sucesso(orcamento_service, repository_mock):
    dados_entrada = OrcamentoCreate(
        nome="Teste Orçamento",
        cliente="Cliente Teste",
        data=datetime.now().date(),
        base_referencia="SINAPI",
        tipo_composicao="PRECO_MEDIO",
        estado="SP",
        bdi=0.0,
        status="em_elaboracao",
    )

    retorno_esperado = {
        "id": "123",
        "nome": "Teste Orçamento",
        "cliente": "Cliente Teste",
        "valor_total": 0.0,
    }
    repository_mock.criar.return_value = retorno_esperado

    resultado = orcamento_service.criar_orcamento(dados_entrada)

    assert resultado == retorno_esperado
    repository_mock.criar.assert_called_once()

    args, _ = repository_mock.criar.call_args
    dados_passados = args[0]
    assert dados_passados["nome"] == "Teste Orçamento"
    assert dados_passados["estado"] == "sp"  # normalizado para lower case
    assert dados_passados["valor_total"] == 0.0


@pytest.mark.unit
def test_listar_orcamentos(orcamento_service, repository_mock):
    retorno_esperado = [{"id": "1", "nome": "Orc 1"}, {"id": "2", "nome": "Orc 2"}]
    repository_mock.listar.return_value = retorno_esperado

    resultado = orcamento_service.listar_orcamentos(status="ativo", cliente="João")

    assert resultado == retorno_esperado
    repository_mock.listar.assert_called_once_with("ativo", "João")


@pytest.mark.unit
def test_buscar_orcamento_sucesso(orcamento_service, repository_mock):
    retorno_esperado = {"id": "1", "nome": "Orc 1"}
    repository_mock.buscar_por_id.return_value = retorno_esperado

    resultado = orcamento_service.buscar_orcamento("1")

    assert resultado == retorno_esperado
    repository_mock.buscar_por_id.assert_called_once_with("1")


@pytest.mark.unit
def test_buscar_orcamento_nao_encontrado(orcamento_service, repository_mock):
    repository_mock.buscar_por_id.return_value = None

    with pytest.raises(ValueError, match="Orçamento não encontrado"):
        orcamento_service.buscar_orcamento("999")


@pytest.mark.unit
def test_atualizar_orcamento_sucesso(orcamento_service, repository_mock):
    repository_mock.buscar_por_id.return_value = {
        "id": "1",
        "nome": "Antigo",
        "status": "em_elaboracao",
    }
    repository_mock.atualizar.return_value = {"id": "1", "nome": "Novo"}

    update_data = OrcamentoUpdate(nome="Novo")

    resultado = orcamento_service.atualizar_orcamento("1", update_data)

    assert resultado["nome"] == "Novo"
    repository_mock.atualizar.assert_called_once()

    args, _ = repository_mock.atualizar.call_args
    assert "updated_at" in args[1]
    assert args[1]["nome"] == "Novo"


@pytest.mark.unit
def test_deletar_orcamento_sucesso(orcamento_service, repository_mock):
    repository_mock.buscar_por_id.return_value = {"id": "1"}
    repository_mock.deletar.return_value = True

    resultado = orcamento_service.deletar_orcamento("1")

    assert resultado is True
    repository_mock.deletar.assert_called_once_with("1")
