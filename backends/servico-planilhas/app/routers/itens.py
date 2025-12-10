from typing import Any, Dict, List
import os
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_supabase

router = APIRouter(prefix="/composicoes", tags=["Composições"])

# Caminho absoluto baseado no diretório do arquivo atual
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PLANILHA_SINAPI_CAMINHO = BASE_DIR / "planilhas" / "planilha_sinapi.xlsx"
ABA_CSD = "CSD"

# Nomes de tabelas no Supabase
TABELA_COMPOSICOES = "composicao"
TABELA_COMPOSICOES_ESTADOS = "composicao_estados"

# Ajuste aqui os nomes das colunas de metadados conforme o cabeçalho da aba CSD
# Depois de normalizar os nomes (strip, lower, espaço -> _, etc.)
COLUMN_GRUPO = "grupo"
COLUMN_CODIGO = "codigo_composicao"
COLUMN_DESCRICAO = "descricao"
COLUMN_UNIDADE = "unidade"

# Colunas que representam os estados (após normalização)
COLUNAS_ESTADOS = [
    "ac",
    "al",
    "ap",
    "am",
    "ba",
    "ce",
    "df",
    "es",
    "go",
    "ma",
    "mt",
    "ms",
    "mg",
    "pa",
    "pb",
    "pr",
    "pe",
    "pi",
    "rj",
    "rn",
    "rs",
    "ro",
    "rr",
    "sc",
    "sp",
    "se",
    "to",
]


def _normalizar_colunas(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
    )
    return df


