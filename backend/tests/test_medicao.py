from datetime import date, timedelta
from unittest.mock import MagicMock

import pytest

from app.main import app
from app.modules.diario import services as diario_services
from app.modules.diario.schemas import DiarioCreate, DiarioUpdate
from app.modules.diario.services import DiarioService
from app.modules.medicao import services as medicao_services
from app.modules.medicao.routes import get_medicao_service
from app.modules.medicao.schemas import AvancoEtapa, MedicaoCreate
from app.modules.medicao.services import MedicaoService, calcular_curva, progresso_planejado
from core.exceptions import NaoEncontradoError

HOJE = date(2026, 10, 22)
OBRA = "obra-real"
ORCAMENTO = "orc-1"


def _etapa(etapa_id, inicio, fim, parent_id=None, progresso=0):
    return {
        "id": etapa_id,
        "orcamento_id": ORCAMENTO,
        "nome": f"Etapa {etapa_id}",
        "ordem": 1,
        "parent_id": parent_id,
        "data_inicio": inicio.isoformat() if inicio else None,
        "data_fim": fim.isoformat() if fim else None,
        "progresso": progresso,
    }


def _med(etapa_id, dia, progresso):
    return {"etapa_id": etapa_id, "data": dia.isoformat(), "progresso": progresso}


# --- cálculo da curva ----------------------------------------------------------


def test_planejado_antes_durante_e_depois_da_etapa():
    ini, fim = date(2026, 10, 1), date(2026, 10, 10)
    assert progresso_planejado(ini, fim, date(2026, 9, 30)) == 0
    assert progresso_planejado(ini, fim, ini) == pytest.approx(10.0)
    assert progresso_planejado(ini, fim, date(2026, 10, 5)) == pytest.approx(50.0)
    assert progresso_planejado(ini, fim, fim) == 100.0
    assert progresso_planejado(ini, fim, date(2026, 11, 1)) == 100.0


def test_sem_cronograma_nao_calcula_curva():
    curva = calcular_curva([_etapa("a", None, None)], {}, [], HOJE)
    assert curva["situacao"] == "SEM_CRONOGRAMA"
    assert curva["pontos"] == []
    assert curva["etapas_sem_cronograma"] == 1
    assert curva["planejado_hoje"] is None


def test_etapa_pai_sem_custo_nao_entra_na_curva():
    etapas = [
        _etapa("pai", date(2026, 10, 1), date(2026, 10, 30)),
        _etapa("filha", date(2026, 10, 1), date(2026, 10, 30), parent_id="pai"),
    ]
    curva = calcular_curva(etapas, {"filha": 100.0}, [], HOJE)
    # só a filha pesa: o planejado de hoje é o da filha (22 de 30 dias)
    assert curva["planejado_hoje"] == pytest.approx(73.3, abs=0.1)


def test_pesos_seguem_o_custo_orcado_de_cada_etapa():
    ini, fim = date(2026, 10, 1), date(2026, 10, 10)
    etapas = [_etapa("cara", ini, fim), _etapa("barata", ini, fim)]
    medicoes = [_med("cara", date(2026, 10, 10), 100)]  # só a etapa cara foi concluída
    curva = calcular_curva(etapas, {"cara": 300.0, "barata": 100.0}, medicoes, HOJE)
    assert curva["realizado_hoje"] == 75.0
    # com pesos iguais seriam 50%
    igual = calcular_curva(etapas, {}, medicoes, HOJE)
    assert igual["realizado_hoje"] == 50.0


def test_realizado_usa_a_ultima_medicao_ate_cada_data():
    ini, fim = date(2026, 10, 1), date(2026, 10, 31)
    medicoes = [_med("a", date(2026, 10, 10), 20), _med("a", date(2026, 10, 20), 60)]
    curva = calcular_curva([_etapa("a", ini, fim)], {"a": 1.0}, medicoes, HOJE)
    por_data = {p["data"]: p["realizado"] for p in curva["pontos"]}
    assert por_data[date(2026, 10, 15)] == 20.0
    assert por_data[HOJE] == 60.0


