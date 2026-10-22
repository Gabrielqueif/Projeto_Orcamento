from datetime import date, timedelta
from unittest.mock import MagicMock

import pytest

from app.main import app
from app.modules.dashboard import services as dashboard_services
from app.modules.dashboard.routes import get_dashboard_service
from app.modules.dashboard.services import MAX_FEED, MAX_RISCOS, DashboardService

HOJE = date(2026, 10, 22)
USUARIO = "user-1"


@pytest.fixture(autouse=True)
def data_fixa(monkeypatch):
    monkeypatch.setattr(dashboard_services, "hoje", lambda: HOJE)


def _obra(obra_id="o1", status="EM_ANDAMENTO", inicio="2026-10-01"):
    return {
        "id": obra_id,
        "orcamento_id": f"orc-{obra_id}",
        "cliente": "Cliente",
        "escopo": f"Obra {obra_id}",
        "status": status,
        "data_inicio_real": inicio,
        "prazo_estimado_dias": 60,
    }


def _etapa(etapa_id="e1", inicio="2026-10-01", fim="2026-10-30", progresso=0):
    return {
        "id": etapa_id,
        "nome": f"Etapa {etapa_id}",
        "parent_id": None,
        "data_inicio": inicio,
        "data_fim": fim,
        "progresso": progresso,
    }


def _financeiro(orcado=1000.0, realizado=500.0):
    return {"total_orcado": orcado, "total_realizado": realizado}


def _diario(obra_id="o1", dias_atras=0, titulo="Concretagem", status="ENVIADO"):
    return {
        "obra_id": obra_id,
        "data": (HOJE - timedelta(days=dias_atras)).isoformat(),
        "titulo": titulo,
        "status": status,
        "updated_at": f"2026-10-{22 - dias_atras:02d}T10:00:00Z",
    }


@pytest.fixture
def repo():
    r = MagicMock()
    r.obras_do_usuario.return_value = [_obra()]
    r.nomes_de_orcamentos.return_value = {}
    r.insumos_criticos_por_obra.return_value = {}
    r.diarios_recentes.return_value = [_diario()]
    return r


@pytest.fixture
def medicoes():
    m = MagicMock()
    m.etapas.return_value = [_etapa()]
    m.pesos_por_etapa.return_value = {}
    m.listar.return_value = []
    return m


@pytest.fixture
def financeiro():
    f = MagicMock()
    f.obter_consolidado_financeiro.return_value = _financeiro()
    return f


@pytest.fixture
def service(repo, medicoes, financeiro):
    return DashboardService(repo, medicoes, financeiro)


def _riscos(dados, tipo):
    return [r for r in dados["riscos"] if r["tipo"] == tipo]


# --- totais --------------------------------------------------------------------


def test_sem_obras_ativas_devolve_painel_zerado(service, repo):
    repo.obras_do_usuario.return_value = []
    dados = service.obter(USUARIO)

    assert dados["obras_ativas"] == 0
    assert dados["riscos"] == [] and dados["series"] == [] and dados["feed"] == []
    assert dados["semanas"] == ["01/10", "08/10", "15/10", "22/10"]


def test_so_consulta_as_obras_do_usuario(service, repo):
    service.obter(USUARIO)
    repo.obras_do_usuario.assert_called_once_with(USUARIO)


def test_obras_concluidas_ficam_de_fora(service, repo):
    repo.obras_do_usuario.return_value = [_obra("o1"), _obra("o2", status="CONCLUIDO"), _obra("o3", status="CONCLUIDA")]
    assert service.obter(USUARIO)["obras_ativas"] == 1


def test_totais_financeiros_somam_as_obras_ativas(service, repo, financeiro):
    repo.obras_do_usuario.return_value = [_obra("o1"), _obra("o2")]
    financeiro.obter_consolidado_financeiro.side_effect = [_financeiro(1000, 400), _financeiro(3000, 1100)]

    dados = service.obter(USUARIO)
    assert dados["orcamento_total"] == 4000.0
    assert dados["gasto_realizado"] == 1500.0
    assert dados["disponivel"] == 2500.0
    assert dados["utilizacao_orcamento"] == 37.5


