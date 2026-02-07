import pandas as pd
from io import BytesIO
import sys

def test_read_excel():
    print("Starting excel read test...")
    try:
        # Create a minimal valid excel file in memory for testing
        df_source = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df_source.to_excel(writer, sheet_name='Analítico com Custo', index=False)
        
        buffer.seek(0)
        content = buffer.getvalue()
        print(f"Created in-memory excel file of size {len(content)} bytes")
        
        # Now try to read it back like the service does
        df = pd.read_excel(BytesIO(content), sheet_name='Analítico com Custo', header=None, nrows=20)
        print("Successfully read excel file")
        print(df)
        
    except Exception as e:
        print(f"Caught exception: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_read_excel()
