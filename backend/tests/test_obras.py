from datetime import date
from unittest.mock import MagicMock

import pytest

from app.modules.obra.schemas import ObraTransitionCreate
from app.modules.obra.services import ObraService

# ---------------------------------------------------------------------------
# Service Unit Tests
# ---------------------------------------------------------------------------

def test_gerar_obra_sucesso():
    # Setup mocks
    obra_repo = MagicMock()
    obra_repo.buscar_obra_por_orcamento.return_value = None
    orcamento_repo = MagicMock()
    etapa_repo = MagicMock()
    item_repo = MagicMock()
    supabase_client = MagicMock()

    # Stub data
    orcamento_id = "test-orcamento-uuid"
    orcamento_mock = {
        "id": orcamento_id,
        "nome": "Orçamento Teste",
        "cliente": "Cliente Teste",
        "status": "APROVADO",
        "valor_total": 100000.0,
        "bdi": 25.0,
        "estado": "pe",
        "base_referencia": "Julho/2026",
        "fonte": "SINAPI"
    }
    
    obra_mock = {
        "id": "test-obra-uuid",
        "orcamento_id": orcamento_id,
        "cliente": "Cliente Teste",
        "status": "EM_ANDAMENTO"
    }

    orcamento_repo.buscar_por_id.return_value = orcamento_mock
    obra_repo.criar_obra.return_value = obra_mock
    etapa_repo.listar_por_orcamento.return_value = [{"id": "etapa-1", "nome": "Fundação"}]
    item_repo.listar_por_orcamento.return_value = [{"id": "item-1", "descricao": "Concreto"}]
    
    # Mock supabase table query for insumos
    mock_execute = MagicMock()
    mock_execute.data = [
        {
            "codigo_insumo": "INS-1",
            "descricao": "Cimento",
            "unidade": "SC",
            "quantidade_unitaria": 100.0
        }
    ]
    supabase_client.table.return_value.select.return_value.in_.return_value.execute.return_value = mock_execute

    service = ObraService(
        obra_repository=obra_repo,
        orcamento_repository=orcamento_repo,
        etapa_repository=etapa_repo,
        orcamento_item_repository=item_repo,
        supabase_client=supabase_client
    )

    dados_transicao = ObraTransitionCreate(
        data_inicio_real=date(2026, 7, 20),
        prazo_estimado_dias=120,
        engenheiro_responsavel_id="eng-123",
        enviar_curva_abc_almoxarifado=True,
        bloquear_planilha_base=True
    )

    result = service.gerar_obra(orcamento_id, dados_transicao)

    # Asserts
    assert result == obra_mock
    orcamento_repo.buscar_por_id.assert_called_once_with(orcamento_id)
    obra_repo.criar_obra.assert_called_once()
    orcamento_repo.atualizar.assert_called_once()
    obra_repo.criar_snapshot_meta.assert_called_once()
    obra_repo.criar_limites_requisicao_batch.assert_called_once()


def test_gerar_obra_orcamento_ja_vinculado():
    obra_repo = MagicMock()
    obra_repo.buscar_obra_por_orcamento.return_value = {"id": "obra-1"}
    orcamento_repo = MagicMock()
    orcamento_repo.buscar_por_id.return_value = {"id": "orc-1", "status": "aprovado"}
    service = ObraService(obra_repo, orcamento_repo, MagicMock(), MagicMock(), MagicMock())

    dados = ObraTransitionCreate(data_inicio_real=date(2026, 7, 20), prazo_estimado_dias=120)

    with pytest.raises(ValueError, match="já está vinculado a uma obra"):
        service.gerar_obra("orc-1", dados)
    obra_repo.criar_obra.assert_not_called()


def test_gerar_obra_status_invalido():
    obra_repo = MagicMock()
    orcamento_repo = MagicMock()
    etapa_repo = MagicMock()
    item_repo = MagicMock()
    supabase_client = MagicMock()

    orcamento_id = "test-orcamento-uuid"
    orcamento_mock = {
        "id": orcamento_id,
        "nome": "Orçamento Teste",
        "cliente": "Cliente Teste",
        "status": "em_elaboracao",
    }

    orcamento_repo.buscar_por_id.return_value = orcamento_mock

    service = ObraService(
        obra_repository=obra_repo,
        orcamento_repository=orcamento_repo,
        etapa_repository=etapa_repo,
        orcamento_item_repository=item_repo,
        supabase_client=supabase_client
    )

    dados_transicao = ObraTransitionCreate(
        data_inicio_real=date(2026, 7, 20),
        prazo_estimado_dias=120,
        engenheiro_responsavel_id="eng-123",
        enviar_curva_abc_almoxarifado=True,
        bloquear_planilha_base=True
    )

    with pytest.raises(ValueError, match="Apenas orçamentos com status APROVADO"):
        service.gerar_obra(orcamento_id, dados_transicao)

