import pandas as pd
from app.services.sinapi_text_utils import gerar_chave_match

xl = pd.ExcelFile('planilhas/Tabela-de-Insumos-028.1---ENC.-SOCIAIS-84,44.xls')
df = pd.read_excel(xl, sheet_name='insumos', header=None)

found = False
for i, row in df.iterrows():
    vals = [gerar_chave_match(str(v)) for v in row.values]
    if "codigo" in vals and "descricao" in vals:
        print(f"HEADER FOUND at Row {i}")
        print(f"Values: {vals}")
        found = True
        break

if not found:
    print("Header NOT FOUND in any row.")
