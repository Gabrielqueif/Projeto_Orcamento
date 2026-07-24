from unittest.mock import MagicMock
import pytest

def test_criar_insumo_sucesso(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    payload = {
        "codigo_insumo": "SINAPI-1245",
        "descricao": "Cimento CP-II",
        "categoria": "ESTRUTURA",
        "quantidade_minima": 100.0,
        "unidade": "sacos",
        "preco_unitario": 32.50,
        "quantidade_atual": 450.0
    }
    
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "obra_id": obra_id,
            "codigo_insumo": "SINAPI-1245",
            "descricao": "Cimento CP-II",
            "categoria": "ESTRUTURA",
            "quantidade_minima": 100.00,
            "unidade": "sacos",
            "preco_unitario": 32.50,
            "quantidade_atual": 450.00,
            "created_at": "2026-07-23T11:44:00Z",
            "updated_at": "2026-07-23T11:44:00Z"
        }
    ]

    response = client.post(f"/obras/{obra_id}/almoxarifado/insumos", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["codigo_insumo"] == "SINAPI-1245"
    assert data["status"] == "Normal"
    assert float(data["quantidade_atual"]) == 450.0

def test_listar_insumos(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    mock_data = [
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "obra_id": obra_id,
            "codigo_insumo": "SINAPI-1245",
            "descricao": "Cimento CP-II",
            "categoria": "ESTRUTURA",
            "quantidade_minima": 100.00,
            "unidade": "sacos",
            "preco_unitario": 32.50,
            "quantidade_atual": 450.00,
            "created_at": "2026-07-23T11:44:00Z",
            "updated_at": "2026-07-23T11:44:00Z"
        },
        {
            "id": "00000000-0000-0000-0000-000000000002",
            "obra_id": obra_id,
            "codigo_insumo": "PR-8821",
            "descricao": "Aço CA-50 10mm",
            "categoria": "ESTRUTURA",
            "quantidade_minima": 15.00,
            "unidade": "toneladas",
            "preco_unitario": 5200.00,
            "quantidade_atual": 12.00,
            "created_at": "2026-07-23T11:44:00Z",
            "updated_at": "2026-07-23T11:44:00Z"
        }
    ]

    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value.data) = mock_data

    response = client.get(f"/obras/{obra_id}/almoxarifado/insumos")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["status"] == "Normal"
    assert data[1]["status"] == "Crítico"

def test_registrar_movimentacao_entrada_sucesso(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    insumo_id = "00000000-0000-0000-0000-000000000001"
    payload = {
        "tipo_movimentacao": "ENTRADA",
        "quantidade": 50.0,
        "responsavel": "Almoxarife Carlos",
        "observacoes": "Recebimento NF-5520"
    }

    mock_insumo = {
        "id": insumo_id,
        "obra_id": obra_id,
        "codigo_insumo": "SINAPI-1245",
        "descricao": "Cimento CP-II",
        "categoria": "ESTRUTURA",
        "quantidade_minima": 100.00,
        "unidade": "sacos",
        "preco_unitario": 32.50,
        "quantidade_atual": 450.00
    }
    
    # 1. Mock buscar insumo
    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value.data) = [mock_insumo]

    # 2. Mock criar movimentação
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "00000000-0000-0000-0000-000000000009",
            "insumo_id": insumo_id,
            "tipo_movimentacao": "ENTRADA",
            "quantidade": 50.00,
            "responsavel": "Almoxarife Carlos",
            "observacoes": "Recebimento NF-5520",
            "data_movimentacao": "2026-07-23T11:44:00Z",
            "created_at": "2026-07-23T11:44:00Z"
        }
    ]

    # 3. Mock atualizar quantidade do insumo
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [
        {**mock_insumo, "quantidade_atual": 500.0}
    ]

    response = client.post(f"/obras/{obra_id}/almoxarifado/insumos/{insumo_id}/movimentacoes", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["tipo_movimentacao"] == "ENTRADA"
    assert float(data["quantidade"]) == 50.0
    mock_supabase.table.return_value.update.assert_called_with({
        "quantidade_atual": 500.0,
        "updated_at": "now()"
    })

def test_registrar_movimentacao_saida_saldo_insuficiente(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    insumo_id = "00000000-0000-0000-0000-000000000002"
    payload = {
        "tipo_movimentacao": "SAIDA",
        "quantidade": 20.0,
        "responsavel": "Mestre Antônio",
        "observacoes": "Consumo para a laje do piso 12"
    }

    mock_insumo = {
        "id": insumo_id,
        "obra_id": obra_id,
        "codigo_insumo": "PR-8821",
        "descricao": "Aço CA-50 10mm",
        "categoria": "ESTRUTURA",
        "quantidade_minima": 15.00,
        "unidade": "toneladas",
        "preco_unitario": 5200.00,
        "quantidade_atual": 12.00
    }
    
    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value.data) = [mock_insumo]

    response = client.post(f"/obras/{obra_id}/almoxarifado/insumos/{insumo_id}/movimentacoes", json=payload)

    assert response.status_code == 400
    assert "insuficiente" in response.json()["detail"]

def test_listar_locacoes(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    mock_data = [
        {
            "id": "00000000-0000-0000-0000-000000000030",
            "obra_id": obra_id,
            "nome_equipamento": "Betoneira 400L",
            "locadora": "Rental Tech",
            "status": "EM_USO",
            "devolucao_prevista": "2024-05-28",
            "responsavel": "Mestre Antônio",
            "created_at": "2026-07-23T11:44:00Z"
        }
    ]

    (mock_supabase.table.return_value
        .select.return_value
        .eq.return_value
        .execute.return_value.data) = mock_data

    response = client.get(f"/obras/{obra_id}/almoxarifado/locacoes")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["nome_equipamento"] == "Betoneira 400L"
    assert data[0]["status"] == "EM_USO"

def test_registrar_locacao(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    payload = {
        "nome_equipamento": "Martelete Elétrico 15kg",
        "locadora": "Tools Express",
        "status": "AGUARDANDO_RETIRADA",
        "devolucao_prevista": "2024-05-25"
    }

    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "00000000-0000-0000-0000-000000000031",
            "obra_id": obra_id,
            "nome_equipamento": "Martelete Elétrico 15kg",
            "locadora": "Tools Express",
            "status": "AGUARDANDO_RETIRADA",
            "devolucao_prevista": "2024-05-25",
            "responsavel": None,
            "created_at": "2026-07-23T11:44:00Z"
        }
    ]

    response = client.post(f"/obras/{obra_id}/almoxarifado/locacoes", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["nome_equipamento"] == "Martelete Elétrico 15kg"
    assert data["status"] == "AGUARDANDO_RETIRADA"

def test_deletar_locacao_sucesso(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    locacao_id = "00000000-0000-0000-0000-000000000030"

    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = [
        {"id": locacao_id}
    ]

    response = client.delete(f"/obras/{obra_id}/almoxarifado/locacoes/{locacao_id}")

    assert response.status_code == 200
    assert response.json() == {"message": "Locação deletada com sucesso"}