def test_gerar_obra_sem_bloqueio_e_sem_abc():
    obra_repo = MagicMock()
    obra_repo.buscar_obra_por_orcamento.return_value = None
    orcamento_repo = MagicMock()
    etapa_repo = MagicMock()
    item_repo = MagicMock()
    supabase_client = MagicMock()

    orcamento_id = "test-orcamento-uuid"
    orcamento_mock = {
        "id": orcamento_id,
        "nome": "Orçamento Teste",
        "cliente": "Cliente Teste",
        "status": "APROVADO",
    }
    obra_mock = {"id": "test-obra-uuid"}

    orcamento_repo.buscar_por_id.return_value = orcamento_mock
    obra_repo.criar_obra.return_value = obra_mock
    etapa_repo.listar_por_orcamento.return_value = []
    item_repo.listar_por_orcamento.return_value = []

    service = ObraService(
        obra_repository=obra_repo,
        orcamento_repository=orcamento_repo,
        etapa_repository=etapa_repo,
        orcamento_item_repository=item_repo,
        supabase_client=supabase_client
    )

    dados_transicao = ObraTransitionCreate(
        data_inicio_real=date(2026, 7, 20),
        prazo_estimado_dias=120,
        engenheiro_responsavel_id="eng-123",
        enviar_curva_abc_almoxarifado=False,
        bloquear_planilha_base=False
    )

    result = service.gerar_obra(orcamento_id, dados_transicao)
    assert result == obra_mock
    orcamento_repo.atualizar.assert_not_called()
    obra_repo.criar_limites_requisicao_batch.assert_not_called()

def test_criar_obra_gera_orcamento_em_branco():
    from datetime import date

    from app.modules.obra.schemas import ObraCreate

    obra_repo = MagicMock()
    orcamento_repo = MagicMock()
    orcamento_repo.criar.return_value = {"id": "orc-1"}
    obra_repo.criar_obra.return_value = {"id": "obra-1", "orcamento_id": "orc-1"}
    service = ObraService(obra_repo, orcamento_repo, MagicMock(), MagicMock(), MagicMock())

    dados = ObraCreate(nome="Casa", cliente="Ana", data_inicio_real=date(2026, 1, 5), prazo_estimado_dias=30)
    res = service.criar_obra(dados, user_id="u1")

    orcamento = orcamento_repo.criar.call_args[0][0]
    assert orcamento["valor_total"] == 0.0
    assert orcamento["status"] == "em_elaboracao"
    assert orcamento["user_id"] == "u1"
    assert obra_repo.criar_obra.call_args[0][0]["orcamento_id"] == "orc-1"
    assert res["id"] == "obra-1"


def test_criar_obra_com_orcamento_existente_nao_cria_outro():
    from datetime import date

    from app.modules.obra.schemas import ObraCreate

    obra_repo = MagicMock()
    orcamento_repo = MagicMock()
    obra_repo.criar_obra.return_value = {"id": "obra-1"}
    service = ObraService(obra_repo, orcamento_repo, MagicMock(), MagicMock(), MagicMock())

    dados = ObraCreate(orcamento_id="orc-9", cliente="Ana", data_inicio_real=date(2026, 1, 5), prazo_estimado_dias=0)
    service.criar_obra(dados, user_id="u1")

    orcamento_repo.criar.assert_not_called()


def test_service_buscar_obra():
    obra_repo = MagicMock()
    service = ObraService(obra_repo, MagicMock(), MagicMock(), MagicMock(), MagicMock())
    obra_repo.buscar_obra_por_id.return_value = {"id": "1"}
    
    res = service.buscar_obra("1")
    assert res == {"id": "1"}

def test_service_buscar_obra_erro():
    obra_repo = MagicMock()
    service = ObraService(obra_repo, MagicMock(), MagicMock(), MagicMock(), MagicMock())
    obra_repo.buscar_obra_por_id.return_value = None
    
    with pytest.raises(ValueError, match="Obra não encontrada"):
        service.buscar_obra("1")

