from datetime import date
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

from app.modules.diario import services as diario_services
from app.modules.diario.schemas import DiarioCreate, DiarioUpdate, EfetivoInput
from app.modules.diario.services import DiarioService
from core.exceptions import NaoEncontradoError

OBRA = "obra-real"
DIARIO = "diario-1"
USUARIO = "user-1"
CARGO = "cargo-1"
HOJE = date(2026, 10, 22)


def _diario(**extra):
    base = {
        "id": DIARIO,
        "obra_id": OBRA,
        "data": "2026-10-21",
        "titulo": "Concretagem",
        "atividades": "Laje L2",
        "ocorrencias": None,
        "clima": "SOL",
        "temperatura": None,
        "equipe_presente": 10,
        "responsavel": None,
        "status": "RASCUNHO",
        "created_at": "2026-10-21T10:00:00Z",
        "updated_at": "2026-10-21T10:00:00Z",
    }
    return {**base, **extra}


@pytest.fixture(autouse=True)
def data_fixa(monkeypatch):
    monkeypatch.setattr(diario_services, "hoje", lambda: HOJE)


@pytest.fixture
def repo():
    r = MagicMock()
    r.resolver_obra.return_value = OBRA
    r.buscar.return_value = _diario()
    r.buscar_obra.return_value = {"id": OBRA, "orcamento_id": None}
    r.buscar_por_data.return_value = None
    r.listar_fotos.return_value = []
    r.listar_efetivo.return_value = []
    r.assinar_urls.return_value = {}
    r.atualizar.side_effect = lambda diario_id, obra_id, dados: _diario(**dados)
    r.criar.side_effect = lambda obra_id, dados: _diario(**dados)
    return r


@pytest.fixture
def cargos():
    c = MagicMock()
    c.buscar_por_id.return_value = {"id": CARGO, "nome": "Pedreiro", "user_id": None}
    return c


@pytest.fixture
def service(repo, cargos):
    return DiarioService(repo, cargos=cargos)


def _novo(**extra):
    base = {"data": date(2026, 10, 21), "titulo": "Concretagem", "atividades": "Laje L2", "clima": "SOL"}
    return DiarioCreate(**{**base, **extra})


def _efetivo(*itens):
    return [EfetivoInput(**i) for i in itens]


# --- criação -----------------------------------------------------------------


def test_criar_com_efetivo_substitui_e_soma_em_equipe_presente(service, repo):
    service.criar(
        OBRA,
        _novo(
            equipe_presente=99,
            efetivo=_efetivo(
                {"cargo_id": CARGO, "funcao": "Pedreiro", "quantidade": 4},
                {"funcao": "Servente", "quantidade": 3},
            ),
        ),
        user_id=USUARIO,
    )

    _, dados = repo.criar.call_args.args
    assert dados["equipe_presente"] == 7
    repo.substituir_efetivo.assert_called_once_with(
        DIARIO,
        [
            {"cargo_id": CARGO, "funcao": "Pedreiro", "quantidade": 4},
            {"cargo_id": None, "funcao": "Servente", "quantidade": 3},
        ],
    )


def test_criar_sem_efetivo_nao_grava_efetivo(service, repo):
    service.criar(OBRA, _novo(equipe_presente=5), user_id=USUARIO)

    _, dados = repo.criar.call_args.args
    assert dados["equipe_presente"] == 5
    repo.substituir_efetivo.assert_not_called()


def test_criar_com_cargo_de_outro_usuario_levanta_nao_encontrado(service, repo, cargos):
    cargos.buscar_por_id.return_value = None
    with pytest.raises(NaoEncontradoError):
        service.criar(
            OBRA, _novo(efetivo=_efetivo({"cargo_id": "cargo-alheio", "funcao": "X", "quantidade": 1})), user_id=USUARIO
        )
    repo.criar.assert_not_called()
    repo.substituir_efetivo.assert_not_called()


def test_criar_valida_cargo_pelo_usuario_da_requisicao(service, cargos):
    service.criar(
        OBRA, _novo(efetivo=_efetivo({"cargo_id": CARGO, "funcao": "Pedreiro", "quantidade": 1})), user_id=USUARIO
    )
    cargos.buscar_por_id.assert_called_once_with(CARGO, USUARIO)


