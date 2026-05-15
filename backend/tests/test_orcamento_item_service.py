"""
Tests for OrcamentoItemService.

Fixtures (mock_supabase, orcamento_repo_mock, item_repo_mock,
orcamento_item_repo_mock, orcamento_item_service) are provided by conftest.py.
"""
import pytest
from schemas.schemas import OrcamentoItemCreate, OrcamentoItemUpdate


# ---------------------------------------------------------------------------
# Helper: default orcamento stub
# ---------------------------------------------------------------------------
def _make_orcamento(orcamento_id: str = "orc1", estado: str = "SP") -> dict:
    return {
        "id": orcamento_id,
        "estado": estado,
        "base_referencia": "SINAPI",
        "tipo_composicao": "PRECO_MEDIO",
        "bdi": 0.0,
    }


# ---------------------------------------------------------------------------
# adicionar_item
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_adicionar_item_sucesso(
    orcamento_item_service,
    orcamento_repo_mock,
    item_repo_mock,
    orcamento_item_repo_mock,
):
    orcamento_id = "orc1"
    item_create = OrcamentoItemCreate(
        codigo_composicao="12345",
        quantidade=2.0,
        etapa_id="etapa1",
        descricao="Tijolo",
        unidade="un",
    )

    orcamento_repo_mock.buscar_por_id.return_value = _make_orcamento(orcamento_id)
    item_repo_mock.buscar_por_codigo.return_value = [
        {"codigo_composicao": "12345", "descricao": "Tijolo", "unidade": "un"}
    ]
    item_repo_mock.buscar_preco.return_value = 10.0

    retorno_criacao = {
        "id": "item1",
        "preco_unitario": 10.0,
        "preco_total": 20.0,
        "quantidade": 2.0,
    }
    orcamento_item_repo_mock.criar.return_value = retorno_criacao
    orcamento_item_repo_mock.calcular_total_itens.return_value = 20.0

    resultado = orcamento_item_service.adicionar_item(orcamento_id, item_create)

    assert resultado == retorno_criacao
    orcamento_item_repo_mock.criar.assert_called_once()

    args, _ = orcamento_item_repo_mock.criar.call_args
    dados = args[0]
    assert dados["preco_unitario"] == 10.0
    assert dados["preco_total"] == 20.0
    assert dados["descricao"] == "Tijolo"

    # Deve atualizar o valor_total do orçamento pai
    orcamento_repo_mock.atualizar.assert_called_once()
    args_upd, _ = orcamento_repo_mock.atualizar.call_args
    assert args_upd[1]["valor_total"] == 20.0


@pytest.mark.unit
def test_adicionar_item_preco_nao_encontrado(
    orcamento_item_service,
    orcamento_repo_mock,
    item_repo_mock,
):
    orcamento_repo_mock.buscar_por_id.return_value = _make_orcamento()
    item_repo_mock.buscar_por_codigo.return_value = [{"codigo_composicao": "12345"}]
    item_repo_mock.buscar_preco.return_value = None  # sem preço

    item_create = OrcamentoItemCreate(
        codigo_composicao="12345",
        quantidade=1.0,
        descricao="Teste",
        unidade="un",
    )

    with pytest.raises(ValueError, match="Preço não encontrado"):
        orcamento_item_service.adicionar_item("orc1", item_create)


# ---------------------------------------------------------------------------
# atualizar_item
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_atualizar_item_quantidade(
    orcamento_item_service,
    orcamento_item_repo_mock,
    orcamento_repo_mock,
):
    orcamento_id = "orc1"
    item_id = "item1"

    orcamento_item_repo_mock.buscar_por_id.return_value = {
        "id": item_id,
        "preco_unitario": 10.0,
        "quantidade": 1.0,
        "estado": "sp",
    }
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": orcamento_id,
        "base_referencia": "SINAPI",
        "tipo_composicao": "PRECO_MEDIO",
    }

    update = OrcamentoItemUpdate(quantidade=5.0)
    orcamento_item_repo_mock.atualizar.return_value = {
        "id": item_id,
        "quantidade": 5.0,
        "preco_total": 50.0,
    }
    orcamento_item_repo_mock.calcular_total_itens.return_value = 50.0

    resultado = orcamento_item_service.atualizar_item(orcamento_id, item_id, update)

    assert resultado["preco_total"] == 50.0

    args, _ = orcamento_item_repo_mock.atualizar.call_args
    assert args[1]["quantidade"] == 5.0
    assert args[1]["preco_total"] == 50.0

    orcamento_repo_mock.atualizar.assert_called_once()


# ---------------------------------------------------------------------------
# remover_item
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_remover_item(
    orcamento_item_service,
    orcamento_item_repo_mock,
    orcamento_repo_mock,
):
    orcamento_item_repo_mock.buscar_por_id.return_value = {"id": "item1"}
    orcamento_item_repo_mock.calcular_total_itens.return_value = 0.0

    orcamento_item_service.remover_item("orc1", "item1")

    orcamento_item_repo_mock.deletar.assert_called_once_with("item1")
    orcamento_repo_mock.atualizar.assert_called_once()
