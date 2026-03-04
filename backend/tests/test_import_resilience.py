import pytest
from unittest.mock import MagicMock, patch
from app.services.import_service import process_import_file, _deduplicar_composicoes
import pandas as pd
from io import BytesIO

def create_mock_sinapi_excel() -> bytes:
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Minimal valid SINAPI-like structure
        data = [
            ["", "", "", ""],
            ["", "", "", ""],
            ["", "01/2024", "SP", ""],
            ["", "", "", "Sem Desoneração"],
            ["", "", "", "SP"],
            ["CODIGO", "DESCRICAO", "UNIDADE", "AC", "SP"],
            ["100", "Item 1", "UN", 10.0, 15.0],
            ["101", "Item 2", "UN", 20.0, 25.0]
        ]
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name="CSD_TEST", index=False, header=False)
    return output.getvalue()

def test_import_db_failure_during_composicoes():
    """Testa falha no banco de dados durante o upsert de composições."""
    content = create_mock_sinapi_excel()
    mock_repo = MagicMock()
    # Simula erro de conexão ou restrição no banco
    mock_repo.upsert_batch_composicoes.side_effect = Exception("DB Connection Error")
    
    with pytest.raises(ValueError, match="Erro no processamento da importação: DB Connection Error"):
        process_import_file(content, mock_repo, source_type="SINAPI")

def test_import_db_failure_during_precos():
    """Testa falha no banco de dados durante o upsert de preços."""
    content = create_mock_sinapi_excel()
    mock_repo = MagicMock()
    mock_repo.upsert_batch_composicoes.return_value = 2
    mock_repo.upsert_batch_estados.side_effect = Exception("Storage Limit Exceeded")
    
    with pytest.raises(ValueError, match="Erro no processamento da importação: Storage Limit Exceeded"):
        process_import_file(content, mock_repo, source_type="SINAPI")

def test_import_high_volume_data():
    """Testa o processamento de uma planilha com grande volume de dados."""
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        header = [["", "01/2024", "", ""], ["", "", "", ""], ["CODIGO", "DESCRICAO", "UNIDADE", "AC"]]
        # Gerar 5000 linhas de dados
        data_rows = [[str(i), f"Item {i}", "UN", 1.0] for i in range(5000)]
        df = pd.DataFrame(header + data_rows)
        df.to_excel(writer, sheet_name="CSD_LARGE", index=False, header=False)
    
    content = output.getvalue()
    mock_repo = MagicMock()
    mock_repo.upsert_batch_composicoes.return_value = 5000
    mock_repo.upsert_batch_estados.return_value = 5000
    
    result = process_import_file(content, mock_repo, source_type="SINAPI")
    
    assert result["status"] == "sucesso"
    assert result["imported_items"] == 5000
    assert mock_repo.upsert_batch_composicoes.called

def test_deduplication_logic_edge_cases():
    """Testa a lógica de deduplicação com casos extremos."""
    # Lista vazia
    assert _deduplicar_composicoes([]) == []
    
    # Itens já únicos
    data = [{"codigo_composicao": "1"}, {"codigo_composicao": "2"}]
    assert _deduplicar_composicoes(data) == data
    
    # Itens duplicados
    data_dup = [{"codigo_composicao": "1", "v": "a"}, {"codigo_composicao": "1", "v": "b"}]
    # Deve manter o primeiro
    res = _deduplicar_composicoes(data_dup)
    assert len(res) == 1
    assert res[0]["v"] == "a"
