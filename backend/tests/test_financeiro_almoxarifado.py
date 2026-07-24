import pytest
from decimal import Decimal
from unittest.mock import MagicMock
from app.modules.almoxarifado.services import AlmoxarifadoService

def test_status_insumo_critico():
    mock_repo = MagicMock()
    mock_repo.listar_insumos.return_value = [
        {"id": "ins-1", "descricao": "Cimento", "quantidade_atual": 5, "quantidade_minima": 10},
        {"id": "ins-2", "descricao": "Areia", "quantidade_atual": 50, "quantidade_minima": 10}
    ]
    
    service = AlmoxarifadoService(mock_repo)
    resultado = service.listar_insumos("obra-123")
    
    assert len(resultado) == 2
    assert resultado[0]["status"] == "Crítico"
    assert resultado[1]["status"] == "Normal"

def test_movimentacao_estoque_insuficiente():
    mock_repo = MagicMock()
    mock_repo.buscar_insumo_por_id.return_value = {
        "id": "ins-1",
        "quantidade_atual": 3.0,
        "obra_id": "obra-123"
    }
    
    service = AlmoxarifadoService(mock_repo)
    schema_saida = MagicMock()
    schema_saida.tipo_movimentacao = "SAIDA"
    schema_saida.quantidade = 10.0
    
    with pytest.raises(ValueError, match="insuficiente"):
        service.registrar_movimentacao("ins-1", schema_saida)
