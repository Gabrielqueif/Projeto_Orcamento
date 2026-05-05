import sys
import os
sys.path.insert(0, r'd:\repositorios\Projeto_Orcamento\backend')

from app.services.sinapi_excel_parser import SinapiExcelParser
from app.repositories.item_repository import ItemRepository
from core.supabase_client import get_supabase_client

XLSX_FILES = [
    r'd:\repositorios\Projeto_Orcamento\planilhas\SINAPI_Referência_2026_01.xlsx',
    r'd:\repositorios\Projeto_Orcamento\planilhas\SINAPI_Referência_2025_12.xlsx'
]

repository = ItemRepository(get_supabase_client())

for file_path in XLSX_FILES:
    if not os.path.exists(file_path):
        print(f"Arquivo nao encontrado: {file_path}")
        continue
        
    print(f"Processando analitico de: {file_path}")
    with open(file_path, 'rb') as f:
        content = f.read()
    
    parser = SinapiExcelParser(content)
    aba_analitico = parser.identificar_aba_analitico()
    
    if not aba_analitico:
        print(f"ERRO: Aba analitico nao encontrada em {file_path}")
        continue
        
    print(f"Aba encontrada: {aba_analitico}")
    meta = parser.extrair_metadados()
    mes = meta["mes_referencia"]
    
    relacoes = parser.extrair_analitico(aba_analitico, mes)
    print(f"Extraidas {len(relacoes)} relacoes. Salvando no banco...")
    
    q = repository.upsert_batch_composicao_itens(relacoes)
    print(f"SUCESSO: {q} registros salvos para {mes}.")

print("Fim do processo.")
