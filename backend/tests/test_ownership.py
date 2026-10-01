from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_supabase
from core.security import get_current_user

DONO = "user-a"
INTRUSO = "user-b"


def _supabase_com_dono(dono):
    """Supabase mockado cuja consulta de user_id devolve `dono` (None = inexistente)."""
    sb = MagicMock()
    chain = sb.table.return_value.select.return_value.eq.return_value
    chain.execute.return_value.data = [{"user_id": dono}] if dono else []
    return sb


@pytest.fixture
def make_client():
    def _make(usuario, dono):
        sb = _supabase_com_dono(dono)
        app.dependency_overrides[get_supabase] = lambda: sb
        app.dependency_overrides[get_current_user] = lambda: {"id": usuario}
        return TestClient(app), sb

    yield _make
    app.dependency_overrides.clear()


ROTAS_POR_ORCAMENTO = [
    ("get", "/orcamentos/o1"),
    ("delete", "/orcamentos/o1"),
    ("get", "/orcamentos/o1/itens"),
    ("get", "/orcamentos/o1/etapas"),
    ("get", "/orcamentos/o1/pdf"),
]
ROTAS_POR_OBRA = [
    ("get", "/obras/b1"),
    ("get", "/obras/b1/limites"),
    ("get", "/obras/b1/almoxarifado/insumos"),
    ("get", "/obras/b1/financeiro/despesas"),
    ("get", "/obras/b1/financeiro/consolidado"),
]


@pytest.mark.parametrize("metodo,url", ROTAS_POR_ORCAMENTO + ROTAS_POR_OBRA)
def test_usuario_de_outro_dono_recebe_404(make_client, metodo, url):
    client, _ = make_client(INTRUSO, DONO)
    assert getattr(client, metodo)(url).status_code == 404


@pytest.mark.parametrize("metodo,url", ROTAS_POR_ORCAMENTO + ROTAS_POR_OBRA)
def test_registro_inexistente_ou_sem_dono_recebe_404(make_client, metodo, url):
    client, _ = make_client(DONO, None)
    assert getattr(client, metodo)(url).status_code == 404


def test_dono_passa_pela_checagem():
    from core.ownership import enforce_ownership

    request = MagicMock()
    request.path_params = {"obra_id": "b1"}
    usuario = {"id": DONO}
    assert enforce_ownership(request, usuario, _supabase_com_dono(DONO)) == usuario


def test_listagem_de_orcamentos_filtra_por_usuario(make_client):
    client, sb = make_client(DONO, DONO)
    client.get("/orcamentos/")
    sb.table.return_value.select.return_value.eq.assert_any_call("user_id", DONO)


def test_criar_orcamento_grava_user_id():
    from app.modules.orcamento.services import OrcamentoService
    from app.modules.orcamento.schemas import OrcamentoCreate
    from datetime import date

    repo = MagicMock()
    repo.criar.return_value = {"id": "o1"}
    service = OrcamentoService(repo, MagicMock(), MagicMock(), MagicMock())
    service.criar_orcamento(
        OrcamentoCreate(nome="X", cliente="Y", data=date(2026, 1, 1), base_referencia="01/2026",
                        tipo_composicao="Sem Desoneração", estado="SP"),
        user_id=DONO,
    )
    assert repo.criar.call_args.args[0]["user_id"] == DONO
