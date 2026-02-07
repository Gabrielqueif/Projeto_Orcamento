import pytest
from pathlib import Path
from app.services.sinapi_service import extract_metadata

def test_extract_metadata_success():
    """
    Tests metadata extraction using the actual sample file available in the repo.
    """
    file_path = Path("planilhas/planilha_sinapi.xlsx")
    if not file_path.exists():
        pytest.skip("Planilha de exemplo não encontrada")

    with open(file_path, "rb") as f:
        content = f.read()

    metadata = extract_metadata(content)

    assert metadata.mes_referencia == "09/2025"
    assert metadata.uf == "SP"
    assert metadata.desoneracao == "SEM DESONERAÇÃO"