def test_realizado_fica_nulo_depois_de_hoje_e_hoje_entra_nos_pontos():
    curva = calcular_curva([_etapa("a", date(2026, 10, 1), date(2026, 11, 30))], {}, [], HOJE)
    datas = [p["data"] for p in curva["pontos"]]
    assert HOJE in datas and datas == sorted(datas)
    assert all(p["realizado"] is None for p in curva["pontos"] if p["data"] > HOJE)
    assert all(p["realizado"] is not None for p in curva["pontos"] if p["data"] <= HOJE)


def test_progresso_antigo_da_etapa_vale_como_medicao_de_hoje():
    etapa = _etapa("a", date(2026, 10, 1), date(2026, 10, 31), progresso=40)
    assert calcular_curva([etapa], {}, [], HOJE)["realizado_hoje"] == 40.0


@pytest.mark.parametrize(
    "realizado,esperado",
    [(10, "ATRASADA"), (70, "NO_PRAZO"), (95, "ADIANTADA")],
)
def test_situacao_pela_diferenca_entre_realizado_e_planejado(realizado, esperado):
    # etapa de 1 a 30/10: planejado de 22/10 = 73,3%
    medicoes = [_med("a", HOJE, realizado)]
    curva = calcular_curva([_etapa("a", date(2026, 10, 1), date(2026, 10, 30))], {}, medicoes, HOJE)
    assert curva["situacao"] == esperado


def test_obra_que_ainda_nao_comecou_esta_no_prazo():
    curva = calcular_curva([_etapa("a", HOJE + timedelta(days=10), HOJE + timedelta(days=20))], {}, [], HOJE)
    assert curva["situacao"] == "NO_PRAZO"
    assert curva["planejado_hoje"] == 0.0


# --- serviço -------------------------------------------------------------------


@pytest.fixture(autouse=True)
def data_fixa(monkeypatch):
    monkeypatch.setattr(medicao_services, "hoje", lambda: HOJE)
    monkeypatch.setattr(diario_services, "hoje", lambda: HOJE)


@pytest.fixture
def repo():
    r = MagicMock()
    r.resolver_obra.return_value = OBRA
    r.buscar_obra.return_value = {"id": OBRA, "orcamento_id": ORCAMENTO, "status": "EM_ANDAMENTO"}
    r.etapas.return_value = [_etapa("e1", date(2026, 10, 1), date(2026, 10, 30))]
    r.pesos_por_etapa.return_value = {}
    r.listar.return_value = []
    r.buscar_por_etapa_data.return_value = None
    r.inserir.side_effect = lambda dados: {"id": "m1", **dados}
    r.atualizar.side_effect = lambda medicao_id, obra_id, dados: {"id": medicao_id, **dados}
    r.ultima_da_etapa.return_value = {"progresso": 50}
    r.deletar_do_diario.return_value = []
    return r


@pytest.fixture
def service(repo):
    return MedicaoService(repo)


def _nova(**extra):
    base = {"etapa_id": "e1", "data": HOJE, "progresso": 50}
    return MedicaoCreate(**{**base, **extra})


def test_registrar_insere_e_espelha_o_progresso_na_etapa(service, repo):
    resposta = service.registrar("id-do-orcamento", _nova())

    dados = repo.inserir.call_args.args[0]
    assert (dados["obra_id"], dados["etapa_id"], dados["data"], dados["origem"]) == (OBRA, "e1", "2026-10-22", "MANUAL")
    repo.atualizar_progresso_etapa.assert_called_once_with("e1", ORCAMENTO, 50)
    assert resposta["etapa_nome"] == "Etapa e1"


def test_registrar_na_mesma_data_atualiza_a_medicao_existente(service, repo):
    repo.buscar_por_etapa_data.return_value = {"id": "m-antiga"}
    service.registrar(OBRA, _nova(progresso=70))
    repo.atualizar.assert_called_once()
    assert repo.atualizar.call_args.args[0] == "m-antiga"
    repo.inserir.assert_not_called()


