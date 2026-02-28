import pytest
from pathlib import Path
from app.services.sinapi_service import extract_metadata

def test_extract_metadata_success():
    """
    Tests metadata extraction using the actual sample file available in the repo.
    """
    file_path = Path("planilhas/SINAPI_Referência_2025_12.xlsx")
    if not file_path.exists():
        file_path = Path("../planilhas/SINAPI_Referência_2025_12.xlsx")
        
    if not file_path.exists():
        pytest.skip(f"Planilha {file_path} não encontrada")

    with open(file_path, "rb") as f:
        content = f.read()

    metadata = extract_metadata(content)

    assert metadata.mes_referencia == "12/2025"
    assert metadata.uf == "BR"
    assert "SEM DESONERA" in metadata.desoneracao
