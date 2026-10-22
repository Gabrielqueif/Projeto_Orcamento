"""
Rotas filhas (insumo, locação, despesa, etapa, insumo de item) recebem o id do
registro filho no path. A checagem de dono só cobre a obra/orçamento do path,
então cada operação precisa também restringir o filho a essa obra/orçamento:
senão o dono da obra A altera registros da obra B informando o id deles.
"""
from unittest.mock import MagicMock

import pytest

from app.modules.almoxarifado.repositories import AlmoxarifadoRepository
from app.modules.almoxarifado.services import AlmoxarifadoService
from app.modules.etapa.repositories import EtapaRepository
from app.modules.financeiro.repositories import FinanceiroRepository
from app.modules.financeiro.services import FinanceiroService
from core.exceptions import NaoEncontradoError

OBRA_A = "e9b50e2ddc9943efb387052637738f61"
INSUMO_OBRA_B = "00000000-0000-0000-0000-0000000000b1"


# ---------------------------------------------------------------------------
# Almoxarifado
# ---------------------------------------------------------------------------

def test_buscar_insumo_filtra_pela_obra():
    supabase = MagicMock()
    AlmoxarifadoRepository(supabase).buscar_insumo_por_id(INSUMO_OBRA_B, OBRA_A)

    supabase.table.return_value.select.return_value.eq.return_value.eq.assert_called_with("obra_id", OBRA_A)


def test_movimentacao_de_insumo_de_outra_obra_nao_altera_estoque():
    repo = MagicMock()
    repo.buscar_insumo_por_id.return_value = None
    schema = MagicMock(tipo_movimentacao="ENTRADA", quantidade=10.0)

    with pytest.raises(NaoEncontradoError):
        AlmoxarifadoService(repo).registrar_movimentacao(OBRA_A, INSUMO_OBRA_B, schema)

    repo.buscar_insumo_por_id.assert_called_once_with(INSUMO_OBRA_B, OBRA_A)
    repo.criar_movimentacao.assert_not_called()
    repo.atualizar_quantidade_insumo.assert_not_called()


def test_rota_movimentacao_de_insumo_de_outra_obra_responde_404(client, mock_supabase):
    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value.data) = []

    response = client.post(
        f"/obras/{OBRA_A}/almoxarifado/insumos/{INSUMO_OBRA_B}/movimentacoes",
        json={"tipo_movimentacao": "ENTRADA", "quantidade": 5.0, "responsavel": "Almoxarife"},
    )

    assert response.status_code == 404
    mock_supabase.table.return_value.insert.assert_not_called()


def test_rota_deletar_insumo_de_outra_obra_responde_404(client, mock_supabase):
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = []

    response = client.delete(f"/obras/{OBRA_A}/almoxarifado/insumos/{INSUMO_OBRA_B}")

    assert response.status_code == 404
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.assert_called_with("obra_id", OBRA_A)


def test_rota_status_de_locacao_de_outra_obra_responde_404(client, mock_supabase):
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []

    response = client.put(
        f"/obras/{OBRA_A}/almoxarifado/locacoes/loc-obra-b/status", params={"novo_status": "FINALIZADO"}
    )

    assert response.status_code == 404
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.assert_called_with("obra_id", OBRA_A)


# ---------------------------------------------------------------------------
# Financeiro
# ---------------------------------------------------------------------------

def test_status_de_despesa_de_outra_obra_nao_e_atualizado():
    repo = MagicMock()
    repo.buscar_despesa_por_id.return_value = None

    with pytest.raises(NaoEncontradoError):
        FinanceiroService(repo).atualizar_status_despesa(OBRA_A, "despesa-obra-b", "PAGO")

    repo.buscar_despesa_por_id.assert_called_once_with("despesa-obra-b", OBRA_A)
    repo.atualizar_status_despesa.assert_not_called()


def test_rota_status_de_despesa_de_outra_obra_responde_404(client, mock_supabase):
    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value.data) = [{"id": OBRA_A}]
    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .in_.return_value
        .execute.return_value.data) = []

    response = client.put(
        f"/obras/{OBRA_A}/financeiro/despesas/despesa-obra-b/status", params={"novo_status": "PAGO"}
    )

    assert response.status_code == 404
    mock_supabase.table.return_value.update.assert_not_called()


def test_deletar_despesa_restringe_aos_ids_da_obra():
    supabase = MagicMock()
    repo = FinanceiroRepository(supabase)
    repo._ids_da_obra = MagicMock(return_value=[OBRA_A])
    supabase.table.return_value.delete.return_value.eq.return_value.in_.return_value.execute.return_value.data = []

    assert repo.deletar_despesa("despesa-obra-b", OBRA_A) is False
    supabase.table.return_value.delete.return_value.eq.return_value.in_.assert_called_with("obra_id", [OBRA_A])


# ---------------------------------------------------------------------------
# Etapas e insumos de item do orçamento
# ---------------------------------------------------------------------------

def test_atualizar_etapa_filtra_pelo_orcamento():
    supabase = MagicMock()
    EtapaRepository(supabase).atualizar("etapa-orc-b", {"progresso": 50}, "orc-a")

    supabase.table.return_value.update.return_value.eq.return_value.eq.assert_called_with("orcamento_id", "orc-a")


def test_rota_progresso_de_etapa_de_outro_orcamento_nao_responde_200(client, mock_supabase):
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []

    response = client.patch("/orcamentos/orc-a/etapas/etapa-orc-b/progresso", json={"progresso": 80})

    assert response.status_code != 200


def test_atualizar_insumo_de_outro_item_e_recusado(
    orcamento_item_service_com_insumo, orcamento_item_repo_mock, insumo_repo_mock
):
    orcamento_item_repo_mock.buscar_por_id.return_value = {"id": "item-a", "quantidade": 1.0}
    insumo_repo_mock.buscar_por_id.return_value = {"id": "ins-b", "orcamento_item_id": "item-b"}

    with pytest.raises(NaoEncontradoError):
        orcamento_item_service_com_insumo.atualizar_insumo("orc-a", "item-a", "ins-b", {"quantidade_unitaria": 9})

    insumo_repo_mock.atualizar.assert_not_called()


def test_atualizar_insumo_de_item_de_outro_orcamento_e_recusado(
    orcamento_item_service_com_insumo, orcamento_item_repo_mock, insumo_repo_mock
):
    orcamento_item_repo_mock.buscar_por_id.return_value = None

    with pytest.raises(NaoEncontradoError):
        orcamento_item_service_com_insumo.atualizar_insumo("orc-a", "item-b", "ins-b", {"quantidade_unitaria": 9})

    orcamento_item_repo_mock.buscar_por_id.assert_called_once_with("item-b", "orc-a")
    insumo_repo_mock.atualizar.assert_not_called()