def test_registrar_etapa_de_outra_obra_e_recusado(service, repo):
    with pytest.raises(NaoEncontradoError):
        service.registrar(OBRA, _nova(etapa_id="etapa-da-obra-b"))
    repo.inserir.assert_not_called()
    repo.atualizar_progresso_etapa.assert_not_called()


def test_registrar_com_data_futura_e_recusado(service, repo):
    with pytest.raises(ValueError, match="futura"):
        service.registrar(OBRA, _nova(data=HOJE + timedelta(days=1)))
    repo.inserir.assert_not_called()


def test_registrar_em_obra_inexistente(service, repo):
    repo.resolver_obra.return_value = None
    with pytest.raises(NaoEncontradoError):
        service.registrar("x", _nova())


def test_obra_atrasada_muda_o_status_para_atrasado(service, repo):
    repo.listar.return_value = [_med("e1", HOJE, 10)]
    service.registrar(OBRA, _nova(progresso=10))
    repo.atualizar_status_obra.assert_called_once_with(OBRA, "ATRASADO")


def test_obra_que_recupera_o_ritmo_volta_para_em_andamento(service, repo):
    repo.buscar_obra.return_value = {"id": OBRA, "orcamento_id": ORCAMENTO, "status": "ATRASADO"}
    repo.listar.return_value = [_med("e1", HOJE, 75)]
    service.registrar(OBRA, _nova(progresso=75))
    repo.atualizar_status_obra.assert_called_once_with(OBRA, "EM_ANDAMENTO")


def test_obra_concluida_nunca_tem_o_status_alterado(service, repo):
    repo.buscar_obra.return_value = {"id": OBRA, "orcamento_id": ORCAMENTO, "status": "CONCLUIDO"}
    repo.listar.return_value = [_med("e1", HOJE, 10)]
    service.registrar(OBRA, _nova(progresso=10))
    repo.atualizar_status_obra.assert_not_called()


def test_status_sem_mudanca_nao_grava(service, repo):
    repo.listar.return_value = [_med("e1", HOJE, 70)]
    service.registrar(OBRA, _nova(progresso=70))
    repo.atualizar_status_obra.assert_not_called()


def test_remover_medicao_de_outra_obra_e_recusado(service, repo):
    repo.buscar.return_value = None
    with pytest.raises(NaoEncontradoError):
        service.remover(OBRA, "medicao-da-obra-b")
    repo.buscar.assert_called_once_with("medicao-da-obra-b", OBRA)
    repo.deletar.assert_not_called()


def test_remover_recalcula_o_progresso_da_etapa(service, repo):
    repo.buscar.return_value = {"id": "m1", "etapa_id": "e1"}
    repo.ultima_da_etapa.return_value = None  # era a única medição
    service.remover(OBRA, "m1")
    repo.deletar.assert_called_once_with("m1", OBRA)
    repo.atualizar_progresso_etapa.assert_called_once_with("e1", ORCAMENTO, 0)


def test_listar_traz_o_nome_da_etapa(service, repo):
    repo.listar.return_value = [{"id": "m1", "etapa_id": "e1", "progresso": 10}]
    assert service.listar(OBRA)[0]["etapa_nome"] == "Etapa e1"


def test_substituir_do_diario_troca_as_medicoes_anteriores(service, repo):
    repo.deletar_do_diario.return_value = ["e-antiga"]
    resultado = service.substituir_do_diario(OBRA, "d1", HOJE, [AvancoEtapa(etapa_id="e1", progresso=30)])

    repo.deletar_do_diario.assert_called_once_with("d1", OBRA)
    dados = repo.inserir.call_args.args[0]
    assert (dados["origem"], dados["diario_id"], dados["progresso"]) == ("DIARIO", "d1", 30)
    assert resultado == {"e1": 30}
    espelhadas = {c.args[0] for c in repo.atualizar_progresso_etapa.call_args_list}
    assert espelhadas == {"e-antiga", "e1"}


def test_substituir_valida_as_etapas_antes_de_apagar_qualquer_coisa(service, repo):
    with pytest.raises(NaoEncontradoError):
        service.substituir_do_diario(OBRA, "d1", HOJE, [AvancoEtapa(etapa_id="etapa-da-obra-b", progresso=30)])
    repo.deletar_do_diario.assert_not_called()


