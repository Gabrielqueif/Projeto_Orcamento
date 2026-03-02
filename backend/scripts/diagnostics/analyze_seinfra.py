import pandas as pd
import sys

def analyze_structure(file_path):
    print(f"Analyzing: {file_path}")
    try:
        xl = pd.ExcelFile(file_path)
        for sheet in xl.sheet_names:
            print(f"\nSheet: {sheet}")
            df = pd.read_excel(xl, sheet_name=sheet, header=None, nrows=30)
            for i, row in df.iterrows():
                # Filter out all-NaN rows
                vals = [str(v).strip() for v in row.values if not pd.isna(v) and str(v).strip()]
                if vals:
                    print(f"Row {i}: {vals}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_seinfra.py <file_path>")
    else:
        analyze_structure(sys.argv[1])
