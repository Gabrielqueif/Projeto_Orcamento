import pytest
from unittest.mock import MagicMock
from datetime import datetime
from app.services.orcamento_service import OrcamentoService
from schemas.schemas import OrcamentoCreate, OrcamentoUpdate

# Fixture para o mock do repositório
@pytest.fixture
def repository_mock():
    return MagicMock()

# Fixture para o serviço instanciado com o mock
@pytest.fixture
def orcamento_service(repository_mock):
    return OrcamentoService(repository_mock)

def test_criar_orcamento_sucesso(orcamento_service, repository_mock):
    # Setup
    dados_entrada = OrcamentoCreate(
        nome="Teste Orçamento",
        cliente="Cliente Teste",
        data=datetime.now().date(),
        base_referencia="SINAPI",
        estado="SP",
        status="em_elaboracao"
    )
    
    # Mock do retorno do repositório
    retorno_esperado = {
        "id": "123",
        "nome": "Teste Orçamento",
        "cliente": "Cliente Teste",
        "valor_total": 0.0
    }
    repository_mock.criar.return_value = retorno_esperado

    # Execução
    resultado = orcamento_service.criar_orcamento(dados_entrada)

    # Verificações
    assert resultado == retorno_esperado
    repository_mock.criar.assert_called_once()
    
    # Verificar se os dados passados para o repositório estão corretos
    args, _ = repository_mock.criar.call_args
    dados_passados = args[0]
    assert dados_passados["nome"] == "Teste Orçamento"
    assert dados_passados["estado"] == "sp" # lower case
    assert dados_passados["valor_total"] == 0.0

def test_listar_orcamentos(orcamento_service, repository_mock):
    # Setup
    retorno_esperado = [{"id": "1", "nome": "Orc 1"}, {"id": "2", "nome": "Orc 2"}]
    repository_mock.listar.return_value = retorno_esperado

    # Execução
    resultado = orcamento_service.listar_orcamentos(status="ativo", cliente="João")

    # Verificações
    assert resultado == retorno_esperado
    repository_mock.listar.assert_called_once_with("ativo", "João")

def test_buscar_orcamento_sucesso(orcamento_service, repository_mock):
    # Setup
    retorno_esperado = {"id": "1", "nome": "Orc 1"}
    repository_mock.buscar_por_id.return_value = retorno_esperado

    # Execução
    resultado = orcamento_service.buscar_orcamento("1")

    # Verificações
    assert resultado == retorno_esperado
    repository_mock.buscar_por_id.assert_called_once_with("1")

def test_buscar_orcamento_nao_encontrado(orcamento_service, repository_mock):
    # Setup
    repository_mock.buscar_por_id.return_value = None

    # Execução e Verificação de Exceção
    with pytest.raises(ValueError, match="Orçamento não encontrado"):
        orcamento_service.buscar_orcamento("999")

def test_atualizar_orcamento_sucesso(orcamento_service, repository_mock):
    # Setup
    repository_mock.buscar_por_id.return_value = {"id": "1", "nome": "Antigo"}
    repository_mock.atualizar.return_value = {"id": "1", "nome": "Novo"}
    
    update_data = OrcamentoUpdate(nome="Novo")

    # Execução
    resultado = orcamento_service.atualizar_orcamento("1", update_data)

    # Verificações
    assert resultado["nome"] == "Novo"
    repository_mock.atualizar.assert_called_once()
    
    # Verificar se updated_at foi adicionado
    args, _ = repository_mock.atualizar.call_args
    assert "updated_at" in args[1]
    assert args[1]["nome"] == "Novo"

def test_deletar_orcamento_sucesso(orcamento_service, repository_mock):
    # Setup
    repository_mock.buscar_por_id.return_value = {"id": "1"}
    repository_mock.deletar.return_value = True

    # Execução
    resultado = orcamento_service.deletar_orcamento("1")

    # Verificações
    assert resultado is True
    repository_mock.deletar.assert_called_once_with("1")
