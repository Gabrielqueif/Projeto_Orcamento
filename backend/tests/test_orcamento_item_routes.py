from unittest.mock import MagicMock
import pytest

def configure_mock_table_side_effect(mock_supabase, table_mocks):
    """
    Helper to configure mock_supabase.table(name) to return different mocks per table.
    table_mocks: dict of table_name -> mock_object
    """
    def side_effect(name):
        return table_mocks.get(name, MagicMock())
    
    mock_supabase.table.side_effect = side_effect

def test_adicionar_item(client, mock_supabase):
    # Setup Mocks
    mock_orc_itens_table = MagicMock()
    mock_itens_table = MagicMock()
    mock_orcamentos_table = MagicMock()
    
    configure_mock_table_side_effect(mock_supabase, {
        "orcamento_itens": mock_orc_itens_table,
        "itens": mock_itens_table,
        "orcamentos": mock_orcamentos_table
    })
    
    orcamento_id = "orc-1"
    payload = {
        "codigo_composicao": "CODE-123",
        "descricao": "Cimento",
        "quantidade": 10.0,
        "unidade": "KG",
        "estado": "SP"
    }
    
    # Mock Orcamento exists
    mock_orcamentos_table.select.return_value.eq.return_value.execute.return_value.data = [{"id": orcamento_id, "estado": "SP"}]
    
    # Mock Item Price (ItemRepository)
    # listar_estados_por_item -> .select().eq().execute()
    mock_itens_table.select.return_value.eq.return_value.execute.return_value.data = [{"sp": 50.0}]
    
    mock_response_db = {
        "id": "item-1",
        "orcamento_id": orcamento_id,
        "codigo_composicao": "CODE-123",
        "descricao": "Cimento",
        "quantidade": 10.0,
        "unidade": "KG",
        "estado": "sp",
        "preco_unitario": 50.0,
        "preco_total": 500.0,
        "etapa_id": None,
        "memoria_calculo": None,
        "variaveis": None,
        "created_at": "2023-10-27T10:00:00"
    }
    
    # Mock Insert execution
    mock_orc_itens_table.insert.return_value.execute.return_value.data = [mock_response_db]
    
    # Mock Update total orcamento (called after insert)
    # OrcamentoRepository.atualizar -> .update().eq().execute()
    mock_orcamentos_table.update.return_value.eq.return_value.execute.return_value.data = [{}]

    # Mock OrcamentoItemRepository.calcular_total_itens -> uses rpc or select?
    # Service calls: self.repository.calcular_total_itens(orcamento_id)
    # This involves .rpc() usually or .select() and summing in python.
    # We need to check repository. Let's assume generic mock handling for now or simple select.
    # Actually checking repository logic would be best, but let's see if this passes.
    # Wait, `_atualizar_valor_total_orcamento` calls `repository.calcular_total_itens`.
    
    # Act
    # If calcular_total_itens fails (Mock), service might crash.
    # Let's verify `test_adicionar_item`...
    
    response = client.post(f"/orcamentos/{orcamento_id}/itens", json=payload)

    # Assert
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["id"] == "item-1"
    assert data["preco_total"] == 500.0

def test_listar_itens(client, mock_supabase):
    # Setup Mock
    mock_orc_itens_table = MagicMock()
    mock_orcamentos_table = MagicMock()
    configure_mock_table_side_effect(mock_supabase, {
        "orcamento_itens": mock_orc_itens_table,
        "orcamentos": mock_orcamentos_table
    })

    orcamento_id = "orc-1"
    
    # Mock Orcamento exists check
    mock_orcamentos_table.select.return_value.eq.return_value.execute.return_value.data = [{"id": orcamento_id}]
    
    mock_data = [
        {"id": "item-1", "orcamento_id": orcamento_id, "codigo_composicao": "A", "descricao": "Item A", "quantidade": 1, "unidade": "UN", "estado": "sp", "preco_unitario": 10, "preco_total": 10, "estado": "sp"},
        {"id": "item-2", "orcamento_id": orcamento_id, "codigo_composicao": "B", "descricao": "Item B", "quantidade": 2, "unidade": "UN", "estado": "sp", "preco_unitario": 20, "preco_total": 40, "estado": "sp"}
    ]
    
    mock_orc_itens_table.select.return_value.eq.return_value.order.return_value.execute.return_value.data = mock_data

    # Act
    response = client.get(f"/orcamentos/{orcamento_id}/itens")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_atualizar_item(client, mock_supabase):
    # Setup Mocks
    mock_orc_itens_table = MagicMock()
    mock_itens_table = MagicMock()
    mock_orcamentos_table = MagicMock()
    
    configure_mock_table_side_effect(mock_supabase, {
        "orcamento_itens": mock_orc_itens_table,
        "itens": mock_itens_table,
        "orcamentos": mock_orcamentos_table
    })
    
    orcamento_id = "orc-1"
    item_id = "item-1"
    payload = {"quantidade": 20.0}
    
    item_atual = {
        "id": item_id,
        "orcamento_id": orcamento_id,
        "codigo_composicao": "A",
        "descricao": "Item A",
        "quantidade": 10.0,
        "unidade": "UN",
        "estado": "sp",
        "preco_unitario": 10.0,
        "preco_total": 100.0
    }
    
    # Mock Buscar Item Atual (.select().eq().eq().execute())
    mock_orc_itens_table.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [item_atual]
    
    # Mock Update (.update().eq().execute())
    mock_response_db = item_atual.copy()
    mock_response_db.update({"quantidade": 20.0, "preco_total": 200.0})
    
    mock_orc_itens_table.update.return_value.eq.return_value.execute.return_value.data = [mock_response_db]
    
    # Mock Update total orcamento
    mock_orcamentos_table.update.return_value.eq.return_value.execute.return_value.data = [{}]

    # Act
    response = client.put(f"/orcamentos/{orcamento_id}/itens/{item_id}", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["quantidade"] == 20.0
    assert data["preco_total"] == 200.0

def test_remover_item(client, mock_supabase):
    # Setup Mocks
    mock_orc_itens_table = MagicMock()
    mock_orcamentos_table = MagicMock()
    
    configure_mock_table_side_effect(mock_supabase, {
        "orcamento_itens": mock_orc_itens_table,
        "orcamentos": mock_orcamentos_table
    })
    
    orcamento_id = "orc-1"
    item_id = "item-1"
    
    # Mock Item exists (.select().eq().eq())
    mock_orc_itens_table.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{"id": item_id}]
    
    # Mock Delete
    mock_orc_itens_table.delete.return_value.eq.return_value.execute.return_value = MagicMock()
    
    # Mock Update total (called after delete)
    mock_orcamentos_table.update.return_value.eq.return_value.execute.return_value.data = [{}]

    # Act
    response = client.delete(f"/orcamentos/{orcamento_id}/itens/{item_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": "Item removido com sucesso", "id": item_id}

