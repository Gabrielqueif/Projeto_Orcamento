import pandas as pd
from io import BytesIO
import re
import unicodedata
from typing import Dict, Any, List
from fastapi import UploadFile
from app.schemas.sinapi import SinapiMetadata
from app.repositories.item_repository import ItemRepository

COLUNAS_ESTADOS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", 
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", 
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

def _remover_acentos(texto: str) -> str:
    if not isinstance(texto, str): return str(texto)
    nfkd = unicodedata.normalize('NFD', texto)
    return u"".join([c for c in nfkd if not unicodedata.combining(c)]).lower()

def _limpar_link_excel(texto):
    if pd.isna(texto): return ""
    texto = str(texto).strip()
    if texto.startswith("="):
        match = re.search(r'HYPERLINK\s*\(.*,\s*"(.*)"\s*\)', texto, re.IGNORECASE)
        if match: return match.group(1)
        return texto.replace('"', '').replace('=', '')
    return texto

def _gerar_chave_match(texto: str) -> str:
    texto = _limpar_link_excel(texto)
    sem_acento = _remover_acentos(texto)
    return re.sub(r'[^a-z0-9]', '', sem_acento)

def _limpar_valor_moeda(valor):
    if pd.isna(valor): return None
    s_valor = str(valor).strip()
    if s_valor == '' or s_valor == '-' or s_valor.lower() == 'nan': return None
    try:
        if isinstance(valor, (int, float)): return float(valor)
        return float(s_valor.replace('.', '').replace(',', '.'))
    except: return None

def _normalizar_nome_aba(texto):
    return _remover_acentos(str(texto)).strip()

def _dedup(lista):
    seen = set()
    new_l = []
    for d in lista:
        c = d['codigo_composicao']
        if c not in seen:
            seen.add(c)
            new_l.append(d)
    return new_l

def extract_metadata(file_content: bytes, sheet_name_hint: str = None) -> SinapiMetadata:
    """
    Extracts metadata from the first available valid sheet.
    """
    try:
        xl = pd.ExcelFile(BytesIO(file_content))
        if sheet_name_hint and sheet_name_hint in xl.sheet_names:
            sheet_use = sheet_name_hint
        else:
            # Fallback: try to find any CSD/CCD/CSE or Analitico sheet
            sheet_use = xl.sheet_names[0]
            for s in xl.sheet_names:
                norm = _normalizar_nome_aba(s).upper()
                if any(x in norm for x in ["CSD", "CCD", "CSE", "ANALITICO"]):
                    sheet_use = s
                    break

        df = pd.read_excel(xl, sheet_name=sheet_use, header=None, nrows=20)
        
        # Strategies to find metadata
        # Strategy A: Standard layout (Mes: B3, Deson/UF: A8/B8)
        mes_referencia = "UNKNOWN"
        desoneracao_raw = "UNKNOWN" 
        uf = "BR"

        # Search for "MES DE REFERENCIA" in first 10 rows
        for idx, row in df.iterrows():
            row_str = " ".join([str(x).upper() for x in row.values if pd.notna(x)])
            if "MES DE REFERENCIA" in row_str or "MÊS DE REFERÊNCIA" in row_str:
                # Usually value is in next col or same col split?
                # Let's try to look at specific cells if known, or regex
                pass
        
        # Hardcoded attempt for standard SINAPI
        if len(df) > 2:
             val = str(df.iloc[2, 1]).strip() # B3
             if len(val) > 4: mes_referencia = val
        
        if len(df) > 7:
             d = str(df.iloc[7, 0]).strip().upper() # A8
             u = str(df.iloc[7, 1]).strip().upper() # B8
             if "ENCARGOS" in d or "DESONERADO" in d: desoneracao_raw = d
             if len(u) == 2: uf = u
        
        return SinapiMetadata(
            mes_referencia=mes_referencia,
            uf=uf,
            desoneracao=desoneracao_raw
        )
        
    except Exception as e:
        raise ValueError(f"Erro ao extrair metadados: {str(e)}")

