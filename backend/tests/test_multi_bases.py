"""
Tests for multi-base support: parser factory and SINAPI/SEINFRA parsers.

The `sinapi_excel_content` fixture (conftest.py) provides an in-memory Excel
file so tests run in any environment without physical spreadsheet files.
"""
import pytest
import unittest.mock as mock
from app.services.parser_factory import get_parser
from app.services.sinapi_excel_parser import SinapiExcelParser
from app.services.seinfra_excel_parser import SeinfraExcelParser
from app.services.base_excel_parser import BaseExcelParser
from app.services.import_service import extract_metadata


# ---------------------------------------------------------------------------
# Parser factory
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_parser_factory_returns_sinapi_parser(sinapi_excel_content: bytes):
    """Factory retorna SinapiExcelParser (que é subclasse de BaseExcelParser) para fonte SINAPI."""
    parser = get_parser(sinapi_excel_content, "SINAPI")
    assert isinstance(parser, SinapiExcelParser)
    assert isinstance(parser, BaseExcelParser)


@pytest.mark.unit
def test_parser_factory_invalid_source():
    """Factory levanta ValueError para fonte desconhecida."""
    with pytest.raises(ValueError, match="Fonte de dados 'INVALID' não suportada"):
        get_parser(b"fake content", "INVALID")


@pytest.mark.unit
def test_parser_factory_returns_seinfra_parser():
    """Factory instancia SeinfraExcelParser para fonte SEINFRA (sem arquivo físico)."""
    with mock.patch("pandas.ExcelFile"):
        parser = get_parser(b"fake excel content", "SEINFRA")
    assert isinstance(parser, SeinfraExcelParser)


# ---------------------------------------------------------------------------
# Inheritance / structural
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_sinapi_excel_parser_inherits_base():
    """SinapiExcelParser deve herdar de BaseExcelParser."""
    assert issubclass(SinapiExcelParser, BaseExcelParser)


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_extract_metadata_with_source_type(sinapi_excel_content: bytes):
    """extract_metadata aceita e propaga source_type correto."""
    metadata = extract_metadata(sinapi_excel_content, source_type="SINAPI")
    assert metadata.fonte == "SINAPI"
    assert metadata.mes_referencia == "12/2025"