def test_service_listar_obras():
    obra_repo = MagicMock()
    service = ObraService(obra_repo, MagicMock(), MagicMock(), MagicMock(), MagicMock())
    obra_repo.listar_obras.return_value = [{"id": "1"}]
    
    res = service.listar_obras()
    assert res == [{"id": "1"}]

def test_service_listar_limites():
    obra_repo = MagicMock()
    service = ObraService(obra_repo, MagicMock(), MagicMock(), MagicMock(), MagicMock())
    obra_repo.listar_limites_por_obra.return_value = [{"id": "lim-1"}]
    
    res = service.listar_limites("1")
    assert res == [{"id": "lim-1"}]



# ---------------------------------------------------------------------------
# Router / Endpoint Tests
def test_atualizar_status_obra_sucesso():
    obra_repo = MagicMock()
    orcamento_repo = MagicMock()
    etapa_repo = MagicMock()
    item_repo = MagicMock()
    supabase_client = MagicMock()

    obra_id = "test-obra-uuid"
    obra_mock = {
        "id": obra_id,
        "status": "EM_ANDAMENTO"
    }
    obra_repo.buscar_obra_por_id.return_value = obra_mock
    obra_repo.atualizar_obra_status.return_value = {**obra_mock, "status": "CONCLUIDA"}

    service = ObraService(
        obra_repository=obra_repo,
        orcamento_repository=orcamento_repo,
        etapa_repository=etapa_repo,
        orcamento_item_repository=item_repo,
        supabase_client=supabase_client
    )

    result = service.atualizar_status(obra_id, "CONCLUIDA")
    assert result["status"] == "CONCLUIDA"
    obra_repo.buscar_obra_por_id.assert_called_once_with(obra_id)
    obra_repo.atualizar_obra_status.assert_called_once_with(obra_id, "CONCLUIDA")

# ---------------------------------------------------------------------------

def test_routes_obras_endpoints(client):
    # Mocking ObraService methods through dependency overrides
    # The fixture client in conftest.py overrides authentication and get_supabase
    from app.modules.obra.routes import get_obra_service
    
    mock_service = MagicMock()
    
    obra_dummy = {
        "id": "test-obra-uuid",
        "orcamento_id": "test-orcamento-uuid",
        "cliente": "Cliente Teste",
        "endereco": {},
        "escopo": "Escopo Teste",
        "data_inicio_real": "2026-07-20",
        "prazo_estimado_dias": 120,
        "engenheiro_responsavel_id": "eng-123",
        "enviar_curva_abc_almoxarifado": True,
        "bloquear_planilha_base": True,
        "status": "EM_ANDAMENTO",
        "created_at": "2026-07-19T11:00:00",
        "updated_at": "2026-07-19T11:00:00"
    }
    
    limites_dummy = [
        {
            "id": "limite-uuid",
            "obra_id": "test-obra-uuid",
            "codigo_insumo": "INS-1",
            "descricao": "Cimento",
            "unidade": "SC",
            "quantidade_limite": 150.0,
            "quantidade_requisitada": 0.0,
            "created_at": "2026-07-19T11:00:00",
            "updated_at": "2026-07-19T11:00:00"
        }
    ]

    mock_service.gerar_obra.return_value = obra_dummy
    mock_service.listar_obras.return_value = [obra_dummy]
    mock_service.buscar_obra.return_value = obra_dummy
    mock_service.listar_limites.return_value = limites_dummy

    def override_get_obra_service():
        return mock_service

    from app.main import app
    app.dependency_overrides[get_obra_service] = override_get_obra_service

    try:
        # 1. POST transição
        response = client.post("/obras/transicao/test-orcamento-uuid", json={
            "data_inicio_real": "2026-07-20",
            "prazo_estimado_dias": 120,
            "engenheiro_responsavel_id": "eng-123",
            "enviar_curva_abc_almoxarifado": True,
            "bloquear_planilha_base": True
        })
        assert response.status_code == 200
        assert response.json()["id"] == "test-obra-uuid"

        # 2. GET listar obras
        response = client.get("/obras")
        assert response.status_code == 200
        assert len(response.json()) == 1

        # 3. GET buscar obra por ID
        response = client.get("/obras/test-obra-uuid")
        assert response.status_code == 200
        assert response.json()["cliente"] == "Cliente Teste"

        # 4. GET listar limites
        response = client.get("/obras/test-obra-uuid/limites")
        assert response.status_code == 200
        assert response.json()[0]["codigo_insumo"] == "INS-1"

        # 5. PATCH atualizar status
        mock_service.atualizar_status.return_value = {**obra_dummy, "status": "CONCLUIDA"}
        response = client.patch("/obras/test-obra-uuid/status", json={"status": "CONCLUIDA"})
        assert response.status_code == 200
        assert response.json()["status"] == "CONCLUIDA"
        mock_service.atualizar_status.assert_called_once_with("test-obra-uuid", "CONCLUIDA")

    finally:
        # Clean override
        if get_obra_service in app.dependency_overrides:
            del app.dependency_overrides[get_obra_service]