def process_sinapi_file(file_content: bytes, repository: ItemRepository) -> Dict[str, Any]:
    try:
        xl = pd.ExcelFile(BytesIO(file_content))
        abas = xl.sheet_names
        
        # Identify Price Sheets (CSD, CCD, CSE)
        termos_precos = ["csd", "ccd", "cse"]
        abas_precos = [a for a in abas if any(t in _normalizar_nome_aba(a) for t in termos_precos)]
        
        # Fallback if no specific price sheets found (maybe user renamed them?) use all except known 'bad' sheets
        if not abas_precos:
             ignore = ["MENU", "BUSCA", "OBS", "INSTRUCOES"]
             abas_precos = [a for a in abas if not any(i in _normalizar_nome_aba(a).upper() for i in ignore)]

        # Extract Metadata from the first price sheet found (or just the file)
        first_sheet = abas_precos[0] if abas_precos else abas[0]
        metadata = extract_metadata(file_content, sheet_name_hint=first_sheet)

        with open("debug_sinapi.log", "a", encoding="utf-8") as f:
             f.write(f"\n--- Processando Arquivo (Refatorado) ---\n")
             f.write(f"Abas encontradas: {abas}\n")
             f.write(f"Abas Preços processadas: {abas_precos}\n")
             f.write(f"Metadados: {metadata}\n")

        registros_comp = []
        registros_precos = []
        
        # Process ONLY Price Sheets (extracting both Item Data AND Prices from them)
        for aba_precos in abas_precos:
            df_grid = pd.read_excel(xl, sheet_name=aba_precos, header=None)
            
            row_idx_header = -1
            mapa_col_estados = {}
            col_idx_cod = -1
            col_idx_desc = -1
            col_idx_unid = -1
            
            # 1. Find Header Line (must contain State codes AND 'CODIGO'/'DESCRICAO')
            # Searching first 20 lines
            for r_idx, row in df_grid.head(20).iterrows():
                vals = [_remover_acentos(str(v)).strip().upper() for v in row.values]
                
                # Check for key columns
                tem_estados = any(v in COLUNAS_ESTADOS for v in vals)
                tem_cod = any("CODIGO" in v for v in vals)
                tem_desc = any("DESCRICAO" in v for v in vals)
                
                if tem_estados and (tem_cod or tem_desc):
                    row_idx_header = r_idx
                    for c_idx, val in enumerate(vals):
                        if val in COLUNAS_ESTADOS:
                            mapa_col_estados[c_idx] = val.lower()
                        elif "CODIGO" in val: col_idx_cod = c_idx
                        elif "DESCRICAO" in val: col_idx_desc = c_idx
                        elif "UNIDADE" in val: col_idx_unid = c_idx
                    break
            
            # Fallback if header is tricky: try to find just states line? 
            # User said "descriptions are the same", so columns must exist.
            if row_idx_header == -1: 
                 # Try finding just states
                 for r_idx, row in df_grid.head(15).iterrows():
                    vals = [_remover_acentos(str(v)).strip().upper() for v in row.values]
                    if sum(1 for v in vals if v in COLUNAS_ESTADOS) > 5:
                         row_idx_header = r_idx
                         for c_idx, val in enumerate(vals):
                            if val in COLUNAS_ESTADOS: mapa_col_estados[c_idx] = val.lower()
                         # Assume standard positions if not found explicitly?
                         # Usually: Cod=0/1, Desc=1/2, Unit=2/3?
                         # Let's hope the previous explicit search worked.
                         break

            if row_idx_header == -1: continue # Skip this sheet

            row_idx_dados = row_idx_header + 1
            
            # Determine Type from Sheet Name
            aba_norm = _normalizar_nome_aba(aba_precos).upper()
            tipo_comp = "Sem Desoneração"
            if "CCD" in aba_norm or "COM DESONERACAO" in aba_norm: tipo_comp = "Com Desoneração"
            elif "CSE" in aba_norm or "EMPREITADA" in aba_norm: tipo_comp = "Empreitada"
            elif "CSD" in aba_norm or "SEM DESONERACAO" in aba_norm: tipo_comp = "Sem Desoneração"

            # Process Data
            df_dados = df_grid.iloc[row_idx_dados:]
            for _, row in df_dados.iterrows():
                # Extract Code/Desc/Unit
                cod_raw = row.iloc[col_idx_cod] if col_idx_cod != -1 else None
                desc_raw = row.iloc[col_idx_desc] if col_idx_desc != -1 else None
                
                if pd.isna(cod_raw) or str(cod_raw).strip() == "": continue
                
                cod = str(cod_raw).replace('.0', '').strip()
                desc = str(desc_raw).strip()
                unid = str(row.iloc[col_idx_unid]).strip() if col_idx_unid != -1 else "-"
                
                if not cod.isdigit() and len(cod) < 3: continue # Skip headers repeated or cruft

                # Add to Master Catalog List (will be deduped)
                registros_comp.append({
                    "codigo_composicao": cod,
                    "descricao": desc,
                    "unidade": unid,
                    "grupo": "-", # Not present in price sheet usually, default to -
                    "mes_referencia": metadata.mes_referencia
                })
                
                # Add to Prices List
                reg_preco = {
                     "codigo_composicao": cod,
                     "mes_referencia": metadata.mes_referencia,
                     "tipo_composicao": tipo_comp
                }
                has_val = False
                for c_idx, sigla_estado in mapa_col_estados.items():
                    val = _limpar_valor_moeda(row.iloc[c_idx])
                    reg_preco[sigla_estado] = val
                    if val is not None: has_val = True
                
                if has_val:
                    registros_precos.append(reg_preco)

        # Deduplicate Master Catalog
        registros_comp = _dedup(registros_comp)
        
        # Upsert
        q_comp = repository.upsert_batch_composicoes(registros_comp)
        q_est = repository.upsert_batch_estados(registros_precos)
        
        return {
            "status": "sucesso",
            "imported_items": q_comp,
            "imported_prices": q_est,
            "metadata": metadata.dict()
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise ValueError(f"Erro no processamento da importação: {str(e)}")
