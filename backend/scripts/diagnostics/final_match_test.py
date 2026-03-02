import pandas as pd
from app.services.sinapi_text_utils import gerar_chave_match

xl = pd.ExcelFile('planilhas/Tabela-de-Insumos-028.1---ENC.-SOCIAIS-84,44.xls')
df = pd.read_excel(xl, sheet_name='insumos', header=None)
row3 = df.iloc[3]
vals_clean = [gerar_chave_match(str(v)) for v in row3.values]
print(f"Row 3 Clean: {vals_clean}")
print(f"Match 'codigo': {'codigo' in vals_clean}")
print(f"Match 'descricao': {'descricao' in vals_clean}")
