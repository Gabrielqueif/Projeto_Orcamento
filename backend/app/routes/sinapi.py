import logging
import traceback

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from app.services.sinapi_service import extract_metadata, process_sinapi_file
from app.repositories.item_repository import ItemRepository
from app.schemas.sinapi import SinapiMetadata
from core.supabase_client import get_supabase_client

# Setup Router
logger = logging.getLogger("projeto_orcamento")
router = APIRouter(prefix="/sinapi", tags=["SINAPI"])

# Dependencies
from core.security import require_admin, get_current_user


def get_item_repository():
    return ItemRepository(get_supabase_client())

# Routes
@router.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    return {"filename": file.filename, "content_type": file.content_type}

@router.post("/upload", response_model=SinapiMetadata)
async def upload_sinapi_worksheet(
    file: UploadFile = File(...),
    current_user = Depends(require_admin)
):
    """
    Uploads a SINAPI worksheet to extract metadata (Year/Month, UF, Desoneracao type).
    Does not save the file yet, just parses header data for verification.
    """
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

    logger.info(f"Received file: {file.filename}")
    try:
        content = await file.read()
        logger.info(f"File read into memory. Size: {len(content)} bytes")
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(status_code=500, detail="Error reading file")
    
    try:
        logger.info("Calling extract_metadata...")
        metadata = extract_metadata(content)
        logger.info("Metadata extracted successfully")
        return metadata
    except ValueError as e:
        logger.warning(f"ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error processing file.")

@router.post("/import")
async def import_sinapi_data(
    files: list[UploadFile] = File(...),
    current_user = Depends(require_admin),
):
    """
    Full import: Accepts multiple Excel files (e.g., CSD, CCD, CSE) and processes them all.
    Extracts metadata AND processes data sheets to database.
    """
    total_items = 0
    total_prices = 0
    results_metadata = []

    repository = get_item_repository()

    try:
        for file in files:
            if not file.filename.endswith(('.xls', '.xlsx')):
                continue # Skip invalid files
            
            content = await file.read()
            # Process each file
            try:
                result = process_sinapi_file(content, repository)
                total_items += result.get("imported_items", 0)
                total_prices += result.get("imported_prices", 0)
                results_metadata.append(result.get("metadata"))
            except ValueError as e:
                logger.error(f"Error processing file {file.filename}: {e}")
                # We could raise or just continue. Let's continue to try other files but log error.
                pass 

        return {
            "status": "sucesso",
            "imported_items": total_items,
            "imported_prices": total_prices,
            "metadata_list": results_metadata
        }
    except Exception as e:
        logger.error(f"Error importing SINAPI: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error importing SINAPI: {str(e)}")


@router.get("/bases")
async def listar_bases_disponiveis():
    """Retorna a lista de meses e tipos de desoneração disponíveis para escolha."""
    repo = ItemRepository(get_supabase_client())
    
    bases = repo.listar_bases_disponiveis()
    # Deduplicar no Python para evitar lógica complexa de distinct no Supabase client se necessário
    unique_bases = []
    seen = set()
    for b in bases:
        # Usar .get() para evitar KeyError se a coluna não existir (ex: na TABELA_COMPOSICOES)
        mes = b.get("mes_referencia")
        tipo = b.get("tipo_composicao", "Sem Desoneração") # Valor default
        
        key = (mes, tipo)
        if key not in seen and mes:
            seen.add(key)
            unique_bases.append({
                "mes_referencia": mes,
                "tipo_composicao": tipo
            })
            
    return sorted(unique_bases, key=lambda x: x["mes_referencia"], reverse=True)
