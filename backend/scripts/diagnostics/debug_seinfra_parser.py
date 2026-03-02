from app.services.seinfra_excel_parser import SeinfraExcelParser
from app.services.sinapi_text_utils import remover_acentos
import sys
import os
import pandas as pd

def test_parser(file_path):
    print(f"Testing Parser with: {file_path}")
    if not os.path.exists(file_path):
        print("File not found.")
        return

    with open(file_path, "rb") as f:
        content = f.read()

    parser = SeinfraExcelParser(content)
    abas = parser.identificar_abas_dados()
    print(f"Abas identificadas: {abas}")

    for aba in abas:
        print(f"\n--- Analisando aba: {aba} ---")
        df = parser.ler_aba(aba, header=None)
        print(f"Linhas totais: {len(df)}")
        
        # Inspecionar as primeiras 10 linhas
        for r_idx, row in df.head(10).iterrows():
            vals = [remover_acentos(str(v)).strip().upper() for v in row.values]
            print(f"Row {r_idx}: {vals}")
            
        comps, prices = parser.extrair_registros_aba(aba, "TEST")
        print(f"Result: {len(comps)} comps, {len(prices)} prices")

if __name__ == "__main__":
    test_parser(sys.argv[1])
