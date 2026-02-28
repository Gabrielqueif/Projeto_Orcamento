"""
Serviço de processamento de planilhas SINAPI.

Orquestra a extração de metadados e importação de dados de composições
e preços a partir de arquivos Excel no formato SINAPI.
"""

import logging
from typing import Any, Dict, List

from app.repositories.item_repository import ItemRepository
from app.schemas.sinapi import SinapiMetadata
from app.services.parser_factory import get_parser
from app.services.sinapi_text_utils import normalizar_nome_aba

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Extração de metadados
# ---------------------------------------------------------------------------

def extract_metadata(
    file_content: bytes,
    sheet_name_hint: str | None = None,
    source_type: str = "SINAPI"
) -> SinapiMetadata:
    """Extrai metadados (mês de referência, UF, desoneração) de um arquivo SINAPI.

    Args:
        file_content: Conteúdo binário do arquivo Excel.
        sheet_name_hint: Nome de aba preferencial para buscar metadados.

    Returns:
        Objeto SinapiMetadata com os campos extraídos.

    Raises:
        ValueError: Se não for possível extrair os metadados.
    """
    try:
        parser = get_parser(file_content, source_type)
        sheet_use = _escolher_aba_metadados(parser, sheet_name_hint)
        return _extrair_metadados_da_aba(parser, sheet_use, source_type=source_type)
    except Exception as e:
        raise ValueError(f"Erro ao extrair metadados: {e}") from e


def _escolher_aba_metadados(
    parser,
    sheet_name_hint: str | None,
) -> str:
    """Escolhe a melhor aba para extrair metadados.

    Prioriza o hint fornecido; em seguida procura abas com nomes
    contendo CSD, CCD, CSE ou ANALITICO; por fim usa a primeira aba.
    """
    if sheet_name_hint and sheet_name_hint in parser.sheet_names:
        return sheet_name_hint

    termos_meta = ("CSD", "CCD", "CSE", "ANALITICO")
    for sheet in parser.sheet_names:
        norm = normalizar_nome_aba(sheet).upper()
        if any(t in norm for t in termos_meta):
            return sheet

    return parser.sheet_names[0]


def _extrair_metadados_da_aba(
    parser,
    sheet_name: str,
    source_type: str = "SINAPI"
) -> SinapiMetadata:
    """Lê as primeiras linhas de uma aba e extrai mês e desoneração."""
    df = parser.ler_aba(sheet_name, header=None, nrows=20)

    mes_referencia = "UNKNOWN"
    desoneracao_raw = "UNKNOWN"

    # Posição padrão SINAPI: mês em B3 (iloc[2,1])
    if len(df) > 2:
        val = str(df.iloc[2, 1]).strip()
        if len(val) > 4:
            mes_referencia = val

    # Posição padrão SINAPI: desoneração em D4 (iloc[3,3])
    if len(df) > 3 and len(df.columns) > 3:
        d = str(df.iloc[3, 3]).strip().upper()
        if d and d != "NAN":
            desoneracao_raw = d

    # Tentar extrair UF (geralmente em D5 ou C3, dependendo do modelo)
    uf = "BR"
    if len(df) > 4 and len(df.columns) > 3:
        u = str(df.iloc[4, 3]).strip().upper()
        if len(u) == 2 and u.isalpha():
            uf = u
    elif len(df) > 2 and len(df.columns) > 2:
        u = str(df.iloc[2, 2]).strip().upper()
        if len(u) == 2 and u.isalpha():
            uf = u

    return SinapiMetadata(
        mes_referencia=mes_referencia,
        uf=uf,
        desoneracao=desoneracao_raw,
        fonte=source_type
    )


# ---------------------------------------------------------------------------
# Processamento completo (composições + preços)
# ---------------------------------------------------------------------------

def process_sinapi_file(
    file_content: bytes,
    repository: ItemRepository,
    source_type: str = "SINAPI"
) -> Dict[str, Any]:
    """Processa um arquivo SINAPI completo e importa os dados no banco.

    Fluxo:
        1. Abre o arquivo Excel
        2. Identifica abas de preços (CSD/CCD/CSE)
        3. Extrai metadados da primeira aba de preços
        4. Para cada aba: extrai composições e preços
        5. Deduplica composições e salva via repository

    Args:
        file_content: Conteúdo binário do arquivo Excel.
        repository: Repositório para persistir os dados.

    Returns:
        Dict com status, quantidades importadas e metadados.

    Raises:
        ValueError: Se ocorrer um erro durante o processamento.
    """
    try:
        parser = get_parser(file_content, source_type)
        abas_precos = parser.identificar_abas_dados()

        first_sheet = abas_precos[0] if abas_precos else parser.sheet_names[0]
        metadata = extract_metadata(file_content, sheet_name_hint=first_sheet, source_type=source_type)

        logger.info(
            "Processando arquivo SINAPI — abas: %s, metadados: %s",
            abas_precos,
            metadata,
        )

        todas_composicoes: List[dict] = []
        todos_precos: List[dict] = []

        for aba in abas_precos:
            composicoes, precos = parser.extrair_registros_aba(
                aba, metadata.mes_referencia
            )
            todas_composicoes.extend(composicoes)
            todos_precos.extend(precos)

        todas_composicoes = _deduplicar_composicoes(todas_composicoes)

        q_comp = repository.upsert_batch_composicoes(todas_composicoes)
        q_est = repository.upsert_batch_estados(todos_precos)

        return {
            "status": "sucesso",
            "imported_items": q_comp,
            "imported_prices": q_est,
            "metadata": metadata.dict(),
        }

    except Exception as e:
        logger.exception("Erro no processamento da importação SINAPI")
        raise ValueError(f"Erro no processamento da importação: {e}") from e


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _deduplicar_composicoes(registros: List[dict]) -> List[dict]:
    """Remove composições duplicadas mantendo a primeira ocorrência."""
    vistos: set = set()
    resultado: List[dict] = []
    for reg in registros:
        cod = reg["codigo_composicao"]
        if cod not in vistos:
            vistos.add(cod)
            resultado.append(reg)
    return resultado
