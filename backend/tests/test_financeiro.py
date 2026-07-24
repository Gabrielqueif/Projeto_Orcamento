from unittest.mock import MagicMock
import pytest

def test_criar_despesa_sucesso(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    payload = {
        "descricao": "Fornecimento de Vigas de Aço",
        "valor": 184600.00,
        "categoria": "Materiais",
        "status": "APROVADO",
        "data_competencia": "2026-07-23",
        "responsavel": "A. Torres"
    }

    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": "despesa-1",
            "obra_id": obra_id,
            "descricao": "Fornecimento de Vigas de Aço",
            "valor": 184600.00,
            "categoria": "Materiais",
            "status": "APROVADO",
            "data_competencia": "2026-07-23",
            "responsavel": "A. Torres",
            "origem": "MANUAL",
            "created_at": "2026-07-23T12:00:00Z",
            "updated_at": "2026-07-23T12:00:00Z"
        }
    ]

    response = client.post(f"/obras/{obra_id}/financeiro/despesas", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["descricao"] == "Fornecimento de Vigas de Aço"
    assert float(data["valor"]) == 184600.0
    assert data["categoria"] == "Materiais"

def test_listar_despesas(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    
    mock_data = [
        {
            "id": "despesa-1",
            "obra_id": obra_id,
            "descricao": "Fornecimento de Vigas de Aço",
            "valor": 184600.00,
            "categoria": "Materiais",
            "status": "APROVADO",
            "data_competencia": "2026-07-23",
            "responsavel": "A. Torres",
            "origem": "MANUAL",
            "created_at": "2026-07-23T12:00:00Z",
            "updated_at": "2026-07-23T12:00:00Z"
        }
    ]

    (mock_supabase.table.return_value
        .select.return_value
        .or_.return_value
        .execute.return_value.data) = [{"id": obra_id, "orcamento_id": "orc-1"}]

    (mock_supabase.table.return_value
        .select.return_value
        .in_.return_value
        .order.return_value
        .execute.return_value.data) = mock_data


    response = client.get(f"/obras/{obra_id}/financeiro/despesas")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["descricao"] == "Fornecimento de Vigas de Aço"

def test_deletar_despesa_sucesso(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    despesa_id = "despesa-1"

    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = [
        {"id": despesa_id}
    ]

    response = client.delete(f"/obras/{obra_id}/financeiro/despesas/{despesa_id}")

    assert response.status_code == 200
    assert response.json() == {"message": "Despesa excluída com sucesso"}

def test_obter_consolidado_financeiro(client, mock_supabase):
    obra_id = "e9b50e2ddc9943efb387052637738f61"
    orcamento_id = "orc-123"

    # 1. Mock obter_orcamento_id_da_obra
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"orcamento_id": orcamento_id}
    ]

    # 2. Mock obter_valor_total_planejado
    # 3. Mock obter_planejado_por_categoria (agrupado em orcamento_item_insumo)
    # Para o select encadeado do repositório:
    # self.supabase.table("orcamento_item_insumo").select("tipo_item, total, orcamento_item_id, orcamento_itens(quantidade)").eq("orcamento_itens.orcamento_id", orcamento_id).execute()
    
    mock_insumos_data = [
        {
            "tipo_item": "MATERIAL",
            "total": 100000.0,
            "orcamento_item_id": "item-1",
            "orcamento_itens": {"quantidade": 2.0}
        },
        {
            "tipo_item": "MAO_DE_OBRA",
            "total": 50000.0,
            "orcamento_item_id": "item-2",
            "orcamento_itens": {"quantidade": 1.0}
        }
    ]

    # Criamos um mock estruturado para os múltiplos selects
    class TableMock:
        def __init__(self, name):
            self.name = name

        def select(self, *args, **kwargs):
            self.select_args = args
            return self

        def eq(self, *args, **kwargs):
            return self

        def in_(self, *args, **kwargs):
            return self

        def or_(self, *args, **kwargs):
            return self

        def order(self, *args, **kwargs):
            return self


        def insert(self, *args, **kwargs):
            return self

        def delete(self, *args, **kwargs):
            return self

        def update(self, *args, **kwargs):
            return self

        def execute(self):
            mock_res = MagicMock()
            if self.name == "obras":
                mock_res.data = [{"orcamento_id": orcamento_id}]
            elif self.name == "orcamentos":
                mock_res.data = [{"valor_total": 250000.0}]
            elif self.name == "orcamento_itens":
                mock_res.data = [{"id": "item-1", "quantidade": 2.0}, {"id": "item-2", "quantidade": 1.0}]
            elif self.name == "orcamento_item_insumo":
                mock_res.data = [
                    {"tipo_item": "MATERIAL", "total": 100000.0, "orcamento_item_id": "item-1"},
                    {"tipo_item": "MAO_DE_OBRA", "total": 50000.0, "orcamento_item_id": "item-2"}
                ]
            elif self.name == "custos_despesas":
                mock_res.data = [
                    {"categoria": "Materiais", "valor": 180000.0},
                    {"categoria": "Mão de Obra", "valor": 45000.0}
                ]
            else:
                mock_res.data = []
            return mock_res


    def side_effect_table(table_name):
        return TableMock(table_name)

    mock_supabase.table.side_effect = side_effect_table

    response = client.get(f"/obras/{obra_id}/financeiro/consolidado")

    assert response.status_code == 200
    data = response.json()
    assert float(data["total_orcado"]) == 250000.0
    assert float(data["total_realizado"]) == 225000.0 # 180000 + 45000
    assert float(data["saldo_restante"]) == 250000.0 - 225000.0
    assert data["desvio_percentual"] == -10.0 # (225000 - 250000)/250000 * 100
    
    # Valida categorias
    materiais_cat = next(c for c in data["gasto_por_categoria"] if c["categoria"] == "Materiais")
    assert float(materiais_cat["orcado"]) == 200000.0 # 100000 * 2
    assert float(materiais_cat["realizado"]) == 180000.0
    assert float(materiais_cat["desvio"]) == -20000.0

def test_obter_portfolio_consolidado(client, mock_supabase):
    mock_obras_data = [
        {"id": "obra-1", "escopo": "Residencial Teste", "cliente": "Cliente A", "engenheiro_responsavel_id": "Eng. Silva"},
        {"id": "obra-2", "escopo": "Comercial Teste", "cliente": "Cliente B", "engenheiro_responsavel_id": "Eng. Souza"}
    ]

    class TableMockPortfolio:
        def __init__(self, name):
            self.name = name

        def select(self, *args, **kwargs): return self
        def eq(self, *args, **kwargs): return self
        def in_(self, *args, **kwargs): return self
        def or_(self, *args, **kwargs): return self
        def order(self, *args, **kwargs): return self
        def execute(self):
            res = MagicMock()
            if self.name == "obras":
                res.data = mock_obras_data
            elif self.name == "orcamentos":
                res.data = [{"valor_total": 500000.0}]
            elif self.name == "orcamento_itens":
                res.data = [{"id": "item-1", "quantidade": 1.0}]
            elif self.name == "orcamento_item_insumo":
                res.data = [{"tipo_item": "MATERIAL", "total": 100000.0, "orcamento_item_id": "item-1"}]
            elif self.name == "custos_despesas":
                res.data = [{"categoria": "Materiais", "valor": 50000.0}]
            else:
                res.data = []
            return res

    mock_supabase.table.side_effect = lambda name: TableMockPortfolio(name)

    response = client.get("/financeiro/portfolio")
    assert response.status_code == 200
    data = response.json()
    assert "total_orcado" in data
    assert "projetos" in data
    assert len(data["projetos"]) == 2
    assert data["projetos"][0]["nome"] == "Residencial Teste"

