import pytest
from unittest.mock import MagicMock
from datetime import date, datetime
from app.modules.orcamento.services import OrcamentoService

@pytest.fixture
def orcamento_repo():
    return MagicMock()

@pytest.fixture
def etapa_repo():
    return MagicMock()

@pytest.fixture
def item_repo():
    return MagicMock()

@pytest.fixture
def supabase():
    return MagicMock()

@pytest.fixture
def service(orcamento_repo, etapa_repo, item_repo, supabase):
    return OrcamentoService(
        repository=orcamento_repo,
        etapa_repository=etapa_repo,
        orcamento_item_repository=item_repo,
        supabase_client=supabase
    )

# ---------------------------------------------------------------------------
# obter_estatisticas
# ---------------------------------------------------------------------------

def test_obter_estatisticas_sucesso(service, orcamento_repo):
    # Arrange
    orcamento_repo.listar.return_value = [
        {
            "id": "1",
            "valor_total": 100000.0,
            "status": "APROVADO",
            "created_at": "2026-07-01T10:00:00Z",
            "updated_at": "2026-07-02T10:00:00Z"
        },
        {
            "id": "2",
            "valor_total": 200000.0,
            "status": "pendente",
            "created_at": "2026-07-01T10:00:00Z",
            "updated_at": "2026-07-01T12:00:00Z"
        }
    ]

    # Act
    stats = service.obter_estatisticas()

    # Assert
    assert stats["total_orcamentos"] == 2
    assert stats["valor_total"] == 300000.0
    assert stats["taxa_aprovacao"] == 50.0
    assert stats["ticket_medio"] == 150000.0
    assert stats["tempo_resposta_medio"] == 1.0 # 1 dia entre dia 1 e 2 para o aprovado

def test_obter_estatisticas_vazio(service, orcamento_repo):
    # Arrange
    orcamento_repo.listar.return_value = []

    # Act
    stats = service.obter_estatisticas()

    # Assert
    assert stats["total_orcamentos"] == 0
    assert stats["valor_total"] == 0.0
    assert stats["taxa_aprovacao"] == 0.0
    assert stats["ticket_medio"] == 0.0
    assert stats["tempo_resposta_medio"] == 0.0

# ---------------------------------------------------------------------------
# obter_curva_abc
# ---------------------------------------------------------------------------

def test_obter_curva_abc_sucesso(service, orcamento_repo, item_repo, supabase):
    # Arrange
    orcamento_id = "orc-1"
    orcamento_repo.buscar_por_id.return_value = {"id": orcamento_id}
    item_repo.listar_por_orcamento.return_value = [{"id": "item-1"}]
    
    mock_insumos = [
        {
            "codigo_insumo": "INS-A",
            "descricao": "Cimento",
            "unidade": "SC",
            "quantidade_unitaria": 10.0,
            "total": 80.0
        },
        {
            "codigo_insumo": "INS-B",
            "descricao": "Areia",
            "unidade": "M3",
            "quantidade_unitaria": 5.0,
            "total": 20.0
        }
    ]
    supabase.table.return_value.select.return_value.in_.return_value.execute.return_value.data = mock_insumos

    # Act
    res = service.obter_curva_abc(orcamento_id)

    # Assert
    assert res["valor_total"] == 100.0
    assert len(res["insumos"]) == 2
    # Insumo A deve vir primeiro pois custa 80 (80%)
    ins_a = res["insumos"][0]
    assert ins_a["codigo_insumo"] == "INS-A"
    assert ins_a["classe"] == "A"
    assert ins_a["porcentagem"] == 80.0
    assert ins_a["acumulado"] == 80.0

    # Insumo B deve ser Classe C (acumulado vai para 100%)
    ins_b = res["insumos"][1]
    assert ins_b["codigo_insumo"] == "INS-B"
    assert ins_b["classe"] == "C"
    assert ins_b["porcentagem"] == 20.0
    assert ins_b["acumulado"] == 100.0

    assert res["resumo_classes"]["A"] == 80.0
    assert res["resumo_classes"]["B"] == 0.0
    assert res["resumo_classes"]["C"] == 20.0

def test_obter_curva_abc_orcamento_inexistente(service, orcamento_repo):
    # Arrange
    orcamento_repo.buscar_por_id.return_value = None

    # Act & Assert
    with pytest.raises(ValueError, match="Orçamento não encontrado"):
        service.obter_curva_abc("orc-invalido")

# ---------------------------------------------------------------------------
# obter_cronograma
# ---------------------------------------------------------------------------

def test_obter_cronograma_sucesso(service, orcamento_repo, etapa_repo, item_repo):
    # Arrange
    orcamento_id = "orc-1"
    orcamento_repo.buscar_por_id.return_value = {
        "id": orcamento_id,
        "data": "2026-07-01"
    }
    
    etapa_repo.listar_por_orcamento.return_value = [
        {
            "id": "etapa-1",
            "nome": "Fundação",
            "ordem": 0,
            "data_inicio": "2026-07-01",
            "data_fim": "2026-07-31"
        },
        {
            "id": "etapa-2",
            "nome": "Alvenaria",
            "ordem": 1,
            "data_inicio": "2026-08-01",
            "data_fim": "2026-08-31"
        }
    ]
    
    item_repo.listar_por_orcamento.return_value = [
        {"id": "i1", "etapa_id": "etapa-1", "preco_total": 40000.0},
        {"id": "i2", "etapa_id": "etapa-2", "preco_total": 60000.0}
    ]

    # Act
    res = service.obter_cronograma(orcamento_id)

    # Assert
    assert res["valor_total"] == 100000.0
    assert len(res["mensal"]) == 2
    
    m1 = res["mensal"][0]
    assert m1["mes"] == "Jul/2026"
    assert m1["valor"] == 40000.0
    assert m1["acumulado_pct"] == 40.0
    assert "Fundação" in m1["servicos"]

    m2 = res["mensal"][1]
    assert m2["mes"] == "Ago/2026"
    assert m2["valor"] == 60000.0
    assert m2["acumulado_pct"] == 100.0
    assert "Alvenaria" in m2["servicos"]
