"""
Unit tests for OrcamentoItemService — métodos de insumo:
  - listar_insumos
  - atualizar_insumo
  - _explodir_insumos

Todos os repositórios são mockados via conftest.py.
"""
import pytest
from unittest.mock import MagicMock, call


# ---------------------------------------------------------------------------
# listar_insumos
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_listar_insumos_sucesso(
    orcamento_item_service_com_insumo,
    orcamento_item_repo_mock,
    insumo_repo_mock,
):
    """Item existe → delega a chamada ao insumo_repository."""
    # Arrange
    item_existente = {"id": "item-1", "orcamento_id": "orc-1"}
    insumos_esperados = [{"id": "ins-1", "codigo_insumo": "101"}]
    orcamento_item_repo_mock.buscar_por_id.return_value = item_existente
    insumo_repo_mock.listar_por_item.return_value = insumos_esperados

    # Act
    resultado = orcamento_item_service_com_insumo.listar_insumos("orc-1", "item-1")

    # Assert
    assert resultado == insumos_esperados
    orcamento_item_repo_mock.buscar_por_id.assert_called_once_with("item-1", "orc-1")
    insumo_repo_mock.listar_por_item.assert_called_once_with("item-1")


@pytest.mark.unit
def test_listar_insumos_item_nao_encontrado(
    orcamento_item_service_com_insumo,
    orcamento_item_repo_mock,
):
    """buscar_por_id retorna None → levanta ValueError."""
    # Arrange
    orcamento_item_repo_mock.buscar_por_id.return_value = None

    # Act + Assert
    with pytest.raises(ValueError, match="Item não encontrado"):
        orcamento_item_service_com_insumo.listar_insumos("orc-1", "item-inexistente")


@pytest.mark.unit
def test_listar_insumos_sem_repo_retorna_lista_vazia(
    orcamento_item_repo_mock, orcamento_repo_mock, item_repo_mock
):
    """Quando insumo_repository=None, retorna [] sem chamar nada."""
    from app.modules.orcamento.services import OrcamentoItemService

    # Arrange
    service = OrcamentoItemService(
        orcamento_item_repo_mock,
        orcamento_repo_mock,
        item_repo_mock,
        insumo_repository=None,
    )
    orcamento_item_repo_mock.buscar_por_id.return_value = {"id": "item-1"}

    # Act
    resultado = service.listar_insumos("orc-1", "item-1")

    # Assert
    assert resultado == []


# ---------------------------------------------------------------------------
# atualizar_insumo
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_atualizar_insumo_sucesso(
    orcamento_item_service_com_insumo,
    orcamento_item_repo_mock,
    orcamento_repo_mock,
    insumo_repo_mock,
):
    """Atualiza insumo e recalcula totais do item pai e do orçamento."""
    # Arrange
    insumo_atual = {
        "id": "ins-1",
        "quantidade_unitaria": 2.0,
        "preco_unitario_base": 10.0,
        "preco_unitario_custom": None,
        "total": 20.0,
    }
    insumo_atualizado = {
        "id": "ins-1",
        "quantidade_unitaria": 3.0,
        "preco_unitario_custom": None,
        "total": 30.0,
    }
    item_pai = {"id": "item-1", "quantidade": 1.0}
    orcamento = {"id": "orc-1", "bdi": 0.0}

    insumo_repo_mock.buscar_por_id.return_value = insumo_atual
    insumo_repo_mock.atualizar.return_value = insumo_atualizado
    insumo_repo_mock.listar_por_item.return_value = [{"total": 30.0}]
    orcamento_item_repo_mock.buscar_por_id.return_value = item_pai
    orcamento_item_repo_mock.calcular_total_itens.return_value = 30.0
    orcamento_repo_mock.buscar_por_id.return_value = orcamento

    dados = {"quantidade_unitaria": 3.0}

    # Act
    resultado = orcamento_item_service_com_insumo.atualizar_insumo(
        "orc-1", "item-1", "ins-1", dados
    )

    # Assert
    assert resultado == insumo_atualizado
    insumo_repo_mock.atualizar.assert_called_once()
    orcamento_item_repo_mock.atualizar.assert_called_once()
    orcamento_repo_mock.atualizar.assert_called()


