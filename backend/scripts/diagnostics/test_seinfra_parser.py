from app.services.seinfra_excel_parser import SeinfraExcelParser
import sys
import os

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

    meta = parser.extrair_metadados()
    print(f"Metadados: {meta}")

    for aba in abas[:1]: # Test first data sheet
        print(f"\n--- Extraindo da aba: {aba} ---")
        comps, prices = parser.extrair_registros_aba(aba, meta['mes_referencia'])
        print(f"Composições extraídas: {len(comps)}")
        print(f"Preços extraídos: {len(prices)}")
        
        if comps:
            print("\nExemplo Composição 0:")
            print(comps[0])
        if prices:
            print("\nExemplo Preço 0:")
            print(prices[0])

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_seinfra_parser.py <file_path>")
    else:
        test_parser(sys.argv[1])
