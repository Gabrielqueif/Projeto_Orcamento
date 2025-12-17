from typing import Any, Dict, List
import unicodedata
import re
from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_supabase

router = APIRouter(prefix="/composicoes", tags=["Composições"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PLANILHA_SINAPI_CAMINHO = BASE_DIR / "planilhas" / "planilha_sinapi.xlsx"

TABELA_COMPOSICOES = "composicao"
TABELA_COMPOSICOES_ESTADOS = "composicao_estados"

COLUNAS_ESTADOS = [
    "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", 
    "ma", "mt", "ms", "mg", "pa", "pb", "pr", "pe", "pi", 
    "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to"
]

def remover_acentos(texto: str) -> str:
    """Remove acentos e deixa minúsculo"""
    if not isinstance(texto, str): return str(texto)
    nfkd = unicodedata.normalize('NFD', texto)
    return u"".join([c for c in nfkd if not unicodedata.combining(c)]).lower()

def limpar_link_excel(texto):
    """Remove fórmulas HYPERLINK e deixa só o texto"""
    if pd.isna(texto): return ""
    texto = str(texto).strip()
    if texto.startswith("="):
        match = re.search(r'HYPERLINK\s*\(.*,\s*"(.*)"\s*\)', texto, re.IGNORECASE)
        if match: return match.group(1)
        return texto.replace('"', '').replace('=', '')
    return texto

def gerar_chave_match(texto: str) -> str:
    """Gera chave apenas com letras e números para cruzar dados"""
    texto = limpar_link_excel(texto)
    sem_acento = remover_acentos(texto)
    return re.sub(r'[^a-z0-9]', '', sem_acento)

def limpar_valor_moeda(valor):
    if pd.isna(valor): return None
    s_valor = str(valor).strip()
    if s_valor == '' or s_valor == '-' or s_valor.lower() == 'nan': return None
    try:
        if isinstance(valor, (int, float)): return float(valor)
        return float(s_valor.replace('.', '').replace(',', '.'))
    except: return None

def _normalizar_nome_aba(texto):
    return remover_acentos(str(texto)).strip()

@router.post("/importar", summary="Importar SINAPI (Completo)")
def importar_sinapi(supabase=Depends(get_supabase)) -> dict:
    
    if not PLANILHA_SINAPI_CAMINHO.exists():
        raise HTTPException(status_code=400, detail="Arquivo planilha_sinapi.xlsx não encontrado.")

    try:
        xl = pd.ExcelFile(PLANILHA_SINAPI_CAMINHO)
        abas = xl.sheet_names
        
        # 1. LOCALIZAR ABAS
        aba_analitico = next((a for a in abas if "analitico" in _normalizar_nome_aba(a) and "custo" not in _normalizar_nome_aba(a)), None)
        if not aba_analitico: aba_analitico = next((a for a in abas if "analitico" in _normalizar_nome_aba(a)), None)

        aba_precos = next((a for a in abas if "csd" in _normalizar_nome_aba(a)), None)
        if not aba_precos: aba_precos = next((a for a in abas if "ccd" in _normalizar_nome_aba(a)), None)
        if not aba_precos: aba_precos = next((a for a in abas if "cse" in _normalizar_nome_aba(a)), None)

        registros_comp = []
        registros_precos = []
        mapa_desc_cod = {} 

        # =========================================================
        # FASE 1: ANALÍTICO (Metadados e Chaves)
        # =========================================================
        if aba_analitico:
            df_raw = pd.read_excel(PLANILHA_SINAPI_CAMINHO, sheet_name=aba_analitico, header=None, dtype=str)
            
            idx_row_header = -1
            col_idx_cod = -1
            col_idx_desc = -1
            col_idx_unid = -1
            col_idx_grupo = -1
            col_idx_tipo = -1

            for r_idx, row in df_raw.head(30).iterrows():
                row_clean = [remover_acentos(str(v)) for v in row.values]
                
                tem_codigo = any("codigo" in s and "composicao" in s for s in row_clean)
                tem_descricao = any("descricao" in s for s in row_clean)
                
                if tem_codigo and tem_descricao:
                    idx_row_header = r_idx
                    for c_idx, val in enumerate(row_clean):
                        if "codigo" in val and "composicao" in val: col_idx_cod = c_idx
                        elif "descricao" in val: col_idx_desc = c_idx
                        elif "unidade" in val: col_idx_unid = c_idx
                        elif "grupo" in val: col_idx_grupo = c_idx
                        elif "tipo" in val and "item" in val: col_idx_tipo = c_idx
                    break
            
            if idx_row_header != -1 and col_idx_cod != -1:
                for r_idx in range(idx_row_header + 1, len(df_raw)):
                    row = df_raw.iloc[r_idx]
                    
                    if col_idx_tipo != -1:
                        tipo = remover_acentos(str(row.iloc[col_idx_tipo]))
                        if "insumo" in tipo or "composicao" in tipo: continue 
                    
                    cod = str(row.iloc[col_idx_cod]).replace('.0', '').strip()
                    desc = str(row.iloc[col_idx_desc]) if col_idx_desc != -1 else ""
                    
                    if cod.isdigit() and cod != '0':
                        chave = gerar_chave_match(desc)
                        if len(chave) > 5:
                            mapa_desc_cod[chave] = cod
                        
                        registros_comp.append({
                            "codigo_composicao": cod,
                            "descricao": desc.strip(),
                            "unidade": str(row.iloc[col_idx_unid]).strip() if col_idx_unid != -1 else "-",
                            "grupo": str(row.iloc[col_idx_grupo]).strip()[:250] if col_idx_grupo != -1 else "-"
                        })

        # =========================================================
        # FASE 2: PREÇOS (Grid Layout)
        # =========================================================
        if aba_precos:
            df_grid = pd.read_excel(PLANILHA_SINAPI_CAMINHO, sheet_name=aba_precos, header=None)
            
            row_idx_estados = -1
            mapa_col_estados_temp = {} 
            
            # Busca Linha dos Estados
            for r_idx, row in df_grid.head(15).iterrows():
                vals = [remover_acentos(str(v)).strip() for v in row.values]
                siglas_achadas = [v for v in vals if v in COLUNAS_ESTADOS]
                if len(siglas_achadas) >= 5:
                    row_idx_estados = r_idx
                    for c_idx, val in enumerate(vals):
                        if val in COLUNAS_ESTADOS:
                            mapa_col_estados_temp[c_idx] = val
                    break
            
            # Busca Linha de Dados (Descrição)
            row_idx_dados_inicio = -1
            col_idx_desc_preco = -1
            start_search = row_idx_estados + 1 if row_idx_estados != -1 else 0
            
            for r_idx in range(start_search, 25): 
                row = df_grid.iloc[r_idx]
                vals = [remover_acentos(str(v)).strip() for v in row.values]
                if any("descricao" in v for v in vals):
                    row_idx_dados_inicio = r_idx + 1
                    for c_idx, val in enumerate(vals):
                        if "descricao" in val: col_idx_desc_preco = c_idx
                    break
            
            # Extração
            if row_idx_dados_inicio != -1 and mapa_col_estados_temp:
                df_dados = df_grid.iloc[row_idx_dados_inicio:]
                
                for _, row in df_dados.iterrows():
                    desc_raw = row.iloc[col_idx_desc_preco] if col_idx_desc_preco != -1 else ""
                    if pd.isna(desc_raw) or str(desc_raw).strip() == "": continue
                    
                    chave = gerar_chave_match(desc_raw)
                    cod_recuperado = mapa_desc_cod.get(chave)
                    
                    if cod_recuperado:
                        reg_preco = {"codigo_composicao": cod_recuperado}
                        tem_valor = False
                        
                        for c_idx, sigla_estado in mapa_col_estados_temp.items():
                            val = row.iloc[c_idx]
                            val_float = limpar_valor_moeda(val)
                            reg_preco[sigla_estado] = val_float
                            if val_float is not None: tem_valor = True
                        
                        if tem_valor:
                            registros_precos.append(reg_preco)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

    # =========================================================
    # FASE 3: ENVIO (Deduplicação e Batch)
    # =========================================================
    def dedup(lista):
        seen = set()
        new_l = []
        for d in lista:
            c = d['codigo_composicao']
            if c not in seen:
                seen.add(c)
                new_l.append(d)
        return new_l

    registros_comp = dedup(registros_comp)
    registros_precos = dedup(registros_precos)

    def upsert_batch(tabela, dados):
        if not dados: return 0
        total = 0
        for i in range(0, len(dados), 1000):
            try:
                r = supabase.table(tabela).upsert(dados[i:i+1000]).execute()
                if r.data: total += len(r.data)
            except Exception as e:
                print(f"Erro lote {tabela}: {e}")
        return total

    q_comp = upsert_batch(TABELA_COMPOSICOES, registros_comp)
    q_est = upsert_batch(TABELA_COMPOSICOES_ESTADOS, registros_precos)

    return {
        "status": "sucesso",
        "mensagem": "Importação concluída com sucesso.",
        "detalhes": {
            "itens_cadastrados": q_comp,
            "itens_com_preco": q_est,
            "aba_origem": aba_analitico,
            "aba_precos": aba_precos
        }
    }

# --- ROTAS DE LEITURA ---
@router.get("/")
def listar_composicoes(supabase=Depends(get_supabase)):
    return supabase.table(TABELA_COMPOSICOES).select("*").limit(100).execute().data or []

@router.get("/buscar/{termo}")
def buscar_composicao(termo: str, supabase=Depends(get_supabase)):
    try:
        if termo.isdigit():
            return supabase.table(TABELA_COMPOSICOES).select("*").eq("codigo_composicao", termo).execute().data
        else:
            return supabase.table(TABELA_COMPOSICOES).select("*").ilike("descricao", f"%{termo}%").limit(50).execute().data
    except: return []

@router.get("/{codigo_composicao}/estados")
def listar_estados_composicao(codigo_composicao: str, supabase=Depends(get_supabase)):
    return supabase.table(TABELA_COMPOSICOES_ESTADOS).select("*").eq("codigo_composicao", codigo_composicao).execute().data or []