# ---------------------------------------------------------------------------
# ObraRepository Unit Tests
# ---------------------------------------------------------------------------

from app.modules.obra.repositories import ObraRepository  # noqa: E402


def test_repo_criar_obra_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = {"cliente": "Teste"}
    supabase.table.return_value.insert.return_value.execute.return_value.data = [dados]
    
    res = repo.criar_obra(dados)
    assert res == dados

def test_repo_criar_obra_excecao():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.insert.return_value.execute.side_effect = RuntimeError("Erro")
    
    with pytest.raises(RuntimeError):
        repo.criar_obra({"cliente": "Teste"})

def test_repo_buscar_obra_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = {"id": "1", "cliente": "Teste"}
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [dados]
    
    res = repo.buscar_obra_por_id("1")
    assert res == dados

def test_repo_buscar_obra_nao_encontrada():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    
    res = repo.buscar_obra_por_id("1")
    assert res is None

def test_repo_buscar_obra_excecao():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.select.side_effect = RuntimeError("Erro")
    
    res = repo.buscar_obra_por_id("1")
    assert res is None

def test_repo_listar_obras_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = [{"id": "1"}]
    supabase.table.return_value.select.return_value.order.return_value.execute.return_value.data = dados
    
    res = repo.listar_obras()
    assert res == dados

def test_repo_listar_obras_excecao():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.select.side_effect = RuntimeError("Erro")
    
    res = repo.listar_obras()
    assert res == []

def test_repo_criar_snapshot_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = {"orcamento_id": "1"}
    supabase.table.return_value.insert.return_value.execute.return_value.data = [dados]
    
    res = repo.criar_snapshot_meta(dados)
    assert res == dados

def test_repo_criar_snapshot_excecao():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.insert.return_value.execute.side_effect = RuntimeError("Erro")
    
    with pytest.raises(RuntimeError):
        repo.criar_snapshot_meta({"orcamento_id": "1"})

def test_repo_buscar_snapshot_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = {"orcamento_id": "1"}
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [dados]
    
    res = repo.buscar_snapshot_meta_por_orcamento("1")
    assert res == dados

def test_repo_buscar_snapshot_excecao():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.select.side_effect = RuntimeError("Erro")
    
    res = repo.buscar_snapshot_meta_por_orcamento("1")
    assert res is None

def test_repo_criar_limites_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = [{"codigo_insumo": "1"}]
    supabase.table.return_value.insert.return_value.execute.return_value.data = dados
    
    res = repo.criar_limites_requisicao_batch(dados)
    assert res == 1

def test_repo_criar_limites_vazio():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    res = repo.criar_limites_requisicao_batch([])
    assert res == 0

def test_repo_criar_limites_excecao():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.insert.return_value.execute.side_effect = RuntimeError("Erro")
    
    with pytest.raises(RuntimeError):
        repo.criar_limites_requisicao_batch([{"codigo_insumo": "1"}])

def test_repo_listar_limites_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = [{"codigo_insumo": "1"}]
    supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = dados
    
    res = repo.listar_limites_por_obra("1")
    assert res == dados

def test_repo_listar_limites_excecao():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    supabase.table.return_value.select.side_effect = RuntimeError("Erro")
    
    res = repo.listar_limites_por_obra("1")
    assert res == []

def test_repo_atualizar_status_sucesso():
    supabase = MagicMock()
    repo = ObraRepository(supabase)
    dados = {"id": "1", "status": "CONCLUIDA"}
    supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [dados]
    
    res = repo.atualizar_obra_status("1", "CONCLUIDA")
    assert res == dados