def test_registrar_por_orcamento_sem_obra_nao_faz_nada(service, repo):
    repo.buscar_obra_por_orcamento.return_value = None
    service.registrar_por_orcamento(ORCAMENTO, "e1", 40)
    repo.inserir.assert_not_called()


def test_registrar_por_orcamento_grava_a_medicao_de_hoje(service, repo):
    repo.buscar_obra_por_orcamento.return_value = repo.buscar_obra.return_value
    service.registrar_por_orcamento(ORCAMENTO, "e1", 40)
    assert repo.inserir.call_args.args[0]["data"] == HOJE.isoformat()


def test_registrar_por_orcamento_engole_falhas(service, repo):
    repo.buscar_obra_por_orcamento.side_effect = RuntimeError("banco fora")
    service.registrar_por_orcamento(ORCAMENTO, "e1", 40)  # não levanta


def test_curva_s_sincroniza_o_status(service, repo):
    repo.listar.return_value = [_med("e1", HOJE, 5)]
    assert service.curva_s(OBRA)["situacao"] == "ATRASADA"
    repo.atualizar_status_obra.assert_called_once_with(OBRA, "ATRASADO")


def test_curva_s_de_obra_sem_orcamento(service, repo):
    repo.buscar_obra.return_value = {"id": OBRA, "orcamento_id": None, "status": "EM_ANDAMENTO"}
    assert service.curva_s(OBRA)["situacao"] == "SEM_CRONOGRAMA"


# --- rotas ---------------------------------------------------------------------


@pytest.fixture
def api(client, repo):
    app.dependency_overrides[get_medicao_service] = lambda: MedicaoService(repo)
    return client


def test_rota_registrar_medicao(api):
    r = api.post(f"/obras/{OBRA}/medicoes", json={"etapa_id": "e1", "data": "2026-10-22", "progresso": 40})
    assert r.status_code == 201
    assert r.json()["progresso"] == 40


@pytest.mark.parametrize("progresso", [-1, 101])
def test_rota_progresso_fora_de_0_a_100_responde_422(api, progresso):
    r = api.post(f"/obras/{OBRA}/medicoes", json={"etapa_id": "e1", "data": "2026-10-22", "progresso": progresso})
    assert r.status_code == 422


def test_rota_etapa_de_outra_obra_responde_404(api):
    r = api.post(f"/obras/{OBRA}/medicoes", json={"etapa_id": "outra", "data": "2026-10-22", "progresso": 10})
    assert r.status_code == 404


def test_rota_remover_medicao_de_outra_obra_responde_404(api, repo):
    repo.buscar.return_value = None
    assert api.delete(f"/obras/{OBRA}/medicoes/m-outra").status_code == 404


def test_rota_curva_s(api):
    r = api.get(f"/obras/{OBRA}/curva-s")
    assert r.status_code == 200
    assert r.json()["situacao"] in {"NO_PRAZO", "ATRASADA", "ADIANTADA", "SEM_CRONOGRAMA"}


def test_rota_listar_medicoes(api, repo):
    repo.listar.return_value = [
        {"id": "m1", "obra_id": OBRA, "etapa_id": "e1", "data": "2026-10-20", "progresso": 10, "origem": "MANUAL"}
    ]
    r = api.get(f"/obras/{OBRA}/medicoes?etapa_id=e1")
    assert r.status_code == 200 and r.json()[0]["etapa_nome"] == "Etapa e1"


# --- integração com o diário ---------------------------------------------------


def _repo_diario():
    r = MagicMock()
    r.resolver_obra.return_value = OBRA
    r.buscar_por_data.return_value = None
    r.listar_fotos.return_value = []
    r.assinar_urls.return_value = {}
    r.avancos_dos_diarios.return_value = []
    r.criar.side_effect = lambda obra_id, dados: {
        "id": "d1",
        "obra_id": obra_id,
        "ocorrencias": None,
        "status": "RASCUNHO",
        **dados,
    }
    return r


