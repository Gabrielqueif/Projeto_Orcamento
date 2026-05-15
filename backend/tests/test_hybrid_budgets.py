"""
Tests for hybrid budgets — items with a different source (font) than the
parent orcamento's base reference.

Fixtures provided by conftest.py:
  orcamento_repo_mock, item_repo_mock, orcamento_item_repo_mock,
  orcamento_item_service
"""
import pytest
from schemas.schemas import OrcamentoItemCreate, OrcamentoItemUpdate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _sinapi_orcamento(orcamento_id: str = "orc_normal") -> dict:
    return {
        "id": orcamento_id,
        "estado": "CE",
        "base_referencia": "05/2023",
        "tipo_composicao": "PRECO_MEDIO",
        "fonte": "SINAPI",
        "bdi": 0.0,
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_adicionar_item_fonte_diferente_do_orcamento(
    orcamento_item_service,
    orcamento_repo_mock,
    item_repo_mock,
    orcamento_item_repo_mock,
):
    """Item SEINFRA adicionado em orçamento cuja base principal é SINAPI."""
    orcamento_id = "orc_hibrido"
    item_create = OrcamentoItemCreate(
        codigo_composicao="I1234",
        quantidade=10.0,
        descricao="Cimento SEINFRA",
        unidade="kg",
        fonte="SEINFRA",  # explicitamente diferente da base do orçamento
    )

    orcamento_repo_mock.buscar_por_id.return_value = _sinapi_orcamento(orcamento_id)

    item_repo_mock.buscar_por_codigo.return_value = [
        {
            "codigo_composicao": "I1234",
            "descricao": "Cimento SEINFRA",
            "unidade": "kg",
            "fonte": "SEINFRA",
        }
    ]
    item_repo_mock.buscar_preco.return_value = 5.0

    retorno_criacao = {"id": "item1", "fonte": "SEINFRA", "preco_unitario": 5.0, "preco_total": 50.0}
    orcamento_item_repo_mock.criar.return_value = retorno_criacao
    orcamento_item_repo_mock.calcular_total_itens.return_value = 50.0

    resultado = orcamento_item_service.adicionar_item(orcamento_id, item_create)

    assert resultado["fonte"] == "SEINFRA"
    item_repo_mock.buscar_por_codigo.assert_called_with("I1234", fonte="SEINFRA")
    item_repo_mock.buscar_preco.assert_called_with("I1234", "CE", "05/2023", "PRECO_MEDIO", "SEINFRA")


@pytest.mark.unit
def test_adicionar_item_fallback_para_fonte_do_orcamento(
    orcamento_item_service,
    orcamento_repo_mock,
    item_repo_mock,
    orcamento_item_repo_mock,
):
    """Item sem fonte explícita herda a fonte do orçamento pai."""
    orcamento_id = "orc_normal"
    item_create = OrcamentoItemCreate(
        codigo_composicao="88248",
        quantidade=1.0,
        descricao="Item SINAPI",
        unidade="h",
        fonte=None,  # não especificado → deve herdar SINAPI do orçamento
    )

    orcamento_repo_mock.buscar_por_id.return_value = _sinapi_orcamento(orcamento_id)

    item_repo_mock.buscar_por_codigo.return_value = [
        {"codigo_composicao": "88248", "fonte": "SINAPI"}
    ]
    item_repo_mock.buscar_preco.return_value = 20.0
    orcamento_item_repo_mock.criar.return_value = {"id": "item1", "fonte": "SINAPI"}
    orcamento_item_repo_mock.calcular_total_itens.return_value = 20.0

    orcamento_item_service.adicionar_item(orcamento_id, item_create)

    item_repo_mock.buscar_por_codigo.assert_called_with("88248", fonte="SINAPI")


@pytest.mark.unit
def test_atualizar_item_trocando_fonte(
    orcamento_item_service,
    orcamento_repo_mock,
    item_repo_mock,
    orcamento_item_repo_mock,
):
    """Troca de fonte de um item existente: SINAPI → SEINFRA."""
    orcamento_id = "orc1"
    item_id = "item1"

    orcamento_item_repo_mock.buscar_por_id.return_value = {
        "id": item_id,
        "codigo_composicao": "OLD",
        "fonte": "SINAPI",
        "quantidade": 1.0,
        "estado": "ce",
    }
    orcamento_repo_mock.buscar_por_id.return_value = {
        "id": orcamento_id,
        "base_referencia": "05/2023",
        "tipo_composicao": "PRECO_MEDIO",
    }

    update = OrcamentoItemUpdate(fonte="SEINFRA", codigo_composicao="I_NEW")
    item_repo_mock.buscar_preco.return_value = 100.0
    orcamento_item_repo_mock.atualizar.return_value = {
        "id": item_id,
        "fonte": "SEINFRA",
        "preco_unitario": 100.0,
    }

    orcamento_item_service.atualizar_item(orcamento_id, item_id, update)

    item_repo_mock.buscar_preco.assert_called_with(
        "I_NEW", "ce", "05/2023", "PRECO_MEDIO", "SEINFRA"
    )