def test_disponivel_nao_fica_negativo_quando_estoura(service, financeiro):
    financeiro.obter_consolidado_financeiro.return_value = _financeiro(1000, 1300)
    dados = service.obter(USUARIO)
    assert dados["disponivel"] == 0.0
    assert dados["utilizacao_orcamento"] == 130.0


def test_orcamento_zerado_nao_divide_por_zero(service, financeiro):
    financeiro.obter_consolidado_financeiro.return_value = _financeiro(0, 0)
    assert service.obter(USUARIO)["utilizacao_orcamento"] == 0.0


def test_progresso_medio_das_obras(service, repo, medicoes):
    repo.obras_do_usuario.return_value = [_obra("o1"), _obra("o2")]
    medicoes.etapas.side_effect = [[_etapa(progresso=20), _etapa("e2", progresso=40)], [_etapa(progresso=80)]]
    # obra 1 = 30%, obra 2 = 80% -> média 55%
    assert service.obter(USUARIO)["progresso_medio"] == 55


# --- riscos --------------------------------------------------------------------


def test_obra_muito_atrasada_gera_risco_critico(service, medicoes):
    medicoes.listar.return_value = [{"etapa_id": "e1", "data": "2026-10-22", "progresso": 10}]
    dados = service.obter(USUARIO)

    risco = _riscos(dados, "ATRASO")[0]
    assert risco["severidade"] == "critical"
    assert risco["href"] == "/obras/orc-o1"
    assert dados["alertas_criticos"] == 1


def test_atraso_leve_e_moderado(service, medicoes):
    # planejado de hoje = 73,3%; realizado 65% -> desvio de -8,3 p.p.
    medicoes.listar.return_value = [{"etapa_id": "e1", "data": "2026-10-22", "progresso": 65}]
    dados = service.obter(USUARIO)
    assert _riscos(dados, "ATRASO")[0]["severidade"] == "moderate"
    assert dados["alertas_criticos"] == 0


def test_obra_no_prazo_nao_gera_risco_de_atraso(service, medicoes):
    medicoes.listar.return_value = [{"etapa_id": "e1", "data": "2026-10-22", "progresso": 75}]
    assert _riscos(service.obter(USUARIO), "ATRASO") == []


def test_estouro_de_orcamento_e_critico(service, financeiro):
    financeiro.obter_consolidado_financeiro.return_value = _financeiro(1000, 1184)
    risco = _riscos(service.obter(USUARIO), "ORCAMENTO")[0]
    assert risco["severidade"] == "critical"
    assert "18,4%" in risco["descricao"]
    assert risco["href"] == "/financeiro/orc-o1"


def test_orcamento_quase_esgotado_e_moderado(service, financeiro):
    financeiro.obter_consolidado_financeiro.return_value = _financeiro(1000, 950)
    assert _riscos(service.obter(USUARIO), "ORCAMENTO")[0]["severidade"] == "moderate"


def test_orcamento_dentro_do_limite_nao_gera_risco(service, financeiro):
    financeiro.obter_consolidado_financeiro.return_value = _financeiro(1000, 500)
    assert _riscos(service.obter(USUARIO), "ORCAMENTO") == []


def test_estoque_critico_gera_risco_moderado(service, repo):
    repo.insumos_criticos_por_obra.return_value = {"o1": 3}
    risco = _riscos(service.obter(USUARIO), "ESTOQUE")[0]
    assert risco["severidade"] == "moderate"
    assert "3 insumo(s)" in risco["descricao"]
    assert risco["href"] == "/obras/orc-o1/almoxarifado"


def test_diario_ha_dois_dias_sem_registro_gera_risco(service, repo):
    repo.diarios_recentes.return_value = [_diario(dias_atras=3)]
    risco = _riscos(service.obter(USUARIO), "DIARIO")[0]
    assert risco["href"] == "/diario/o1"


def test_diario_em_dia_nao_gera_risco(service):
    assert _riscos(service.obter(USUARIO), "DIARIO") == []


