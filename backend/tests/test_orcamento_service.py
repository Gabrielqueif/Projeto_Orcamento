"""
Unit tests for OrcamentoService.
All external dependencies (repository) are mocked.
"""
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from app.modules.orcamento.schemas import OrcamentoCreate, OrcamentoUpdate
from app.modules.orcamento.services import OrcamentoService


@pytest.fixture
def repository_mock():
    return MagicMock()


@pytest.fixture
def orcamento_service(repository_mock):
    return OrcamentoService(repository_mock)


@pytest.mark.unit
def test_criar_orcamento_sucesso(orcamento_service, repository_mock):
    dados_entrada = OrcamentoCreate(
        nome="Teste Orçamento",
        cliente="Cliente Teste",
        data=datetime.now().date(),
        base_referencia="SINAPI",
        tipo_composicao="PRECO_MEDIO",
        estado="SP",
        bdi=0.0,
        status="em_elaboracao",
    )

    retorno_esperado = {
        "id": "123",
        "nome": "Teste Orçamento",
        "cliente": "Cliente Teste",
        "valor_total": 0.0,
    }
    repository_mock.criar.return_value = retorno_esperado

    resultado = orcamento_service.criar_orcamento(dados_entrada)

    assert resultado == retorno_esperado
    repository_mock.criar.assert_called_once()

    args, _ = repository_mock.criar.call_args
    dados_passados = args[0]
    assert dados_passados["nome"] == "Teste Orçamento"
    assert dados_passados["estado"] == "sp"  # normalizado para lower case
    assert dados_passados["valor_total"] == 0.0


@pytest.mark.unit
def test_listar_orcamentos(orcamento_service, repository_mock):
    retorno_esperado = [{"id": "1", "nome": "Orc 1"}, {"id": "2", "nome": "Orc 2"}]
    repository_mock.listar.return_value = retorno_esperado

    resultado = orcamento_service.listar_orcamentos(status="ativo", cliente="João")

    assert resultado == retorno_esperado
    repository_mock.listar.assert_called_once_with(None, "ativo", "João", user_id=None)


@pytest.mark.unit
def test_buscar_orcamento_sucesso(orcamento_service, repository_mock):
    retorno_esperado = {"id": "1", "nome": "Orc 1"}
    repository_mock.buscar_por_id.return_value = retorno_esperado

    resultado = orcamento_service.buscar_orcamento("1")

    assert resultado == retorno_esperado
    repository_mock.buscar_por_id.assert_called_once_with("1")


@pytest.mark.unit
def test_buscar_orcamento_nao_encontrado(orcamento_service, repository_mock):
    repository_mock.buscar_por_id.return_value = None

    with pytest.raises(ValueError, match="Orçamento não encontrado"):
        orcamento_service.buscar_orcamento("999")


@pytest.mark.unit
def test_atualizar_orcamento_sucesso(orcamento_service, repository_mock):
    repository_mock.buscar_por_id.return_value = {
        "id": "1",
        "nome": "Antigo",
        "status": "em_elaboracao",
    }
    repository_mock.atualizar.return_value = {"id": "1", "nome": "Novo"}

    update_data = OrcamentoUpdate(nome="Novo")

    resultado = orcamento_service.atualizar_orcamento("1", update_data)

    assert resultado["nome"] == "Novo"
    repository_mock.atualizar.assert_called_once()

    args, _ = repository_mock.atualizar.call_args
    assert "updated_at" in args[1]
    assert args[1]["nome"] == "Novo"


@pytest.mark.unit
def test_deletar_orcamento_sucesso(orcamento_service, repository_mock):
    repository_mock.buscar_por_id.return_value = {"id": "1"}
    repository_mock.deletar.return_value = True

    resultado = orcamento_service.deletar_orcamento("1")

    assert resultado is True
    repository_mock.deletar.assert_called_once_with("1")


# ---------------------------------------------------------------------------
# Cenários faltantes (Prioridade 2 do plano)
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_criar_orcamento_fonte_seinfra(orcamento_service, repository_mock):
    """fonte=SEINFRA é persistida corretamente sem substituição por padrão."""
    # Arrange
    dados_entrada = OrcamentoCreate(
        nome="Obra SEINFRA",
        cliente="Governo",
        data=datetime.now().date(),
        base_referencia="SEINFRA 01/2025",
        tipo_composicao="Sem Desoneração",
        estado="RJ",
        fonte="SEINFRA",
    )
    repository_mock.criar.return_value = {"id": "42", "fonte": "SEINFRA"}

    # Act
    orcamento_service.criar_orcamento(dados_entrada)

    # Assert
    args, _ = repository_mock.criar.call_args
    assert args[0]["fonte"] == "SEINFRA"


