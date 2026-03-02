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
    """Extrai metadados delegando a tarefa ao parser específico."""
    try:
        parser = get_parser(file_content, source_type)
        meta_dict = parser.extrair_metadados(sheet_hint=sheet_name_hint)
        
        return SinapiMetadata(
            mes_referencia=meta_dict.get("mes_referencia", "UNKNOWN"),
            uf=meta_dict.get("uf", "BR"),
            desoneracao=meta_dict.get("desoneracao", "UNKNOWN"),
            fonte=source_type
        )
    except Exception as e:
        raise ValueError(f"Erro ao extrair metadados: {e}") from e


# ---------------------------------------------------------------------------
# Processamento completo (composições + preços)
# ---------------------------------------------------------------------------

def process_import_file(
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
            # Injetar a fonte em cada registro para respeitar a nova constraint
            for c in composicoes:
                c["fonte"] = source_type
            for p in precos:
                p["fonte"] = source_type

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
