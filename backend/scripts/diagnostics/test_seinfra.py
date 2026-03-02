import pandas as pd
from io import BytesIO
import sys

def test_seinfra_file(file_path):
    print(f"Testing file: {file_path}")
    try:
        xl = pd.ExcelFile(file_path)
        print(f"Sheet names: {xl.sheet_names}")
        
        for sheet in xl.sheet_names[:3]:
            print(f"\n--- Sheet: {sheet} ---")
            df = pd.read_excel(xl, sheet_name=sheet, header=None, nrows=20)
            print(df.to_string())
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_seinfra.py <file_path>")
    else:
        test_seinfra_file(sys.argv[1])
