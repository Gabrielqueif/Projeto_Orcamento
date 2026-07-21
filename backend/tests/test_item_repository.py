"""
Unit tests for ItemRepository.
Supabase client é mockado via MagicMock.
Destaque especial para buscar_preco — 3 tentativas de fallback.
"""
import pytest
from unittest.mock import MagicMock, call
from app.modules.item.repositories import ItemRepository


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def supabase():
    return MagicMock()


@pytest.fixture
def repo(supabase):
    return ItemRepository(supabase)


def _make_exec(data):
    """Cria um MagicMock cujo .execute() retorna data."""
    m = MagicMock()
    m.execute.return_value.data = data
    return m


# ---------------------------------------------------------------------------
# upsert_batch_composicoes
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_upsert_batch_composicoes_lista_vazia_retorna_zero(repo, supabase):
    """Lista vazia → retorna 0 sem chamar Supabase."""
    assert repo.upsert_batch_composicoes([]) == 0
    supabase.table.assert_not_called()


@pytest.mark.unit
def test_upsert_batch_composicoes_remove_campo_grupo(repo, supabase):
    """O campo 'grupo' deve ser removido do payload antes do upsert."""
    # Arrange
    dados = [{"codigo_composicao": "100", "descricao": "X", "grupo": "G1"}]
    supabase.table.return_value.upsert.return_value.execute.return_value.data = [
        {"codigo_composicao": "100"}
    ]

    # Act
    resultado = repo.upsert_batch_composicoes(dados)

    # Assert
    assert resultado == 1
    lote_passado = supabase.table.return_value.upsert.call_args[0][0]
    assert "grupo" not in lote_passado[0]


# ---------------------------------------------------------------------------
# upsert_batch_estados
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_upsert_batch_estados_lista_vazia_retorna_zero(repo, supabase):
    """Lista vazia → retorna 0."""
    assert repo.upsert_batch_estados([]) == 0


@pytest.mark.unit
def test_upsert_batch_estados_chama_upsert(repo, supabase):
    """Dados válidos → chama upsert e retorna count."""
    # Arrange
    dados = [{"codigo_composicao": "100", "mes_referencia": "12/2025", "sp": 10.0}]
    supabase.table.return_value.upsert.return_value.execute.return_value.data = dados

    # Act
    resultado = repo.upsert_batch_estados(dados)

    # Assert
    assert resultado == 1
    supabase.table.return_value.upsert.assert_called_once()


# ---------------------------------------------------------------------------
# buscar_por_codigo
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_buscar_por_codigo_retorna_lista(repo, supabase):
    """Filtra por codigo_composicao e fonte."""
    # Arrange
    esperado = [{"codigo_composicao": "100"}]
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.execute.return_value.data = esperado

    # Act
    resultado = repo.buscar_por_codigo("100", fonte="SINAPI")

    # Assert
    assert resultado == esperado


# ---------------------------------------------------------------------------
# buscar_preco — 3 tentativas de fallback
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_buscar_preco_tentativa1_exata(repo, supabase):
    """Tentativa 1 (busca exata) encontra registro → retorna preço do estado."""
    # Arrange
    dados_row = {"sp": 150.0, "rj": 160.0, "codigo_composicao": "100"}
    # O encadeamento exato da tentativa 1: .select().eq().eq().eq().eq().execute()
    chain = supabase.table.return_value.select.return_value
    chain.eq.return_value = chain
    chain.execute.return_value.data = [dados_row]

    # Act
    resultado = repo.buscar_preco("100", "sp", "12/2025", "Sem Desoneração", "SINAPI")

    # Assert
    assert resultado == 150.0


