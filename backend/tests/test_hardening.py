import pytest
from fastapi.testclient import TestClient

from app.main import app
from core.config import Settings, settings
from core.exceptions import NaoEncontradoError


@pytest.fixture
def client_sem_raise():
    # raise_server_exceptions=False: deixa os exception handlers responderem
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def rota_que_explode():
    @app.get("/__boom")
    def boom():
        raise RuntimeError("senha do banco: hunter2")

    @app.get("/__naoencontrado")
    def nao_encontrado():
        raise NaoEncontradoError("Coisa não encontrada")

    @app.get("/__valor")
    def valor():
        raise ValueError("Orçamento sem itens não encontrado em cache")

    yield
    app.router.routes[:] = [r for r in app.router.routes if not getattr(r, "path", "").startswith("/__")]


def test_500_em_producao_nao_vaza_mensagem(client_sem_raise, rota_que_explode, monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    r = client_sem_raise.get("/__boom")
    assert r.status_code == 500
    assert "hunter2" not in r.text


def test_500_em_desenvolvimento_mantem_detalhe(client_sem_raise, rota_que_explode, monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    assert "hunter2" in client_sem_raise.get("/__boom").text


def test_404_vem_do_tipo_da_excecao_e_nao_do_texto(client_sem_raise, rota_que_explode):
    assert client_sem_raise.get("/__naoencontrado").status_code == 404
    # contém "não encontrado" no texto, mas é ValueError comum -> 400
    assert client_sem_raise.get("/__valor").status_code == 400


def test_500_so_ecoa_origem_permitida(client_sem_raise, rota_que_explode, monkeypatch):
    monkeypatch.setattr(settings, "CORS_ORIGINS", "https://a.com")
    ok = client_sem_raise.get("/__boom", headers={"Origin": "https://a.com"})
    assert ok.headers.get("access-control-allow-origin") == "https://a.com"
    negado = client_sem_raise.get("/__boom", headers={"Origin": "https://evil.com"})
    assert "access-control-allow-origin" not in negado.headers


@pytest.mark.parametrize("origens", ["*", "", "https://a.com,*"])
def test_producao_recusa_cors_aberto(origens):
    with pytest.raises(ValueError):
        Settings(ENVIRONMENT="production", CORS_ORIGINS=origens)


def test_producao_aceita_origens_explicitas():
    s = Settings(ENVIRONMENT="production", CORS_ORIGINS="https://a.com, https://b.com")
    assert s.cors_origins_list == ["https://a.com", "https://b.com"]
