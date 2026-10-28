from unittest.mock import MagicMock

import pytest

from app.main import app
from app.modules.notificacao.routes import get_notificacao_service
from app.modules.notificacao.services import NotificacaoService

USUARIO = "user-1"


def _risco(tipo="ATRASO", obra_id="o1", severidade="critical"):
    return {
        "obra_id": obra_id,
        "tipo": tipo,
        "severidade": severidade,
        "titulo": f"{tipo} em {obra_id}",
        "descricao": "descrição",
        "href": f"/obras/{obra_id}",
    }


@pytest.fixture
def dashboard():
    d = MagicMock()
    d.listar_riscos.return_value = [_risco("ATRASO", "o1"), _risco("ESTOQUE", "o1", "moderate")]
    return d


@pytest.fixture
def repo():
    r = MagicMock()
    r.chaves_lidas.return_value = []
    return r


@pytest.fixture
def service(dashboard, repo):
    return NotificacaoService(dashboard, repo)


# --- listagem ------------------------------------------------------------------


def test_chave_e_tipo_obra_formam_uma_chave_estavel(service):
    itens = service.listar(USUARIO)["itens"]
    assert [i["chave"] for i in itens] == ["ATRASO:o1", "ESTOQUE:o1"]


def test_item_traz_os_campos_do_risco_sem_a_obra_de_origem(service):
    item = service.listar(USUARIO)["itens"][0]
    assert set(item) == {"chave", "tipo", "severidade", "titulo", "descricao", "href", "lida"}
    assert item["href"] == "/obras/o1"


def test_nao_lidas_conta_os_riscos_sem_marca(service, repo):
    repo.chaves_lidas.return_value = ["ATRASO:o1"]
    dados = service.listar(USUARIO)

    assert dados["nao_lidas"] == 1
    assert [i["lida"] for i in dados["itens"]] == [True, False]


def test_sem_riscos_nao_ha_itens_nem_nao_lidas(service, dashboard, repo):
    dashboard.listar_riscos.return_value = []
    assert service.listar(USUARIO) == {"itens": [], "nao_lidas": 0}


def test_listar_apaga_as_chaves_que_nao_sao_mais_riscos(service, repo):
    service.listar(USUARIO)
    repo.apagar_obsoletas.assert_called_once_with(USUARIO, ["ATRASO:o1", "ESTOQUE:o1"])


def test_listar_sem_riscos_apaga_todas_as_chaves_do_usuario(service, dashboard, repo):
    dashboard.listar_riscos.return_value = []
    service.listar(USUARIO)
    repo.apagar_obsoletas.assert_called_once_with(USUARIO, [])


def test_risco_que_volta_aparece_como_nao_lido(service, repo):
    # A chave antiga foi apagada na listagem anterior; sem marca no banco, o risco volta não lido.
    repo.chaves_lidas.return_value = []
    assert service.listar(USUARIO)["nao_lidas"] == 2


# --- marcar como lidas ---------------------------------------------------------


def test_marcar_uma_grava_so_a_chave_pedida(service, repo):
    repo.chaves_lidas.return_value = ["ATRASO:o1"]
    resultado = service.marcar_lidas(USUARIO, ["ATRASO:o1"])

    repo.marcar.assert_called_once_with(USUARIO, ["ATRASO:o1"])
    assert resultado == {"nao_lidas": 1}


def test_marcar_todas_quando_a_lista_e_nula(service, repo):
    repo.chaves_lidas.return_value = ["ATRASO:o1", "ESTOQUE:o1"]
    resultado = service.marcar_lidas(USUARIO, None)

    repo.marcar.assert_called_once_with(USUARIO, ["ATRASO:o1", "ESTOQUE:o1"])
    assert resultado == {"nao_lidas": 0}


def test_ignora_chave_que_nao_e_risco_ativo(service, repo):
    service.marcar_lidas(USUARIO, ["DIARIO:o9", "ATRASO:o1"])
    repo.marcar.assert_called_once_with(USUARIO, ["ATRASO:o1"])


def test_so_chaves_invalidas_nao_grava_nada(service, repo):
    service.marcar_lidas(USUARIO, ["DIARIO:o9"])
    repo.marcar.assert_not_called()


def test_chaves_repetidas_sao_gravadas_uma_vez(service, repo):
    service.marcar_lidas(USUARIO, ["ATRASO:o1", "ATRASO:o1"])
    repo.marcar.assert_called_once_with(USUARIO, ["ATRASO:o1"])


def test_lista_vazia_nao_marca_nada(service, repo):
    service.marcar_lidas(USUARIO, [])
    repo.marcar.assert_not_called()


def test_nao_lidas_depois_de_marcar_parcialmente(service, repo):
    repo.chaves_lidas.return_value = ["ESTOQUE:o1"]
    assert service.marcar_lidas(USUARIO, ["ESTOQUE:o1"]) == {"nao_lidas": 1}


# --- isolamento por usuário ----------------------------------------------------


def test_todas_as_consultas_usam_o_usuario_recebido(service, dashboard, repo):
    service.listar("user-A")
    service.marcar_lidas("user-A", None)

    dashboard.listar_riscos.assert_called_with("user-A")
    repo.chaves_lidas.assert_called_with("user-A")
    repo.apagar_obsoletas.assert_called_with("user-A", ["ATRASO:o1", "ESTOQUE:o1"])
    repo.marcar.assert_called_with("user-A", ["ATRASO:o1", "ESTOQUE:o1"])


def test_marcar_nao_grava_para_outro_usuario(service, repo):
    service.marcar_lidas("user-B", ["ATRASO:o1"])
    for chamada in repo.marcar.call_args_list:
        assert chamada.args[0] == "user-B"


# --- rotas ---------------------------------------------------------------------


def test_rota_listar_notificacoes(client, service):
    app.dependency_overrides[get_notificacao_service] = lambda: service
    resposta = client.get("/notificacoes")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["nao_lidas"] == 2
    assert corpo["itens"][0]["chave"] == "ATRASO:o1"


def test_rota_marcar_lidas_com_chaves(client, service, repo):
    # O mock não persiste: depois do POST, o banco passa a devolver a chave marcada.
    repo.chaves_lidas.return_value = ["ATRASO:o1"]
    app.dependency_overrides[get_notificacao_service] = lambda: service
    resposta = client.post("/notificacoes/lidas", json={"chaves": ["ATRASO:o1"]})

    assert resposta.status_code == 200
    repo.marcar.assert_called_once_with("test-user-id", ["ATRASO:o1"])
    assert resposta.json() == {"nao_lidas": 1}


def test_rota_marcar_todas_sem_corpo(client, service, repo):
    repo.chaves_lidas.return_value = ["ATRASO:o1", "ESTOQUE:o1"]
    app.dependency_overrides[get_notificacao_service] = lambda: service
    resposta = client.post("/notificacoes/lidas")

    assert resposta.status_code == 200
    repo.marcar.assert_called_once_with("test-user-id", ["ATRASO:o1", "ESTOQUE:o1"])
    assert resposta.json() == {"nao_lidas": 0}


def test_rota_marcar_todas_com_chaves_nulas(client, service, repo):
    app.dependency_overrides[get_notificacao_service] = lambda: service
    resposta = client.post("/notificacoes/lidas", json={"chaves": None})

    assert resposta.status_code == 200
    repo.marcar.assert_called_once_with("test-user-id", ["ATRASO:o1", "ESTOQUE:o1"])
