"""
Utilitários de manipulação de texto para processamento de planilhas SINAPI.

Funções puras de normalização, limpeza e conversão de strings
usadas no parsing de arquivos Excel da SINAPI.
"""

import re
import unicodedata

import pandas as pd


def remover_acentos(texto: str) -> str:
    """Remove acentos e converte para minúsculas.

    Args:
        texto: Texto a ser normalizado.

    Returns:
        Texto sem acentos, em minúsculas.
    """
    if not isinstance(texto, str):
        return str(texto)
    nfkd = unicodedata.normalize('NFD', texto)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def limpar_link_excel(texto) -> str:
    """Extrai o texto de display de fórmulas HYPERLINK do Excel.

    Células com links no Excel podem conter fórmulas como
    ``=HYPERLINK("url", "texto visível")``. Esta função extrai
    apenas o texto visível.

    Args:
        texto: Valor da célula (pode ser NaN, string ou fórmula).

    Returns:
        Texto limpo sem fórmulas.
    """
    if pd.isna(texto):
        return ""
    texto = str(texto).strip()
    if texto.startswith("="):
        match = re.search(r'HYPERLINK\s*\(.*,\s*"(.*)"\s*\)', texto, re.IGNORECASE)
        if match:
            return match.group(1)
        return texto.replace('"', '').replace('=', '')
    return texto


def gerar_chave_match(texto: str) -> str:
    """Gera uma chave normalizada para comparação fuzzy de textos.

    Remove acentos, links do Excel e caracteres não-alfanuméricos,
    resultando em uma string lowercase apenas com letras e números.

    Args:
        texto: Texto original.

    Returns:
        Chave normalizada para comparação.
    """
    texto = limpar_link_excel(texto)
    sem_acento = remover_acentos(texto)
    return re.sub(r'[^a-z0-9]', '', sem_acento)


def limpar_valor_moeda(valor) -> float | None:
    """Converte valores monetários em formato brasileiro para float.

    Trata formatos como ``"1.234,56"`` (ponto como separador de milhar,
    vírgula como decimal), valores NaN, strings vazias e hífens.

    Args:
        valor: Valor da célula (pode ser NaN, string, int ou float).

    Returns:
        Valor numérico ou None se não for possível converter.
    """
    if pd.isna(valor):
        return None
    s_valor = str(valor).strip()
    if s_valor == '' or s_valor == '-' or s_valor.lower() == 'nan':
        return None
    try:
        if isinstance(valor, (int, float)):
            return float(valor)
        return float(s_valor.replace('.', '').replace(',', '.'))
    except (ValueError, TypeError):
        return None


def normalizar_nome_aba(texto) -> str:
    """Normaliza o nome de uma aba de planilha para comparação.

    Args:
        texto: Nome original da aba.

    Returns:
        Nome sem acentos e sem espaços extras.
    """
    return remover_acentos(str(texto)).strip()
