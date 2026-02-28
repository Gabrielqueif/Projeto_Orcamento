import pytest
from unittest.mock import MagicMock
from app.services.orcamento_item_service import OrcamentoItemService
from schemas.schemas import OrcamentoItemCreate, OrcamentoItemUpdate

@pytest.fixture
def item_repo_mock():
    return MagicMock()

@pytest.fixture
def orcamento_repo_mock():
    return MagicMock()

@pytest.fixture
def orcamento_item_repo_mock():
    return MagicMock()

@pytest.fixture
def service(orcamento_item_repo_mock, orcamento_repo_mock, item_repo_mock):
    return OrcamentoItemService(orcamento_item_repo_mock, orcamento_repo_mock, item_repo_mock)

def test_adicionar_item_sucesso(service, orcamento_repo_mock, item_repo_mock, orcamento_item_repo_mock):
    # Setup
    orcamento_id = "orc1"
    item_create = OrcamentoItemCreate(
        codigo_composicao="12345",
        quantidade=2.0,
        etapa_id="etapa1",
        descricao="Tijolo",
        unidade="un"
    )
    
    # Mock Orcamento
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": orcamento_id, 
        "estado": "SP", 
        "base_referencia": "SINAPI", 
        "tipo_composicao": "PRECO_MEDIO",
        "bdi": 0.0
    }
    
    # Mock Composição (ItemRepository)
    item_repo_mock.buscar_por_codigo.return_value = [{"codigo_composicao": "12345", "descricao": "Tijolo", "unidade": "un"}]
    item_repo_mock.buscar_preco.return_value = 10.0 # Preço 10.0
    
    # Mock Criação
    retorno_criacao = {
        "id": "item1", 
        "preco_unitario": 10.0, 
        "preco_total": 20.0, 
        "quantidade": 2.0
    }
    orcamento_item_repo_mock.criar.return_value = retorno_criacao
    
    # Mock Totalização
    orcamento_item_repo_mock.calcular_total_itens.return_value = 20.0

    # Execução
    resultado = service.adicionar_item(orcamento_id, item_create)

    # Verificações
    assert resultado == retorno_criacao
    orcamento_item_repo_mock.criar.assert_called_once()
    
    args, _ = orcamento_item_repo_mock.criar.call_args
    dados_passados = args[0]
    assert dados_passados["preco_unitario"] == 10.0
    assert dados_passados["preco_total"] == 20.0
    assert dados_passados["descricao"] == "Tijolo" # Pegou do cadastro
    
    # Verifica atualização do orçamento pai
    orcamento_repo_mock.atualizar.assert_called_once()
    args_update, _ = orcamento_repo_mock.atualizar.call_args
    assert args_update[1]["valor_total"] == 20.0

def test_adicionar_item_preco_nao_encontrado(service, orcamento_repo_mock, item_repo_mock):
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": "orc1", 
        "estado": "SP", 
        "base_referencia": "SINAPI", 
        "tipo_composicao": "PRECO_MEDIO"
    }
    item_repo_mock.buscar_por_codigo.return_value = [{"codigo_composicao": "12345"}]
    item_repo_mock.buscar_preco.return_value = None # Não encontrou

    item_create = OrcamentoItemCreate(codigo_composicao="12345", quantidade=1.0, descricao="Teste", unidade="un")

    with pytest.raises(ValueError, match="Preço não encontrado"):
        service.adicionar_item("orc1", item_create)

def test_atualizar_item_quantidade(service, orcamento_item_repo_mock, orcamento_repo_mock):
    # Setup
    orcamento_id = "orc1"
    item_id = "item1"
    
    # Item atual tem preço 10.0
    orcamento_item_repo_mock.buscar_por_id.return_value = {"id": item_id, "preco_unitario": 10.0, "quantidade": 1.0, "estado": "sp"}
    
    # Mock Orcamento pai para quando o serviço buscar base/tipo
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": orcamento_id, 
        "base_referencia": "SINAPI", 
        "tipo_composicao": "PRECO_MEDIO"
    }
    
    update = OrcamentoItemUpdate(quantidade=5.0) # Novo total deve ser 50.0

    orcamento_item_repo_mock.atualizar.return_value = {"id": item_id, "quantidade": 5.0, "preco_total": 50.0}
    orcamento_item_repo_mock.calcular_total_itens.return_value = 50.0

    # Execução
    resultado = service.atualizar_item(orcamento_id, item_id, update)

    # Verificações
    assert resultado["preco_total"] == 50.0
    
    args, _ = orcamento_item_repo_mock.atualizar.call_args
    assert args[1]["quantidade"] == 5.0
    assert args[1]["preco_total"] == 50.0
    
    orcamento_repo_mock.atualizar.assert_called_once() # Atualiza total do orçamento pai

def test_remover_item(service, orcamento_item_repo_mock, orcamento_repo_mock):
    # Setup
    orcamento_item_repo_mock.buscar_por_id.return_value = {"id": "item1"}
    orcamento_item_repo_mock.calcular_total_itens.return_value = 0.0

    # Execução
    service.remover_item("orc1", "item1")

    # Verificações
    orcamento_item_repo_mock.deletar.assert_called_once_with("item1")
    orcamento_repo_mock.atualizar.assert_called_once()