@router.post(
    "/importar",
    summary=(
        "Importar composições da planilha SINAPI (aba CSD) para duas tabelas: "
        "composicoes e composicoes_estados"
    ),
)
def importar_composicoes(supabase=Depends(get_supabase)) -> dict:
    """
    Lê a planilha planilha_sinapi.xlsx (aba CSD) e envia os dados para DUAS tabelas:

    1. `composicao`: grupo, codigo_composicao (PK), descricao, unidade (1 linha por composição)
    2. `composicao_estados`: codigo_composicao (FK) + colunas ac, al, ap, am, ba, ce, etc. (formato largo)

    A planilha SINAPI tem cabeçalhos na linha 10 (índice 9) e dados começam na linha 11.
    A tabela composicao_estados usa formato largo: uma coluna para cada estado brasileiro.
    """
    try:
        # Verifica se o arquivo existe
        if not PLANILHA_SINAPI_CAMINHO.exists():
            raise HTTPException(
                status_code=500, 
                detail=f"Arquivo da planilha não encontrado: {PLANILHA_SINAPI_CAMINHO}"
            )
        
        # Lê a planilha pulando as primeiras 9 linhas (0-8) e usando linha 10 (índice 9) como cabeçalho
        df = pd.read_excel(
            PLANILHA_SINAPI_CAMINHO, 
            sheet_name=ABA_CSD, 
            skiprows=9,  # Pula linhas 0-8 (metadados do relatório)
            header=0     # Usa a primeira linha lida (linha 10 original) como cabeçalho
        )
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=500, 
            detail=f"Arquivo da planilha não encontrado: {PLANILHA_SINAPI_CAMINHO}"
        )
    except ValueError as e:
        # Erro comum quando a aba não existe
        raise HTTPException(status_code=500, detail=f"Erro ao ler a planilha/aba: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro inesperado ao ler planilha: {str(e)}")

    if df.empty:
        return {"status": "vazio", "mensagem": "Nenhum dado encontrado na aba CSD."}

    # Remove linhas totalmente vazias
    df = df.dropna(how="all")
    
    # Remove linhas que são apenas separadores ou totais
    df = df[~df.iloc[:, 0].astype(str).str.contains("TOTAL", case=False, na=False)]

    # Normaliza nomes de colunas
    df = _normalizar_colunas(df)

    # Mapeia nomes de colunas que podem variar
    mapeamento_colunas = {}
    for col in df.columns:
        col_lower = str(col).lower()
        if 'grupo' in col_lower and COLUMN_GRUPO not in mapeamento_colunas.values():
            mapeamento_colunas[col] = COLUMN_GRUPO
        elif ('código' in col_lower or 'codigo' in col_lower) and ('composição' in col_lower or 'composicao' in col_lower):
            if COLUMN_CODIGO not in mapeamento_colunas.values():
                mapeamento_colunas[col] = COLUMN_CODIGO
        elif 'descrição' in col_lower or 'descricao' in col_lower:
            if COLUMN_DESCRICAO not in mapeamento_colunas.values():
                mapeamento_colunas[col] = COLUMN_DESCRICAO
        elif 'unidade' in col_lower:
            if COLUMN_UNIDADE not in mapeamento_colunas.values():
                mapeamento_colunas[col] = COLUMN_UNIDADE
    
    # Aplica o mapeamento se encontrou colunas
    if mapeamento_colunas:
        df = df.rename(columns=mapeamento_colunas)
        # Normaliza novamente após renomear
        df = _normalizar_colunas(df)

    colunas_necessarias = {COLUMN_GRUPO, COLUMN_CODIGO, COLUMN_DESCRICAO, COLUMN_UNIDADE}
    if not colunas_necessarias.issubset(set(df.columns)):
        raise HTTPException(
            status_code=500,
            detail=(
                "As colunas esperadas não foram encontradas após normalização. "
                f"Esperado: {sorted(colunas_necessarias)}. "
                f"Encontrado (primeiras 20): {sorted(df.columns.tolist()[:20])}"
            ),
        )

    # Remove linhas onde código está vazio ou inválido
    df = df[df[COLUMN_CODIGO].notna()]
    df = df[df[COLUMN_CODIGO].astype(str).str.strip() != '']

    # ------ TABELA 1: COMPOSICOES (metadados da composição) ------
    df_composicoes = df[[COLUMN_GRUPO, COLUMN_CODIGO, COLUMN_DESCRICAO, COLUMN_UNIDADE]].copy()
    df_composicoes = df_composicoes.drop_duplicates()
    registros_composicoes: List[Dict[str, Any]] = df_composicoes.to_dict(orient="records")

    # ------ TABELA 2: COMPOSICAO_ESTADOS (formato largo: uma coluna por estado) ------
    # A tabela tem formato largo: codigo_composicao + colunas ac, al, ap, am, ba, ce, etc.
    # Identifica colunas de custo (não %AS)
    colunas_custo = [c for c in df.columns 
                    if 'custo' in str(c).lower() 
                    and '%as' not in str(c).lower()
                    and c not in [COLUMN_GRUPO, COLUMN_CODIGO, COLUMN_DESCRICAO, COLUMN_UNIDADE]]

    if not colunas_custo:
        raise HTTPException(
            status_code=500,
            detail=(
                "Nenhuma coluna de custo encontrada. "
                f"Colunas disponíveis: {list(df.columns)}"
            ),
        )

    # Lê a linha 9 (índice 8 na planilha original) para identificar os estados
    # Esta linha contém as siglas dos estados (AC, AL, AM, etc.)
    try:
        df_linha_estados = pd.read_excel(
            PLANILHA_SINAPI_CAMINHO, 
            sheet_name=ABA_CSD, 
            skiprows=8,  # Pula até linha 9
            nrows=1,     # Lê apenas 1 linha
            header=None  # Sem cabeçalho
        )
        # Normaliza para facilitar busca
        linha_estados = df_linha_estados.iloc[0].astype(str).str.strip().str.upper()
    except:
        linha_estados = None

    # Mapeia cada coluna de custo para seu estado correspondente (formato: coluna_planilha -> coluna_tabela)
    mapeamento_coluna_estado = {}
    estados_siglas = [e.upper() for e in COLUNAS_ESTADOS]
    
    for idx, col_custo in enumerate(colunas_custo):
        estado_encontrado = None
        
        # Tenta encontrar o estado pela posição na linha de estados
        if linha_estados is not None:
            # Calcula a posição da coluna de custo no DataFrame original
            posicao_coluna = list(df.columns).index(col_custo)
            if posicao_coluna < len(linha_estados):
                valor_linha = linha_estados.iloc[posicao_coluna]
                # Verifica se é uma sigla de estado válida
                if valor_linha in estados_siglas:
                    estado_encontrado = valor_linha.lower()  # Converte para minúscula (nome da coluna na tabela)
        
        # Se não encontrou, tenta pelo nome da coluna
        if not estado_encontrado:
            col_lower = str(col_custo).lower()
            for estado in COLUNAS_ESTADOS:  # Já está em minúscula
                if estado in col_lower:
                    estado_encontrado = estado
                    break
        
        # Se ainda não encontrou, usa mapeamento sequencial padrão
        if not estado_encontrado:
            # Mapeamento baseado na posição
            if idx < len(COLUNAS_ESTADOS):
                estado_encontrado = COLUNAS_ESTADOS[idx]
        
        if estado_encontrado:
            mapeamento_coluna_estado[col_custo] = estado_encontrado

    if not mapeamento_coluna_estado:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível mapear colunas de custo para estados."
        )

    # Prepara DataFrame para composicao_estados no formato largo
    # Cada linha terá: codigo_composicao + valores para cada estado (ac, al, ap, etc.)
    df_estados = pd.DataFrame()
    df_estados['codigo_composicao'] = df[COLUMN_CODIGO].astype(str).str.strip()
    
    # Função para converter valores (tratando formatação brasileira)
    def converter_valor(valor):
        try:
            if pd.isna(valor):
                return None
            if isinstance(valor, str):
                valor_limpo = valor.replace('.', '').replace(',', '.').strip()
                if valor_limpo == '' or valor_limpo == '-':
                    return None
                return float(valor_limpo)
            return float(valor)
        except (ValueError, TypeError):
            return None
    
    # Mapeia cada coluna de custo para sua coluna de estado correspondente
    for col_custo, estado_col in mapeamento_coluna_estado.items():
        if estado_col in COLUNAS_ESTADOS:  # Garante que o estado está na lista
            df_estados[estado_col] = df[col_custo].apply(converter_valor)
    
    # Remove linhas onde código está vazio
    df_estados = df_estados[df_estados['codigo_composicao'].notna()]
    df_estados = df_estados[df_estados['codigo_composicao'].str.strip() != '']
    
    # Converte para lista de dicionários
    registros_estados_list: List[Dict[str, Any]] = df_estados.to_dict(orient="records")

    if not registros_composicoes and not registros_estados_list:
        return {"status": "vazio", "mensagem": "Após limpeza, nenhum registro para enviar."}

    # Envia tabelas para o Supabase
    inseridos_composicoes = 0
    inseridos_estados = 0

    try:
        if registros_composicoes:
            resp_comp = supabase.table(TABELA_COMPOSICOES).upsert(registros_composicoes).execute()
            inseridos_composicoes = len(resp_comp.data) if resp_comp.data else 0

        if registros_estados_list:
            resp_est = supabase.table(TABELA_COMPOSICOES_ESTADOS).upsert(registros_estados_list).execute()
            inseridos_estados = len(resp_est.data) if resp_est.data else 0
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao inserir dados no Supabase: {str(e)}"
        )

    return {
        "status": "ok",
        "composicoes_enviadas": len(registros_composicoes),
        "linhas_estados_enviadas": len(registros_estados_list),
        "composicoes_inseridas_atualizadas": inseridos_composicoes,
        "estados_inseridos_atualizados": inseridos_estados,
    }


