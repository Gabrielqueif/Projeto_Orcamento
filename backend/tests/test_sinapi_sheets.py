import pytest
import pandas as pd
from io import BytesIO
from unittest.mock import MagicMock
from app.services.sinapi_service import process_sinapi_file

def test_sheet_identification():
    # 1. Create a mock Excel file with CSD, CCD, CSE sheets
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Create minimal valid data for each sheet
        # Columns must mimic the expected structure: State columns + CODIGO/DESCRICAO
        # COLUNAS_ESTADOS = ["AC", "AL", ...] from service
        
        # We need a header row that identifies it as a valid sheet
        # Service checks for: Any state column AND (CODIGO or DESCRICAO)
        
        headers = ["CODIGO", "DESCRICAO", "UNIDADE", "SP", "RJ", "MG"]
        data = [
            ["123", "Item Test 1", "UN", "10,00", "11,00", "12,00"],
        ]
        df = pd.DataFrame(data, columns=headers)
        
        # Write to specific sheet names we want to test
        df.to_excel(writer, sheet_name="CSD_MACRO_ABC", index=False) # Should be Sem Desoneracao
        df.to_excel(writer, sheet_name="CCD_OUTRA_COISA", index=False) # Should be Com Desoneracao
        df.to_excel(writer, sheet_name="CSE_BLABLA", index=False) # Should be Empreitada
        
        # Add a dummy sheet to ignore
        df.to_excel(writer, sheet_name="MENU", index=False)

    file_content = output.getvalue()

    # 2. Mock Repository
    mock_repo = MagicMock()
    mock_repo.upsert_batch_composicoes.return_value = 1
    mock_repo.upsert_batch_estados.return_value = 1

    # 3. Process
    result = process_sinapi_file(file_content, mock_repo)

    # 4. Verification
    # Check that repo methods were called
    assert mock_repo.upsert_batch_composicoes.called
    assert mock_repo.upsert_batch_estados.called
    
    # Check if we captured prices for all 3 types
    # We need to inspect the call args to see what was passed to upsert_batch_estados
    call_args = mock_repo.upsert_batch_estados.call_args[0][0] # First arg is the list of dicts
    
    types_found = set(item['tipo_composicao'] for item in call_args)
    
    # We expect mapped values
    expected_types = {"Sem Desoneração", "Com Desoneração", "Empreitada"}
    
    # Check if all expected types are present in the processed data
    assert expected_types.issubset(types_found), f"Expected {expected_types} but found {types_found}"