@pytest.mark.unit
def test_atualizar_insumo_nao_encontrado(
    orcamento_item_service_com_insumo,
    insumo_repo_mock,
):
    """insumo_repository.buscar_por_id retorna None → ValueError."""
    # Arrange
    insumo_repo_mock.buscar_por_id.return_value = None

    # Act + Assert
    with pytest.raises(ValueError, match="Insumo não encontrado"):
        orcamento_item_service_com_insumo.atualizar_insumo(
            "orc-1", "item-1", "ins-inexistente", {}
        )


@pytest.mark.unit
def test_atualizar_insumo_sem_repo_levanta_value_error(
    orcamento_item_repo_mock, orcamento_repo_mock, item_repo_mock
):
    """Quando insumo_repository=None → ValueError."""
    from app.modules.orcamento.services import OrcamentoItemService

    # Arrange
    service = OrcamentoItemService(
        orcamento_item_repo_mock,
        orcamento_repo_mock,
        item_repo_mock,
        insumo_repository=None,
    )

    # Act + Assert
    with pytest.raises(ValueError, match="Repositório de insumos não disponível"):
        service.atualizar_insumo("orc-1", "item-1", "ins-1", {})


# ---------------------------------------------------------------------------
# _explodir_insumos
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_explodir_insumos_com_filhos_cria_batch(
    orcamento_item_service_com_insumo,
    item_repo_mock,
    insumo_repo_mock,
):
    """_explodir_insumos com filhos → deleta insumos antigos e cria batch."""
    # Arrange
    item = {
        "id": "item-1",
        "codigo_composicao": "9999",
        "quantidade": 2.0,
    }
    orcamento = {
        "base_referencia": "12/2025",
        "tipo_composicao": "Sem Desoneração",
    }
    filhos = [
        {
            "codigo_filho": "101",
            "quantidade_coeficiente": 1.5,
            "descricao_filho": "Areia",
            "unidade_filho": "M3",
        }
    ]
    item_repo_mock.buscar_filhos_composicao.return_value = filhos
    item_repo_mock.buscar_preco.return_value = 10.0
    insumo_repo_mock.deletar_por_item.return_value = None
    insumo_repo_mock.criar_batch.return_value = 1

    # Act
    orcamento_item_service_com_insumo._explodir_insumos(item, orcamento, "SINAPI", "sp")

    # Assert
    insumo_repo_mock.deletar_por_item.assert_called_once_with("item-1")
    insumo_repo_mock.criar_batch.assert_called_once()
    batch_args = insumo_repo_mock.criar_batch.call_args[0][0]
    assert len(batch_args) == 1
    assert batch_args[0]["codigo_insumo"] == "101"
    assert batch_args[0]["orcamento_item_id"] == "item-1"
    assert batch_args[0]["quantidade_unitaria"] == pytest.approx(3.0)  # 1.5 * 2.0


@pytest.mark.unit
def test_explodir_insumos_sem_filhos_nao_chama_batch(
    orcamento_item_service_com_insumo,
    item_repo_mock,
    insumo_repo_mock,
):
    """buscar_filhos_composicao retorna [] → nenhuma inserção."""
    # Arrange
    item = {"id": "item-1", "codigo_composicao": "0000", "quantidade": 1.0}
    orcamento = {"base_referencia": "12/2025", "tipo_composicao": "Sem Desoneração"}
    item_repo_mock.buscar_filhos_composicao.return_value = []

    # Act
    orcamento_item_service_com_insumo._explodir_insumos(item, orcamento, "SINAPI", "sp")

    # Assert
    insumo_repo_mock.deletar_por_item.assert_not_called()
    insumo_repo_mock.criar_batch.assert_not_called()


@pytest.mark.unit
def test_explodir_insumos_falha_silenciosa(
    orcamento_item_service_com_insumo,
    item_repo_mock,
    insumo_repo_mock,
):
    """Exceção dentro de _explodir_insumos não propaga — apenas loga warning."""
    # Arrange
    item = {"id": "item-1", "codigo_composicao": "9999", "quantidade": 1.0}
    orcamento = {"base_referencia": "12/2025", "tipo_composicao": "Sem Desoneração"}
    item_repo_mock.buscar_filhos_composicao.side_effect = RuntimeError("Erro de rede")

    # Act — não deve levantar exceção
    orcamento_item_service_com_insumo._explodir_insumos(item, orcamento, "SINAPI", "sp")

    # Assert — nenhuma chamada ao insumo_repo após a falha
    insumo_repo_mock.criar_batch.assert_not_called()
