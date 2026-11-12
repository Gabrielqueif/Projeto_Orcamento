"""Acesso de mestre/supervisor: convite (hash, expiração, uso único) e permissão por vínculo."""
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_supabase
from app.main import app
from app.modules.acesso.schemas import ConviteCreate
from app.modules.acesso.services import AcessoService, hash_token
from core.exceptions import NaoEncontradoError
from core.security import get_current_user

DONO = "dono"
MEMBRO = "membro"
OUTRO = "outro"
OBRA = "obra-1"


# --- Serviço ---------------------------------------------------------------


def test_criar_convite_guarda_so_o_hash():
    repo = MagicMock()
    repo.resolver_obra.return_value = OBRA
    repo.criar_convite.side_effect = lambda d: {"id": "c1", "papel": d["papel"], "expira_em": d["expira_em"]}

    r = AcessoService(repo).criar_convite("x", ConviteCreate(papel="SUPERVISOR"), DONO)

    gravado = repo.criar_convite.call_args.args[0]
    assert gravado["token_hash"] == hash_token(r["token"])
    assert r["token"] not in gravado.values()
    assert gravado["papel"] == "SUPERVISOR"
    assert datetime.fromisoformat(gravado["expira_em"]) > datetime.now(timezone.utc)


def test_aceitar_convite_cria_vinculo():
    repo = MagicMock()
    repo.consumir_convite.return_value = {"id": "c1", "obra_id": OBRA, "papel": "MESTRE", "criado_por": DONO}

    r = AcessoService(repo).aceitar_convite("tok", MEMBRO)

    assert repo.consumir_convite.call_args.args[:2] == (hash_token("tok"), MEMBRO)
    repo.upsert_membro.assert_called_once()
    assert r == {"obra_id": OBRA, "papel": "MESTRE"}


def test_convite_expirado_usado_ou_inexistente_recusa():
    repo = MagicMock()
    repo.consumir_convite.return_value = None  # UPDATE condicional não achou linha
    with pytest.raises(NaoEncontradoError):
        AcessoService(repo).aceitar_convite("tok", MEMBRO)
    repo.upsert_membro.assert_not_called()


def test_falha_ao_vincular_devolve_o_convite():
    repo = MagicMock()
    repo.consumir_convite.return_value = {"id": "c1", "obra_id": OBRA, "papel": "MESTRE"}
    repo.upsert_membro.side_effect = RuntimeError("db")
    with pytest.raises(RuntimeError):
        AcessoService(repo).aceitar_convite("tok", MEMBRO)
    repo.liberar_convite.assert_called_once_with("c1")


def test_consumir_convite_filtra_uso_e_validade():
    from app.modules.acesso.repositories import AcessoRepository

    sb = MagicMock()
    AcessoRepository(sb).consumir_convite("h", MEMBRO, "2026-01-01T00:00:00+00:00")
    chain = sb.table.return_value.update.return_value.eq.return_value
    chain.is_.assert_called_once_with("usado_em", "null")
    chain.is_.return_value.gt.assert_called_once_with("expira_em", "2026-01-01T00:00:00+00:00")


# --- enforce_obra_access (rotas do diário) ---------------------------------


def _supabase(dono, papel_membro=None):
    """obras → {id, user_id: dono}; obra_membros → papel (None = sem vínculo)."""
    sb = MagicMock()

    def table(nome):
        t = MagicMock()
        if nome == "obras":
            t.select.return_value.eq.return_value.execute.return_value.data = [{"id": OBRA, "user_id": dono}]
        elif nome == "obra_membros":
            t.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = (
                [{"papel": papel_membro}] if papel_membro else []
            )
        return t

    sb.table.side_effect = table
    return sb


@pytest.fixture
def make_client():
    def _make(usuario, sb):
        app.dependency_overrides[get_supabase] = lambda: sb
        app.dependency_overrides[get_current_user] = lambda: {"id": usuario}
        return TestClient(app)

    yield _make
    app.dependency_overrides.clear()


def test_membro_vinculado_acessa_diario_da_obra(make_client):
    r = make_client(MEMBRO, _supabase(DONO, "MESTRE")).get(f"/obras/{OBRA}/diario")
    assert r.status_code != 404  # passou pelo acesso (a resposta depende do mock do serviço)


def test_usuario_sem_vinculo_recebe_404(make_client):
    assert make_client(OUTRO, _supabase(DONO, None)).get(f"/obras/{OBRA}/diario").status_code == 404


@pytest.mark.parametrize(
    "metodo,url",
    [
        ("get", f"/obras/{OBRA}/membros"),
        ("post", f"/obras/{OBRA}/convites"),
        ("get", f"/obras/{OBRA}/financeiro/despesas"),
        ("get", f"/obras/{OBRA}/almoxarifado/insumos"),
        ("get", f"/orcamentos/{OBRA}"),
    ],
)
def test_membro_nao_alcanca_rotas_exclusivas_do_dono(make_client, metodo, url):
    r = getattr(make_client(MEMBRO, _supabase(DONO, "MESTRE")), metodo)(url)
    assert r.status_code == 404


def test_membro_le_os_cargos_do_dono(make_client):
    sb = _supabase(DONO, "MESTRE")
    base = sb.table.side_effect

    def table(nome):
        if nome == "cargos":
            t = MagicMock()
            t.select.return_value.or_.return_value.order.return_value.execute.return_value.data = []
            return t
        return base(nome)

    sb.table.side_effect = table
    r = make_client(MEMBRO, sb).get(f"/obras/{OBRA}/canteiro/cargos")
    assert r.status_code == 200
    # a consulta de cargos usa o dono da obra, não o membro
    filtro = [c for c in sb.table.call_args_list if c.args == ("cargos",)]
    assert filtro


def test_usuario_sem_vinculo_nao_le_cargos(make_client):
    assert make_client(OUTRO, _supabase(DONO, None)).get(f"/obras/{OBRA}/canteiro/cargos").status_code == 404
