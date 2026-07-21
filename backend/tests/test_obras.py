import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from fastapi.testclient import TestClient

from app.modules.obra.schemas import ObraTransitionCreate
from app.modules.obra.services import ObraService

# ---------------------------------------------------------------------------
# Service Unit Tests
# ---------------------------------------------------------------------------

def test_gerar_obra_sucesso():
    # Setup mocks
    obra_repo = MagicMock()
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

    finally:
        # Clean override
        if get_obra_service in app.dependency_overrides:
            del app.dependency_overrides[get_obra_service]


# ---------------------------------------------------------------------------
# ObraRepository Unit Tests
# ---------------------------------------------------------------------------

from app.modules.obra.repositories import ObraRepository

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

