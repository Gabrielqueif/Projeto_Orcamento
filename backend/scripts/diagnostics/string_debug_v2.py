from app.services.sinapi_text_utils import remover_acentos
import sys
import os
import pandas as pd

def test_string_matching(file_path):
    print(f"Deep string analysis for: {file_path}")
    xl = pd.ExcelFile(file_path)
    df = pd.read_excel(xl, sheet_name=xl.sheet_names[0], header=None, nrows=10)
    
    row3 = df.iloc[3]
    for i, val in enumerate(row3):
        norm = remover_acentos(str(val)).strip().upper()
        print(f"Col {i}: Original='{val}', Norm='{norm}', Len={len(norm)}")
        # Print first few chars info
        msg = f"  Chars: "
        for char in norm:
            msg += f"'{char}'({ord(char)}) "
        print(msg)
        print(f"  Match 'CODIGO': {'CODIGO' in norm}")

if __name__ == "__main__":
    test_string_matching(sys.argv[1])