def test_riscos_criticos_vem_primeiro_e_a_lista_e_limitada(service, repo, medicoes, financeiro):
    repo.obras_do_usuario.return_value = [_obra(f"o{i}") for i in range(6)]
    repo.insumos_criticos_por_obra.return_value = {f"o{i}": 1 for i in range(6)}  # 6 moderados
    financeiro.obter_consolidado_financeiro.side_effect = [_financeiro(1000, 1500)] + [_financeiro()] * 5  # 1 crítico

    dados = service.obter(USUARIO)
    assert len(dados["riscos"]) == MAX_RISCOS
    assert dados["riscos"][0]["severidade"] == "critical"


# --- status e séries -----------------------------------------------------------


def test_obra_atrasada_tem_o_status_sincronizado(service, repo, medicoes):
    medicoes.listar.return_value = [{"etapa_id": "e1", "data": "2026-10-22", "progresso": 10}]
    service.obter(USUARIO)
    repo.atualizar_status_obra.assert_called_once_with("o1", "ATRASADO")


def test_status_ja_correto_nao_e_regravado(service, repo, medicoes):
    repo.obras_do_usuario.return_value = [_obra(status="ATRASADO")]
    medicoes.listar.return_value = [{"etapa_id": "e1", "data": "2026-10-22", "progresso": 10}]
    service.obter(USUARIO)
    repo.atualizar_status_obra.assert_not_called()


def test_falha_ao_sincronizar_status_nao_derruba_o_painel(service, repo, medicoes):
    medicoes.listar.return_value = [{"etapa_id": "e1", "data": "2026-10-22", "progresso": 10}]
    repo.atualizar_status_obra.side_effect = RuntimeError("banco fora")
    assert service.obter(USUARIO)["obras_ativas"] == 1


def test_serie_semanal_acompanha_as_medicoes(service, medicoes):
    medicoes.listar.return_value = [
        {"etapa_id": "e1", "data": "2026-10-10", "progresso": 20},
        {"etapa_id": "e1", "data": "2026-10-20", "progresso": 60},
    ]
    serie = service.obter(USUARIO)["series"][0]
    # semanas: 01/10, 08/10, 15/10, 22/10
    assert serie["valores"] == [0.0, 0.0, 20.0, 60.0]
    assert serie["nome"] == "Obra o1"


def test_progresso_anterior_as_medicoes_nao_aparece_nas_semanas_passadas(service, medicoes):
    medicoes.etapas.return_value = [_etapa(progresso=40)]
    assert service.obter(USUARIO)["series"][0]["valores"] == [0.0, 0.0, 0.0, 40.0]


def test_obra_sem_cronograma_nao_entra_nas_series(service, medicoes):
    medicoes.etapas.return_value = [_etapa(inicio=None, fim=None)]
    assert service.obter(USUARIO)["series"] == []


def test_series_limitadas_as_primeiras_obras(service, repo):
    repo.obras_do_usuario.return_value = [_obra(f"o{i}") for i in range(7)]
    assert len(service.obter(USUARIO)["series"]) == 4


# --- feed ----------------------------------------------------------------------


def test_feed_traz_os_diarios_mais_recentes_com_o_nome_da_obra(service, repo):
    repo.nomes_de_orcamentos.return_value = {"orc-o1": "Residencial Aurora"}
    repo.diarios_recentes.return_value = [_diario(dias_atras=i, titulo=f"Dia {i}") for i in range(9)]

    feed = service.obter(USUARIO)["feed"]
    assert len(feed) == MAX_FEED
    assert [f["titulo"] for f in feed][:2] == ["Dia 0", "Dia 1"]
    assert feed[0]["obra_nome"] == "Residencial Aurora"
    assert feed[0]["href"] == "/diario/o1"


# --- rota ----------------------------------------------------------------------


def test_rota_dashboard(client, service):
    app.dependency_overrides[get_dashboard_service] = lambda: service
    resposta = client.get("/dashboard")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["obras_ativas"] == 1
    assert len(corpo["semanas"]) == 4


def test_rota_dashboard_usa_o_usuario_autenticado(client, service, repo):
    app.dependency_overrides[get_dashboard_service] = lambda: service
    client.get("/dashboard")
    repo.obras_do_usuario.assert_called_once_with("test-user-id")
