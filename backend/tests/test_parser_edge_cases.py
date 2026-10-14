import pytest
import pandas as pd
from io import BytesIO
from app.modules.importacao.services.sinapi_excel_parser import SinapiExcelParser
from app.modules.importacao.services.seinfra_excel_parser import SeinfraExcelParser
from app.modules.importacao.services.parser_factory import get_parser

def create_mock_excel(data_dict: dict) -> bytes:
    """Helper to create a mock excel file in memory."""
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        for sheet_name, rows in data_dict.items():
            df = pd.DataFrame(rows)
            df.to_excel(writer, sheet_name=sheet_name, index=False, header=False)
    return output.getvalue()

def test_sinapi_parser_with_empty_sheet():
    """Testa o parser SINAPI com uma planilha vazia."""
    content = create_mock_excel({"CSD_TEST": []})
    parser = SinapiExcelParser(content)
    
    # Não deve levantar exceção, deve apenas retornar vazio
    abas = parser.identificar_abas_dados()
    assert "CSD_TEST" in abas
    composicoes, precos = parser.extrair_registros_aba("CSD_TEST", "01/2024")
    assert len(composicoes) == 0
    assert len(precos) == 0

def test_sinapi_parser_no_header_found():
    """Testa o parser SINAPI quando não consegue detectar o cabeçalho."""
    # Linhas que não batem com nenhuma estratégia (sem CODIGO, sem estados)
    garbage_data = [["Lixo", "Aleatório", "123"], ["Mais", "Texto", "456"]]
    content = create_mock_excel({"CSD_GARBAGE": garbage_data})
    parser = SinapiExcelParser(content)
    
    composicoes, precos = parser.extrair_registros_aba("CSD_GARBAGE", "01/2024")
    # Pela implementação atual, se header é None, retorna ([], []) e loga warning
    assert len(composicoes) == 0
    assert len(precos) == 0

def test_seinfra_parser_fallback_invalid_data():
    """Testa o fallback do SEINFRA com dados que não parecem códigos nem preços."""
    # Dados que falham no is_valid_cod e is_valid_preco
    garbage_data = [
        ["TITULO TABELA", "", ""],
        ["OBSERVACAO", "TEXTO LONGO", "N/A"],
        ["X", "Y", "Z"] # Não é código (I... ou num) nem preço
    ]
    content = create_mock_excel({"TABELA_SEINFRA": garbage_data})
    parser = SeinfraExcelParser(content)
    
    composicoes, precos = parser.extrair_registros_aba("TABELA_SEINFRA", "01/2024")
    assert len(composicoes) == 0
    assert len(precos) == 0

def test_parser_factory_wrong_source_mismatch():
    """Excel SINAPI aberto como SEINFRA: nada é importado e a tabela não é identificada."""
    sinapi_data = [
        ["", ""],
        ["", ""],
        ["", "01/2024"],
        ["Header", "Composicao", "Preco"],
        ["123", "Item Teste", 100.50]
    ]
    content = create_mock_excel({"CSD_SINAPI": sinapi_data})

    parser = get_parser(content, "SEINFRA")
    assert parser.identificar_abas_dados() == []
    assert parser.extrair_precos_insumos("CSD_SINAPI", "x") == []
    with pytest.raises(ValueError, match="Tabela SEINFRA"):
        parser.extrair_metadados()