def test_criar_com_funcao_repetida_e_recusado(service, repo):
    with pytest.raises(ValueError, match="repetida"):
        service.criar(
            OBRA,
            _novo(efetivo=_efetivo({"funcao": "Servente", "quantidade": 1}, {"funcao": "Servente", "quantidade": 2})),
            user_id=USUARIO,
        )
    repo.criar.assert_not_called()


def test_falha_ao_gravar_efetivo_desfaz_a_criacao(service, repo):
    repo.substituir_efetivo.side_effect = RuntimeError("falha no banco")
    with pytest.raises(RuntimeError):
        service.criar(OBRA, _novo(efetivo=_efetivo({"funcao": "Servente", "quantidade": 2})), user_id=USUARIO)
    repo.deletar.assert_called_once_with(DIARIO, OBRA)


def test_quantidade_zero_no_efetivo_nao_passa_na_validacao():
    with pytest.raises(ValidationError):
        EfetivoInput(funcao="Servente", quantidade=0)


# --- edição ------------------------------------------------------------------


def test_atualizar_sem_efetivo_nao_mexe_no_efetivo(service, repo):
    service.atualizar(OBRA, DIARIO, DiarioUpdate(titulo="Novo título"), user_id=USUARIO)

    repo.substituir_efetivo.assert_not_called()
    _, _, dados = repo.atualizar.call_args.args
    assert "equipe_presente" not in dados


def test_atualizar_com_efetivo_none_nao_mexe_no_efetivo(service, repo):
    service.atualizar(OBRA, DIARIO, DiarioUpdate(efetivo=None), user_id=USUARIO)

    repo.substituir_efetivo.assert_not_called()
    repo.atualizar.assert_not_called()


def test_atualizar_com_lista_vazia_apaga_o_efetivo(service, repo):
    service.atualizar(OBRA, DIARIO, DiarioUpdate(efetivo=[]), user_id=USUARIO)

    repo.substituir_efetivo.assert_called_once_with(DIARIO, [])
    _, _, dados = repo.atualizar.call_args.args
    assert dados["equipe_presente"] == 0


def test_atualizar_com_efetivo_sobrescreve_equipe_presente_enviada(service, repo):
    service.atualizar(
        OBRA,
        DIARIO,
        DiarioUpdate(equipe_presente=3, efetivo=_efetivo({"funcao": "Servente", "quantidade": 5})),
        user_id=USUARIO,
    )

    _, _, dados = repo.atualizar.call_args.args
    assert dados["equipe_presente"] == 5


def test_atualizar_com_cargo_de_outro_usuario_nao_grava_nada(service, repo, cargos):
    cargos.buscar_por_id.return_value = None
    with pytest.raises(NaoEncontradoError):
        service.atualizar(
            OBRA,
            DIARIO,
            DiarioUpdate(efetivo=_efetivo({"cargo_id": "cargo-alheio", "funcao": "X", "quantidade": 1})),
            user_id=USUARIO,
        )
    repo.atualizar.assert_not_called()
    repo.substituir_efetivo.assert_not_called()


def test_cargo_informado_sem_repositorio_de_cargos_e_recusado(repo):
    service = DiarioService(repo)
    with pytest.raises(ValueError, match="cargo"):
        service.atualizar(
            OBRA,
            DIARIO,
            DiarioUpdate(efetivo=_efetivo({"cargo_id": CARGO, "funcao": "Pedreiro", "quantidade": 1})),
            user_id=USUARIO,
        )
    repo.substituir_efetivo.assert_not_called()


# --- leitura -----------------------------------------------------------------


def test_obter_devolve_o_efetivo_do_diario(service, repo):
    repo.listar_efetivo.return_value = [
        {"diario_id": DIARIO, "cargo_id": CARGO, "funcao": "Pedreiro", "quantidade": 4},
        {"diario_id": "outro", "cargo_id": None, "funcao": "Servente", "quantidade": 1},
    ]
    efetivo = service.obter(OBRA, DIARIO)["efetivo"]
    assert efetivo == [{"cargo_id": CARGO, "funcao": "Pedreiro", "quantidade": 4}]
