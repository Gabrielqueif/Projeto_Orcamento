from unittest.mock import MagicMock
from datetime import date

def test_criar_orcamento(client, mock_supabase):
    # Setup Mock
    payload = {
        "nome": "Reforma Sala",
        "cliente": "João Silva",
        "data": "2023-10-27",
        "base_referencia": "SINAPI",
        "estado": "SP"
    }
    
    expected_response_db = {
        "id": "orc-1",
        **payload,
        "status": "em_elaboracao",
        "valor_total": 0.0,
        "created_at": "2023-10-27T10:00:00"
    }
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [expected_response_db]

    # Act
    response = client.post("/orcamentos/", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "orc-1"
    assert data["nome"] == payload["nome"]
    assert data["status"] == "em_elaboracao"

def test_listar_orcamentos(client, mock_supabase):
    # Setup Mock
    mock_data = [
        {"id": "orc-1", "nome": "Orc 1", "cliente": "C1", "data": "2023-01-01", "base_referencia": "A", "estado": "SP", "status": "ok", "valor_total": 100},
        {"id": "orc-2", "nome": "Orc 2", "cliente": "C2", "data": "2023-01-02", "base_referencia": "B", "estado": "RJ", "status": "ok", "valor_total": 200}
    ]
    mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value.data = mock_data

    # Act
    response = client.get("/orcamentos/")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["nome"] == "Orc 1"

def test_buscar_orcamento_por_id(client, mock_supabase):
    # Setup Mock
    orc_id = "orc-1"
    mock_data = [{"id": orc_id, "nome": "Orc 1", "cliente": "C1", "data": "2023-01-01", "base_referencia": "A", "estado": "SP", "status": "ok", "valor_total": 100}]
    
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_data

    # Act
    response = client.get(f"/orcamentos/{orc_id}")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == orc_id

def test_atualizar_orcamento(client, mock_supabase):
    # Setup Mock
    orc_id = "orc-1"
    payload = {"nome": "Novo Nome"}
    
    mock_response_db = {
        "id": orc_id, 
        "nome": "Novo Nome", 
        "cliente": "C1", 
        "data": "2023-01-01", 
        "base_referencia": "A", 
        "estado": "SP", 
        "status": "ok", 
        "valor_total": 100
    }
    
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [mock_response_db]

    # Act
    response = client.put(f"/orcamentos/{orc_id}", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Novo Nome"

def test_deletar_orcamento(client, mock_supabase):
    # Setup Mock
    orc_id = "orc-1"
    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()

    # Act
    response = client.delete(f"/orcamentos/{orc_id}")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": "Orçamento deletado com sucesso", "id": orc_id}
