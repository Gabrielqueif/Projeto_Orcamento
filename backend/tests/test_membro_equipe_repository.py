"""
Unit tests for MembroEquipeRepository.
Supabase client is mocked via chain MagicMock.
"""
import pytest
from unittest.mock import MagicMock
from app.repositories.membro_equipe_repository import MembroEquipeRepository


@pytest.fixture
def supabase():
    """MagicMock do supabase client com encadeamento fluente."""
    return MagicMock()


@pytest.fixture
def repo(supabase):
    return MembroEquipeRepository(supabase)


@pytest.mark.unit
def test_criar_membro_retorna_registro(repo, supabase):
    """criar() insere o membro da equipe e associa o user_id, retornando o registro criado."""
    # Arrange
    membro = {"id": "m1", "nome": "Membro 1", "user_id": "u1"}
    supabase.table.return_value.insert.return_value.execute.return_value.data = [membro]

    # Act
    resultado = repo.criar({"nome": "Membro 1"}, user_id="u1")

    # Assert
    assert resultado == membro
    supabase.table.return_value.insert.assert_called_once_with({"nome": "Membro 1", "user_id": "u1"})


@pytest.mark.unit
def test_criar_membro_falha_sem_dados(repo, supabase):
    """criar() quando insert retorna lista vazia deve levantar exceção."""
    # Arrange
    supabase.table.return_value.insert.return_value.execute.return_value.data = []

    # Act & Assert
    with pytest.raises(Exception, match="Falha ao inserir membro da equipe"):
        repo.criar({"nome": "Membro 1"}, user_id="u1")


@pytest.mark.unit
def test_criar_membro_excecao(repo, supabase):
    """criar() propaga exceções do Supabase client."""
    # Arrange
    supabase.table.return_value.insert.side_effect = RuntimeError("Conexão falhou")

    # Act & Assert
    with pytest.raises(RuntimeError, match="Conexão falhou"):
        repo.criar({"nome": "Membro 1"}, user_id="u1")


@pytest.mark.unit
def test_listar_membros_sem_filtros(repo, supabase):
    """listar() sem filtros adicionais filtra apenas por user_id e ordena por nome."""
    # Arrange
    membros = [{"id": "m1", "nome": "A"}, {"id": "m2", "nome": "B"}]
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.order.return_value = chain
    chain.execute.return_value.data = membros

    # Act
    resultado = repo.listar(user_id="u1")

    # Assert
    assert resultado == membros
    supabase.table.return_value.select.assert_called_once_with("*")
    chain.eq.assert_called_once_with("user_id", "u1")
    chain.order.assert_called_once_with("nome")


@pytest.mark.unit
def test_listar_membros_com_filtros(repo, supabase):
    """listar() com filtros opcionais aplica ilike, eq e is_ corretamente."""
    # Arrange
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.ilike.return_value = chain
    chain.is_.return_value = chain
    chain.order.return_value = chain
    chain.execute.return_value.data = []

    # Act
    repo.listar(user_id="u1", nome="José", cargo="Mestre", status="ATIVO", orcamento_id="—")

    # Assert
    chain.ilike.assert_called_once_with("nome", "%José%")
    # Deve filtrar eq por cargo e status
    chain.eq.assert_any_call("cargo", "Mestre")
    chain.eq.assert_any_call("status", "ATIVO")
    # orcamento_id="—" deve traduzir para is_("orcamento_id", "null")
    chain.is_.assert_called_once_with("orcamento_id", "null")


@pytest.mark.unit
def test_listar_membros_com_orcamento_id_valido(repo, supabase):
    """listar() com orcamento_id real filtra com eq("orcamento_id", ...)."""
    # Arrange
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.order.return_value = chain
    chain.execute.return_value.data = []

    # Act
    repo.listar(user_id="u1", orcamento_id="orc-123")

    # Assert
    # Deverá filtrar por orcamento_id usando eq
    chain.eq.assert_any_call("orcamento_id", "orc-123")


@pytest.mark.unit
def test_listar_membros_excecao(repo, supabase):
    """listar() captura exceções e retorna lista vazia."""
    # Arrange
    supabase.table.side_effect = RuntimeError("Erro na query")

    # Act
    resultado = repo.listar(user_id="u1")

    # Assert
    assert resultado == []


@pytest.mark.unit
def test_buscar_por_id_sucesso(repo, supabase):
    """buscar_por_id() filtra por id e user_id e retorna o primeiro elemento."""
    # Arrange
    membro = {"id": "m1", "nome": "José"}
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.execute.return_value.data = [membro]

    # Act
    resultado = repo.buscar_por_id("m1", "u1")

    # Assert
    assert resultado == membro