@pytest.mark.unit
def test_atualizar_orcamento_estado_normalizado(orcamento_service, repository_mock):
    """estado='RJ' enviado no update deve ser salvo como 'rj' (lowercase)."""
    # Arrange
    repository_mock.buscar_por_id.return_value = {"id": "1", "estado": "sp"}
    repository_mock.atualizar.return_value = {"id": "1", "estado": "rj"}

    update_data = OrcamentoUpdate(estado="RJ")

    # Act
    orcamento_service.atualizar_orcamento("1", update_data)

    # Assert
    args, _ = repository_mock.atualizar.call_args
    assert args[1]["estado"] == "rj"


@pytest.mark.unit
def test_deletar_orcamento_nao_encontrado_levanta_value_error(orcamento_service, repository_mock):
    """buscar_por_id retorna None → deletar lança ValueError."""
    # Arrange
    repository_mock.buscar_por_id.return_value = None

    # Act + Assert
    with pytest.raises(ValueError, match="Orçamento não encontrado"):
        orcamento_service.deletar_orcamento("id-inexistente")

    repository_mock.deletar.assert_not_called()


@pytest.mark.unit
def test_criar_orcamento_grava_campos_de_empreendimento(orcamento_service, repository_mock):
    repository_mock.criar.return_value = {"id": "1"}
    entrada = OrcamentoCreate(
        nome="Edifício A",
        cliente="Cliente",
        data=datetime.now().date(),
        base_referencia="SINAPI",
        tipo_composicao="PRECO_MEDIO",
        estado="SP",
        descricao="Residencial 10 andares",
        proprietario="Construtora X",
        endereco={"cidade": "São Paulo", "uf": "SP"},
        fase="estimativa_custos",
    )
    orcamento_service.criar_orcamento(entrada)
    dados = repository_mock.criar.call_args[0][0]
    assert dados["descricao"] == "Residencial 10 andares"
    assert dados["proprietario"] == "Construtora X"
    assert dados["endereco"]["uf"] == "SP"
    assert dados["fase"] == "estimativa_custos"


@pytest.mark.unit
def test_criar_orcamento_omite_campos_de_empreendimento_quando_nao_informados(orcamento_service, repository_mock):
    repository_mock.criar.return_value = {"id": "1"}
    entrada = OrcamentoCreate(
        nome="Sem extras",
        cliente="C",
        data=datetime.now().date(),
        base_referencia="SINAPI",
        tipo_composicao="PRECO_MEDIO",
        estado="SP",
    )
    orcamento_service.criar_orcamento(entrada)
    dados = repository_mock.criar.call_args[0][0]
    for campo in ("descricao", "proprietario", "endereco", "fase"):
        assert campo not in dados


@pytest.mark.unit
def test_orcamento_create_rejeita_fase_invalida():
    with pytest.raises(Exception):
        OrcamentoCreate(
            nome="x", cliente="c", data=datetime.now().date(), base_referencia="SINAPI",
            tipo_composicao="PRECO_MEDIO", estado="SP", fase="inexistente",
        )


def _item_service(orcamento, itens=None):
    from app.modules.orcamento.services import OrcamentoItemService

    item_repo = MagicMock()
    item_repo.listar_por_orcamento.return_value = itens or []
    orc_repo = MagicMock()
    orc_repo.buscar_por_id.return_value = orcamento
    return OrcamentoItemService(item_repo, orc_repo, MagicMock()), item_repo, orc_repo


@pytest.mark.unit
def test_aprovar_aplica_margem_em_cada_item_e_trava():
    itens = [
        {"id": "i1", "quantidade": 10, "preco_unitario": 100.0},
        {"id": "i2", "quantidade": 2, "preco_unitario": 50.0},
    ]
    svc, item_repo, orc_repo = _item_service({"id": "o1", "status": "em_elaboracao", "bdi": 0}, itens)
    svc.aprovar_orcamento("o1", 10)
    chamadas = {c[0][0]: c[0][1] for c in item_repo.atualizar.call_args_list if "preco_total" in c[0][1]}
    assert chamadas["i1"]["preco_unitario"] == 90.0 and chamadas["i1"]["preco_total"] == 900.0
    assert chamadas["i2"]["preco_unitario"] == 45.0
    final = orc_repo.atualizar.call_args[0][1]
    assert final["status"] == "aprovado" and final["fase"] == "obra" and final["margem_negociacao_pct"] == 10


@pytest.mark.unit
def test_aprovar_rejeita_orcamento_ja_aprovado_e_margem_invalida():
    from core.exceptions import ConflitoError

    svc, _, _ = _item_service({"id": "o1", "status": "aprovado"})
    with pytest.raises(ConflitoError):
        svc.aprovar_orcamento("o1", 5)
    svc, _, _ = _item_service({"id": "o1", "status": "em_elaboracao"})
    with pytest.raises(ValueError):
        svc.aprovar_orcamento("o1", 100)


@pytest.mark.unit
def test_orcamento_aprovado_bloqueia_edicao_de_itens():
    from core.exceptions import ConflitoError

    svc, _, _ = _item_service({"id": "o1", "status": "aprovado"})
    with pytest.raises(ConflitoError):
        svc.remover_item("o1", "i1")
    with pytest.raises(ConflitoError):
        svc.atualizar_item("o1", "i1", MagicMock())
