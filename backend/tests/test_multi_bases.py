import pytest
from app.services.parser_factory import get_parser
from app.services.sinapi_excel_parser import SinapiExcelParser
from app.services.base_excel_parser import BaseExcelParser
from io import BytesIO
import pandas as pd

def test_parser_factory_returns_sinapi_parser():
    """Testa se a fábrica retorna o parser correto para SINAPI."""
    from pathlib import Path
    # No Docker o root é /app, e planilhas está em /app/planilhas/
    file_path = Path("planilhas/SINAPI_Referência_2025_12.xlsx")
    if not file_path.exists():
        # Tentar caminho relativo se falhar (para rodar no host)
        file_path = Path("../planilhas/SINAPI_Referência_2025_12.xlsx")
    
    if not file_path.exists():
        pytest.skip(f"Planilha {file_path} não encontrada")
    
    with open(file_path, "rb") as f:
        content = f.read()
        
    parser = get_parser(content, "SINAPI")
    assert isinstance(parser, SinapiExcelParser)
    assert isinstance(parser, BaseExcelParser)

def test_parser_factory_invalid_source():
    """Testa se a fábrica levanta erro para fonte inválida."""
    content = b"fake content"
    with pytest.raises(ValueError, match="Fonte de dados 'INVALID' não suportada"):
        get_parser(content, "INVALID")

def test_sinapi_excel_parser_inheritance():
    """Testa se SinapiExcelParser herda de BaseExcelParser e tem os métodos necessários."""
    content = b"fake content"
    # Precisamos de um conteúdo mínimo vaildo de excel ou mockar o pd.ExcelFile
    # Para este teste de estrutura, vamos apenas verificar a herança
    assert issubclass(SinapiExcelParser, BaseExcelParser)

def test_extract_metadata_with_source_type():
    """Testa se extract_metadata aceita e retorna o source_type correto."""
    from app.services.sinapi_service import extract_metadata
    from pathlib import Path
    
    file_path = Path("planilhas/SINAPI_Referência_2025_12.xlsx")
    if not file_path.exists():
        file_path = Path("../planilhas/SINAPI_Referência_2025_12.xlsx")

    if not file_path.exists():
        pytest.skip(f"Planilha {file_path} não encontrada")

    with open(file_path, "rb") as f:
        content = f.read()

    metadata = extract_metadata(content, source_type="SINAPI")
    assert metadata.fonte == "SINAPI"
    assert metadata.mes_referencia == "12/2025"
