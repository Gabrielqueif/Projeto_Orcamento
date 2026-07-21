"""
Unit tests for InsumoRepository.
Supabase client é mockado via MagicMock.
"""
import pytest
from unittest.mock import MagicMock
from app.modules.orcamento.repositories import InsumoRepository


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def supabase():
    return MagicMock()


@pytest.fixture
def repo(supabase):
    return InsumoRepository(supabase)


# ---------------------------------------------------------------------------
# criar_batch
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_criar_batch_lista_vazia_retorna_zero(repo, supabase):
    """Lista vazia → retorna 0 sem chamar o Supabase."""
    # Act
    resultado = repo.criar_batch([])

    # Assert
    assert resultado == 0
    supabase.table.assert_not_called()


@pytest.mark.unit
def test_criar_batch_sucesso_retorna_count(repo, supabase):
    """insert().execute().data com items → retorna len(data)."""
    # Arrange
    dados = [
        {"orcamento_item_id": "item-1", "codigo_insumo": "100"},
        {"orcamento_item_id": "item-1", "codigo_insumo": "101"},
    ]
    supabase.table.return_value.insert.return_value.execute.return_value.data = dados

    # Act
    resultado = repo.criar_batch(dados)

    # Assert
    assert resultado == 2
    supabase.table.return_value.insert.assert_called_once_with(dados)


@pytest.mark.unit
def test_criar_batch_excecao_retorna_zero(repo, supabase):
    """Quando Supabase lança exceção → retorna 0 sem propagar."""
    # Arrange
    supabase.table.return_value.insert.return_value.execute.side_effect = RuntimeError("Timeout")

    # Act
    resultado = repo.criar_batch([{"id": "x"}])

    # Assert
    assert resultado == 0


# ---------------------------------------------------------------------------
# listar_por_item
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_listar_por_item_retorna_insumos(repo, supabase):
    """Filtra por orcamento_item_id e retorna lista."""
    # Arrange
    esperado = [{"id": "ins-1"}, {"id": "ins-2"}]
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = esperado

    # Act
    resultado = repo.listar_por_item("item-1")

    # Assert
    assert resultado == esperado
    supabase.table.return_value.select.return_value.eq.assert_called_with("orcamento_item_id", "item-1")


@pytest.mark.unit
def test_listar_por_item_excecao_retorna_lista_vazia(repo, supabase):
    """Exceção → retorna []."""
    # Arrange
    supabase.table.return_value.select.side_effect = RuntimeError("Erro")

    # Act
    resultado = repo.listar_por_item("item-1")

    # Assert
    assert resultado == []


# ---------------------------------------------------------------------------
# atualizar
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_atualizar_insumo_retorna_primeiro_item(repo, supabase):
    """update().eq().execute().data retorna item atualizado."""
    # Arrange
    item_upd = {"id": "ins-1", "quantidade_unitaria": 5.0, "total": 50.0}
    supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [item_upd]

    # Act
    resultado = repo.atualizar("ins-1", {"quantidade_unitaria": 5.0})

    # Assert
    assert resultado == item_upd


@pytest.mark.unit
def test_atualizar_insumo_data_vazio_retorna_none(repo, supabase):
    """data=[] → retorna None."""
    # Arrange
    supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []

    # Act
    resultado = repo.atualizar("ins-1", {})

    # Assert
    assert resultado is None


# ---------------------------------------------------------------------------
# buscar_por_id
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_buscar_por_id_encontrado(repo, supabase):
    """data=[item] → retorna item."""
    # Arrange
    item = {"id": "ins-1", "codigo_insumo": "100"}
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [item]

    # Act
    resultado = repo.buscar_por_id("ins-1")

    # Assert
    assert resultado == item


@pytest.mark.unit
def test_buscar_por_id_nao_encontrado_retorna_none(repo, supabase):
    """data=[] → retorna None."""
    # Arrange
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    # Act
    resultado = repo.buscar_por_id("inexistente")

    # Assert
    assert resultado is None


# ---------------------------------------------------------------------------
# deletar_por_item
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_deletar_por_item_chama_delete_eq(repo, supabase):
    """deletar_por_item delega delete().eq() ao Supabase."""
    # Act
    repo.deletar_por_item("item-1")

    # Assert
    supabase.table.return_value.delete.assert_called_once()