@router.get("/", summary="Listar composições armazenadas no Supabase")
def listar_composicoes(supabase=Depends(get_supabase)) -> list[dict[str, Any]]:
    """
    Lê os dados da tabela `composicao` no Supabase e retorna todos os registros.

    - Você pode depois adicionar filtros (por código, descrição, etc.).
    """
    resposta = supabase.table(TABELA_COMPOSICOES).select("*").execute()
    return resposta.data or []


@router.get("/estados", summary="Listar composições com seus estados e valores")
def listar_composicoes_estados(supabase=Depends(get_supabase)) -> list[dict[str, Any]]:
    """
    Lê os dados da tabela `composicao_estados` no Supabase.
    Retorna todas as composições com seus valores por estado (formato largo: uma coluna por estado).
    """
    resposta = supabase.table(TABELA_COMPOSICOES_ESTADOS).select("*").execute()
    return resposta.data or []


@router.get("/{codigo_composicao}/estados", summary="Listar estados e valores de uma composição específica")
def listar_estados_composicao(
    codigo_composicao: str, supabase=Depends(get_supabase)
) -> list[dict[str, Any]]:
    """
    Retorna os valores de todos os estados para uma composição específica.
    Formato: {codigo_composicao, ac, al, ap, am, ba, ce, ...}
    """
    resposta = (
        supabase.table(TABELA_COMPOSICOES_ESTADOS)
        .select("*")
        .eq("codigo_composicao", codigo_composicao)
        .execute()
    )

    return resposta.data or []