@pytest.mark.unit
def test_buscar_por_id_nao_encontrado(repo, supabase):
    """buscar_por_id() retorna None se o registro não for encontrado."""
    # Arrange
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.execute.return_value.data = []

    # Act
    resultado = repo.buscar_por_id("m2", "u1")

    # Assert
    assert resultado is None


@pytest.mark.unit
def test_buscar_por_id_excecao(repo, supabase):
    """buscar_por_id() retorna None se disparar exceção."""
    # Arrange
    supabase.table.side_effect = RuntimeError("Erro")

    # Act
    resultado = repo.buscar_por_id("m1", "u1")

    # Assert
    assert resultado is None


@pytest.mark.unit
def test_atualizar_membro_sucesso(repo, supabase):
    """atualizar() faz update com updated_at injetado e filtra por id e user_id."""
    # Arrange
    membro = {"id": "m1", "nome": "Nome Novo"}
    chain = supabase.table.return_value.update.return_value
    chain.eq.return_value = chain
    chain.execute.return_value.data = [membro]

    # Act
    resultado = repo.atualizar("m1", {"nome": "Nome Novo"}, "u1")

    # Assert
    assert resultado == membro
    update_payload = supabase.table.return_value.update.call_args[0][0]
    assert "updated_at" in update_payload
    assert update_payload["nome"] == "Nome Novo"


@pytest.mark.unit
def test_atualizar_membro_excecao(repo, supabase):
    """atualizar() propaga erros lançados do Supabase."""
    # Arrange
    supabase.table.side_effect = RuntimeError("Falha")

    # Act & Assert
    with pytest.raises(RuntimeError):
        repo.atualizar("m1", {}, "u1")


@pytest.mark.unit
def test_deletar_membro_sucesso(repo, supabase):
    """deletar() remove o registro e retorna True se data existir."""
    # Arrange
    chain = supabase.table.return_value.delete.return_value
    chain.eq.return_value = chain
    chain.execute.return_value.data = [{"id": "m1"}]

    # Act
    resultado = repo.deletar("m1", "u1")

    # Assert
    assert resultado is True


@pytest.mark.unit
def test_deletar_membro_falha(repo, supabase):
    """deletar() retorna False se delete não deletar nada."""
    # Arrange
    chain = supabase.table.return_value.delete.return_value
    chain.eq.return_value = chain
    chain.execute.return_value.data = []

    # Act
    resultado = repo.deletar("m2", "u1")

    # Assert
    assert resultado is False


@pytest.mark.unit
def test_deletar_membro_excecao(repo, supabase):
    """deletar() propaga exceções do Supabase."""
    # Arrange
    supabase.table.side_effect = RuntimeError("Erro delete")

    # Act & Assert
    with pytest.raises(RuntimeError):
        repo.deletar("m1", "u1")


@pytest.mark.unit
def test_alocar_ao_orcamento_vazio(repo, supabase):
    """alocar_ao_orcamento() com lista de membros vazia retorna True sem chamar Supabase."""
    # Act
    resultado = repo.alocar_ao_orcamento([], "orc1", "u1")

    # Assert
    assert resultado is True
    supabase.table.assert_not_called()


@pytest.mark.unit
def test_alocar_ao_orcamento_sucesso(repo, supabase):
    """alocar_ao_orcamento() atualiza o orcamento_id para os membros passados."""
    # Arrange
    chain = supabase.table.return_value.update.return_value
    chain.eq.return_value = chain
    chain.in_.return_value = chain
    chain.execute.return_value.data = []

    # Act
    resultado = repo.alocar_ao_orcamento(["m1", "m2"], "orc1", "u1")

    # Assert
    assert resultado is True
    supabase.table.return_value.update.assert_called_once()
    update_payload = supabase.table.return_value.update.call_args[0][0]
    assert update_payload["orcamento_id"] == "orc1"
    assert "updated_at" in update_payload
    chain.eq.assert_called_once_with("user_id", "u1")
    chain.in_.assert_called_once_with("id", ["m1", "m2"])


@pytest.mark.unit
def test_alocar_ao_orcamento_excecao(repo, supabase):
    """alocar_ao_orcamento() propaga exceções do Supabase."""
    # Arrange
    supabase.table.side_effect = RuntimeError("Erro update batch")

    # Act & Assert
    with pytest.raises(RuntimeError):
        repo.alocar_ao_orcamento(["m1"], "orc1", "u1")