@pytest.mark.unit
def test_buscar_preco_fallback_ilike(repo, supabase):
    """
    Tentativa 1 falha (data=[]) → tentativa 2 com ilike encontra registro.
    Configura o encadeamento de mock para simular 2 execuções sequenciais.
    """
    from app.modules.item.repositories import ItemRepository

    # Arrange: supabase mock que retorna [] na 1ª consulta e dados na 2ª
    call_count = 0
    dados_row = {"sp": 120.0}

    def side_effect_execute():
        nonlocal call_count
        call_count += 1
        result = MagicMock()
        if call_count <= 2:  # tentativa 1 e diagnóstico
            result.data = []
        else:
            result.data = [dados_row]  # tentativa 2 (ilike)
        return result

    supabase_local = MagicMock()
    chain = supabase_local.table.return_value
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.ilike.return_value = chain
    chain.limit.return_value = chain
    chain.execute.side_effect = side_effect_execute

    repo_local = ItemRepository(supabase_local)

    # Act
    resultado = repo_local.buscar_preco("100", "sp", "12/2025", "Sem Desoneração", "SINAPI")

    # Assert
    assert resultado == 120.0


@pytest.mark.unit
def test_buscar_preco_fallback_sem_mes(repo, supabase):
    """
    Tentativas 1 e 2 falham → tentativa 3 (mês mais recente) encontra registro.
    """
    # Arrange
    call_count = 0
    dados_row_mais_recente = {"sp": 88.0, "mes_referencia": "01/2026"}
    dados_row_antigo = {"sp": 70.0, "mes_referencia": "01/2024"}

    def side_effect_execute():
        nonlocal call_count
        call_count += 1
        result = MagicMock()
        if call_count <= 3:  # tentativa 1, diagnóstico, tentativa 2
            result.data = []
        else:  # tentativa 3
            result.data = [dados_row_antigo, dados_row_mais_recente]
        return result

    supabase_local = MagicMock()
    chain = supabase_local.table.return_value
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.ilike.return_value = chain
    chain.limit.return_value = chain
    chain.execute.side_effect = side_effect_execute

    repo_local = ItemRepository(supabase_local)

    # Act
    resultado = repo_local.buscar_preco("100", "sp", "12/2025", "Sem Desoneração", "SINAPI")

    # Assert — retorna preço do mês mais recente (01/2026)
    assert resultado == 88.0


@pytest.mark.unit
def test_buscar_preco_sem_resultado_retorna_none(repo, supabase):
    """Todas as tentativas falham → retorna None."""
    # Arrange
    chain = supabase.table.return_value
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.ilike.return_value = chain
    chain.limit.return_value = chain
    chain.execute.return_value.data = []

    # Act
    resultado = repo.buscar_preco("INEXISTENTE", "sp", "12/2025", "Sem Desoneração", "SINAPI")

    # Assert
    assert resultado is None


# ---------------------------------------------------------------------------
# buscar_filhos_composicao
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_buscar_filhos_composicao_retorna_relacoes(repo, supabase):
    """Retorna lista de filhos pai→filho."""
    # Arrange
    filhos = [
        {"codigo_pai": "9999", "codigo_filho": "101", "quantidade_coeficiente": 2.0},
    ]
    chain = supabase.table.return_value
    chain.select.return_value = chain
    chain.eq.return_value = chain
    chain.execute.return_value.data = filhos

    # Act
    resultado = repo.buscar_filhos_composicao("9999", "12/2025", "SINAPI")

    # Assert
    assert resultado == filhos


@pytest.mark.unit
def test_buscar_filhos_composicao_excecao_retorna_lista_vazia(repo, supabase):
    """Exceção → retorna [] sem propagar."""
    # Arrange
    supabase.table.return_value.select.side_effect = RuntimeError("Erro")

    # Act
    resultado = repo.buscar_filhos_composicao("9999", "12/2025", "SINAPI")

    # Assert
    assert resultado == []


# ---------------------------------------------------------------------------
# upsert_batch_composicao_itens
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_upsert_batch_composicao_itens_lista_vazia_retorna_zero(repo, supabase):
    """Lista vazia → retorna 0."""
    assert repo.upsert_batch_composicao_itens([]) == 0


@pytest.mark.unit
def test_upsert_batch_composicao_itens_salva_hierarquias(repo, supabase):
    """Dados válidos → chama upsert e retorna count."""
    # Arrange
    dados = [{"codigo_pai": "9999", "codigo_filho": "101", "mes_referencia": "12/2025"}]
    supabase.table.return_value.upsert.return_value.execute.return_value.data = dados

    # Act
    resultado = repo.upsert_batch_composicao_itens(dados)

    # Assert
    assert resultado == 1