# ---------------------------------------------------------------------------
# Exclusão de obra
# ---------------------------------------------------------------------------

def _service_exclusao(monkeypatch, real="obra-real"):
    from app.modules.obra import services as obra_services

    monkeypatch.setattr(obra_services, "resolver_obra_id", lambda supabase, obra_id: real)
    repo = MagicMock()
    repo.listar_caminhos_fotos_diario.return_value = ["obra-real/d1/a.jpg"]
    repo.deletar_obra.return_value = True
    return ObraService(repo, MagicMock(), MagicMock(), MagicMock(), MagicMock()), repo


def test_excluir_obra_apaga_a_obra_e_depois_as_fotos(monkeypatch):
    service, repo = _service_exclusao(monkeypatch)
    service.excluir_obra("id-do-orcamento")

    repo.deletar_obra.assert_called_once_with("obra-real")
    repo.remover_arquivos_diario.assert_called_once_with(["obra-real/d1/a.jpg"])


def test_excluir_obra_inexistente(monkeypatch):
    from app.modules.obra import services as obra_services
    from core.exceptions import NaoEncontradoError

    monkeypatch.setattr(obra_services, "resolver_obra_id", lambda supabase, obra_id: None)
    repo = MagicMock()
    service = ObraService(repo, MagicMock(), MagicMock(), MagicMock(), MagicMock())

    with pytest.raises(NaoEncontradoError):
        service.excluir_obra("x")
    repo.deletar_obra.assert_not_called()


def test_excluir_obra_nao_apaga_arquivos_se_a_exclusao_falhar(monkeypatch):
    from core.exceptions import NaoEncontradoError

    service, repo = _service_exclusao(monkeypatch)
    repo.deletar_obra.return_value = False

    with pytest.raises(NaoEncontradoError):
        service.excluir_obra("x")
    repo.remover_arquivos_diario.assert_not_called()


def test_repo_listar_caminhos_fotos_diario():
    from app.modules.obra.repositories import ObraRepository

    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"id": "d1"}, {"id": "d2"}]
    sb.table.return_value.select.return_value.in_.return_value.execute.return_value.data = [
        {"caminho": "o/d1/a.jpg"},
        {"caminho": "o/d2/b.png"},
    ]
    assert ObraRepository(sb).listar_caminhos_fotos_diario("o") == ["o/d1/a.jpg", "o/d2/b.png"]


def test_repo_listar_caminhos_sem_diarios_nao_consulta_fotos():
    from app.modules.obra.repositories import ObraRepository

    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    assert ObraRepository(sb).listar_caminhos_fotos_diario("o") == []
    sb.table.return_value.select.return_value.in_.assert_not_called()


def test_repo_remover_arquivos_engole_falha_do_storage():
    from app.modules.obra.repositories import ObraRepository

    sb = MagicMock()
    sb.storage.from_.return_value.remove.side_effect = RuntimeError("storage fora")
    ObraRepository(sb).remover_arquivos_diario(["a.jpg"])  # não levanta
    ObraRepository(sb).remover_arquivos_diario([])  # nada a remover


def test_repo_deletar_obra():
    from app.modules.obra.repositories import ObraRepository

    sb = MagicMock()
    sb.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = [{"id": "o1"}]
    assert ObraRepository(sb).deletar_obra("o1") is True
    sb.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = []
    assert ObraRepository(sb).deletar_obra("o1") is False


def test_rota_excluir_obra(client, monkeypatch):
    from app.main import app
    from app.modules.obra.routes import get_obra_service

    service, repo = _service_exclusao(monkeypatch)
    app.dependency_overrides[get_obra_service] = lambda: service

    resposta = client.delete("/obras/obra-real")
    assert resposta.status_code == 200
    assert resposta.json() == {"message": "Obra excluída com sucesso"}
    repo.deletar_obra.assert_called_once_with("obra-real")


def test_rota_excluir_obra_inexistente_responde_404(client, monkeypatch):
    from app.main import app
    from app.modules.obra.routes import get_obra_service

    service, repo = _service_exclusao(monkeypatch)
    repo.deletar_obra.return_value = False
    app.dependency_overrides[get_obra_service] = lambda: service

    assert client.delete("/obras/x").status_code == 404
