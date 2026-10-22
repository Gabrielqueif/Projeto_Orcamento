from datetime import date, timedelta
from unittest.mock import MagicMock

import pytest

from app.main import app
from app.modules.diario import services as diario_services
from app.modules.diario.routes import get_diario_service
from app.modules.diario.schemas import DiarioCreate, DiarioUpdate
from app.modules.diario.services import DiarioService, detectar_imagem, formatar_endereco
from core.exceptions import NaoEncontradoError

OBRA = "obra-real"
DIARIO = "diario-1"
HOJE = date(2026, 10, 22)

JPEG = b"\xff\xd8\xff\xe0" + b"0" * 32
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 32
WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"0" * 32


def _diario(**extra):
    base = {
        "id": DIARIO,
        "obra_id": OBRA,
        "data": "2026-10-21",
        "titulo": "Concretagem",
        "atividades": "Laje L2",
        "ocorrencias": None,
        "clima": "SOL",
        "temperatura": 28.0,
        "equipe_presente": 10,
        "responsavel": "Eng. Ricardo",
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
    r.buscar_por_data.return_value = None
    r.listar_fotos.return_value = []
    r.assinar_urls.return_value = {}
    r.atualizar.side_effect = lambda diario_id, obra_id, dados: _diario(**dados)
    r.criar.side_effect = lambda obra_id, dados: _diario(**dados)
    return r


@pytest.fixture
def service(repo):
    return DiarioService(repo)


def _novo(**extra):
    base = {"data": date(2026, 10, 21), "titulo": "Concretagem", "atividades": "Laje L2", "clima": "SOL"}
    return DiarioCreate(**{**base, **extra})


# --- criação -----------------------------------------------------------------


def test_criar_grava_na_obra_real_com_dados_serializados(service, repo):
    service.criar("id-do-orcamento", _novo(temperatura=27.5))

    obra_gravada, dados = repo.criar.call_args.args
    assert obra_gravada == OBRA
    assert dados["data"] == "2026-10-21"
    assert dados["temperatura"] == 27.5


def test_criar_em_obra_inexistente_responde_nao_encontrado(service, repo):
    repo.resolver_obra.return_value = None
    with pytest.raises(NaoEncontradoError):
        service.criar("x", _novo())
    repo.criar.assert_not_called()


def test_criar_com_data_futura_e_recusado(service, repo):
    with pytest.raises(ValueError, match="futura"):
        service.criar(OBRA, _novo(data=HOJE + timedelta(days=1)))
    repo.criar.assert_not_called()


def test_criar_segundo_diario_na_mesma_data_e_recusado(service, repo):
    repo.buscar_por_data.return_value = {"id": "outro"}
    with pytest.raises(ValueError, match="Já existe"):
        service.criar(OBRA, _novo())
    repo.criar.assert_not_called()


def test_titulo_vazio_nao_passa_na_validacao():
    with pytest.raises(ValueError):
        _novo(titulo="   ")


# --- isolamento por obra ------------------------------------------------------


def test_obter_diario_de_outra_obra_responde_nao_encontrado(service, repo):
    repo.buscar.return_value = None
    with pytest.raises(NaoEncontradoError):
        service.obter("id-do-orcamento", "diario-da-obra-b")
    repo.buscar.assert_called_once_with("diario-da-obra-b", OBRA)


def test_remover_foto_de_outro_diario_responde_nao_encontrado(service, repo):
    repo.buscar_foto.return_value = None
    with pytest.raises(NaoEncontradoError):
        service.remover_foto(OBRA, DIARIO, "foto-do-diario-b")
    repo.buscar_foto.assert_called_once_with("foto-do-diario-b", DIARIO)
    repo.deletar_foto.assert_not_called()
    repo.remover_arquivos.assert_not_called()


# --- edição e status ---------------------------------------------------------


def test_diario_aprovado_nao_pode_ser_editado(service, repo):
    repo.buscar.return_value = _diario(status="APROVADO")
    with pytest.raises(ValueError, match="aprovado"):
        service.atualizar(OBRA, DIARIO, DiarioUpdate(titulo="Novo"))
    repo.atualizar.assert_not_called()


def test_atualizar_campo_obrigatorio_para_nulo_e_recusado(service):
    with pytest.raises(ValueError, match="atividades"):
        service.atualizar(OBRA, DIARIO, DiarioUpdate(atividades=None))


def test_atualizar_pode_limpar_ocorrencias(service, repo):
    service.atualizar(OBRA, DIARIO, DiarioUpdate(ocorrencias=None))
    assert repo.atualizar.call_args.args[2]["ocorrencias"] is None


def test_atualizar_para_data_ja_usada_e_recusado(service, repo):
    repo.buscar_por_data.return_value = {"id": "outro-diario"}
    with pytest.raises(ValueError, match="Já existe"):
        service.atualizar(OBRA, DIARIO, DiarioUpdate(data=date(2026, 10, 20)))


def test_atualizar_mantendo_a_propria_data_nao_conflita(service, repo):
    repo.buscar_por_data.return_value = {"id": DIARIO}
    service.atualizar(OBRA, DIARIO, DiarioUpdate(data=date(2026, 10, 21)))
    repo.atualizar.assert_called_once()


@pytest.mark.parametrize("de,para", [("RASCUNHO", "APROVADO"), ("APROVADO", "RASCUNHO"), ("RASCUNHO", "RASCUNHO")])
def test_transicao_de_status_invalida_e_recusada(service, repo, de, para):
    repo.buscar.return_value = _diario(status=de)
    with pytest.raises(ValueError, match="Não é possível"):
        service.alterar_status(OBRA, DIARIO, para)
    repo.atualizar.assert_not_called()


@pytest.mark.parametrize(
    "de,para",
    [("RASCUNHO", "ENVIADO"), ("ENVIADO", "APROVADO"), ("ENVIADO", "RASCUNHO"), ("APROVADO", "ENVIADO")],
)
def test_transicao_de_status_valida(service, repo, de, para):
    repo.buscar.return_value = _diario(status=de)
    assert service.alterar_status(OBRA, DIARIO, para)["status"] == para


def test_ocorrencia_so_com_texto_marca_tem_ocorrencia(service, repo):
    repo.buscar.return_value = _diario(ocorrencias="   ")
    assert service.obter(OBRA, DIARIO)["tem_ocorrencia"] is False
    repo.buscar.return_value = _diario(ocorrencias="Chuva paralisou a concretagem")
    assert service.obter(OBRA, DIARIO)["tem_ocorrencia"] is True


# --- exclusão e fotos --------------------------------------------------------


def test_deletar_remove_registro_e_arquivos(service, repo):
    repo.listar_fotos.return_value = [{"caminho": "a/b.jpg"}, {"caminho": "a/c.jpg"}]
    repo.deletar.return_value = True
    service.deletar(OBRA, DIARIO)
    repo.deletar.assert_called_once_with(DIARIO, OBRA)
    repo.remover_arquivos.assert_called_once_with(["a/b.jpg", "a/c.jpg"])


def test_deletar_diario_aprovado_e_recusado(service, repo):
    repo.buscar.return_value = _diario(status="APROVADO")
    with pytest.raises(ValueError, match="aprovado"):
        service.deletar(OBRA, DIARIO)
    repo.deletar.assert_not_called()


def test_adicionar_foto_envia_para_pasta_da_obra_e_do_diario(service, repo):
    repo.criar_foto.side_effect = lambda diario_id, caminho, legenda: {"id": "f1", "legenda": legenda}
    repo.assinar_urls.side_effect = lambda caminhos: {caminhos[0]: "https://assinada"}

    foto = service.adicionar_foto(OBRA, DIARIO, PNG, "  Laje  ")

    caminho, conteudo, content_type = repo.enviar_arquivo.call_args.args
    assert caminho.startswith(f"{OBRA}/{DIARIO}/") and caminho.endswith(".png")
    assert (conteudo, content_type) == (PNG, "image/png")
    assert foto["legenda"] == "Laje"
    assert foto["url"] == "https://assinada"


def test_adicionar_arquivo_que_nao_e_imagem_e_recusado(service, repo):
    with pytest.raises(ValueError, match="Formato"):
        service.adicionar_foto(OBRA, DIARIO, b"MZ\x90\x00 executavel", None)
    repo.enviar_arquivo.assert_not_called()


def test_adicionar_foto_acima_do_limite_e_recusado(service, repo):
    repo.listar_fotos.return_value = [{"caminho": f"{i}.jpg"} for i in range(10)]
    with pytest.raises(ValueError, match="Limite"):
        service.adicionar_foto(OBRA, DIARIO, JPEG, None)
    repo.enviar_arquivo.assert_not_called()


def test_falha_ao_registrar_foto_remove_o_arquivo_enviado(service, repo):
    repo.criar_foto.side_effect = RuntimeError("banco fora")
    with pytest.raises(RuntimeError):
        service.adicionar_foto(OBRA, DIARIO, JPEG, None)
    enviado = repo.enviar_arquivo.call_args.args[0]
    repo.remover_arquivos.assert_called_once_with([enviado])


def test_adicionar_foto_em_diario_aprovado_e_recusado(service, repo):
    repo.buscar.return_value = _diario(status="APROVADO")
    with pytest.raises(ValueError, match="aprovado"):
        service.adicionar_foto(OBRA, DIARIO, JPEG, None)
    repo.enviar_arquivo.assert_not_called()


@pytest.mark.parametrize(
    "conteudo,esperado",
    [
        (JPEG, ("image/jpeg", "jpg")),
        (PNG, ("image/png", "png")),
        (WEBP, ("image/webp", "webp")),
        (b"GIF89a....", None),
        (b"<svg onload=alert(1)>", None),
        (b"", None),
    ],
)
def test_detectar_imagem_pelos_bytes(conteudo, esperado):
    assert detectar_imagem(conteudo) == esperado


def test_formatar_endereco():
    assert formatar_endereco({"logradouro": "Rua A, 10", "cidade": "Fortaleza", "uf": "CE"}) == "Rua A, 10, Fortaleza, CE"
    assert formatar_endereco("Av. Paulista, 1200") == "Av. Paulista, 1200"
    assert formatar_endereco({}) is None
    assert formatar_endereco(None) is None


# --- visão geral -------------------------------------------------------------


def _obra(obra_id, inicio="2026-10-01", status="EM_ANDAMENTO"):
    return {
        "id": obra_id,
        "orcamento_id": f"orc-{obra_id}",
        "cliente": "Cliente",
        "escopo": f"Obra {obra_id}",
        "endereco": None,
        "data_inicio_real": inicio,
        "prazo_estimado_dias": 100,
        "engenheiro_responsavel_id": None,
        "status": status,
    }


def _reg(obra_id, dias_atras, status="ENVIADO", clima="SOL"):
    data = (HOJE - timedelta(days=dias_atras)).isoformat()
    return {"obra_id": obra_id, "data": data, "clima": clima, "status": status}


def _sem_nomes(repo):
    repo.nomes_de_orcamentos.return_value = {}
    repo.nomes_de_membros.return_value = {}


def test_resumo_classifica_a_situacao_de_cada_obra(service, repo):
    repo.listar_obras_do_usuario.return_value = [
        _obra("enviada"),
        _obra("rascunho"),
        _obra("ontem"),
        _obra("sumida"),
        _obra("nunca"),
        _obra("futura", inicio=(HOJE + timedelta(days=5)).isoformat()),
        _obra("concluida", status="CONCLUIDO"),
    ]
    repo.diarios_recentes.return_value = [
        _reg("enviada", 0),
        _reg("rascunho", 0, status="RASCUNHO"),
        _reg("ontem", 1),
        _reg("sumida", 3),
    ]
    _sem_nomes(repo)

    resumo = service.resumo("user-1")

    situacoes = {o["obra_id"]: o["situacao"] for o in resumo["obras"]}
    assert situacoes == {
        "enviada": "ENVIADO",
        "rascunho": "RASCUNHO",
        "ontem": "PENDENTE",
        "sumida": "ALERTA",
        "nunca": "ALERTA",
        "futura": "PENDENTE",
    }
    assert resumo["total_obras"] == 6
    assert resumo["enviados_hoje"] == 1
    assert resumo["alertas"] == 2
    # alertas vêm primeiro
    assert [o["situacao"] for o in resumo["obras"]][:2] == ["ALERTA", "ALERTA"]


def test_resumo_taxa_de_preenchimento_dos_ultimos_7_dias(service, repo):
    repo.listar_obras_do_usuario.return_value = [_obra("a"), _obra("b")]
    # 7 dias esperados por obra = 14; a obra a registrou 7 dias e a obra b nenhum
    repo.diarios_recentes.return_value = [_reg("a", d) for d in range(7)]
    _sem_nomes(repo)

    assert service.resumo("user-1")["taxa_preenchimento_7d"] == 50


def test_resumo_sem_obras_ativas(service, repo):
    repo.listar_obras_do_usuario.return_value = []
    repo.diarios_recentes.return_value = []
    _sem_nomes(repo)

    assert service.resumo("user-1") == {
        "total_obras": 0,
        "enviados_hoje": 0,
        "alertas": 0,
        "taxa_preenchimento_7d": 0,
        "obras": [],
    }


def test_resumo_so_consulta_obras_do_usuario(service, repo):
    repo.listar_obras_do_usuario.return_value = []
    repo.diarios_recentes.return_value = []
    _sem_nomes(repo)
    service.resumo("user-1")
    repo.listar_obras_do_usuario.assert_called_once_with("user-1")


# --- rotas -------------------------------------------------------------------


@pytest.fixture
def api(client, repo):
    app.dependency_overrides[get_diario_service] = lambda: DiarioService(repo)
    return client


def test_rota_criar_responde_201(api):
    r = api.post(
        f"/obras/{OBRA}/diario",
        json={"data": "2026-10-21", "titulo": "Concretagem", "atividades": "Laje L2", "clima": "SOL"},
    )
    assert r.status_code == 201
    assert r.json()["titulo"] == "Concretagem"


def test_rota_criar_com_clima_invalido_responde_422(api):
    r = api.post(
        f"/obras/{OBRA}/diario",
        json={"data": "2026-10-21", "titulo": "X", "atividades": "Y", "clima": "NEVE"},
    )
    assert r.status_code == 422


def test_rota_diario_de_outra_obra_responde_404(api, repo):
    repo.buscar.return_value = None
    assert api.get(f"/obras/{OBRA}/diario/diario-da-obra-b").status_code == 404


def test_rota_status_invalido_responde_422(api):
    r = api.patch(f"/obras/{OBRA}/diario/{DIARIO}/status", json={"status": "QUALQUER"})
    assert r.status_code == 422


def test_rota_transicao_invalida_responde_400(api):
    r = api.patch(f"/obras/{OBRA}/diario/{DIARIO}/status", json={"status": "APROVADO"})
    assert r.status_code == 400


def test_rota_foto_acima_de_5mb_responde_413(api, repo):
    grande = JPEG + b"0" * (5 * 1024 * 1024)
    r = api.post(f"/obras/{OBRA}/diario/{DIARIO}/fotos", files={"file": ("f.jpg", grande, "image/jpeg")})
    assert r.status_code == 413
    repo.enviar_arquivo.assert_not_called()


def test_rota_foto_com_content_type_de_imagem_mas_conteudo_invalido_responde_400(api):
    r = api.post(f"/obras/{OBRA}/diario/{DIARIO}/fotos", files={"file": ("f.jpg", b"nao e imagem", "image/jpeg")})
    assert r.status_code == 400


def test_rota_foto_valida_responde_201(api, repo):
    repo.criar_foto.side_effect = lambda diario_id, caminho, legenda: {"id": "f1", "legenda": legenda}
    r = api.post(
        f"/obras/{OBRA}/diario/{DIARIO}/fotos",
        files={"file": ("f.jpg", JPEG, "image/jpeg")},
        data={"legenda": "Fundação"},
    )
    assert r.status_code == 201
    assert r.json()["legenda"] == "Fundação"


def test_rota_resumo(api, repo):
    repo.listar_obras_do_usuario.return_value = []
    repo.diarios_recentes.return_value = []
    _sem_nomes(repo)
    r = api.get("/diario/resumo")
    assert r.status_code == 200
    assert r.json()["total_obras"] == 0
