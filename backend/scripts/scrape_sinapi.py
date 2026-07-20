#!/usr/bin/env python
"""
Script de automatização para coleta e processamento de planilhas SINAPI.
Pode ser executado diretamente ou via cron job para atualizar os índices de custos.
"""

import os
import sys
import argparse
import requests
import zipfile
import io
import logging
from pathlib import Path

# Adiciona o diretório backend ao PYTHONPATH
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.services.import_service import process_import_file
from app.repositories.item_repository import ItemRepository
from core.supabase_client import get_supabase_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sinapi_scraper")

def download_file(url: str) -> bytes:
    logger.info(f"Iniciando download de: {url}")
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    logger.info("Download concluído com sucesso!")
    return response.content

def processar_local_ou_download(caminho_ou_url: str, source: str):
    supabase = get_supabase_client()
    repo = ItemRepository(supabase)
    
    content = None
    if caminho_ou_url.startswith(("http://", "https://")):
        content = download_file(caminho_ou_url)
    else:
        path = Path(caminho_ou_url)
        if not path.exists():
            logger.error(f"Arquivo ou diretório local não encontrado: {caminho_ou_url}")
            sys.exit(1)
        content = path.read_bytes()

    # Verifica se é um arquivo zip
    if caminho_ou_url.endswith(".zip") or zipfile.is_zipfile(io.BytesIO(content)):
        logger.info("Arquivo compactado (ZIP) detectado. Extraindo planilhas...")
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            for name in z.namelist():
                if name.endswith((".xls", ".xlsx")) and not name.startswith("~"):
                    logger.info(f"Processando planilha extraída: {name}")
                    excel_data = z.read(name)
                    importar_planilha(excel_data, repo, source)
    else:
        importar_planilha(content, repo, source)

def importar_planilha(content: bytes, repo: ItemRepository, source: str):
    try:
        resultado = process_import_file(content, repo, source_type=source)
        logger.info(f"Importação realizada com sucesso para a base {source}!")
        logger.info(f"Itens importados: {resultado.get('imported_items')}")
        logger.info(f"Preços de estados importados: {resultado.get('imported_prices')}")
        logger.info(f"Relacionamentos analíticos: {resultado.get('imported_analitico')}")
        logger.info(f"Metadados extraídos: {resultado.get('metadata')}")
    except Exception as e:
        logger.error(f"Erro ao processar e importar planilha: {e}", exc_info=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Coleta e processamento automatizado de planilhas de referência.")
    parser.add_argument(
        "source_path",
        type=str,
        help="URL ou caminho local do arquivo Excel/ZIP contendo as planilhas SINAPI ou SEINFRA."
    )
    parser.add_argument(
        "--source",
        type=str,
        default="SINAPI",
        choices=["SINAPI", "SEINFRA"],
        help="Fonte dos dados (SINAPI ou SEINFRA). Padrão: SINAPI."
    )
    
    args = parser.parse_args()
    processar_local_ou_download(args.source_path, args.source)
