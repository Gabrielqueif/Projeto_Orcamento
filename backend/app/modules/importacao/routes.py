import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query

from app.modules.importacao.services.import_service import extract_metadata, process_import_file
from app.modules.composicao.repositories import ItemRepository
from app.modules.composicao.schemas import SinapiMetadata
from core.supabase_client import get_supabase_client
from core.config import settings
from core.security import require_admin

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
    current_user = Depends(require_admin)
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
    current_user = Depends(require_admin),
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
        results_metadata.append(result.get("metadata"))

    if not results_metadata:
        motivos = "; ".join(f"{f['arquivo']}: {f['motivo']}" for f in falhas)
        raise HTTPException(status_code=400, detail=f"Nenhum arquivo foi importado. {motivos}".strip())

    return {
        "status": "parcial" if falhas else "sucesso",
        "imported_items": total_items,
        "imported_prices": total_prices,
        "metadata_list": results_metadata,
        "falhas": falhas,
    }

@router.get("/bases")
async def listar_bases_disponiveis():
    """Retorna a lista de meses e tipos de desoneração disponíveis para escolha."""
    repo = get_item_repository()
    
    bases = repo.listar_bases_disponiveis()
    unique_bases = []
    seen = set()
    for b in bases:
        mes = b.get("mes_referencia")
        tipo = b.get("tipo_composicao", "Sem Desoneração")
        fonte = b.get("fonte", "SINAPI")
        
        key = (mes, tipo, fonte)
        if key not in seen and mes:
            seen.add(key)
            unique_bases.append({
                "mes_referencia": mes,
                "tipo_composicao": tipo,
                "fonte": fonte
            })
            
    return sorted(unique_bases, key=lambda x: (x["mes_referencia"], x["fonte"]), reverse=True)
