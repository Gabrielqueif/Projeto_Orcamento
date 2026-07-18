"""
Unit tests for OrcamentoRepository.
Supabase client é mockado via encadeamento MagicMock.
"""
import pytest
from unittest.mock import MagicMock
from app.repositories.orcamento_repository import OrcamentoRepository


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def supabase():
    """MagicMock do supabase client com encadeamento fluente automático."""
    return MagicMock()


@pytest.fixture
def repo(supabase):
    return OrcamentoRepository(supabase)


# ---------------------------------------------------------------------------
# criar
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_criar_retorna_primeiro_item(repo, supabase):
    """insert().execute().data retorna lista → repo retorna primeiro item."""
    # Arrange
    item = {"id": "1", "nome": "Obra Teste"}
    supabase.table.return_value.insert.return_value.execute.return_value.data = [item]

    # Act
    resultado = repo.criar({"nome": "Obra Teste"})

    # Assert
    assert resultado == item
    supabase.table.return_value.insert.assert_called_once()


@pytest.mark.unit
def test_criar_falha_data_vazio_levanta_excecao(repo, supabase):
    """Quando data=[] → levanta Exception."""
    # Arrange
    supabase.table.return_value.insert.return_value.execute.return_value.data = []

    # Act + Assert
    with pytest.raises(Exception):
        repo.criar({"nome": "Obra Teste"})


# ---------------------------------------------------------------------------
# listar
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_listar_sem_filtros(repo, supabase):
    """listar() sem filtros chama select('*').order().execute()."""
    # Arrange
    esperado = [{"id": "1"}, {"id": "2"}]
    supabase.table.return_value.select.return_value.order.return_value.execute.return_value.data = esperado

    # Act
    resultado = repo.listar()

    # Assert
    assert resultado == esperado
    supabase.table.return_value.select.assert_called_once_with("*")


@pytest.mark.unit
def test_listar_com_filtro_status(repo, supabase):
    """listar(status=...) encadeia eq('status', ...)."""
    # Arrange
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.ilike.return_value = chain
    chain.order.return_value = chain
    chain.execute.return_value.data = [{"id": "1"}]

    # Act
    resultado = repo.listar(status="ativo")

    # Assert
    assert resultado == [{"id": "1"}]
    chain.eq.assert_called_once_with("status", "ativo")


@pytest.mark.unit
def test_listar_retorna_lista_vazia_quando_data_none(repo, supabase):
    """Quando data=None, retorna []."""
    # Arrange
    supabase.table.return_value.select.return_value.order.return_value.execute.return_value.data = None

    # Act
    resultado = repo.listar()

    # Assert
    assert resultado == []


# ---------------------------------------------------------------------------
# buscar_por_id
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_buscar_por_id_encontrado(repo, supabase):
    """data=[item] → retorna item."""
    # Arrange
    item = {"id": "42", "nome": "Obra X"}
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [item]

    # Act
    resultado = repo.buscar_por_id("42")

    # Assert
    assert resultado == item


@pytest.mark.unit
def test_buscar_por_id_nao_encontrado(repo, supabase):
    """data=[] → retorna None."""
    # Arrange
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    # Act
    resultado = repo.buscar_por_id("99")

    # Assert
    assert resultado is None


# ---------------------------------------------------------------------------
# atualizar
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_atualizar_adiciona_updated_at(repo, supabase):
    """atualizar() injeta 'updated_at' no payload automaticamente."""
    # Arrange
    chain = supabase.table.return_value
    chain.update.return_value.eq.return_value.execute.return_value.data = [{"id": "1", "nome": "Novo"}]

    # Act
    resultado = repo.atualizar("1", {"nome": "Novo"})

    # Assert
    assert resultado == {"id": "1", "nome": "Novo"}
    # Verifica que updated_at foi adicionado ao payload
    update_call_args = chain.update.call_args[0][0]
    assert "updated_at" in update_call_args


# ---------------------------------------------------------------------------
# deletar
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_deletar_retorna_true(repo, supabase):
    """deletar() sempre retorna True independente da resposta."""
    # Arrange
    supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = []

    # Act
    resultado = repo.deletar("1")

    # Assert
    assert resultado is True