def _novo_diario(**extra):
    base = {"data": date(2026, 10, 21), "titulo": "Concretagem", "atividades": "Laje", "clima": "SOL"}
    return DiarioCreate(**{**base, **extra})


def test_diario_com_avancos_registra_as_medicoes_na_data_do_diario():
    medicoes = MagicMock()
    DiarioService(_repo_diario(), medicoes).criar(OBRA, _novo_diario(avancos=[AvancoEtapa(etapa_id="e1", progresso=30)]))

    obra, diario_id, data, avancos = medicoes.substituir_do_diario.call_args.args
    assert (obra, diario_id, data) == (OBRA, "d1", date(2026, 10, 21))
    assert avancos[0].progresso == 30


def test_avancos_nao_vao_para_a_tabela_do_diario():
    repo = _repo_diario()
    DiarioService(repo, MagicMock()).criar(OBRA, _novo_diario(avancos=[AvancoEtapa(etapa_id="e1", progresso=30)]))
    assert "avancos" not in repo.criar.call_args.args[1]


def test_falha_nas_medicoes_desfaz_a_criacao_do_diario():
    repo = _repo_diario()
    medicoes = MagicMock()
    medicoes.substituir_do_diario.side_effect = NaoEncontradoError("Etapa não encontrada nesta obra")

    with pytest.raises(NaoEncontradoError):
        DiarioService(repo, medicoes).criar(OBRA, _novo_diario(avancos=[AvancoEtapa(etapa_id="outra", progresso=30)]))
    repo.deletar.assert_called_once_with("d1", OBRA)


def test_diario_sem_avancos_nao_mexe_nas_medicoes():
    medicoes = MagicMock()
    DiarioService(_repo_diario(), medicoes).criar(OBRA, _novo_diario())
    medicoes.substituir_do_diario.assert_not_called()


def test_atualizar_sem_informar_avancos_preserva_as_medicoes():
    repo = _repo_diario()
    repo.buscar.return_value = {"id": "d1", "obra_id": OBRA, "data": "2026-10-21", "status": "RASCUNHO"}
    repo.atualizar.side_effect = lambda diario_id, obra_id, dados: {**repo.buscar.return_value, **dados}
    medicoes = MagicMock()

    DiarioService(repo, medicoes).atualizar(OBRA, "d1", DiarioUpdate(titulo="Novo título"))
    medicoes.substituir_do_diario.assert_not_called()


def test_atualizar_com_lista_vazia_remove_as_medicoes():
    repo = _repo_diario()
    repo.buscar.return_value = {"id": "d1", "obra_id": OBRA, "data": "2026-10-21", "status": "RASCUNHO"}
    repo.atualizar.side_effect = lambda diario_id, obra_id, dados: {**repo.buscar.return_value, **dados}
    medicoes = MagicMock()

    DiarioService(repo, medicoes).atualizar(OBRA, "d1", DiarioUpdate(avancos=[]))
    assert medicoes.substituir_do_diario.call_args.args[3] == []


def test_excluir_diario_remove_as_medicoes_dele():
    repo = _repo_diario()
    repo.buscar.return_value = {"id": "d1", "obra_id": OBRA, "data": "2026-10-21", "status": "RASCUNHO"}
    repo.deletar.return_value = True
    medicoes = MagicMock()

    DiarioService(repo, medicoes).deletar(OBRA, "d1")
    assert medicoes.substituir_do_diario.call_args.args[3] == []
    repo.deletar.assert_called_once_with("d1", OBRA)


def test_diario_traz_os_avancos_com_o_nome_da_etapa():
    repo = _repo_diario()
    repo.buscar.return_value = {"id": "d1", "obra_id": OBRA, "status": "RASCUNHO", "ocorrencias": None}
    repo.avancos_dos_diarios.return_value = [
        {"diario_id": "d1", "etapa_id": "e1", "etapa_nome": "Fundação", "progresso": 30}
    ]
    avancos = DiarioService(repo).obter(OBRA, "d1")["avancos"]
    assert avancos == [{"etapa_id": "e1", "etapa_nome": "Fundação", "progresso": 30}]
