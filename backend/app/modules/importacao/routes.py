import logging

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.modules.composicao.repositories import ItemRepository
from app.modules.composicao.schemas import SinapiMetadata
from app.modules.importacao.services.import_service import extract_metadata, process_import_file
from core.config import settings
from core.security import get_current_user, require_admin
from core.supabase_client import get_supabase_client

logger = logging.getLogger("projeto_orcamento")
MAX_ARQUIVOS_POR_IMPORTACAO = 10

router = APIRouter(prefix="/importacao", tags=["Importacao"], redirect_slashes=False)


def get_item_repository() -> ItemRepository:
    return ItemRepository(get_supabase_client())


EXTENSOES_PERMITIDAS = (".xls", ".xlsx")


def _extensao_valida(filename: str | None) -> bool:
    return bool(filename) and filename.lower().endswith(EXTENSOES_PERMITIDAS)


async def _ler_com_limite(file: UploadFile) -> bytes:
    """Lê o upload recusando (413) arquivos acima de MAX_UPLOAD_MB, sem carregar o excedente."""
    limite = settings.MAX_UPLOAD_MB * 1024 * 1024
    content = await file.read(limite + 1)
    if len(content) > limite:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo '{file.filename}' excede o limite de {settings.MAX_UPLOAD_MB} MB.",
        )
    return content


@router.post("/upload", response_model=SinapiMetadata)
async def upload_worksheet(
    file: UploadFile = File(...),
    source: str = Query("SINAPI", description="Fonte da planilha (ex: SINAPI, SEINFRA)"),
    current_user=Depends(require_admin),
):
    """
    Uploads a SINAPI worksheet to extract metadata (Year/Month, UF, Desoneracao type).
    Does not save the file yet, just parses header data for verification.
    """
    if not _extensao_valida(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

    content = await _ler_com_limite(file)

    try:
        return extract_metadata(content, source_type=source)
    except ValueError as e:
        logger.warning(f"ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error processing file.")


@router.post("/import")
async def import_worksheet_data(
    files: list[UploadFile] = File(...),
    source: str = Query("SINAPI", description="Fonte da planilha (ex: SINAPI, SEINFRA)"),
    current_user=Depends(require_admin),
):
    """
    Full import: Accepts multiple Excel files (e.g., CSD, CCD, CSE) and processes them all.
    Extracts metadata AND processes data sheets to database.

    O campo `status` é "sucesso" (todos importados), "parcial" (alguns falharam)
    ou, se nenhum arquivo foi processado, a resposta é HTTP 400 com a lista de falhas.
    """
    if len(files) > MAX_ARQUIVOS_POR_IMPORTACAO:
        raise HTTPException(
            status_code=400,
            detail=f"Máximo de {MAX_ARQUIVOS_POR_IMPORTACAO} arquivos por importação.",
        )

    total_items = 0
    total_prices = 0
    total_analitico = 0
    total_insumo_prices = 0
    results_metadata = []
    falhas = []

    repository = get_item_repository()

    for file in files:
        nome = file.filename or "(sem nome)"
        if not _extensao_valida(file.filename):
            falhas.append({"arquivo": nome, "motivo": "Formato inválido (use .xls ou .xlsx)"})
            continue

        content = await _ler_com_limite(file)
        try:
            result = process_import_file(content, repository, source_type=source)
        except ValueError as e:
            logger.error(f"Error processing file {nome}: {e}")
            falhas.append({"arquivo": nome, "motivo": str(e)})
            continue
        except Exception as e:
            logger.error(f"Unexpected error importing {nome}: {e}", exc_info=True)
            falhas.append({"arquivo": nome, "motivo": "Erro interno ao processar o arquivo"})
            continue

        total_items += result.get("imported_items", 0)
        total_prices += result.get("imported_prices", 0)
        total_analitico += result.get("imported_analitico", 0)
        total_insumo_prices += result.get("imported_insumo_prices", 0)
        results_metadata.append(result.get("metadata"))

    if not results_metadata:
        motivos = "; ".join(f"{f['arquivo']}: {f['motivo']}" for f in falhas)
        raise HTTPException(status_code=400, detail=f"Nenhum arquivo foi importado. {motivos}".strip())

    ItemRepository.invalidar_cache_bases()

    return {
        "status": "parcial" if falhas else "sucesso",
        "imported_items": total_items,
        "imported_prices": total_prices,
        "imported_analitico": total_analitico,
        "imported_insumo_prices": total_insumo_prices,
        "metadata_list": results_metadata,
        "falhas": falhas,
    }


def _chave_ordenacao_base(base: dict) -> tuple:
    """Mais recente primeiro: "MM/AAAA" vira (AAAA, MM) para ordenar cronologicamente."""
    mes = str(base["mes_referencia"])
    partes = mes.split("/")
    cronologico = (partes[1], partes[0]) if len(partes) == 2 else (mes, "")
    return (*cronologico, base["fonte"], base["tipo_composicao"])


@router.get("/bases")
async def listar_bases_disponiveis(current_user=Depends(get_current_user)):
    """Bases disponíveis (fonte, mês e desoneração) com a contagem de composições."""
    bases = get_item_repository().listar_bases_disponiveis()
    return sorted(bases, key=_chave_ordenacao_base, reverse=True)
