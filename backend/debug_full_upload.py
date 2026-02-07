import requests
import pandas as pd
from io import BytesIO

def debug_full_upload():
    # Changed to /import to test the full processing logic
    url = "http://127.0.0.1:8000/sinapi/import"
    
    # Create a dummy excel that mimics SINAPI structure
    # We need to simulate the structure expected by process_sinapi_file
    
    # 1. Sheet "Analítico com Custo"
    # Header row at index ?? Code logic searches for "codigo" and "composicao"
    # data[2][1] = "09/2025" (B3)
    
    data_analitico = [['' for _ in range(10)] for _ in range(30)]
    data_analitico[2][1] = "09/2025"      # Metadata B3
    data_analitico[7][0] = "SEM DESONERAÇÃO" # Metadata A8
    data_analitico[7][1] = "SP"           # Metadata B8
    
    # Header Row (e.g., row 20)
    header_row = 20
    data_analitico[header_row][0] = "codigo da composicao"
    data_analitico[header_row][1] = "descricao da composicao"
    data_analitico[header_row][2] = "unidade"
    data_analitico[header_row][3] = "origem de preco"
    
    # Data Row
    data_analitico[header_row+1][0] = "9999"
    data_analitico[header_row+1][1] = "COMPOSICAO TESTE"
    data_analitico[header_row+1][2] = "UN"
    data_analitico[header_row+1][3] = "SINAPI"
    
    df_analitico = pd.DataFrame(data_analitico)
    
    # 2. Sheet "CSD" (Prices)
    # Header row with states
    data_precos = [['' for _ in range(10)] for _ in range(30)]
    
    # States row (e.g., row 10)
    row_estados = 10
    data_precos[row_estados][0] = "CODIGO"
    data_precos[row_estados][1] = "DESCRICAO"
    data_precos[row_estados][2] = "SP" # State column
    data_precos[row_estados][3] = "RJ"
    
    # Data Start (row 15, needs "descricao" in column 1?)
    # Logic searches for "descricao" again in data lines? No, identifying data start.
    # Logic: "Find Data Start Line... if any 'descricao' in values... row_idx_dados_inicio = r_idx + 1"
    
    # Let's put a header "descrição" at row 15 to trigger start
    row_desc = 15
    data_precos[row_desc][1] = "descricao"
    
    # Actual Data at 16
    data_precos[row_desc+1][1] = "COMPOSICAO TESTE" # Match by description!
    data_precos[row_desc+1][2] = "150.50" # Price SP
    
    df_precos = pd.DataFrame(data_precos)

    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df_analitico.to_excel(writer, sheet_name='Analítico com Custo', header=False, index=False)
        df_precos.to_excel(writer, sheet_name='CSD', header=False, index=False)
    
    buffer.seek(0)
    files = {'file': ('sinapi_dummy.xlsx', buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    
    try:
        print("Sending request to /sinapi/import...")
        r = requests.post(url, files=files)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    debug_full_upload()
