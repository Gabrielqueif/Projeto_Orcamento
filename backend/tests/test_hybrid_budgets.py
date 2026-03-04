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

def test_adicionar_item_fonte_diferente_do_orcamento(service, orcamento_repo_mock, item_repo_mock, orcamento_item_repo_mock):
    """Testa a adição de um item SEINFRA em um orçamento cuja base principal é SINAPI."""
    # Setup
    orcamento_id = "orc_hibrido"
    item_create = OrcamentoItemCreate(
        codigo_composicao="I1234",
        quantidade=10.0,
        descricao="Cimento SEINFRA",
        unidade="kg",
        fonte="SEINFRA" # Fonte explícita diferente da do orçamento
    )
    
    # Mock Orcamento (Base Principal SINAPI)
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": orcamento_id, 
        "estado": "CE", 
        "base_referencia": "05/2023", 
        "tipo_composicao": "PRECO_MEDIO",
        "fonte": "SINAPI", # Base Principal
        "bdi": 0.0
    }
    
    # Mock Composição SEINFRA (ItemRepository)
    # Deve buscar com fonte="SEINFRA"
    item_repo_mock.buscar_por_codigo.return_value = [{"codigo_composicao": "I1234", "descricao": "Cimento SEINFRA", "unidade": "kg", "fonte": "SEINFRA"}]
    item_repo_mock.buscar_preco.return_value = 5.0 
    
    # Mock Criação
    retorno_criacao = {"id": "item1", "fonte": "SEINFRA", "preco_unitario": 5.0, "preco_total": 50.0}
    orcamento_item_repo_mock.criar.return_value = retorno_criacao
    orcamento_item_repo_mock.calcular_total_itens.return_value = 50.0

    # Execução
    resultado = service.adicionar_item(orcamento_id, item_create)

    # Verificações
    assert resultado["fonte"] == "SEINFRA"
    
    # Verifica se buscou no repositório com a fonte SEINFRA, não com a do orçamento
    item_repo_mock.buscar_por_codigo.assert_called_with("I1234", fonte="SEINFRA")
    item_repo_mock.buscar_preco.assert_called_with("I1234", "CE", "05/2023", "PRECO_MEDIO", "SEINFRA")

def test_adicionar_item_fallback_para_fonte_do_orcamento(service, orcamento_repo_mock, item_repo_mock, orcamento_item_repo_mock):
    """Testa se o item herda a fonte do orçamento quando não especificada."""
    # Setup
    orcamento_id = "orc_normal"
    item_create = OrcamentoItemCreate(
        codigo_composicao="88248",
        quantidade=1.0,
        descricao="Item SINAPI",
        unidade="h",
        fonte=None # Não especificado
    )
    
    # Mock Orcamento
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": orcamento_id, 
        "estado": "CE", 
        "base_referencia": "05/2023", 
        "tipo_composicao": "PRECO_MEDIO",
        "fonte": "SINAPI"
    }
    
    item_repo_mock.buscar_por_codigo.return_value = [{"codigo_composicao": "88248", "fonte": "SINAPI"}]
    item_repo_mock.buscar_preco.return_value = 20.0 
    orcamento_item_repo_mock.criar.return_value = {"id": "item1", "fonte": "SINAPI"}
    orcamento_item_repo_mock.calcular_total_itens.return_value = 20.0

    # Execução
    service.adicionar_item(orcamento_id, item_create)

    # Verificações
    # Deve ter usado a fonte do orçamento (SINAPI)
    item_repo_mock.buscar_por_codigo.assert_called_with("88248", fonte="SINAPI")

def test_atualizar_item_trocando_fonte(service, orcamento_repo_mock, item_repo_mock, orcamento_item_repo_mock):
    """Testa a troca de fonte de um item existente (SINAPI -> SEINFRA)."""
    # Setup
    orcamento_id = "orc1"
    item_id = "item1"
    
    # Item atual era SINAPI
    orcamento_item_repo_mock.buscar_por_id.return_value = {
        "id": item_id, 
        "codigo_composicao": "OLD", 
        "fonte": "SINAPI", 
        "quantidade": 1.0, 
        "estado": "ce"
    }
    
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": orcamento_id, 
        "base_referencia": "05/2023", 
        "tipo_composicao": "PRECO_MEDIO"
    }
    
    # Update para SEINFRA
    update = OrcamentoItemUpdate(fonte="SEINFRA", codigo_composicao="I_NEW")
    
    item_repo_mock.buscar_preco.return_value = 100.0
    orcamento_item_repo_mock.atualizar.return_value = {"id": item_id, "fonte": "SEINFRA", "preco_unitario": 100.0}

    # Execução
    service.atualizar_item(orcamento_id, item_id, update)

    # Verificações
    item_repo_mock.buscar_preco.assert_called_with("I_NEW", "ce", "05/2023", "PRECO_MEDIO", "SEINFRA")
