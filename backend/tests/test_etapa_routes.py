from unittest.mock import MagicMock

def test_criar_etapa_sucesso(client, mock_supabase):
    # Setup Mock
    orcamento_id = "orc-123"
    payload = {"nome": "Fundação", "ordem": 1}
    
    # Simulate Supabase response structure: .table().insert().execute().data
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "etapa-1", "orcamento_id": orcamento_id, "nome": "Fundação", "ordem": 1}
    ]

    # Act
    response = client.post(f"/orcamentos/{orcamento_id}/etapas", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Fundação"
    assert data["orcamento_id"] == orcamento_id
    assert "id" in data

def test_listar_etapas(client, mock_supabase):
    # Setup Mock
    orcamento_id = "orc-123"
    
    mock_data = [
        {"id": "etapa-1", "orcamento_id": orcamento_id, "nome": "Fundação", "ordem": 1},
        {"id": "etapa-2", "orcamento_id": orcamento_id, "nome": "Estrutura", "ordem": 2}
    ]
    # Simulate .table().select().eq().order().execute().data
    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .order.return_value
        .execute.return_value.data) = mock_data

    # Act
    response = client.get(f"/orcamentos/{orcamento_id}/etapas")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["nome"] == "Fundação"

def test_deletar_etapa(client, mock_supabase):
    # Setup Mock
    orcamento_id = "orc-123"
    etapa_id = "etapa-1"
    
    # Simulate execute() success for delete
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()

    # Act
    response = client.delete(f"/orcamentos/{orcamento_id}/etapas/{etapa_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": "Etapa deletada com sucesso"}
